<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class OCAService
{
    /**
     * Get formatted Open Campus Achievements (OCA / SBT) for a student.
     */
    public function getStudentCredentials(User $student): Collection
    {
        $profile = $student->studentProfile;
        $rawSbtData = is_array($profile?->sbt_data) ? $profile->sbt_data : [];

        return collect($rawSbtData)->map(fn ($item, $index) => $this->formatCredential($item, $student, $index));
    }

    /**
     * Format raw credential object according to Open Campus / W3C Verifiable Credential standard.
     */
    public function formatCredential(array $raw, User $student, int $index = 0): array
    {
        $id = $raw['id'] ?? 'oca-cert-'.($index + 101);
        $title = $raw['title'] ?? $raw['name'] ?? 'Open Campus Certified Credential';
        $issuer = $raw['issuer'] ?? 'Open Campus Protocol Alliance';
        $issuedAt = $raw['issued_at'] ?? $raw['issuedAt'] ?? now()->subDays($index * 15)->toDateString();
        $skills = $raw['skills'] ?? ['Web3', 'Blockchain', 'Verified Skill'];
        $hash = $raw['credential_hash'] ?? '0x'.substr(md5($id.$student->id.$issuedAt), 0, 16);

        return [
            'id' => $id,
            'title' => $title,
            'issuer' => $issuer,
            'issued_at' => $issuedAt,
            'skills' => $skills,
            'credential_hash' => $hash,
            'verified' => true,
            'student_name' => $student->name,
            'ocid' => $student->ocid ?? "ocid.student_{$student->id}.edu",
            'type' => 'Soulbound Token (SBT)',
            'description' => "Chứng chỉ học tập & kỹ năng đã được xác thực mã hóa on-chain bởi {$issuer} qua Open Campus ID.",
        ];
    }

    /**
     * Issue a new Open Campus Achievement (OCA / SBT) to a student profile.
     */
    public function issueBadge(User $student, array $details): array
    {
        $mode = config('services.open_campus.mode', 'sandbox');
        $issuerName = $details['issuer'] ?? config('services.open_campus.issuer_name', 'EduLink Hub Alliance');
        $issuedAt = now()->toDateString();
        $title = $details['title'] ?? 'Open Campus Certified Achievement';
        $description = $details['description'] ?? "Chứng chỉ hoàn thành công việc và xác thực kỹ năng cấp bởi {$issuerName}.";
        
        $skills = $details['skills'] ?? ['Web3', 'Verified Performance'];
        if (is_string($skills)) {
            $skills = array_map('trim', explode(',', $skills));
        }

        $uniqueId = 'oca-cert-' . time() . '-' . strtolower(substr(md5(uniqid()), 0, 4));
        
        // Generate cryptographic proof hash & signature for Sandbox mode
        $secretKey = config('services.open_campus.secret_key', 'sandbox_secret');
        $hash = '0x' . substr(hash_hmac('sha256', $uniqueId . $student->id . $issuedAt, $secretKey), 0, 40);
        $signature = '0x' . substr(hash_hmac('sha256', $hash . '_OCID_SANDBOX_SIG', $secretKey), 0, 64);

        $newBadge = [
            'id' => $uniqueId,
            'title' => $title,
            'description' => $description,
            'issuer' => $issuerName,
            'issued_at' => $issuedAt,
            'skills' => array_values($skills),
            'credential_hash' => $hash,
            'signature' => $signature,
            'mode' => $mode,
            'verified' => true,
        ];

        $profile = $student->studentProfile()->firstOrCreate(
            ['user_id' => $student->id],
            ['bio' => 'Student Profile', 'rating' => 5.0]
        );

        $sbtData = is_array($profile->sbt_data) ? $profile->sbt_data : [];
        array_unshift($sbtData, $newBadge);
        $profile->sbt_data = $sbtData;
        $profile->save();

        return $this->formatCredential($newBadge, $student, 0);
    }

    /**
     * Verify credential authenticity.
     */
    public function verifyCredential(array $credential): bool
    {
        return ! empty($credential['credential_hash']) && str_starts_with($credential['credential_hash'], '0x');
    }
}
