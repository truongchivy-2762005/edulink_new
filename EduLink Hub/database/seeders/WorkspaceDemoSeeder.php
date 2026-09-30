<?php

namespace Database\Seeders;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class WorkspaceDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DatabaseSeeder::class);

        // Mentor demo 2 & 3
        foreach ([2, 3] as $number) {
            User::updateOrCreate(
                ['email' => "mentor{$number}@edulink.test"],
                [
                    'name' => "Mentor Trọng tài {$number}",
                    'password' => bcrypt('Password123!'),
                    'role' => 'mentor',
                    'reputation_score' => 90 + $number,
                ]
            );
        }

        // 5 Hồ sơ sinh viên mẫu phong phú cho Top 5 AI Matching
        $studentsData = [
            1 => [
                'email' => 'student@edulink.test',
                'name' => 'Nguyễn Văn An (Top 1 Candidate)',
                'rep' => 98,
                'skills' => ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Solana', 'Laravel'],
                'university' => 'Đại học Bách Khoa',
                'major' => 'Khoa học Máy tính',
                'completed_jobs' => 6,
                'on_time_jobs' => 6,
                'sbt_data' => [
                    [
                        'id' => 'oca-cert-101',
                        'title' => 'Open Campus Senior Web3 Developer',
                        'issuer' => 'Open Campus Protocol Alliance',
                        'issued_at' => '2026-01-15',
                        'skills' => ['React', 'Solana', 'TypeScript'],
                        'credential_hash' => '0x8f7e...9a1b',
                    ],
                    [
                        'id' => 'oca-cert-102',
                        'title' => 'EduLink Verified Fullstack Engineer',
                        'issuer' => 'EduLink Hub Academy',
                        'issued_at' => '2026-03-10',
                        'skills' => ['Laravel', 'Next.js'],
                        'credential_hash' => '0x4c2a...8e9d',
                    ],
                ],
            ],
            2 => [
                'email' => 'student2@edulink.test',
                'name' => 'Trần Thị Bình (Top 2 Candidate)',
                'rep' => 88,
                'skills' => ['React', 'TypeScript', 'Node.js', 'English'],
                'university' => 'Đại học Công Nghệ',
                'major' => 'Công nghệ Thông tin',
                'completed_jobs' => 4,
                'on_time_jobs' => 4,
                'sbt_data' => [
                    [
                        'id' => 'oca-cert-201',
                        'title' => 'Open Campus Frontend Specialist',
                        'issuer' => 'Open Campus Protocol Alliance',
                        'issued_at' => '2026-02-20',
                        'skills' => ['React', 'TypeScript'],
                        'credential_hash' => '0x1a2b...3c4d',
                    ],
                ],
            ],
            3 => [
                'email' => 'student3@edulink.test',
                'name' => 'Lê Hoàng Cường (Top 3 Candidate)',
                'rep' => 80,
                'skills' => ['React', 'UI/UX', 'Figma', 'Tailwind'],
                'university' => 'Đại học Quốc gia',
                'major' => 'Thiết kế Đồ họa & Web',
                'completed_jobs' => 3,
                'on_time_jobs' => 2,
                'sbt_data' => [
                    [
                        'id' => 'oca-cert-301',
                        'title' => 'EduLink Certified UI/UX Designer',
                        'issuer' => 'EduLink Hub Academy',
                        'issued_at' => '2026-04-05',
                        'skills' => ['UI/UX', 'Figma'],
                        'credential_hash' => '0x9z8y...7x6w',
                    ],
                ],
            ],
            4 => [
                'email' => 'student4@edulink.test',
                'name' => 'Phạm Minh Dung (Top 4 Candidate)',
                'rep' => 72,
                'skills' => ['Python', 'Laravel', 'MySQL', 'PHP'],
                'university' => 'Đại học Kỹ thuật',
                'major' => 'Hệ thống Thông tin',
                'completed_jobs' => 2,
                'on_time_jobs' => 2,
                'sbt_data' => [],
            ],
            5 => [
                'email' => 'student5@edulink.test',
                'name' => 'Võ Quốc Em (Top 5 Candidate)',
                'rep' => 65,
                'skills' => ['Flutter', 'Mobile Dev', 'Dart'],
                'university' => 'Cao đẳng Công nghệ',
                'major' => 'Phát triển Ứng dụng Di động',
                'completed_jobs' => 1,
                'on_time_jobs' => 1,
                'sbt_data' => [],
            ],
        ];

        foreach ($studentsData as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('Password123!'),
                    'role' => 'student',
                    'reputation_score' => $data['rep'],
                ]
            );

            StudentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'university' => $data['university'],
                    'major' => $data['major'],
                    'skills' => $data['skills'],
                    'bio' => "Sinh viên sinh hoạt tại {$data['university']}, đam mê công nghệ và muốn đóng góp dự án thực tế.",
                    'sbt_data' => $data['sbt_data'],
                    'availability' => true,
                    'completed_jobs' => $data['completed_jobs'],
                    'on_time_jobs' => $data['on_time_jobs'],
                ]
            );
        }

        // Tự động chạy Matching Engine cho các công việc demo
        $jobs = \App\Models\Job::all();
        $matching = app(\App\Services\MatchingService::class);
        foreach ($jobs as $job) {
            $topCandidates = $matching->topCandidates($job, 5);
            foreach ($topCandidates as $candidate) {
                \App\Models\Application::updateOrCreate(
                    ['job_id' => $job->id, 'student_id' => $candidate['student_id']],
                    [
                        'match_score' => $candidate['match_score'],
                        'ai_reason' => $candidate['reason'],
                        'source' => 'ai',
                        'status' => 'matched',
                    ]
                );
            }
        }

        // Tạo nhật ký biến động uy tín ban đầu (Initial Reputation Logs) cho các tài khoản sinh viên
        $demoStudent = User::where('email', 'student@edulink.test')->first();
        if ($demoStudent) {
            \App\Models\ReputationLog::query()->where('user_id', $demoStudent->id)->delete();
            
            \App\Models\ReputationLog::create([
                'user_id' => $demoStudent->id,
                'change' => 50,
                'score_after' => 50,
                'reason' => 'Khởi tạo hệ thống điểm uy tín ban đầu (+50đ)',
                'created_at' => now()->subDays(30),
            ]);
            \App\Models\ReputationLog::create([
                'user_id' => $demoStudent->id,
                'change' => 10,
                'score_after' => 60,
                'reason' => 'Xác thực tài khoản Open Campus ID (OCID) (+10đ)',
                'created_at' => now()->subDays(20),
            ]);
            \App\Models\ReputationLog::create([
                'user_id' => $demoStudent->id,
                'change' => 10,
                'score_after' => 70,
                'reason' => 'Hoàn thành Milestone "Thiết kế Giao diện Landing Page": Đúng hạn (+10đ)',
                'created_at' => now()->subDays(12),
            ]);
            \App\Models\ReputationLog::create([
                'user_id' => $demoStudent->id,
                'change' => 10,
                'score_after' => 80,
                'reason' => 'Hoàn thành Milestone "Tích hợp Solana Escrow Smart Contract": Đúng hạn (+10đ)',
                'created_at' => now()->subDays(5),
            ]);
            \App\Models\ReputationLog::create([
                'user_id' => $demoStudent->id,
                'change' => 18,
                'score_after' => 98,
                'reason' => 'Đánh giá Xuất sắc từ Doanh nghiệp EduLink Company (+18đ)',
                'created_at' => now()->subDays(1),
            ]);
        }
    }
}

