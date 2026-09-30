<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['skills' => 'array', 'sbt_data' => 'array', 'availability' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
