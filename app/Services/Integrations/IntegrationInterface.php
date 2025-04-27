<?php

namespace App\Services\Integrations;

use App\Models\IntegrationProvider;
use Illuminate\Http\Request;

interface IntegrationInterface
{
    /**
     * Get the integration name
     */
    public function getName(): string;

    /**
     * Get the integration type identifier
     */
    public function getType(): string;

    /**
     * Get required configuration fields
     */
    public function getConfigurationFields(): array;

    /**
     * Get authorization URL for OAuth flow
     */
    public function getAuthUrl(string $redirectUri = null): string;

    /**
     * Handle the authorization callback
     */
    public function handleAuthCallback(Request $request): bool;

    /**
     * Set the provider instance
     */
    public function setProvider(IntegrationProvider $provider): self;

    /**
     * Get the provider instance
     */
    public function getProvider(): ?IntegrationProvider;

    /**
     * Check if the integration is authenticated
     */
    public function isAuthenticated(): bool;
}
