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
     * Default statuses for GitHub issues
     */
    public const STATUS_OPEN = 'open';
    public const STATUS_CLOSED = 'closed';

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

    /**
     * Get the issue title from settings
     *
     * @return string|null
     */
    public function getIssueTitle(): ?string
    {
        return $this->settings['title'] ?? null;
    }

    /**
     * Check if this link is a GitHub issue
     *
     * @return bool
     */
    public function isGitHubIssue(): bool
    {
        return $this->provider && $this->provider->type === 'github';
    }

    /**
     * Check if the issue is closed
     *
     * @return bool
     */
    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * Check if the issue is open
     *
     * @return bool
     */
    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    /**
     * Scope a query to only include GitHub links.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeGitHub($query)
    {
        return $query->whereHas('provider', function ($query) {
            $query->where('type', 'github');
        });
    }

    /**
     * Scope a query to only include open issues.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    /**
     * Scope a query to only include closed issues.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    /**
     * Find links by repository and issue number.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $repositoryFullName
     * @param int|string $issueNumber
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByIssue($query, string $repositoryFullName, $issueNumber)
    {
        return $query->whereHas('repository', function ($query) use ($repositoryFullName) {
            $query->where('full_name', $repositoryFullName);
        })->where('external_id', (string) $issueNumber);
    }
}
