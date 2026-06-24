<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    protected $fillable = [
        'provider',
        'license_id',
        'plan_id',
        'plan_title',
        'pricing_id',
        'freemius_user_id',
        'install_id',
        'subscription_id',
        'status',
        'is_active',
        'expiration',
        'data',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expiration' => 'datetime',
        'data' => 'array',
    ];

    /**
     * Scope to currently active (non-expired, non-cancelled) licenses.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function (Builder $q) {
                $q->whereNull('expiration')
                    ->orWhere('expiration', '>', now());
            });
    }

    /**
     * Whether this individual license currently grants premium access.
     */
    public function isActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        return $this->expiration === null || $this->expiration->isFuture();
    }
}
