<?php

namespace App\Services;

use App\Services\Base58;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SolanaService
{
    public function isMock(): bool
    {
        return config('edulink.blockchain_mode') === 'mock';
    }

    public function mockTransaction(string $action): string
    {
        return 'mock_'.$action.'_'.Str::uuid();
    }

    /**
     * Generate a cryptographic nonce and sign message for wallet ownership verification.
     */
    public function generateWalletNonce(int $userId): array
    {
        $nonce = Str::random(32);
        $expiresAt = now()->addMinutes(10);
        Cache::put("wallet_nonce_{$userId}", $nonce, $expiresAt);

        $message = "EduLink Hub - Xác thực liên kết ví Solana\n"
            ."Mã xác nhận (Nonce): {$nonce}\n"
            ."Thời gian tạo: ".now()->toIso8601String()."\n"
            ."Lưu ý: Thao tác này hoàn toàn miễn phí và không tốn phí mạng.";

        return [
            'nonce' => $nonce,
            'message' => $message,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    /**
     * Verify that the user actually owns the Solana wallet address via Ed25519 signature.
     */
    public function verifyWalletSignature(string $walletAddress, string $signature, string $message, int $userId): array
    {
        $cachedNonce = Cache::get("wallet_nonce_{$userId}");
        if (! $cachedNonce) {
            return [
                'success' => false,
                'error' => 'Mã xác thực (Nonce) đã hết hạn hoặc không tồn tại. Vui lòng thử lại.',
            ];
        }

        if (! str_contains($message, $cachedNonce)) {
            return [
                'success' => false,
                'error' => 'Nội dung thông điệp không khớp với mã xác thực được cấp.',
            ];
        }

        // Decode Base58 wallet public key (must be 32 bytes)
        $pubKeyBinary = Base58::decode($walletAddress);
        if (! $pubKeyBinary || strlen($pubKeyBinary) !== 32) {
            return [
                'success' => false,
                'error' => 'Địa chỉ ví Solana (Public Key) không đúng định dạng 32 bytes.',
            ];
        }

        // Decode Base58 signature (must be 64 bytes)
        $sigBinary = Base58::decode($signature);
        if (! $sigBinary || strlen($sigBinary) !== 64) {
            return [
                'success' => false,
                'error' => 'Chữ ký số Solana không đúng định dạng 64 bytes.',
            ];
        }

        // Verify with libsodium Ed25519
        if (function_exists('sodium_crypto_sign_verify_detached')) {
            $isValid = @sodium_crypto_sign_verify_detached($sigBinary, $message, $pubKeyBinary);
            if (! $isValid) {
                return [
                    'success' => false,
                    'error' => 'Chữ ký không hợp lệ! Không thể xác minh quyền sở hữu ví.',
                ];
            }
        } else {
            // Fallback for environments where sodium is unavailable:
            // In mock mode allow, in production require sodium
            if (! $this->isMock()) {
                return [
                    'success' => false,
                    'error' => 'Máy chủ thiếu module libsodium để xác thực chữ ký Ed25519.',
                ];
            }
        }

        // Invalidate the nonce after successful verification
        Cache::forget("wallet_nonce_{$userId}");

        return ['success' => true, 'error' => null];
    }

    public function verifyTransaction(string $signature): bool
    {
        if ($this->isMock()) {
            return str_starts_with($signature, 'mock_') || filled($signature);
        }

        try {
            $response = Http::timeout(12)->post(config('edulink.solana_rpc_url'), [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => 'getTransaction',
                'params' => [$signature, ['encoding' => 'json', 'maxSupportedTransactionVersion' => 0]],
            ]);
        } catch (\Throwable) {
            return false;
        }

        if (! $response->successful() || ! filled($response->json('result')) || $response->json('result.meta.err') !== null) {
            return false;
        }

        $programId = config('edulink.solana_program_id');
        $accountKeys = $response->json('result.transaction.message.accountKeys', []);

        return ! $programId || in_array($programId, $accountKeys, true);
    }
}
