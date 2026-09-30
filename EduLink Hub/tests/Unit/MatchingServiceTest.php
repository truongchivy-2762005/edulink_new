<?php

namespace Tests\Unit;

use App\Models\Job;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\MatchingService;
use PHPUnit\Framework\TestCase;

class MatchingServiceTest extends TestCase
{
    public function test_score_calculation_five_criteria(): void
    {
        $service = new MatchingService();

        $job = new Job([
            'required_skills' => ['React', 'TypeScript', 'Solana'],
        ]);

        $student = new User([
            'id' => 1,
            'name' => 'Nguyen Van An',
            'reputation_score' => 100,
        ]);

        $profile = new StudentProfile([
            'skills' => ['React', 'TypeScript', 'Solana', 'Laravel'],
            'sbt_data' => [
                ['title' => 'Open Campus Senior Developer'],
                ['title' => 'EduLink Fullstack Developer'],
            ],
            'completed_jobs' => 5,
            'on_time_jobs' => 5,
        ]);

        $student->setRelation('studentProfile', $profile);

        $result = $service->score($job, $student);

        $this->assertEquals(100.0, $result['match_score']);
        $this->assertEquals(35.0, $result['breakdown']['skills']);
        $this->assertEquals(20.0, $result['breakdown']['certificates']);
        $this->assertEquals(20.0, $result['breakdown']['reputation']);
        $this->assertEquals(15.0, $result['breakdown']['experience']);
        $this->assertEquals(10.0, $result['breakdown']['ontime']);
        $this->assertCount(3, $result['matched_skills']);
        $this->assertCount(5, $result['reasons']);
    }

    public function test_partial_score_breakdown(): void
    {
        $service = new MatchingService();

        $job = new Job([
            'required_skills' => ['React', 'TypeScript', 'Python', 'Go'],
        ]);

        $student = new User([
            'id' => 2,
            'name' => 'Tran Thi B',
            'reputation_score' => 50, // 50% rep -> 10 pts
        ]);

        $profile = new StudentProfile([
            'skills' => ['React', 'TypeScript'], // 2 out of 4 skills -> 17.5 pts
            'sbt_data' => [
                ['title' => 'Open Campus Developer'], // 1 cert -> 10 pts
            ],
            'completed_jobs' => 2, // 2 out of 5 -> 6 pts
            'on_time_jobs' => 2, // 100% rate -> 10 pts
        ]);

        $student->setRelation('studentProfile', $profile);

        $result = $service->score($job, $student);

        // Total expected = 17.5 + 10 + 10 + 6 + 10 = 53.5
        $this->assertEquals(53.5, $result['match_score']);
        $this->assertEquals(17.5, $result['breakdown']['skills']);
        $this->assertEquals(10.0, $result['breakdown']['certificates']);
        $this->assertEquals(10.0, $result['breakdown']['reputation']);
        $this->assertEquals(6.0, $result['breakdown']['experience']);
        $this->assertEquals(10.0, $result['breakdown']['ontime']);
    }
}
