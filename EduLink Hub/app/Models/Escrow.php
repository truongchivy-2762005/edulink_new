<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Escrow extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['amount' => 'decimal:6'];
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}
