<?php

namespace App\Factories;

use App\Models\IntegrationProvider;
use App\Services\Integrations\IntegrationInterface;
use App\Services\IntegrationRegistry;

class IntegrationFactory
{
    /**
     * Integration registry
     */
    protected IntegrationRegistry $registry;

    /**
     * Constructor
     */
    public function __construct(IntegrationRegistry $registry)
    {
        $this->registry = $registry;
    }

    /**
     * Create an integration instance by type
     *
     * @param string $type Integration type identifier
     * @return IntegrationInterface|null The integration instance or null if not found
     */
    public function make(string $type): ?IntegrationInterface
    {
        return $this->registry->getIntegration($type);
    }

    /**
     * Create an integration instance from a provider model
     *
     * @param IntegrationProvider $provider The provider model
     * @return IntegrationInterface|null The integration instance with provider set or null if not found
     */
    public function makeFromProvider(IntegrationProvider $provider): ?IntegrationInterface
    {
        $integration = $this->make($provider->type);

        if ($integration) {
            $integration->setProvider($provider);
        }

        return $integration;
    }
}
