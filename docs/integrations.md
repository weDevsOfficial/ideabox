# IdeaBox Integrations Documentation

This guide explains how to work with and extend the integrations system in IdeaBox.

## Architecture Overview

The integrations system is designed with simplicity and extensibility in mind. It consists of the following key components:

### Models

- **IntegrationProvider**: Database model storing provider connection details and configuration
- **IntegrationRepository**: Links providers to external repositories (like GitHub repositories)
- **PostIntegrationLink**: Links IdeaBox posts to external resources (like GitHub issues)

### Services

- **IntegrationInterface**: Contract that all integrations must fulfill
- **BaseIntegration**: Abstract base implementation with common functionality
- **Specific Integrations**: Concrete implementations for specific services (e.g., GitHubIntegration)
- **IntegrationRegistry**: Service for registering and retrieving integration implementations

### Factory

- **IntegrationFactory**: Creates integration instances by type or from provider models

## Adding a New Integration

To add a new integration (e.g., for Jira, Trello, etc.), follow these steps:

1. Create a new integration class extending `BaseIntegration` and implementing `IntegrationInterface`:

```php
namespace App\Services\Integrations;

use Illuminate\Http\Request;

class JiraIntegration extends BaseIntegration implements IntegrationInterface
{
    protected string $apiBaseUrl = 'https://api.atlassian.com/ex/jira';
    protected string $authBaseUrl = 'https://auth.atlassian.com/authorize';
    protected string $tokenUrl = 'https://auth.atlassian.com/oauth/token';

    public function getName(): string
    {
        return 'Jira';
    }

    public function getType(): string
    {
        return 'jira';
    }

    public function getConfigurationFields(): array
    {
        return [
            'client_id' => [
                'type' => 'text',
                'label' => 'Client ID',
                'required' => true,
            ],
            'client_secret' => [
                'type' => 'text',
                'label' => 'Client Secret',
                'required' => true,
            ],
            'domain' => [
                'type' => 'text',
                'label' => 'Jira Domain',
                'required' => true,
            ]
        ];
    }

    public function getAuthUrl(string $redirectUri = null): string
    {
        // Implement authorization URL generation
    }

    public function handleAuthCallback(Request $request): bool
    {
        // Implement OAuth callback handling
    }

    // Implement other required methods...
}
```

2. Register your integration in the `IntegrationRegistry` service provider:

```php
// In App\Providers\IntegrationServiceProvider.php

public function register(): void
{
    $this->app->singleton(IntegrationRegistry::class, function ($app) {
        $registry = new IntegrationRegistry();

        // Register existing integrations
        $registry->register('github', GitHubIntegration::class);

        // Register your new integration
        $registry->register('jira', JiraIntegration::class);

        return $registry;
    });
}
```

3. Create a controller for your integration:

```php
namespace App\Http\Controllers\Admin;

class JiraIntegrationController extends Controller
{
    public function settings() { /* ... */ }
    public function connect(Request $request, IntegrationFactory $factory) { /* ... */ }
    public function callback(Request $request, IntegrationFactory $factory) { /* ... */ }
    public function disconnect(IntegrationProvider $provider) { /* ... */ }
    // Additional methods for your integration...
}
```

4. Define routes for your integration in `routes/web.php`:

```php
Route::middleware(['auth', 'admin'])->prefix('admin/integrations/jira')->name('admin.integrations.jira.')->group(function () {
    Route::get('/', [JiraIntegrationController::class, 'settings'])->name('settings');
    Route::post('/connect', [JiraIntegrationController::class, 'connect'])->name('connect');
    Route::get('/callback', [JiraIntegrationController::class, 'callback'])->name('callback');
    Route::delete('/{provider}', [JiraIntegrationController::class, 'disconnect'])->name('disconnect');
    // Additional routes...
});
```

5. Create frontend views for your integration

## Integration Flow

The typical OAuth integration flow is:

1. User provides credentials (client ID, client secret, etc.)
2. System stores credentials in `IntegrationProvider` record
3. User is redirected to external service for authorization
4. External service redirects back to our callback URL
5. System obtains access token and updates the provider record
6. User can now use the integration features

## Best Practices

1. Always handle errors gracefully with proper logging
2. Store sensitive data securely (tokens, secrets)
3. Refresh tokens when they expire if the service supports it
4. Use clear, consistent naming for methods and variables
5. Follow the existing patterns when adding new functionality
