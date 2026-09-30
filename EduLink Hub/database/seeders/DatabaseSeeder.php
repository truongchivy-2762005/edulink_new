<?php

namespace Database\Seeders;

use App\Models\Escrow;
use App\Models\Job;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'Password123!';
        $employer = User::updateOrCreate(
            ['email' => 'employer@edulink.test'],
            ['name' => 'EduLink Company', 'password' => $password, 'role' => 'employer', 'wallet_address' => str_repeat('1', 32)]
        );
        $student = User::updateOrCreate(
            ['email' => 'student@edulink.test'],
            ['name' => 'Nguyễn Sinh Viên', 'password' => $password, 'role' => 'student', 'wallet_address' => str_repeat('2', 32), 'ocid' => 'ocid-demo-student']
        );
        User::updateOrCreate(
            ['email' => 'mentor@edulink.test'],
            ['name' => 'Mentor Demo', 'password' => $password, 'role' => 'mentor', 'reputation_score' => 90]
        );
        User::updateOrCreate(
            ['email' => 'admin@edulink.test'],
            ['name' => 'Admin EduLink', 'password' => $password, 'role' => 'admin']
        );
        StudentProfile::updateOrCreate(['user_id' => $student->id], [
            'university' => 'Đại học Demo',
            'major' => 'Công nghệ thông tin',
            'skills' => ['Laravel', 'React', 'English'],
            'bio' => 'Sinh viên demo cho quy trình EduLink Hub.',
            'sbt_data' => [['name' => 'Web Development Badge', 'issuer' => 'Open Campus Demo']],
            'availability' => true,
            'completed_jobs' => 2,
            'on_time_jobs' => 2,
        ]);

        $job = Job::firstOrCreate(
            ['employer_id' => $employer->id, 'title' => 'Xây dựng landing page Web3'],
            [
                'description' => 'Thiết kế và triển khai landing page cho một dự án giáo dục.',
                'required_skills' => ['React', 'English'],
                'budget' => 100,
                'deadline' => now()->addDays(7),
                'status' => 'open',
                'escrow_status' => 'locked',
            ]
        );
        if (! $job->milestones()->exists()) {
            $job->milestones()->createMany([
                ['title' => 'Thiết kế giao diện', 'amount' => 40, 'due_date' => now()->addDays(3), 'position' => 1],
                ['title' => 'Hoàn thiện và bàn giao', 'amount' => 60, 'due_date' => now()->addDays(7), 'position' => 2],
            ]);
        }
        Escrow::firstOrCreate(['job_id' => $job->id], [
            'employer_wallet' => $employer->wallet_address,
            'amount' => $job->budget,
            'deposit_tx' => 'mock_deposit_seed',
            'status' => 'locked',
        ]);
    }
}
