<?php

namespace App\Services;

use App\Models\Escrow;
use App\Models\Milestone;
use Illuminate\Support\Facades\DB;

class SettlementService
{
    public function releaseMilestone(Escrow $escrow, Milestone $milestone, string $transaction): Milestone
    {
        return DB::transaction(function () use ($escrow, $milestone, $transaction) {
            $milestone->update(['status' => 'paid', 'release_tx' => $transaction]);

            $job = $escrow->job()->lockForUpdate()->firstOrFail();
            if (! $job->milestones()->where('status', '!=', 'paid')->exists()) {
                $wasCompleted = $job->status === 'completed';
                $job->update(['status' => 'completed']);
                $escrow->update(['status' => 'released', 'release_tx' => $transaction]);

                if (! $wasCompleted) {
                    $application = $job->applications()->where('status', 'accepted')->first();
                    if ($application) {
                        $student = $application->student;
                        $onTime = now()->lte($job->deadline);
                        app(ReputationService::class)->change(
                            $student,
                            $onTime ? 10 : 3,
                            $onTime ? 'Hoàn thành công việc đúng hạn' : 'Hoàn thành công việc trễ hạn',
                            $job,
                            $milestone
                        );
                        $profile = $student->studentProfile;
                        if ($profile) {
                            $profile->increment('completed_jobs');
                            if ($onTime) {
                                $profile->increment('on_time_jobs');
                            }
                        }
                    }
                }
            }

            return $milestone->fresh();
        });
    }
}
