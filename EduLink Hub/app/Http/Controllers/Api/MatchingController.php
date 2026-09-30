<?php

namespace App\Http\Controllers\Api;

use App\Models\Application;
use App\Models\Job;
use App\Services\MatchingService;
use Illuminate\Http\Request;

class MatchingController extends ApiController
{
    public function match(Request $request, Job $job, MatchingService $matching)
    {
        abort_unless($job->employer_id === $request->user()->id, 403);
        abort_unless($job->status === 'open', 409, 'Công việc phải ở trạng thái open.');

        $topCandidates = $matching->topCandidates($job, 5);
        foreach ($topCandidates as $candidate) {
            Application::updateOrCreate(
                ['job_id' => $job->id, 'student_id' => $candidate['student_id']],
                [
                    'match_score' => $candidate['match_score'],
                    'ai_reason' => $candidate['reason'],
                    'source' => 'ai',
                    'status' => 'matched',
                ]
            );
        }

        return $this->candidates($request, $job, $matching);
    }

    public function candidates(Request $request, Job $job, MatchingService $matching)
    {
        abort_unless($job->employer_id === $request->user()->id, 403);

        $applications = $job->applications()
            ->with('student.studentProfile')
            ->orderByDesc('match_score')
            ->get()
            ->map(function ($app) use ($job, $matching) {
                if ($app->student) {
                    $evaluation = $matching->score($job, $app->student);
                    $app->match_breakdown = $evaluation['breakdown'];
                    $app->match_reasons = $evaluation['reasons'];
                    $app->matched_skills = $evaluation['matched_skills'];
                }
                return $app;
            });

        return $this->success(
            $applications,
            'Lấy danh sách Top ứng viên phù hợp thành công.'
        );
    }
}

