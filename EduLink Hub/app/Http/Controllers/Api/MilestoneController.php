<?php

namespace App\Http\Controllers\Api;

use App\Models\Milestone;
use App\Models\Submission;
use App\Services\SettlementService;
use App\Services\SolanaService;
use Illuminate\Http\Request;

class MilestoneController extends ApiController
{
    public function submit(Request $request, Milestone $milestone)
    {
        $job = $milestone->job;
        $accepted = $job->applications()->where('student_id', $request->user()->id)->where('status', 'accepted')->exists();
        abort_unless($accepted, 403, 'Bạn không phải sinh viên đang thực hiện công việc này.');
        abort_unless(in_array($milestone->status, ['pending', 'submitted'], true), 409, 'Milestone không thể nộp ở trạng thái hiện tại.');

        $data = $request->validate([
            'work_url' => ['nullable', 'url', 'max:2048', 'required_without:file'],
            'file' => ['nullable', 'file', 'max:10240', 'required_without:work_url'],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);
        $path = $request->hasFile('file') ? $request->file('file')->store('submissions') : null;
        unset($data['file']);
        $submission = Submission::create($data + [
            'milestone_id' => $milestone->id,
            'student_id' => $request->user()->id,
            'file_path' => $path,
            'submitted_at' => now(),
        ]);
        $milestone->update(['status' => 'submitted']);

        return $this->success($submission, 'Nộp sản phẩm thành công.', 201);
    }

    public function approve(Request $request, Milestone $milestone, SolanaService $solana, SettlementService $settlement, \App\Services\ReputationService $reputationService)
    {
        $this->ensureEmployer($request, $milestone);
        abort_unless($milestone->status === 'submitted', 409, 'Milestone chưa có bài nộp để duyệt.');
        $data = $request->validate(['feedback' => ['nullable', 'string', 'max:5000']]);
        $milestone->submissions()->latest()->first()?->update(['employer_feedback' => $data['feedback'] ?? null]);
        $milestone->update(['status' => 'approved']);

        $acceptedApp = $milestone->job->applications()->where('status', 'accepted')->first();
        if ($acceptedApp && $acceptedApp->student) {
            $isOntime = now()->lte($milestone->due_date);
            $points = $isOntime ? 10 : -5;
            $reason = $isOntime
                ? "Duyệt milestone \"{$milestone->title}\": Đúng hạn (+10đ)"
                : "Duyệt milestone \"{$milestone->title}\": Trễ hạn (-5đ)";

            $reputationService->change(
                $acceptedApp->student,
                $points,
                $reason,
                $milestone->job,
                $milestone
            );
        }

        if ($solana->isMock()) {
            $escrow = $milestone->job->escrow;
            abort_unless($escrow && $escrow->status === 'locked', 409, 'Escrow chưa được khóa.');
            $settlement->releaseMilestone($escrow, $milestone, $solana->mockTransaction('release'));
        }

        return $this->success($milestone->fresh(), 'Duyệt milestone thành công.');
    }

    public function reject(Request $request, Milestone $milestone)
    {
        $this->ensureEmployer($request, $milestone);
        abort_unless($milestone->status === 'submitted', 409, 'Milestone chưa có bài nộp để từ chối.');
        $data = $request->validate(['feedback' => ['required', 'string', 'max:5000']]);
        $milestone->submissions()->latest()->first()?->update(['employer_feedback' => $data['feedback']]);
        $milestone->update(['status' => 'pending']);

        return $this->success($milestone->fresh(), 'Đã yêu cầu sinh viên chỉnh sửa sản phẩm.');
    }

    private function ensureEmployer(Request $request, Milestone $milestone): void
    {
        abort_unless($milestone->job->employer_id === $request->user()->id, 403, 'Bạn không quản lý công việc này.');
    }
}
