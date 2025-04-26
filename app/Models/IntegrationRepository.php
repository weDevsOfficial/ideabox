<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

}
