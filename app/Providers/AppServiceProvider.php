<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\Freemius\FreemiusService;
use App\Services\SettingService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SettingService::class, function ($app) {
            return new SettingService();
        });

        $this->app->singleton(FreemiusService::class, function ($app) {
            return new FreemiusService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
