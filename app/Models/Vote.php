<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = ['board_id', 'post_id', 'user_id', 'created_by', 'archive_post_id'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($vote) {
            if (auth()->id()) {
                $vote->created_by = auth()->id();
            }
        });

        static::created(function ($vote) {
            $vote->post->update([
                'vote' => $vote->post->votes()->count('id')
            ]);
        });

        static::deleted(function ($vote) {
            $vote->post->update([
                'vote' => $vote->post->votes()->count('id'),
            ]);
        });
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * Scope a query to only include votes on a specific post.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \App\Models\Post  $post
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOnPost($query, $post)
    {
        return $query->where('post_id', $post->id);
    }
}
