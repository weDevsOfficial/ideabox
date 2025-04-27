<?php

namespace App\Http\Controllers\Admin\GitHub;

use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\PostIntegrationLink;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;

class GitHubRepositoryController extends BaseGitHubController
{
    /**
     * Search GitHub repositories.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
            'provider_id' => 'required|exists:integration_providers,id'
        ]);

        $provider = $this->getGitHubProvider($validated['provider_id']);
        if (!$provider) {
            return response()->json(['error' => 'This is not a GitHub integration.'], 400);
        }

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        // Use integration service to search repositories
        $searchResults = $integration->searchRepositories($validated['query']);

        return response()->json([
            'repositories' => collect($searchResults['items'] ?? [])->map(function ($repo) {
                return [
                    'id' => $repo['id'],
                    'name' => $repo['name'],
                    'full_name' => $repo['full_name'],
                    'description' => $repo['description'] ?? '',
                    'html_url' => $repo['html_url'] ?? '',
                    'owner' => [
                        'login' => $repo['owner']['login'] ?? '',
                        'avatar_url' => $repo['owner']['avatar_url'] ?? '',
                    ],
                ];
            })
        ]);
    }

    /**
     * Add a GitHub repository.
     */
    public function add(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'full_name' => 'required|string',
            'provider_id' => 'required|exists:integration_providers,id'
        ]);

        $provider = $this->getGitHubProvider($validated['provider_id']);
        if (!$provider) {
            return ValidationException::withMessages([
                'error' => 'This is not a GitHub integration.'
            ]);
        }

        // Check if the repository already exists for this provider
        $existingRepo = IntegrationRepository::where('integration_provider_id', $provider->id)
            ->where('full_name', $request->input('full_name'))
            ->first();

        if ($existingRepo) {
            return back()->with('error', 'Repository already exists.');
        }

        // Use findOrCreateRepository helper method
        $repository = $this->findOrCreateRepository($provider, $request->input('full_name'));

        // Get GitHub integration service
        $integration = $this->getGitHubIntegration($provider);
        if ($integration) {
            // Create a webhook for this repository
            $webhook = $integration->createRepositoryWebhook($repository);

            if ($webhook) {
                Log::info('Created webhook for repository', [
                    'repository' => $repository->full_name,
                    'webhook_id' => $webhook['id'],
                ]);

                return redirect()->route('admin.integrations.github.settings')
                    ->with('success', 'Repository added successfully. A webhook has been created to track issue updates.');
            } else {
                Log::warning('Failed to create webhook for repository', [
                    'repository' => $repository->full_name
                ]);
                // Still proceed even if webhook creation failed
            }
        }

        return redirect()->route('admin.integrations.github.settings')
            ->with('success', 'Repository added successfully');
    }

    /**
     * Get repositories for a GitHub integration.
     */
    public function list(Request $request, IntegrationProvider $provider)
    {
        if ($provider->type !== 'github') {
            return response()->json(['error' => 'This is not a GitHub integration.'], 400);
        }

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        // Option 1: Get repositories from database
        $repositories = IntegrationRepository::where('integration_provider_id', $provider->id)
            ->orderBy('name')
            ->get();

        // Option 2: Fetch repositories from GitHub API (uncomment if needed)
        // $githubRepositories = $integration->getRepositories();
        // If you want to sync with the database, you could do that here

        return response()->json(['repositories' => $repositories]);
    }

    /**
     * Remove a GitHub repository.
     */
    public function remove(Request $request, IntegrationRepository $repository)
    {
        // Use repositoryHasLinks helper method
        if ($this->repositoryHasLinks($repository)) {
            return back()->with('error', 'Cannot remove repository that has linked issues. Please unlink all issues first.');
        }

        // Check if webhook exists and delete it
        $settings = $repository->settings ?? [];
        if (!empty($settings['webhook_id'])) {
            $webhookId = $settings['webhook_id'];
            $provider = $repository->provider;

            if ($provider) {
                $integration = $this->getGitHubIntegration($provider);
                if ($integration) {
                    // Delete the webhook from GitHub using the dedicated method
                    $deleted = $integration->deleteRepositoryWebhook($repository, $webhookId);

                    if ($deleted) {
                        Log::info('Deleted webhook from GitHub repository', [
                            'repository' => $repository->full_name,
                            'webhook_id' => $webhookId
                        ]);
                    } else {
                        Log::warning('Failed to delete webhook from GitHub repository', [
                            'repository' => $repository->full_name,
                            'webhook_id' => $webhookId
                        ]);
                    }
                }
            }
        }

        $repository->delete();

        return back()->with('success', 'Repository removed successfully');
    }
}
