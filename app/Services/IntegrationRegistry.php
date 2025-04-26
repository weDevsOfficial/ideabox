<?php

namespace App\Services;

use App\Services\Integrations\IntegrationInterface;

class IntegrationRegistry
{
    /**
     * Registered integrations
     *
     * @var array
     */
    protected $integrations = [];

    /**
     * Register an integration
     *
     * @param string $type Integration type identifier
     * @param string $class Integration class name
     * @return void
     */
    public function register(string $type, string $class): void
    {
        $this->integrations[$type] = $class;
    }

    /**
     * Get an integration instance by type
     *
     * @param string $type Integration type identifier
     * @return IntegrationInterface|null
     */
    public function getIntegration(string $type): ?IntegrationInterface
    {
        if (!isset($this->integrations[$type])) {
            return null;
        }

        $class = $this->integrations[$type];
        return app($class);
    }

    /**
     * Get all registered integrations
     *
     * @return array<string, IntegrationInterface>
     */
    public function getAllIntegrations(): array
    {
        $result = [];
        foreach ($this->integrations as $type => $class) {
            $result[$type] = app($class);
        }
        return $result;
    }

    /**
     * Get all registered integration types
     *
     * @return array
     */
    public function getTypes(): array
    {
        return array_keys($this->integrations);
    }
}
