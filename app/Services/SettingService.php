<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    /**
     * Cache key for all settings.
     */
    private string $cacheKey = 'settings_all';

    /**
     * Get all settings with values from the database or defaults from definitions.
     *
     * @param bool $useCache Whether to use cache (defaults to true)
     * @return array
     */
    public function all(bool $useCache = true): array
    {
        // If cache shouldn't be used or is being rebuilt, fetch from DB
        if (!$useCache) {
            return $this->loadAllFromDatabase();
        }

        // Otherwise use rememberForever to maintain cache until explicitly cleared
        return Cache::rememberForever($this->cacheKey, function () {
            return $this->loadAllFromDatabase();
        });
    }

    /**
     * Load all settings from database and merge with defaults.
     *
     * @return array
     */
    private function loadAllFromDatabase(): array
    {
        $dbSettings = Setting::all()->keyBy('key')->toArray();
        $result = [];

        // Go through all defined settings
        foreach (Setting::definitions() as $groupKey => $group) {
            foreach ($group['settings'] as $key => $definition) {
                // If setting exists in DB, use that value
                if (isset($dbSettings[$key])) {
                    $value = $dbSettings[$key]['value']; // Value is already cast through the model accessor
                } else {
                    // Otherwise use default value from definition
                    $value = $definition['default'];
                }

                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Get a single setting by key.
     *
     * @param string $key
     * @param mixed $default Override the default value from definitions
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        // Get all settings and return the specific one
        $all = $this->all();

        if (isset($all[$key])) {
            return $all[$key];
        }

        // If not found, return provided default or definition default
        return $default !== null ? $default : Setting::getDefaultValue($key);
    }

    /**
     * Set a setting value.
     *
     * @param string $key
     * @param mixed $value
     * @return bool
     */
    public function set(string $key, $value): bool
    {
        // Check if the setting is defined
        $definition = Setting::getDefinition($key);
        if (!$definition) {
            return false;
        }

        // Get setting from DB or create new
        $setting = Setting::firstOrNew(['key' => $key]);

        // Ensure we have a type
        $type = $definition['type'] ?? 'string';
        $setting->type = $type;

        // The model's mutator will handle proper conversion of the value
        $setting->value = $value;
        $result = $setting->save();

        // Clear cache on update and warm it again immediately
        $this->clearCache();
        $this->warmCache();

        return $result;
    }

    /**
     * Process template variables in text values.
     *
     * @param string $text
     * @param array|null $settings Pass settings array if already retrieved, otherwise null to use cache
     * @return string
     */
    public function processTemplateVariables(string $text, ?array $settings = null): string
    {
        // Use provided settings or get from cache
        $settings = $settings ?? $this->all();

        return preg_replace_callback('/\{([a-z_]+)\}/', function ($matches) use ($settings) {
            $key = $matches[1];
            return $settings[$key] ?? $matches[0];
        }, $text);
    }

    /**
     * Get all settings with their full definitions for admin UI.
     *
     * @param string|null $group Filter by group
     * @return array
     */
    public function getForAdmin(?string $group = null): array
    {
        // Get all settings from DB - using the same cache mechanism as regular settings
        $dbSettings = Setting::all()->keyBy('key')->toArray();

        if ($group) {
            $definitions = Setting::getGroupDefinitions($group);
        } else {
            $definitions = Setting::getAllDefinitions();
        }

        $result = [];

        // Merge DB values with definitions
        foreach ($definitions as $key => $definition) {
            // Use DB value if exists, otherwise use default
            $value = isset($dbSettings[$key])
                ? $dbSettings[$key]['value'] // Value is already cast through the model accessor
                : $definition['default'];

            $result[] = array_merge(
                ['id' => isset($dbSettings[$key]) ? $dbSettings[$key]['id'] : null],
                $definition,
                ['value' => $value]
            );
        }

        return $result;
    }

    /**
     * Get all available setting groups.
     *
     * @return array
     */
    public function getGroups(): array
    {
        return Setting::getGroups();
    }

    /**
     * Get all group labels.
     *
     * @return array
     */
    public function getGroupLabels(): array
    {
        return Setting::getGroupLabels();
    }

    /**
     * Clear all settings cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        Cache::forget($this->cacheKey);
    }

    /**
     * Warm the settings cache if it doesn't exist.
     *
     * @return void
     */
    public function warmCache(): void
    {
        $this->all(true);
    }
}
