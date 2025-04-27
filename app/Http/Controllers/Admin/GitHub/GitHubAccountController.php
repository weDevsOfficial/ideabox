<?php

namespace App\Http\Controllers\Admin\GitHub;

use App\Factories\IntegrationFactory;
use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\PostIntegrationLink;
use App\Services\IntegrationRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class GitHubAccountController extends BaseGitHubController
{
    /**
     * Display the GitHub integration settings page.
     */
    public function settings(IntegrationRegistry $registry)
    {
        $providers = IntegrationProvider::where('type', 'github')->get();

        // Ensure settings are included in the response
        $providers->each(function ($provider) {
            if (!isset($provider->config) && isset($provider->settings)) {
                $provider->config = $provider->settings;
            }
        });

        // Get provider ids with access tokens
        $providerIds = $providers->filter(function ($provider) {
            return $provider->is_connected;
        })->pluck('id');

        // Get all repositories in a single query, with provider information
        $repositories = [];
        if ($providerIds->isNotEmpty()) {
            $repositories = IntegrationRepository::whereIn('integration_provider_id', $providerIds)
                ->orderBy('full_name')
                ->with('provider:id,name') // Include provider name to avoid N+1 problems
                ->get();
        }

        return Inertia::render('Admin/Integrations/GitHub/Settings', [
            'providers' => $providers,
            'callbackUrl' => route('admin.integrations.github.callback'),
            'repositories' => $repositories,
        ]);
    }

    /**
     * Redirect to GitHub for authorization.
     */
    public function connect(Request $request)
    {
        $request->validate([
            'client_id' => 'required',
            'client_secret' => 'required',
        ]);

        // Create GitHub integration instance
        $integration = $this->getGitHubIntegration();

        if (!$integration) {
            return $request->wantsJson()
                ? response()->json(['error' => 'GitHub integration is not available.'], 400)
                : Redirect::back()->with('error', 'GitHub integration is not available.');
        }

        // Check if there's an existing pending provider for this user
        $pendingProvider = IntegrationProvider::where('type', 'github')
            ->whereNull('access_token')
            ->whereNull('authenticated_at')
            ->first();

        // If we have a pending provider, update its settings
        if ($pendingProvider) {
            $pendingProvider->setConfig([
                'client_id' => $request->input('client_id'),
                'client_secret' => $request->input('client_secret'),
            ]);
            $pendingProvider->save();
            $provider = $pendingProvider;
        } else {
            // Create a new provider record
            $provider = IntegrationProvider::create([
                'type' => 'github',
                'name' => 'GitHub',
                'access_token' => null, // Initialize as null
                'settings' => [
                    'client_id' => $request->input('client_id'),
                    'client_secret' => $request->input('client_secret'),
                ],
            ]);
        }

        // Set provider on integration
        $integration->setProvider($provider);

        // Store provider ID in session for callback
        session(['github_integration_provider_id' => $provider->id]);

        // Get authorization URL
        $authUrl = $integration->getAuthUrl(route('admin.integrations.github.callback'));

        // Return response based on request type
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['auth_url' => $authUrl]);
        }

        return Redirect::away($authUrl);
    }

    /**
     * Handle the callback from GitHub after authorization.
     */
    public function callback(Request $request)
    {
        // Handle error from GitHub
        if ($request->has('error')) {
            Log::error('GitHub auth callback error', [
                'error' => $request->input('error'),
                'error_description' => $request->input('error_description')
            ]);

            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'GitHub authorization failed: ' . $request->input('error_description'));
        }

        // Get provider ID from session
        $providerId = session('github_integration_provider_id');
        if (!$providerId) {
            Log::error('GitHub callback - missing provider ID in session');
            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'Authentication session expired. Please try connecting again.');
        }

        // Find the provider
        $provider = $this->getGitHubProvider($providerId);
        if (!$provider) {
            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'Invalid provider. Please try connecting again.');
        }

        // Create GitHub integration with provider
        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'GitHub integration is not available.');
        }

        // Handle the callback
        $success = $integration->handleAuthCallback($request);

        if ($success) {
            // Update the provider's access_token from config
            $config = $provider->getConfig();
            if (isset($config['access_token'])) {
                $provider->access_token = $config['access_token'];
                $provider->save();
            }

            // Clear session data
            session()->forget('github_integration_provider_id');

            return redirect()->route('admin.integrations.github.settings')
                ->with('success', $provider->name . ' connected successfully!');
        } else {
            // Get error message from provider config
            $config = $provider->getConfig();
            $errorMessage = $config['error_message'] ?? 'Unknown error occurred';

            Log::error('GitHub authentication failed: ' . $errorMessage);

            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'Failed to authenticate with GitHub: ' . $errorMessage);
        }
    }

    /**
     * Disconnect a GitHub integration.
     */
    public function disconnect(IntegrationProvider $provider)
    {
        if ($provider->type !== 'github') {
            return Redirect::back()->with('error', 'This is not a GitHub integration.');
        }

        // Check if there are any repositories associated
        $repoCount = IntegrationRepository::where('integration_provider_id', $provider->id)->count();

        // If there are repositories, check if they have any links
        if ($repoCount > 0) {
            $repos = IntegrationRepository::where('integration_provider_id', $provider->id)->get();
            $repoIds = $repos->pluck('id')->toArray();

            $hasLinks = PostIntegrationLink::whereIn('integration_repository_id', $repoIds)->exists();

            if ($hasLinks) {
                return Redirect::back()->with('error', 'Cannot disconnect this integration as it has repositories with linked issues. Please unlink all issues first.');
            }
        }

        // Delete all repositories first
        IntegrationRepository::where('integration_provider_id', $provider->id)->delete();

        // Delete the provider
        $provider->delete();

        return redirect()->route('admin.integrations.github.settings')
            ->with('success', 'GitHub integration disconnected successfully.');
    }
}
