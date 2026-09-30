<?php

namespace Tests\Feature;

use App\Models\Dispute;
use App\Models\Job;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_nextjs_origin_can_call_api_and_unknown_origins_cannot(): void
    {
        $headers = ['Origin' => 'http://127.0.0.1:3000', 'Access-Control-Request-Method' => 'POST', 'Access-Control-Request-Headers' => 'authorization,content-type'];
        $this->options('/api/login', [], $headers)->assertNoContent()->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
        $headers['Origin'] = 'https://untrusted.example';
        $this->options('/api/login', [], $headers)->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    private function job(User $employer): Job
    {
        $job = Job::create(['employer_id' => $employer->id, 'title' => 'Build dashboard', 'description' => 'Deliver UI', 'required_skills' => ['React'], 'budget' => 100, 'deadline' => now()->addWeek(), 'status' => 'open']);
        $job->milestones()->create(['title' => 'UI', 'amount' => 100, 'due_date' => now()->addDays(3), 'status' => 'submitted']);

        return $job;
    }

    public function test_workspace_requires_authentication_and_staff_role(): void
    {
        $this->getJson('/api/workspace/jobs')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(['role' => 'student']));
        $this->getJson('/api/workspace/jobs')->assertForbidden();
        $this->getJson('/api/workspace/users')->assertForbidden();
    }

    public function test_employer_only_reads_own_jobs_and_private_submissions(): void
    {
        $owner = User::factory()->create(['role' => 'employer']);
        $other = User::factory()->create(['role' => 'employer']);
        $mine = $this->job($owner);
        $foreign = $this->job($other);
        Sanctum::actingAs($owner);
        $this->getJson('/api/workspace/jobs')->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.id', $mine->id);
        $this->getJson('/api/workspace/jobs/'.$foreign->id)->assertForbidden();
        $this->getJson('/api/workspace/jobs/'.$mine->id)->assertOk()->assertJsonStructure(['data' => ['milestones', 'applications']]);
    }

    public function test_company_profile_is_persisted_and_scoped_to_current_employer(): void
    {
        $owner = User::factory()->create(['role' => 'employer']);
        Sanctum::actingAs($owner);
        $this->putJson('/api/workspace/company', ['company_name' => 'Acme', 'industry' => 'Education', 'website' => 'https://example.com', 'description' => 'Student opportunities'])->assertOk();
        $this->getJson('/api/workspace/company')->assertJsonPath('data.company_name', 'Acme');
        Sanctum::actingAs(User::factory()->create(['role' => 'employer']));
        $this->getJson('/api/workspace/company')->assertJsonPath('data', null);
        Sanctum::actingAs(User::factory()->create(['role' => 'mentor']));
        $this->putJson('/api/workspace/company', ['company_name' => 'Overwrite'])->assertForbidden();
    }

    public function test_mentor_can_read_evidence_but_not_user_administration(): void
    {
        $owner = User::factory()->create(['role' => 'employer']);
        $job = $this->job($owner);
        $dispute = Dispute::create(['milestone_id' => $job->milestones->first()->id, 'created_by' => $owner->id, 'reason' => 'Incomplete', 'status' => 'open', 'evidence' => ['https://example.com/evidence']]);
        Sanctum::actingAs(User::factory()->create(['role' => 'mentor']));
        $this->getJson('/api/workspace/disputes')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/workspace/disputes/'.$dispute->id)->assertOk()->assertJsonPath('data.evidence.0', 'https://example.com/evidence');
        $this->getJson('/api/workspace/users')->assertForbidden();
        $this->getJson('/api/workspace/jobs/'.$job->id)->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'employer']));
        $this->getJson('/api/workspace/disputes')->assertJsonPath('data.total', 0);
        $this->getJson('/api/workspace/disputes/'.$dispute->id)->assertForbidden();
    }

    public function test_admin_can_search_users_and_edit_name_without_changing_role(): void
    {
        $student = User::factory()->create(['role' => 'student', 'name' => 'Unique Student']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/workspace/users?search=Unique')->assertOk()->assertJsonPath('data.total', 1)->assertJsonMissingPath('data.data.0.password');
        $this->patchJson('/api/workspace/users/'.$student->id, ['name' => 'Corrected name', 'role' => 'admin'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $student->id, 'name' => 'Corrected name', 'role' => 'student']);
    }

    public function test_uploaded_submission_can_only_be_downloaded_by_authorized_reviewers(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('submissions/work.txt', 'Delivered work');
        $owner = User::factory()->create(['role' => 'employer']);
        $job = $this->job($owner);
        $student = User::factory()->create(['role' => 'student']);
        $submission = Submission::create(['milestone_id' => $job->milestones->first()->id, 'student_id' => $student->id, 'file_path' => 'submissions/work.txt', 'submitted_at' => now()]);
        Sanctum::actingAs($owner);
        $this->get('/api/workspace/submissions/'.$submission->id.'/file')->assertOk()->assertDownload();
        Sanctum::actingAs(User::factory()->create(['role' => 'employer']));
        $this->getJson('/api/workspace/submissions/'.$submission->id.'/file')->assertForbidden();
    }
}
