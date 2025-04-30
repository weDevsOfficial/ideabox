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
     * Cache duration in seconds.
     */
    private int $cacheDuration = 3600; // 1 hour

    /**
     * Get all settings with values from the database or defaults from definitions.
     *
     * @param bool $useCache Whether to use cache
     * @return array
     */
    public function all(bool $useCache = true): array
    {
        if ($useCache && Cache::has($this->cacheKey)) {
            return Cache::get($this->cacheKey);
        }

        // Get all settings from database
        $dbSettings = Setting::all()->keyBy('key')->toArray();
        $result = [];

        // Go through all defined settings
        foreach (SettingDefinitions::all() as $groupKey => $group) {
            foreach ($group['settings'] as $key => $definition) {
                // If setting exists in DB, use that value
                if (isset($dbSettings[$key])) {
                    $value = $this->castValue($dbSettings[$key]['value'], $dbSettings[$key]['type']);
                } else {
                    // Otherwise use default value from definition
                    $value = $definition['default'];
                }

                $result[$key] = $value;
            }
        }

        if ($useCache) {
            Cache::put($this->cacheKey, $result, $this->cacheDuration);
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
        return $default !== null ? $default : SettingDefinitions::getDefault($key);
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
        $definition = SettingDefinitions::get($key);
        if (!$definition) {
            return false;
        }

        // Get setting from DB or create new
        $setting = Setting::firstOrNew(['key' => $key]);

        // Ensure we have a type
        $type = $definition['type'] ?? 'string';
        $setting->type = $type;

        // Handle JSON values
        if ($type === 'json' && is_string($value)) {
            try {
                $value = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                // Keep as string if not valid JSON
            }
        }

        $setting->value = $value;
        $result = $setting->save();

        // Clear cache on update
        $this->clearCache();

        return $result;
    }

    /**
     * Process template variables in text values.
     *
     * @param string $text
     * @param array $settings
     * @return string
     */
    public function processTemplateVariables(string $text, array $settings): string
    {
        return preg_replace_callback('/\{([a-z_]+)\}/', function ($matches) use ($settings) {
            $key = $matches[1];
            return $settings[$key] ?? $matches[0];
        }, $text);
    }

    /**
     * Get all settings with their full definitions for admin UI.
     *
     * @param string $group Filter by group
     * @return array
     */
    public function getForAdmin(string $group = null): array
    {
        // Get all settings from DB
        $dbSettings = Setting::all()->keyBy('key')->toArray();
        $result = [];

        if ($group) {
            $definitions = SettingDefinitions::getGroup($group);
        } else {
            $definitions = $this->getAllDefinitions();
        }

        // Merge DB values with definitions
        foreach ($definitions as $key => $definition) {
            // Use DB value if exists, otherwise use default
            $value = isset($dbSettings[$key])
                ? $this->castValue($dbSettings[$key]['value'], $dbSettings[$key]['type'])
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
        return SettingDefinitions::getGroups();
    }

    /**
     * Get all group labels.
     *
     * @return array
     */
    public function getGroupLabels(): array
    {
        return SettingDefinitions::getGroupLabels();
    }

    /**
     * Clear settings cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        Cache::forget($this->cacheKey);
    }

    /**
     * Get flat array of all setting definitions.
     *
     * @return array
     */
    private function getAllDefinitions(): array
    {
        $result = [];
        foreach (SettingDefinitions::all() as $groupKey => $group) {
            foreach ($group['settings'] as $key => $definition) {
                $result[$key] = array_merge(
                    ['key' => $key],
                    $definition,
                    ['group' => $groupKey]
                );
            }
        }
        return $result;
    }

    /**
     * Cast a value based on type.
     *
     * @param mixed $value
     * @param string $type
     * @return mixed
     */
    private function castValue($value, string $type)
    {
        switch ($type) {
            case 'boolean':
                return (bool) $value;
            case 'integer':
                return (int) $value;
            case 'json':
                if (is_string($value)) {
                    try {
                        return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
                    } catch (\JsonException $e) {
                        return $value;
                    }
                }
                return $value;
            default:
                return $value;
        }
    }
}
