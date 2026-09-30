<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('university')->nullable();
            $table->string('major')->nullable();
            $table->json('skills')->nullable();
            $table->text('bio')->nullable();
            $table->json('sbt_data')->nullable();
            $table->boolean('availability')->default(true);
            $table->unsignedInteger('completed_jobs')->default(0);
            $table->unsignedInteger('on_time_jobs')->default(0);
            $table->timestamps();
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->json('required_skills')->nullable();
            $table->decimal('budget', 18, 6);
            $table->dateTime('deadline');
            $table->string('status', 30)->default('draft')->index();
            $table->string('escrow_status', 30)->default('pending')->index();
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('match_score', 5, 2)->nullable();
            $table->text('ai_reason')->nullable();
            $table->string('source', 20)->default('manual');
            $table->string('status', 20)->default('matched')->index();
            $table->timestamps();
            $table->unique(['job_id', 'student_id']);
        });

        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 18, 6);
            $table->dateTime('due_date');
            $table->unsignedInteger('position')->default(1);
            $table->string('status', 20)->default('pending')->index();
            $table->string('release_tx', 128)->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('milestone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('work_url', 2048)->nullable();
            $table->string('file_path')->nullable();
            $table->text('description')->nullable();
            $table->text('employer_feedback')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();
        });

        Schema::create('escrows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('employer_wallet', 64);
            $table->string('student_wallet', 64)->nullable();
            $table->decimal('amount', 18, 6);
            $table->string('deposit_tx', 128)->nullable()->unique();
            $table->string('release_tx', 128)->nullable()->unique();
            $table->string('refund_tx', 128)->nullable()->unique();
            $table->string('program_id', 64)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->timestamps();
        });

        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('milestone_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->json('evidence')->nullable();
            $table->string('status', 20)->default('open')->index();
            $table->unsignedTinyInteger('student_percentage')->nullable();
            $table->text('resolution')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('dispute_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispute_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('student_percentage');
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->unique(['dispute_id', 'mentor_id']);
        });

        Schema::create('reputation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('milestone_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('change');
            $table->integer('score_after');
            $table->string('reason');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reputation_logs');
        Schema::dropIfExists('dispute_votes');
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('escrows');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('milestones');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('student_profiles');
    }
};
