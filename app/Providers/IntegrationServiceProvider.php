<?php

namespace App\Providers;

use App\Factories\IntegrationFactory;
use App\Services\GitHub\WebhookService;
use App\Services\IntegrationRegistry;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Support\ServiceProvider;

class IntegrationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(IntegrationRegistry::class, function () {
            $registry = new IntegrationRegistry();

            // Register all available integrations
            $registry->register('github', GitHubIntegration::class);

            // Future integrations can be registered here
            // $registry->register('slack', SlackIntegration::class);
            // $registry->register('asana', AsanaIntegration::class);
            // $registry->register('discord', DiscordIntegration::class);
            // $registry->register('helpscout', HelpScoutIntegration::class);
            // $registry->register('freshdesk', FreshdeskIntegration::class);

            return $registry;
        });

        // Register GitHub services
        $this->app->singleton(WebhookService::class, function ($app) {
            $factory = $app->make(IntegrationFactory::class);
            $gitHubIntegration = $factory->make('github');

            return new WebhookService($gitHubIntegration);
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
