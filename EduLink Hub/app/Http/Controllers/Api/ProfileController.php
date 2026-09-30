<?php

namespace App\Http\Controllers\Api;

use App\Services\SolanaService;
use Illuminate\Http\Request;

class ProfileController extends ApiController
{
    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'ocid' => ['sometimes', 'nullable', 'string', 'max:255', 'unique:users,ocid,'.$user->id],
            'university' => ['sometimes', 'nullable', 'string', 'max:255'],
            'major' => ['sometimes', 'nullable', 'string', 'max:255'],
            'skills' => ['sometimes', 'array'],
            'skills.*' => ['string', 'max:100'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'sbt_data' => ['sometimes', 'nullable', 'array'],
            'availability' => ['sometimes', 'boolean'],
        ]);

        $user->update(collect($data)->only(['name', 'ocid'])->all());
        if ($user->role === 'student') {
            $user->studentProfile()->updateOrCreate(
                ['user_id' => $user->id],
                collect($data)->only(['university', 'major', 'skills', 'bio', 'sbt_data', 'availability'])->all()
            );
        }

        return $this->success($user->fresh()->load('studentProfile'), 'Cập nhật hồ sơ thành công.');
    }

    /**
     * Request a nonce to sign for Solana wallet ownership verification.
     */
    public function walletNonce(Request $request, SolanaService $solanaService)
    {
        $payload = $solanaService->generateWalletNonce($request->user()->id);

        return $this->success($payload, 'Tạo mã xác nhận ví thành công.');
    }

    /**
     * Connect and verify Solana wallet using Ed25519 signature.
     */
    public function connectWallet(Request $request, SolanaService $solanaService)
    {
        $data = $request->validate([
            'wallet_address' => ['required', 'string', 'regex:/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', 'unique:users,wallet_address,'.$request->user()->id],
            'signature' => ['sometimes', 'nullable', 'string'],
            'message' => ['sometimes', 'nullable', 'string'],
        ], [
            'wallet_address.regex' => 'Địa chỉ ví Solana không hợp lệ.',
            'wallet_address.unique' => 'Địa chỉ ví này đã được liên kết với một tài khoản khác.',
        ]);

        // If signature and message are provided, verify cryptographically
        if (! empty($data['signature']) && ! empty($data['message'])) {
            $verification = $solanaService->verifyWalletSignature(
                $data['wallet_address'],
                $data['signature'],
                $data['message'],
                $request->user()->id
            );

            if (! $verification['success']) {
                return $this->error($verification['error'], 422);
            }
        } elseif (! $solanaService->isMock()) {
            // In devnet / production mode, signature is required
            return $this->error('Yêu cầu ký thông điệp để xác minh quyền sở hữu ví.', 422);
        }

        $request->user()->update([
            'wallet_address' => $data['wallet_address'],
        ]);

        return $this->success([
            'wallet_address' => $data['wallet_address'],
            'verified' => true,
        ], 'Liên kết và xác thực ví Solana thành công.');
    }

    /**
     * Connect and link Open Campus ID (OCID) account.
     */
    public function connectOcid(Request $request)
    {
        $data = $request->validate([
            'ocid' => ['required', 'string', 'max:255', 'unique:users,ocid,'.$request->user()->id],
            'ocid_username' => ['nullable', 'string', 'max:255'],
            'id_token' => ['nullable', 'string'],
        ], [
            'ocid.required' => 'Mã Open Campus ID (ocid) là bắt buộc.',
            'ocid.unique' => 'Tài khoản Open Campus ID này đã được liên kết với một người dùng khác.',
        ]);

        $user = $request->user();
        $ocidUsername = $data['ocid_username'] ?? explode('.', $data['ocid'])[0] ?? 'ocid_student';

        $user->update([
            'ocid' => $data['ocid'],
            'ocid_username' => $ocidUsername,
        ]);

        if ($user->role === 'student') {
            $profile = $user->studentProfile()->firstOrCreate(['user_id' => $user->id]);
            $sbtData = is_array($profile->sbt_data) ? $profile->sbt_data : [];

            // Add OCID Verified SBT credential badge if not already added
            $hasOcidBadge = collect($sbtData)->contains(fn ($item) => ($item['id'] ?? '') === 'oca-cert-ocid-connect');
            if (! $hasOcidBadge) {
                $sbtData[] = [
                    'id' => 'oca-cert-ocid-connect',
                    'title' => 'Open Campus ID Verified Student',
                    'issuer' => 'Open Campus Protocol Alliance',
                    'issued_at' => now()->toDateString(),
                    'skills' => ['Open Campus ID', 'Web3 Identity'],
                    'credential_hash' => '0x'.substr(md5($data['ocid'].time()), 0, 16),
                ];
            }

            $profile->update([
                'ocid' => $data['ocid'],
                'ocid_username' => $ocidUsername,
                'sbt_data' => $sbtData,
            ]);
        }

        return $this->success([
            'ocid' => $user->ocid,
            'ocid_username' => $user->ocid_username,
            'user' => $user->fresh()->load('studentProfile'),
        ], 'Kết nối tài khoản Open Campus ID (OCID) thành công.');
    }

    /**
     * Get reputation change history for the authenticated user or specified user_id.
     */
    public function reputationHistory(Request $request)
    {
        $targetUserId = $request->query('user_id');
        $userId = $targetUserId ? (int) $targetUserId : $request->user()->id;

        $logs = \App\Models\ReputationLog::query()
            ->where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->get();

        return $this->success($logs, 'Tải lịch sử biến động điểm uy tín thành công.');
    }
}
