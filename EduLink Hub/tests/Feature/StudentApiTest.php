<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Job;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_reads_only_their_work_income_and_credentials(): void
    {
        $employer = User::factory()->create(['role' => 'employer']);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        StudentProfile::create([
            'user_id' => $student->id,
            'sbt_data' => [['name' => 'Laravel Badge', 'issuer' => 'EduLink']],
        ]);

        $job = Job::create([
            'employer_id' => $employer->id,
            'title' => 'Laravel API',
            'description' => 'Xây dựng API.',
            'required_skills' => ['Laravel'],
            'budget' => 100,
            'deadline' => now()->addWeek(),
            'status' => 'in_progress',
            'escrow_status' => 'locked',
        ]);
        $milestone = $job->milestones()->create([
            'title' => 'Bàn giao API',
            'amount' => 100,
            'due_date' => now()->addDays(5),
            'position' => 1,
            'status' => 'paid',
            'release_tx' => 'release-student-test',
        ]);
        Application::create([
            'job_id' => $job->id,
            'student_id' => $student->id,
            'status' => 'accepted',
        ]);

        $otherJob = Job::create([
            'employer_id' => $employer->id,
            'title' => 'Private job',
            'description' => 'Không thuộc sinh viên hiện tại.',
            'budget' => 50,
            'deadline' => now()->addWeek(),
            'status' => 'in_progress',
            'escrow_status' => 'locked',
        ]);
        Application::create([
            'job_id' => $otherJob->id,
            'student_id' => $otherStudent->id,
            'status' => 'accepted',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/student/jobs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.job.id', $job->id)
            ->assertJsonPath('data.0.job.milestones.0.id', $milestone->id);

        $this->getJson('/api/student/transactions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.amount', 100)
            ->assertJsonPath('data.0.tx_hash', 'release-student-test');

        $this->getJson('/api/student/sbts')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Laravel Badge');

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.earned_balance', 100)
            ->assertJsonPath('data.sbt_count', 1);
    }

    public function test_non_student_cannot_access_student_workspace(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'employer']));

        $this->getJson('/api/student/jobs')->assertForbidden();
    }
}
