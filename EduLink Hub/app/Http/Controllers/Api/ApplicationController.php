<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\Job;
use App\Services\ReputationService;
use App\Services\SolanaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicationController extends ApiController
{
    /**
     * Student submits application for a job.
     * Status is set to 'pending' (waiting for employer review & approval).
     */
    public function apply(Request $request, Job $job, SolanaService $solana)
    {
        if ($job->status !== 'open') {
            return $this->error('Công việc hiện không nhận ứng viên.', 409);
        }

        $application = Application::firstOrCreate(
            ['job_id' => $job->id, 'student_id' => $request->user()->id],
            ['source' => 'manual', 'status' => 'pending']
        );

        if ($application->status === 'rejected' || $application->status === 'cancelled') {
            $application->update(['status' => 'pending']);
        }

        return $this->success(
            $application->fresh()->load('job'),
            'Đã nộp đơn ứng tuyển thành công! Doanh nghiệp sẽ xem xét và phản hồi.'
        );
    }

    /**
     * Employer accepts/approves a student candidate.
     */
    public function accept(Request $request, Application $application)
    {
        $user = $request->user();

        // Chỉ employer (chủ job) hoặc admin mới được duyệt ứng viên
        if (! in_array($user->role, ['employer', 'admin'], true)) {
            return $this->error('Chỉ doanh nghiệp mới có quyền duyệt ứng viên.', 403);
        }

        $job = Job::query()->findOrFail($application->job_id);

        // Verify employer owns the job (or user is admin)
        if ($user->role === 'employer' && $job->employer_id !== $user->id) {
            return $this->error('Bạn không có quyền duyệt ứng viên cho công việc này.', 403);
        }

        if ($job->status !== 'open') {
            return $this->error('Công việc hiện không ở trạng thái mở nhận ứng viên.', 409);
        }

        $result = DB::transaction(function () use ($application, $job) {
            $application->update(['status' => 'accepted']);
            $job->applications()->whereKeyNot($application->id)->update(['status' => 'rejected']);
            $job->update(['status' => 'in_progress']);

            if ($application->student?->wallet_address) {
                $job->escrow?->update(['student_wallet' => $application->student->wallet_address]);
            }

            return $application->fresh()->load('job', 'student');
        });

        return $result
            ? $this->success($result, 'Đã chấp nhận ứng viên thành công! Công việc đã chuyển sang trạng thái đang thực hiện.')
            : $this->error('Công việc đã được người khác nhận hoặc không còn mở.', 409);
    }

    /**
     * Employer or Student rejects an application.
     */
    public function reject(Request $request, Application $application)
    {
        $user = $request->user();

        if (! in_array($user->role, ['student', 'employer', 'admin'], true)) {
            return $this->error('Bạn không có quyền từ chối đơn này.', 403);
        }

        $job = Job::query()->findOrFail($application->job_id);

        if ($user->role === 'student' && $application->student_id !== $user->id) {
            return $this->error('Bạn không có quyền từ chối đơn này.', 403);
        }

        if ($user->role === 'employer' && $job->employer_id !== $user->id) {
            return $this->error('Bạn không có quyền từ chối đơn này.', 403);
        }

        $application->update(['status' => 'rejected']);

        return $this->success($application, 'Đã từ chối đơn ứng tuyển.');
    }

    /**
     * Student or Employer cancels an application or active job assignment.
     */
    public function cancel(Request $request, Application $application, ReputationService $reputationService)
    {
        $user = $request->user();

        if (! in_array($user->role, ['student', 'employer'], true)) {
            return $this->error('Bạn không có quyền hủy đơn ứng tuyển này.', 403);
        }

        $job = Job::query()->findOrFail($application->job_id);

        if ($user->role === 'student' && $application->student_id !== $user->id) {
            return $this->error('Bạn không có quyền hủy đơn ứng tuyển này.', 403);
        }

        if ($user->role === 'employer' && $job->employer_id !== $user->id) {
            return $this->error('Bạn không có quyền thực hiện thao tác này.', 403);
        }

        $wasAccepted = ($application->status === 'accepted');

        DB::transaction(function () use ($application, $job, $user, $wasAccepted, $reputationService) {
            $application->update(['status' => 'cancelled']);

            // If job was in_progress and assigned to this candidate, reset job back to open
            if ($wasAccepted) {
                $job->update(['status' => 'open']);
                if ($job->escrow) {
                    $job->escrow->update(['student_wallet' => null]);
                }

                // Apply reputation penalty (-15 pts) if student cancels an accepted job
                if ($user->role === 'student') {
                    $reputationService->change(
                        $user,
                        -15,
                        "Hủy nhận việc dự án #{$job->id}: {$job->title}",
                        $job
                    );
                }
            }
        });

        $msg = $wasAccepted
            ? ($user->role === 'student'
                ? 'Đã hủy nhận việc thành công. Điểm uy tín bị trừ 15 điểm do hủy công việc dở dang. Công việc đã được mở lại cho ứng viên khác.'
                : 'Đã hủy gán việc cho ứng viên này. Công việc đã mở lại để nhận ứng viên khác.')
            : 'Đã rút đơn ứng tuyển thành công.';

        return $this->success($application->fresh()->load('job'), $msg);
    }
}
