<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'settings' => 'array',
    ];

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
        return $this->hasMany(IntegrationRepository::class);
    }

    /**
     * Get the post links for this integration provider.
     */
    public function postLinks()
    {
        return $this->hasMany(PostIntegrationLink::class);
    }

    public function scopeGitHub($query)
    {
        return $query->where('type', 'github');
    }
}
