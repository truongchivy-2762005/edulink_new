<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisputeVote extends Model
{
    protected $guarded = [];

    public function dispute()
    {
        return $this->belongsTo(Dispute::class);
    }

    public function mentor()
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }
}
