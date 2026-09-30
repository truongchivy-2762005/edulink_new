<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['match_score' => 'decimal:2'];
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
