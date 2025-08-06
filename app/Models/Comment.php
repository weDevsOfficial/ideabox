<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['post_id', 'parent_id', 'status_id', 'user_id', 'body'];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($comment) {
            $comment->post->update([
                'comments' => $comment->post->comments()->where('parent_id', null)->count('id')
            ]);
        });

        // Delete all children when a parent comment is deleted
        static::deleting(function ($comment) {
            foreach ($comment->children as $child) {
                $child->delete();
            }
        });

        // Update the comments count when a comment is deleted
        static::deleted(function ($comment) {
            $comment->post->update([
                'comments' => $comment->post->comments()->where('parent_id', null)->count('id')
            ]);
        });
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function status()
    {
        return $this->hasOne(Status::class, 'id', 'status_id');
    }
}
