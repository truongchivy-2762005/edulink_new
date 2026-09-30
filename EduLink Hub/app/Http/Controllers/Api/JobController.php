<?php

namespace App\Http\Controllers\Api;

use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JobController extends ApiController
{
    public function index(Request $request)
    {
        $jobs = Job::query()
            ->with(['employer:id,name,reputation_score', 'milestones'])
            ->withCount('applications')
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->search, fn ($query, $search) => $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(max(1, min((int) $request->integer('per_page', 15), 50)));

        return $this->success($jobs, 'Lấy danh sách công việc thành công.');
    }

    public function show(Request $request, Job $job)
    {
        $job->loadCount('applications');
        $job->load(['employer:id,name,reputation_score', 'milestones', 'escrow']);

        // Nếu user đã đăng nhập và là sinh viên, trả thêm trạng thái ứng tuyển
        $user = $request->user();
        if ($user && $user->role === 'student') {
            $application = $job->applications()
                ->where('student_id', $user->id)
                ->first(['id', 'status', 'created_at']);
            $job->setAttribute('my_application', $application);
        }

        return $this->success($job, 'Lấy công việc thành công.');
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $job = DB::transaction(function () use ($request, $data) {
            $milestones = $data['milestones'] ?? [];
            unset($data['milestones']);
            $job = $request->user()->postedJobs()->create($data + [
                'status' => 'awaiting_funding',
                'escrow_status' => 'pending',
            ]);
            foreach ($milestones as $index => $milestone) {
                $job->milestones()->create($milestone + ['position' => $index + 1]);
            }

            return $job;
        });

        return $this->success($job->load('milestones'), 'Tạo công việc thành công.', 201);
    }

    public function update(Request $request, Job $job)
    {
        $this->ensureOwner($request, $job);
        if (! in_array($job->status, ['draft', 'awaiting_funding'], true)) {
            return $this->error('Chỉ có thể sửa công việc trước khi ký quỹ.', 409);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:10000'],
            'required_skills' => ['sometimes', 'array'],
            'required_skills.*' => ['string', 'max:100'],
            'budget' => ['sometimes', 'numeric', 'gt:0'],
            'deadline' => ['sometimes', 'date', 'after:now'],
        ]);
        $job->update($data);

        return $this->success($job->fresh()->load('milestones'), 'Cập nhật công việc thành công.');
    }

    public function destroy(Request $request, Job $job)
    {
        $this->ensureOwner($request, $job);
        if (! in_array($job->status, ['draft', 'awaiting_funding'], true) || $job->escrow_status === 'locked') {
            return $this->error('Không thể xóa công việc đã bắt đầu hoặc đã khóa tiền.', 409);
        }
        $job->delete();

        return $this->success(null, 'Xóa công việc thành công.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'required_skills' => ['nullable', 'array'],
            'required_skills.*' => ['string', 'max:100'],
            'budget' => ['required', 'numeric', 'gt:0'],
            'deadline' => ['required', 'date', 'after:now'],
            'milestones' => ['required', 'array', 'min:1'],
            'milestones.*.title' => ['required', 'string', 'max:255'],
            'milestones.*.description' => ['nullable', 'string', 'max:3000'],
            'milestones.*.amount' => ['required', 'numeric', 'gt:0'],
            'milestones.*.due_date' => ['required', 'date', 'after:now'],
        ]);

        if (! empty($data['milestones'])) {
            $total = collect($data['milestones'])->sum(fn ($item) => (float) $item['amount']);
            if (abs($total - (float) $data['budget']) > 0.000001) {
                throw ValidationException::withMessages([
                    'milestones' => ['Tổng tiền các milestone phải bằng ngân sách công việc.'],
                ]);
            }
        }

        return $data;
    }

    private function ensureOwner(Request $request, Job $job): void
    {
        abort_unless($job->employer_id === $request->user()->id, 403, 'Bạn chỉ được quản lý công việc của mình.');
    }
}
