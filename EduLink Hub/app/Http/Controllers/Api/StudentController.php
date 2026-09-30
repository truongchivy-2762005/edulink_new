<?php

namespace App\Http\Controllers\Api;

use App\Models\Milestone;
use Illuminate\Http\Request;

class StudentController extends ApiController
{
    public function jobs(Request $request)
    {
        $applications = $request->user()->applications()
            ->where('status', 'accepted')
            ->with([
                'job.employer:id,name',
                'job.escrow',
                'job.milestones.submissions' => fn ($query) => $query
                    ->where('student_id', $request->user()->id)
                    ->latest('submitted_at'),
            ])
            ->latest()
            ->get();

        return $this->success($applications, 'Lấy danh sách việc của sinh viên thành công.');
    }

    public function transactions(Request $request)
    {
        $milestones = Milestone::query()
            ->where('status', 'paid')
            ->whereHas('job.applications', fn ($query) => $query
                ->where('student_id', $request->user()->id)
                ->where('status', 'accepted'))
            ->with('job.employer:id,name')
            ->latest('updated_at')
            ->get();

        $transactions = $milestones->map(fn (Milestone $milestone) => [
            'id' => 'milestone-'.$milestone->id,
            'type' => 'earned',
            'amount' => (float) $milestone->amount,
            'token' => 'USDC',
            'from' => $milestone->job->employer->name,
            'description' => $milestone->title,
            'timestamp' => $milestone->updated_at?->toISOString(),
            'tx_hash' => $milestone->release_tx,
            'status' => $milestone->release_tx ? 'confirmed' : 'pending',
        ])->values();

        return $this->success($transactions, 'Lấy lịch sử thu nhập thành công.');
    }

    public function sbts(Request $request, \App\Services\OCAService $ocaService)
    {
        $credentials = $ocaService->getStudentCredentials($request->user());

        return $this->success($credentials, 'Lấy danh sách chứng chỉ Open Campus Achievements / SBT thành công.');
    }
}
