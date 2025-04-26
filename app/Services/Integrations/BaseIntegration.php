<?php

namespace App\Services\Integrations;

use App\Models\IntegrationProvider;
use Illuminate\Support\Facades\Log;

abstract class BaseIntegration implements IntegrationInterface
{
    /**
     * The provider instance associated with this integration
     */
    protected ?IntegrationProvider $provider = null;

    /**
     * Constructor
     *
     * @param IntegrationProvider|null $provider The provider instance associated with this integration
     */
    public function __construct(IntegrationProvider $provider = null)
    {
        if ($provider) {
            $this->setProvider($provider);
        }
    }

    /**
     * Set the provider for this integration
     *
     * @param IntegrationProvider $provider The provider instance associated with this integration
     * @return $this
     */
    public function setProvider(IntegrationProvider $provider): self
    {
        $this->provider = $provider;
        return $this;
    }

    /**
     * Get the provider associated with this integration
     *
     * @return IntegrationProvider|null
     */
    public function getProvider(): ?IntegrationProvider
    {
        return $this->provider;
    }

    /**
     * Check if the integration is authenticated
     *
     * @return bool
     */
    public function isAuthenticated(): bool
    {
        if (!$this->provider) {
            return false;
        }

        // Check model's access_token first
        if (!empty($this->provider->access_token)) {
            return true;
        }

        // Fall back to checking config
        $config = $this->provider->getConfig();
        return isset($config['access_token']) &&
               !empty($config['access_token']) &&
               $this->provider->authenticated_at !== null;
    }

    /**
     * Validate configuration values
     *
     * @param array $config Configuration values to validate
     * @return bool Whether the configuration is valid
     */
    public function validateConfig(array $config): bool
    {
        $fields = $this->getConfigurationFields();

        foreach ($fields as $fieldName => $field) {
            if (($field['required'] ?? false) && empty($config[$fieldName])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Save configuration to the provider
     *
     * @param array $config Configuration values
     * @return bool Success or failure
     */
    protected function saveConfig(array $config): bool
    {
        if (!$this->provider) {
            Log::error($this->getName() . ' integration: Cannot save config without provider');
            return false;
        }

        try {
            $this->provider->setConfig($config);
            $this->provider->save();
            return true;
        } catch (\Exception $e) {
            Log::error($this->getName() . ' integration: Failed to save config', [
                'message' => $e->getMessage()
            ]);
            return false;
        }
    }
}
