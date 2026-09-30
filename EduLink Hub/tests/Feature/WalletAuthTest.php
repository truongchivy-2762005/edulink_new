<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Base58;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_request_wallet_nonce(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/wallet/nonce');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'nonce',
                    'message',
                    'expires_at',
                ],
            ]);
    }

    public function test_verifies_genuine_ed25519_solana_signature(): void
    {
        $user = User::factory()->create();

        // 1. Request nonce
        $nonceRes = $this->actingAs($user, 'sanctum')->getJson('/api/wallet/nonce');
        $nonceRes->assertOk();
        $message = $nonceRes->json('data.message');

        // 2. Generate Solana Ed25519 keypair and sign the message
        $keypair = sodium_crypto_sign_keypair();
        $secretKey = sodium_crypto_sign_secretkey($keypair);
        $publicKey = sodium_crypto_sign_publickey($keypair);

        $walletAddress = Base58::encode($publicKey);
        $rawSignature = sodium_crypto_sign_detached($message, $secretKey);
        $signature = Base58::encode($rawSignature);

        // 3. Send to connect wallet
        $connectRes = $this->actingAs($user, 'sanctum')->postJson('/api/wallet/connect', [
            'wallet_address' => $walletAddress,
            'signature' => $signature,
            'message' => $message,
        ]);

        $connectRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.wallet_address', $walletAddress)
            ->assertJsonPath('data.verified', true);

        $this->assertEquals($walletAddress, $user->fresh()->wallet_address);
    }

    public function test_rejects_tampered_signature_or_message(): void
    {
        $user = User::factory()->create();

        $nonceRes = $this->actingAs($user, 'sanctum')->getJson('/api/wallet/nonce');
        $nonceRes->assertOk();
        $message = $nonceRes->json('data.message');

        $keypair = sodium_crypto_sign_keypair();
        $secretKey = sodium_crypto_sign_secretkey($keypair);
        $publicKey = sodium_crypto_sign_publickey($keypair);

        $walletAddress = Base58::encode($publicKey);
        // Sign different message
        $rawSignature = sodium_crypto_sign_detached('Tampered message', $secretKey);
        $signature = Base58::encode($rawSignature);

        $connectRes = $this->actingAs($user, 'sanctum')->postJson('/api/wallet/connect', [
            'wallet_address' => $walletAddress,
            'signature' => $signature,
            'message' => $message,
        ]);

        $connectRes->assertStatus(422);
    }
}
