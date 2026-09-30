<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Milestone extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['amount' => 'decimal:6', 'due_date' => 'datetime'];
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function disputes()
    {
        return $this->hasMany(Dispute::class);
    }
}
