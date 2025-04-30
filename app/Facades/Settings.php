<?php

declare(strict_types=1);

namespace App\Facades;

use Illuminate\Support\Facades\Facade;
use App\Services\SettingService;

/**
 * @method static mixed get(string $key, mixed $default = null)
 * @method static bool set(string $key, mixed $value)
 * @method static array all(bool $useCache = true)
 * @method static void clearCache()
 * @method static array getForAdmin(string $group = null)
 * @method static array getGroups()
 * @method static array getGroupLabels()
 * @method static string processTemplateVariables(string $text, array $settings)
 *
 * @see \App\Services\SettingService
 */
class Settings extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor()
    {
        return SettingService::class;
    }
}
