<?php

namespace App\Services;

use App\Models\Job;
use App\Models\User;
use Illuminate\Support\Collection;

class MatchingService
{
    public function topCandidates(Job $job, int $limit = 5): Collection
    {
        return User::query()
            ->where('role', 'student')
            ->whereHas('studentProfile', fn ($query) => $query->where('availability', true))
            ->with('studentProfile')
            ->get()
            ->map(fn (User $student) => $this->score($job, $student))
            ->sortByDesc('match_score')
            ->take($limit)
            ->values();
    }

    public function score(Job $job, User $student): array
    {
        $profile = $student->studentProfile;
        $required = collect($job->required_skills ?? [])
            ->map(fn ($skill) => mb_strtolower(trim($skill)))
            ->filter();

        $skills = collect($profile?->skills ?? [])
            ->map(fn ($skill) => mb_strtolower(trim($skill)))
            ->filter();

        $matched = $required->intersect($skills)->values();

        // 1. Kỹ năng bắt buộc (35 điểm)
        $skillScore = $required->isEmpty()
            ? 35.0
            : round(35.0 * ($matched->count() / max($required->count(), 1)), 2);

        // 2. Chứng chỉ / Open Campus Achievement / SBT (20 điểm)
        $sbtData = is_array($profile?->sbt_data) ? $profile->sbt_data : [];
        $certCount = count($sbtData);
        $certificateScore = $certCount >= 2 ? 20.0 : ($certCount === 1 ? 10.0 : 0.0);

        // 3. Điểm Uy tín (20 điểm - chuẩn hóa từ 0 đến 100)
        $repVal = max($student->reputation_score ?? 0, 0);
        $reputationScore = round(20.0 * min($repVal / 100.0, 1.0), 2);

        // 4. Kinh nghiệm dự án đã hoàn thành (15 điểm)
        $completedJobs = (int) ($profile?->completed_jobs ?? 0);
        $experienceScore = round(15.0 * min($completedJobs / 5.0, 1.0), 2);

        // 5. Tỷ lệ giao hàng đúng hạn (10 điểm)
        $onTimeJobs = (int) ($profile?->on_time_jobs ?? 0);
        $onTimeRate = $completedJobs > 0 ? ($onTimeJobs / $completedJobs) : 1.0;
        $onTimeScore = round(10.0 * min($onTimeRate, 1.0), 2);

        $totalScore = round(min(
            $skillScore + $certificateScore + $reputationScore + $experienceScore + $onTimeScore,
            100.0
        ), 2);

        $reasonsList = [];
        if ($required->isNotEmpty()) {
            $reasonsList[] = "Trùng {$matched->count()}/{$required->count()} kỹ năng bắt buộc (".($matched->isNotEmpty() ? $matched->join(', ') : 'Chưa có kỹ năng trùng').") [{$skillScore}/35đ]";
        } else {
            $reasonsList[] = "Không yêu cầu kỹ năng đặc thù [{$skillScore}/35đ]";
        }

        if ($certCount > 0) {
            $reasonsList[] = "Sở hữu {$certCount} chứng chỉ OCA/SBT đã xác thực [{$certificateScore}/20đ]";
        } else {
            $reasonsList[] = "Chưa bổ sung chứng chỉ Open Campus/SBT [0/20đ]";
        }

        $reasonsList[] = "Điểm uy tín: {$student->reputation_score}/100 [{$reputationScore}/20đ]";
        $reasonsList[] = "Đã hoàn thành {$completedJobs} dự án [{$experienceScore}/15đ]";
        $reasonsList[] = "Tỷ lệ đúng hạn: ".round($onTimeRate * 100)."% [{$onTimeScore}/10đ]";

        $reasonSummary = implode('; ', $reasonsList);

        return [
            'student_id' => $student->id,
            'student' => $student,
            'match_score' => $totalScore,
            'matched_skills' => $matched->all(),
            'breakdown' => [
                'skills' => $skillScore,
                'certificates' => $certificateScore,
                'reputation' => $reputationScore,
                'experience' => $experienceScore,
                'ontime' => $onTimeScore,
            ],
            'reasons' => $reasonsList,
            'reason' => $reasonSummary,
        ];
    }
}

