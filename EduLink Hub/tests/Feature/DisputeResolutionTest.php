<?php

namespace Tests\Feature;

use App\Models\Dispute;
use App\Models\DisputeVote;
use App\Models\Job;
use App\Models\Milestone;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisputeResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispute_resolution_updates_milestone_and_reputation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employer = User::factory()->create(['role' => 'employer', 'wallet_address' => str_repeat('1', 32)]);
        $student = User::factory()->create(['role' => 'student', 'reputation_score' => 50]);
        StudentProfile::create(['user_id' => $student->id, 'completed_jobs' => 0, 'on_time_jobs' => 0]);

        $job = Job::create([
            'employer_id' => $employer->id,
            'title' => 'Test Dispute Job',
            'description' => 'Test description',
            'budget' => 100,
            'deadline' => now()->addDays(5),
            'status' => 'disputed',
        ]);
        $job->applications()->create(['student_id' => $student->id, 'status' => 'accepted']);

        $milestone = Milestone::create([
            'job_id' => $job->id,
            'title' => 'Milestone 1',
            'amount' => 100,
            'due_date' => now()->addDays(3),
            'status' => 'disputed',
        ]);

        $dispute = Dispute::create([
            'milestone_id' => $milestone->id,
            'created_by' => $employer->id,
            'reason' => 'Không đúng yêu cầu',
            'status' => 'open',
        ]);

        // Tạo 3 votes từ 3 mentor
        for ($i = 1; $i <= 3; $i++) {
            $mentor = User::factory()->create(['role' => 'mentor']);
            DisputeVote::create([
                'dispute_id' => $dispute->id,
                'mentor_id' => $mentor->id,
                'student_percentage' => 70,
                'reason' => "Đánh giá của Mentor {$i}",
            ]);
        }

        // Admin phán quyết 70% sinh viên
        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/disputes/{$dispute->id}/resolve", [
            'resolution' => 'Sinh viên hoàn thành 70% khối lượng công việc.',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.student_percentage', 70);

        $this->assertEquals('paid', $milestone->fresh()->status);
        $this->assertEquals('completed', $job->fresh()->status);
        // Sinh viên được tăng 5 điểm uy tín
        $this->assertEquals(55, $student->fresh()->reputation_score);
    }
}
