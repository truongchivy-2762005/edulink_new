<?php

namespace Tests\Unit;

use App\Models\StudentProfile;
use App\Models\User;
use PHPUnit\Framework\TestCase;

class OCIDConnectTest extends TestCase
{
    public function test_user_ocid_fields_assignment(): void
    {
        $user = new User([
            'name' => 'Test Student',
            'email' => 'test@edulink.test',
            'role' => 'student',
            'ocid' => 'ocid.test_student.edu',
            'ocid_username' => 'test_student',
        ]);

        $this->assertEquals('ocid.test_student.edu', $user->ocid);
        $this->assertEquals('test_student', $user->ocid_username);
    }

    public function test_student_profile_sbt_data_badge_structure(): void
    {
        $profile = new StudentProfile([
            'university' => 'Dai hoc Bach Khoa',
            'sbt_data' => [
                [
                    'id' => 'oca-cert-ocid-connect',
                    'title' => 'Open Campus ID Verified Student',
                    'issuer' => 'Open Campus Protocol Alliance',
                    'issued_at' => '2026-09-27',
                    'skills' => ['Open Campus ID', 'Web3 Identity'],
                    'credential_hash' => '0x8f7e9a1b2c3d4e5f',
                ],
            ],
        ]);

        $this->assertIsArray($profile->sbt_data);
        $this->assertCount(1, $profile->sbt_data);
        $this->assertEquals('oca-cert-ocid-connect', $profile->sbt_data[0]['id']);
        $this->assertEquals('Open Campus ID Verified Student', $profile->sbt_data[0]['title']);
    }
}
