<?php

namespace App\Http\Controllers\Api;

use App\Models\CompanyProfile;
use App\Models\Dispute;
use App\Models\Escrow;
use App\Models\Job;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkspaceController extends ApiController
{
    public function config()
    {
        return $this->success(['blockchain_mode' => config('edulink.blockchain_mode')]);
    }

    private function filters(Request $request): array
    {
        return $request->validate(['search' => ['nullable', 'string', 'max:200'], 'status' => ['nullable', 'string', 'max:30'], 'page' => ['nullable', 'integer', 'min:1']]);
    }

    public function jobs(Request $request)
    {
        $filters = $this->filters($request);
        $query = Job::with(['employer:id,name', 'milestones', 'escrow'])->withCount('applications');
        if ($request->user()->role === 'employer') {
            $query->where('employer_id', $request->user()->id);
        }
        if (! empty($filters['search'])) {
            $query->where('title', 'like', '%'.$filters['search'].'%');
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $this->success($query->orderByDesc('id')->paginate(12));
    }

    public function job(Request $request, Job $job)
    {
        abort_unless($request->user()->role === 'admin' || $job->employer_id === $request->user()->id, 403);

        $job->load(['employer:id,name', 'escrow', 'milestones.submissions.student:id,name', 'milestones.disputes', 'applications.student.studentProfile']);

        $matching = app(\App\Services\MatchingService::class);
        if ($job->applications) {
            foreach ($job->applications as $app) {
                if ($app->student) {
                    $evaluation = $matching->score($job, $app->student);
                    $app->match_breakdown = $evaluation['breakdown'];
                    $app->match_reasons = $evaluation['reasons'];
                    $app->matched_skills = $evaluation['matched_skills'];
                }
            }
        }

        return $this->success($job);
    }

    public function disputes(Request $request)
    {
        $filters = $this->filters($request);
        $query = Dispute::with(['milestone.job.employer:id,name', 'votes.mentor:id,name', 'creator:id,name']);
        if ($request->user()->role === 'employer') {
            $query->whereHas('milestone.job', fn ($q) => $q->where('employer_id', $request->user()->id));
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['search'])) {
            $query->whereHas('milestone.job', fn ($q) => $q->where('title', 'like', '%'.$filters['search'].'%'));
        }

        return $this->success($query->orderByDesc('id')->paginate(12));
    }

    public function dispute(Request $request, Dispute $dispute)
    {
        abort_unless(in_array($request->user()->role, ['admin', 'mentor'], true) || $dispute->milestone->job->employer_id === $request->user()->id, 403);

        return $this->success($dispute->load(['milestone.job.employer:id,name', 'milestone.submissions.student:id,name', 'votes.mentor:id,name', 'creator:id,name']));
    }

    public function company(Request $request)
    {
        return $this->success(CompanyProfile::where('user_id', $request->user()->id)->first());
    }

    public function saveCompany(Request $request)
    {
        $data = $request->validate(['company_name' => ['required', 'string', 'max:255'], 'industry' => ['nullable', 'string', 'max:255'], 'website' => ['nullable', 'url:http,https', 'max:2048'], 'description' => ['nullable', 'string', 'max:5000']]);

        return $this->success(CompanyProfile::updateOrCreate(['user_id' => $request->user()->id], $data), 'Đã lưu hồ sơ doanh nghiệp.');
    }

    public function users(Request $request)
    {
        $filters = $this->filters($request);
        $role = $request->validate(['role' => ['nullable', 'in:student,employer,mentor,admin']])['role'] ?? null;
        $query = User::select('id', 'name', 'email', 'role', 'reputation_score', 'wallet_address', 'created_at');
        if (! empty($filters['search'])) {
            $query->where(fn ($q) => $q->where('name', 'like', '%'.$filters['search'].'%')->orWhere('email', 'like', '%'.$filters['search'].'%'));
        }
        if ($role) {
            $query->where('role', $role);
        }

        return $this->success($query->orderByDesc('id')->paginate(12));
    }

    public function updateUser(Request $request, User $user)
    {
        $user->update($request->validate(['name' => ['required', 'string', 'max:255']]));

        return $this->success($user->only('id', 'name', 'email', 'role', 'reputation_score'), 'Đã cập nhật người dùng.');
    }

    public function escrows(Request $request)
    {
        $filters = $this->filters($request);
        $query = Escrow::with('job.milestones');
        if ($request->user()->role === 'employer') {
            $query->whereHas('job', fn ($q) => $q->where('employer_id', $request->user()->id));
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['search'])) {
            $query->whereHas('job', fn ($q) => $q->where('title', 'like', '%'.$filters['search'].'%'));
        }

        return $this->success($query->orderByDesc('id')->paginate(12));
    }

    public function file(Request $request, Submission $submission)
    {
        $role = $request->user()->role;
        $milestone = $submission->milestone;
        $allowed = $role === 'admin' || ($role === 'employer' && $milestone->job->employer_id === $request->user()->id) || ($role === 'mentor' && $milestone->disputes()->exists());
        abort_unless($allowed, 403);
        abort_unless($submission->file_path && Storage::exists($submission->file_path), 404);

        return Storage::download($submission->file_path);
    }
}
