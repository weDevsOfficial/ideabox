<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostIntegrationLink extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'post_id',
        'integration_provider_id',
        'integration_repository_id',
        'external_id',
        'external_url',
        'status',
        'settings',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'settings' => 'array',
    ];

    /**
     * Get the post that owns the integration link.
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the integration provider for this link.
     */
    public function provider()
    {
        return $this->belongsTo(IntegrationProvider::class, 'integration_provider_id');
    }

    /**
     * Get the integration repository for this link.
     */
    public function repository()
    {
        return $this->belongsTo(IntegrationRepository::class, 'integration_repository_id');
    }

    /**
     * Get the repository name from settings when no repository is linked
     *
     * @return string|null
     */
    public function getRepositoryName(): ?string
    {
        // If we have a repository relation, use that
        if ($this->integration_repository_id && $this->repository) {
            return $this->repository->full_name;
        }

        // Otherwise check settings
        return $this->settings['repository_full_name'] ?? null;
    }
}
