<?php

namespace App\Http\Controllers\Api;

use App\Models\Dispute;
use App\Models\DisputeVote;
use App\Models\Milestone;
use App\Services\ReputationService;
use App\Services\SolanaService;
use Illuminate\Http\Request;

class DisputeController extends ApiController
{
    public function store(Request $request, Milestone $milestone)
    {
        $job = $milestone->job;
        $isEmployer = $job->employer_id === $request->user()->id;
        $isStudent = $job->applications()->where('student_id', $request->user()->id)->where('status', 'accepted')->exists();
        abort_unless($isEmployer || $isStudent, 403, 'Bạn không tham gia công việc này.');
        abort_unless(in_array($milestone->status, ['submitted', 'approved'], true), 409, 'Milestone chưa thể mở tranh chấp.');

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:5000'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['string', 'max:2048'],
        ]);
        $dispute = Dispute::create($data + [
            'milestone_id' => $milestone->id,
            'created_by' => $request->user()->id,
            'status' => 'open',
        ]);
        $milestone->update(['status' => 'disputed']);
        $job->update(['status' => 'disputed']);

        return $this->success($dispute, 'Tạo tranh chấp thành công.', 201);
    }

    public function show(Request $request, Dispute $dispute)
    {
        $job = $dispute->milestone->job;
        $canView = in_array($request->user()->role, ['mentor', 'admin'], true)
            || $job->employer_id === $request->user()->id
            || $job->applications()->where('student_id', $request->user()->id)->where('status', 'accepted')->exists();
        abort_unless($canView, 403, 'Bạn không có quyền xem tranh chấp này.');

        return $this->success(
            $dispute->load(['milestone.job', 'creator:id,name,role', 'votes.mentor:id,name,reputation_score']),
            'Lấy tranh chấp thành công.'
        );
    }

    public function vote(Request $request, Dispute $dispute)
    {
        abort_unless($dispute->status === 'open', 409, 'Tranh chấp đã đóng.');
        $alreadyVoted = $dispute->votes()->where('mentor_id', $request->user()->id)->exists();
        abort_unless($alreadyVoted || $dispute->votes()->count() < 3, 409, 'Tranh chấp đã đủ ba mentor chấm.');
        $data = $request->validate([
            'student_percentage' => ['required', 'integer', 'between:0,100'],
            'reason' => ['nullable', 'string', 'max:3000'],
        ]);
        $vote = DisputeVote::updateOrCreate(
            ['dispute_id' => $dispute->id, 'mentor_id' => $request->user()->id],
            $data
        );

        return $this->success($vote, 'Ghi nhận phiếu chấm thành công.');
    }

    public function resolve(Request $request, Dispute $dispute, SolanaService $solana, ReputationService $reputation)
    {
        abort_unless($dispute->status === 'open', 409, 'Tranh chấp đã đóng.');
        abort_unless($dispute->votes()->count() >= 3, 409, 'Cần đủ ba phiếu mentor trước khi giải quyết.');
        $data = $request->validate([
            'student_percentage' => ['nullable', 'integer', 'between:0,100'],
            'resolution' => ['required', 'string', 'max:5000'],
            'dispute_tx' => ['nullable', 'string', 'max:128'],
        ]);
        $percentage = $data['student_percentage']
            ?? (int) round($dispute->votes()->avg('student_percentage') ?? 0);

        $disputeTx = $data['dispute_tx'] ?? null;
        if (! $disputeTx && $solana->isMock()) {
            $disputeTx = $solana->mockTransaction('dispute');
        }

        if ($disputeTx && ! $solana->verifyTransaction($disputeTx)) {
            return $this->error('Không xác minh được giao dịch giải quyết tranh chấp on-chain.', 422);
        }

        $dispute->update([
            'student_percentage' => $percentage,
            'resolution' => $data['resolution'],
            'dispute_tx' => $disputeTx,
            'status' => 'resolved',
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        $milestone = $dispute->milestone;
        $milestone->update([
            'status' => $percentage > 0 ? 'paid' : 'resolved',
            'release_tx' => $disputeTx,
        ]);

        $job = $milestone->job;
        if (! $job->milestones()->whereIn('status', ['pending', 'in_progress', 'submitted', 'disputed'])->exists()) {
            $job->update(['status' => 'completed']);
        }

        // Cập nhật Dynamic Reputation Score
        $application = $job->applications()->where('status', 'accepted')->first();
        if ($application) {
            $student = $application->student;
            $employer = $job->employer;

            if ($percentage >= 50) {
                // Sinh viên đạt yêu cầu phán quyết
                $reputation->change(
                    $student,
                    5,
                    "Phán quyết tranh chấp: Được công nhận {$percentage}% công việc hoàn thành",
                    $job,
                    $milestone
                );
            } else {
                // Sinh viên bị trừ điểm vì không đạt yêu cầu
                $reputation->change(
                    $student,
                    -10,
                    "Phán quyết tranh chấp: Bị trừ điểm do không hoàn thành yêu cầu milestone ({$percentage}%)",
                    $job,
                    $milestone
                );
            }

            if ($percentage === 0 && $employer) {
                $reputation->change(
                    $employer,
                    3,
                    "Phán quyết tranh chấp: Hoàn trả 100% chi phí ký quỹ",
                    $job,
                    $milestone
                );
            }
        }

        return $this->success($dispute->fresh()->load('votes'), 'Giải quyết tranh chấp thành công.');
    }
}
