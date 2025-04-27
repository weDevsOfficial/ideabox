<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class IntegrationRepository extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'integration_provider_id',
        'name',
        'full_name',
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
     * Get the integration provider that owns the repository.
     */
    public function provider()
    {
        return $this->belongsTo(IntegrationProvider::class, 'integration_provider_id');
    }

    /**
     * Get the post links for this repository.
     */
    public function postLinks()
    {
        return $this->hasMany(PostIntegrationLink::class, 'integration_repository_id');
    }

    /**
     * Scope a query to repositories for a specific provider.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int|IntegrationProvider $provider
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForProvider($query, $provider)
    {
        $providerId = $provider instanceof IntegrationProvider ? $provider->id : $provider;
        return $query->where('integration_provider_id', $providerId);
    }

    /**
     * Check if the repository has any linked issues.
     *
     * @return bool
     */
    public function hasLinks(): bool
    {
        return $this->postLinks()->exists();
    }

    /**
     * Get the webhook ID set for this repository.
     *
     * @return int|null
     */
    public function getWebhookId(): ?int
    {
        return $this->settings['webhook_id'] ?? null;
    }

    /**
     * Get the webhook secret for this repository.
     *
     * @return string|null
     */
    public function getWebhookSecret(): ?string
    {
        return $this->settings['webhook_secret'] ?? null;
    }

    /**
     * Store webhook details for this repository.
     *
     * @param int $webhookId The webhook ID from GitHub
     * @param string $secret The webhook secret
     * @return bool
     */
    public function storeWebhookDetails(int $webhookId, string $secret): bool
    {
        try {
            $settings = $this->settings ?? [];
            $settings['webhook_id'] = $webhookId;
            $settings['webhook_secret'] = $secret;

            $this->settings = $settings;
            return $this->save();
        } catch (\Exception $e) {
            Log::error('Failed to store webhook details for repository', [
                'repository_id' => $this->id,
                'repository' => $this->full_name,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Remove webhook details from repository settings.
     *
     * @return bool
     */
    public function removeWebhookDetails(): bool
    {
        try {
            $settings = $this->settings ?? [];
            unset($settings['webhook_id']);
            unset($settings['webhook_secret']);

            $this->settings = $settings;
            return $this->save();
        } catch (\Exception $e) {
            Log::error('Failed to remove webhook details for repository', [
                'repository_id' => $this->id,
                'repository' => $this->full_name,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Find an existing repository by full name and provider or create a new one.
     *
     * @param IntegrationProvider $provider
     * @param string $fullName
     * @return self
     */
    public static function findOrCreateByName(IntegrationProvider $provider, string $fullName): self
    {
        return self::firstOrCreate(
            [
                'integration_provider_id' => $provider->id,
                'full_name' => $fullName
            ],
            [
                'name' => basename($fullName)
            ]
        );
    }
}
