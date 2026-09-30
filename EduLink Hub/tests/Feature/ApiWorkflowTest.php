<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_and_read_profile(): void
    {
        $register = $this->postJson('/api/register', [
            'name' => 'Khang',
            'email' => 'khang@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'student',
        ]);

        $register->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'student')
            ->assertJsonStructure(['data' => ['token']]);

        $this->postJson('/api/login', [
            'email' => 'khang@example.com',
            'password' => 'Password123!',
        ])->assertOk()->assertJsonPath('success', true);
    }

    public function test_complete_mock_escrow_workflow_updates_job_and_reputation(): void
    {
        $employer = User::factory()->create([
            'role' => 'employer',
            'wallet_address' => str_repeat('1', 32),
        ]);
        $student = User::factory()->create([
            'role' => 'student',
            'wallet_address' => str_repeat('2', 32),
            'reputation_score' => 50,
        ]);
        StudentProfile::create([
            'user_id' => $student->id,
            'skills' => ['React', 'English'],
            'sbt_data' => [['name' => 'React Badge']],
            'availability' => true,
        ]);

        Sanctum::actingAs($employer);
        $jobResponse = $this->postJson('/api/jobs', [
            'title' => 'Landing page Web3',
            'description' => 'Xây dựng landing page cho dự án.',
            'required_skills' => ['React', 'English'],
            'budget' => 100,
            'deadline' => now()->addWeek()->toISOString(),
            'milestones' => [[
                'title' => 'Bàn giao sản phẩm',
                'description' => 'Nộp source code.',
                'amount' => 100,
                'due_date' => now()->addDays(5)->toISOString(),
            ]],
        ])->assertCreated()->assertJsonPath('data.status', 'awaiting_funding');

        $jobId = $jobResponse->json('data.id');
        $milestoneId = $jobResponse->json('data.milestones.0.id');
        $escrowResponse = $this->postJson("/api/jobs/{$jobId}/escrow", [])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
        $escrowId = $escrowResponse->json('data.id');

        $this->postJson("/api/escrows/{$escrowId}/verify")
            ->assertOk()
            ->assertJsonPath('data.status', 'locked');

        $matchResponse = $this->postJson("/api/jobs/{$jobId}/match")
            ->assertOk()
            ->assertJsonPath('data.0.student_id', $student->id);
        $applicationId = $matchResponse->json('data.0.id');

        Sanctum::actingAs($student);
        $this->postJson("/api/applications/{$applicationId}/accept")
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted');
        $this->postJson("/api/milestones/{$milestoneId}/submit", [
            'work_url' => 'https://github.com/example/edulink-demo',
            'description' => 'Đã hoàn tất source code.',
        ])->assertCreated();

        Sanctum::actingAs($employer);
        $this->postJson("/api/milestones/{$milestoneId}/approve", [
            'feedback' => 'Đạt yêu cầu.',
        ])->assertOk()->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('jobs', ['id' => $jobId, 'status' => 'completed']);
        $this->assertDatabaseHas('escrows', ['id' => $escrowId, 'status' => 'released']);
        $this->assertDatabaseHas('users', ['id' => $student->id, 'reputation_score' => 60]);
        $this->assertDatabaseHas('reputation_logs', ['user_id' => $student->id, 'change' => 10]);
    }

    public function test_student_cannot_create_job(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        Sanctum::actingAs($student);

        $this->postJson('/api/jobs', [])->assertForbidden()
            ->assertJsonPath('success', false);
    }
}
