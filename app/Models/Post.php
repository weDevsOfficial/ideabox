<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'slug', 'body', 'vote', 'status_id', 'board_id', 'comments', 'by', 'created_by'];

    protected static function boot()
    {
        parent::boot();

        // when creating a post, automatically make the slug from the title
        static::creating(function ($post) {
            $slug = Str::slug($post->title);
            $count = Post::whereRaw("slug RLIKE '^{$slug}(-[0-9]+)?$'")->count();

            $post->slug = $count ? "{$slug}-{$count}" : $slug;

            if (auth()->id()) {
                $post->created_by = auth()->id();
            }
        });

        static::created(function ($post) {
            $post->board->increment('posts');
        });

        static::deleted(function ($post) {
            $post->board->decrement('posts');
        });
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    public function status()
    {
        return $this->hasOne(Status::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all of the comments for the post.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
