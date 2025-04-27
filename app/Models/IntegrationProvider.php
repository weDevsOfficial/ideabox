<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Log;

class IntegrationProvider extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'name',
        'access_token',
        'refresh_token',
        'settings',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'access_token',
        'refresh_token',
        'settings',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'settings' => 'array',
        'authenticated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'is_connected',
    ];

    /**
     * Get whether the integration is connected.
     */
    protected function isConnected(): Attribute
    {
        return Attribute::make(
            get: fn () => !empty($this->access_token),
        );
    }

    /**
     * Get the configuration settings for this provider.
     *
     * @return array
     */
    public function getConfig(): array
    {
        return $this->settings ?? [];
    }

    /**
     * Set the configuration settings for this provider.
     *
     * @param array $config
     * @return $this
     */
    public function setConfig(array $config): self
    {
        $this->settings = $config;
        return $this;
    }

    /**
     * Get the repositories for this integration provider.
     */
    public function repositories()
    {
        return $this->hasMany(IntegrationRepository::class, 'integration_provider_id');
    }

    /**
     * Get the post links for this integration provider.
     */
    public function postLinks()
    {
        return $this->hasMany(PostIntegrationLink::class, 'integration_provider_id');
    }

    /**
     * Scope query to GitHub integrations.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeGitHub($query)
    {
        return $query->where('type', 'github');
    }

    /**
     * Scope query to connected integrations (with access token).
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeConnected($query)
    {
        return $query->whereNotNull('access_token');
    }

    /**
     * Scope query to pending integrations (without access token).
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePending($query)
    {
        return $query->whereNull('access_token')->whereNull('authenticated_at');
    }

    /**
     * Update access token information for this provider.
     *
     * @param string $accessToken
     * @param string|null $refreshToken
     * @param array $config Additional config to store
     * @return bool
     */
    public function updateTokens(string $accessToken, ?string $refreshToken = null, array $config = []): bool
    {
        try {
            $this->access_token = $accessToken;

            if ($refreshToken) {
                $this->refresh_token = $refreshToken;
            }

            // Store the authenticated timestamp
            $this->authenticated_at = Carbon::now();

            // Update config if needed
            if (!empty($config)) {
                $currentConfig = $this->getConfig();
                $this->setConfig(array_merge($currentConfig, $config));
            }

            return $this->save();
        } catch (\Exception $e) {
            Log::error('Failed to update integration provider tokens', [
                'provider_id' => $this->id,
                'provider_type' => $this->type,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Disconnect this integration provider by removing tokens.
     *
     * @return bool
     */
    public function disconnect(): bool
    {
        try {
            $this->access_token = null;
            $this->refresh_token = null;
            $this->authenticated_at = null;

            // Keep configuration values like client ID/secret
            return $this->save();
        } catch (\Exception $e) {
            Log::error('Failed to disconnect integration provider', [
                'provider_id' => $this->id,
                'provider_type' => $this->type,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get a specific config value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function getConfigValue(string $key, $default = null)
    {
        $config = $this->getConfig();
        return $config[$key] ?? $default;
    }
}
