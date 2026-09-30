<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime'];
    }

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
