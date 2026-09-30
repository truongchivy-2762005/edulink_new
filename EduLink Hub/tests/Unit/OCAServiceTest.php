<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\StudentProfile;
use App\Services\OCAService;
use Tests\TestCase;

class OCAServiceTest extends TestCase
{
    public function test_can_issue_and_verify_open_campus_achievement(): void
    {
        $student = new User([
            'id' => 99,
            'name' => 'Nguyen Van A',
            'email' => 'student_test@edulink.edu',
            'role' => 'student',
            'ocid' => 'ocid.nguyenvana.edu',
        ]);
        $student->exists = true;

        $profile = new StudentProfile([
            'user_id' => 99,
            'sbt_data' => [],
        ]);

        $service = new OCAService();

        $raw = [
            'id' => 'oca-cert-101',
            'title' => 'Solana Smart Contract Dev',
            'issuer' => 'EduLink Alliance',
            'skills' => ['Solana', 'Rust', 'Anchor'],
            'credential_hash' => '0x99887766554433221100aabbccddeeff',
        ];

        $formatted = $service->formatCredential($raw, $student);

        $this->assertEquals('Solana Smart Contract Dev', $formatted['title']);
        $this->assertEquals('EduLink Alliance', $formatted['issuer']);
        $this->assertTrue($service->verifyCredential($formatted));
    }
}
