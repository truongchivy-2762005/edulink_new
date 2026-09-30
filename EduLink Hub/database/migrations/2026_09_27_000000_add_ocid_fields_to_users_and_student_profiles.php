<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'ocid_username')) {
                $table->string('ocid_username')->nullable()->after('ocid');
            }
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('student_profiles', 'ocid')) {
                $table->string('ocid')->nullable()->after('user_id');
            }
            if (! Schema::hasColumn('student_profiles', 'ocid_username')) {
                $table->string('ocid_username')->nullable()->after('ocid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'ocid_username')) {
                $table->dropColumn('ocid_username');
            }
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('student_profiles', 'ocid')) {
                $table->dropColumn('ocid');
            }
            if (Schema::hasColumn('student_profiles', 'ocid_username')) {
                $table->dropColumn('ocid_username');
            }
        });
    }
};
