<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'order',
        'posts',
        'privacy',
        'allow_posts',
        'settings'
    ];

    protected $casts = [
        'settings' => 'array',
        'allow_posts' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        // Clear cache on any board changes
        static::saved(function () {
            Cache::forget('public_boards');
        });

        static::deleted(function () {
            Cache::forget('public_boards');
        });
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Scope a query to only include public boards with minimal fields.
     */
    public function scopePublicBoards(Builder $query): Builder
    {
        return $query->select('id', 'name', 'posts', 'slug')
            ->where('privacy', 'public')
            ->orderBy('order');
    }

    /**
     * Get cached public boards.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getCachedPublicBoards()
    {
        return Cache::rememberForever('public_boards', function () {
            return static::publicBoards()->get();
        });
    }

    /**
     * Get all public boards with a count of posts visible in the frontend.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function withOpenPostsCount()
    {
        $frontendStatusIds = Status::inFrontend()->pluck('id');

        return static::where('privacy', 'public')
            ->orderBy('order')
            ->withCount(['posts as posts' => function ($query) use ($frontendStatusIds) {
                $query->where(function ($q) use ($frontendStatusIds) {
                    $q->whereIn('status_id', $frontendStatusIds)
                      ->orWhereNull('status_id');
                });
            }])
            ->get(['id', 'name', 'slug']);
    }
}
