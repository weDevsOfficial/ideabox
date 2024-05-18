<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'color', 'in_roadmap', 'order', 'in_frontend'];
    protected $casts = [
        'in_roadmap' => 'boolean',
        'in_frontend' => 'boolean',
    ];
    protected $hidden = ['created_at', 'updated_at'];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function scopeInRoadmap($query)
    {
        return $query->where('in_roadmap', 1);
    }

    public function scopeShowInFrontend($query)
    {
        return $query->where('in_frontend', 1);
    }
}
