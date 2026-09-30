<?php

namespace App\Services;

use App\Models\Job;
use App\Models\Milestone;
use App\Models\ReputationLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReputationService
{
    public function change(User $user, int $points, string $reason, ?Job $job = null, ?Milestone $milestone = null): ReputationLog
    {
        return DB::transaction(function () use ($user, $points, $reason, $job, $milestone) {
            $user->refresh();
            $user->reputation_score = max(0, $user->reputation_score + $points);
            $user->save();

            return ReputationLog::create([
                'user_id' => $user->id,
                'job_id' => $job?->id,
                'milestone_id' => $milestone?->id,
                'change' => $points,
                'score_after' => $user->reputation_score,
                'reason' => $reason,
            ]);
        });
    }
}
