<?php

namespace App\Http\Controllers\Api;

use App\Models\Escrow;
use App\Models\Job;
use App\Models\Milestone;
use App\Services\SettlementService;
use App\Services\SolanaService;
use Illuminate\Http\Request;

class EscrowController extends ApiController
{
    public function store(Request $request, Job $job, SolanaService $solana)
    {
        $this->ensureOwner($request, $job);
        abort_unless($job->status === 'awaiting_funding', 409, 'Công việc không chờ ký quỹ.');
        abort_unless($request->user()->wallet_address, 409, 'Doanh nghiệp cần kết nối ví Solana trước.');

        $data = $request->validate([
            'deposit_tx' => [$solana->isMock() ? 'nullable' : 'required', 'string', 'max:128', 'unique:escrows,deposit_tx'],
            'program_id' => ['nullable', 'string', 'max:64'],
        ]);
        $escrow = Escrow::updateOrCreate(['job_id' => $job->id], [
            'employer_wallet' => $request->user()->wallet_address,
            'amount' => $job->budget,
            'deposit_tx' => $data['deposit_tx'] ?? $solana->mockTransaction('deposit'),
            'program_id' => $data['program_id'] ?? config('edulink.solana_program_id'),
            'status' => 'pending',
        ]);

        return $this->success($escrow, 'Đã ghi nhận giao dịch ký quỹ.', 201);
    }

    public function verify(Request $request, Escrow $escrow, SolanaService $solana)
    {
        $this->ensureOwner($request, $escrow->job);
        if (! $escrow->deposit_tx || ! $solana->verifyTransaction($escrow->deposit_tx)) {
            return $this->error('Không xác minh được giao dịch ký quỹ.', 422);
        }
        $escrow->update(['status' => 'locked']);
        $escrow->job->update(['status' => 'open', 'escrow_status' => 'locked']);

        return $this->success($escrow->fresh(), 'Xác minh ký quỹ thành công.');
    }

    public function show(Request $request, Escrow $escrow)
    {
        $user = $request->user();
        $acceptedStudent = $escrow->job->applications()->where('student_id', $user->id)->where('status', 'accepted')->exists();
        abort_unless($user->role === 'admin' || $escrow->job->employer_id === $user->id || $acceptedStudent, 403);

        return $this->success($escrow->load('job.milestones'), 'Lấy escrow thành công.');
    }

    public function release(Request $request, Escrow $escrow, SolanaService $solana, SettlementService $settlement)
    {
        $this->ensureOwner($request, $escrow->job);
        abort_unless($escrow->status === 'locked', 409, 'Escrow chưa được khóa.');
        $data = $request->validate([
            'milestone_id' => ['required', 'integer', 'exists:milestones,id'],
            'release_tx' => [$solana->isMock() ? 'nullable' : 'required', 'string', 'max:128'],
        ]);
        $milestone = Milestone::where('job_id', $escrow->job_id)->findOrFail($data['milestone_id']);
        abort_unless($milestone->status === 'approved', 409, 'Milestone chưa được duyệt.');
        $transaction = $data['release_tx'] ?? $solana->mockTransaction('release');
        if (! $solana->verifyTransaction($transaction)) {
            return $this->error('Không xác minh được giao dịch giải ngân.', 422);
        }

        return $this->success(
            $settlement->releaseMilestone($escrow, $milestone, $transaction),
            'Giải ngân milestone thành công.'
        );
    }

    public function refund(Request $request, Escrow $escrow, SolanaService $solana)
    {
        $this->ensureOwner($request, $escrow->job);
        abort_unless(in_array($escrow->status, ['pending', 'locked'], true), 409, 'Escrow không thể hoàn tiền.');

        // Không cho phép hoàn tiền nếu có milestone đã nộp sản phẩm hoặc đang tranh chấp
        $hasActiveWork = $escrow->job->milestones()
            ->whereIn('status', ['submitted', 'approved', 'disputed', 'paid'])
            ->exists();
        if ($hasActiveWork) {
            return $this->error('Không thể hoàn tiền khi có milestone đã nộp sản phẩm, đã duyệt hoặc đang tranh chấp.', 409);
        }
        $data = $request->validate([
            'refund_tx' => [$solana->isMock() ? 'nullable' : 'required', 'string', 'max:128'],
        ]);
        $transaction = $data['refund_tx'] ?? $solana->mockTransaction('refund');
        if (! $solana->verifyTransaction($transaction)) {
            return $this->error('Không xác minh được giao dịch hoàn tiền.', 422);
        }
        $escrow->update(['refund_tx' => $transaction, 'status' => 'refunded']);
        $escrow->job->update(['status' => 'cancelled', 'escrow_status' => 'refunded']);

        return $this->success($escrow->fresh(), 'Hoàn tiền thành công.');
    }

    private function ensureOwner(Request $request, Job $job): void
    {
        abort_unless($job->employer_id === $request->user()->id, 403, 'Bạn không quản lý công việc này.');
    }
}
