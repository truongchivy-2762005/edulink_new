<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['required_skills' => 'array', 'budget' => 'decimal:6', 'deadline' => 'datetime'];
    }

    public function employer()
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class)->orderBy('position');
    }

    public function escrow()
    {
        return $this->hasOne(Escrow::class);
    }
}
