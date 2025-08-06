<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'body',
        'vote',
        'status_id',
        'board_id',
        'comments',
        'by',
        'owner',
        'eta',
        'impact',
        'effort',
        'created_by',
    ];

    protected static function boot()
    {
        parent::boot();

        // when creating a post, automatically make the slug from the title
        static::creating(function ($post) {
            $slug = Str::slug($post->title);
            $count = Post::whereRaw("slug RLIKE '^{$slug}(-[0-9]+)?$'")->count();

            $post->slug = $count ? "{$slug}-{$count}" : $slug;

            if (auth()->id() && ! $post->created_by) {
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

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function status()
    {
        return $this->hasOne(Status::class, 'id', 'status_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function by(): BelongsTo
    {
        return $this->belongsTo(User::class, 'by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all of the comments for the post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get all of the subscriptions for the post.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(PostSubscription::class);
    }

    public function scopeWithVote($query): void
    {
        if (auth()->check()) {
            $userId = auth()->id();

            $query->addSelect([
                'has_voted' => Vote::selectRaw('count(*)')
                    ->whereColumn('post_id', 'posts.id')
                    ->where('user_id', $userId)
                    ->take(1)
            ]);
        }
    }

    /**
     * Get all integration links for the post.
     */
    public function integrationLinks(): HasMany
    {
        return $this->hasMany(PostIntegrationLink::class);
    }

    /**
     * Get GitHub integration links for the post.
     */
    public function githubLinks(): HasMany
    {
        return $this->hasMany(PostIntegrationLink::class)
            ->whereHas('provider', function ($query) {
                $query->where('type', 'github');
            });
    }

    public function updateVotes(): void
    {
        $this->update(['votes' => $this->votes()->count()]);
    }
}
