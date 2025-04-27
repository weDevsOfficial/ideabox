<?php

namespace App\Http\Controllers\Admin\GitHub;

use App\Http\Requests\GitHub\RepositoryRequest;
use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Services\GitHub\WebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;

class GitHubRepositoryController extends BaseGitHubController
{
    /**
     * The webhook service
     */
    protected WebhookService $webhookService;

    /**
     * Constructor
     */
    public function __construct(WebhookService $webhookService)
    {
        $this->webhookService = $webhookService;
    }

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
    public function add(RepositoryRequest $request)
    {
        $validated = $request->validated();

        // Start a database transaction
        return DB::transaction(function () use ($validated, $request) {
            $provider = $this->getGitHubProvider($validated['provider_id']);
            if (!$provider) {
                return ValidationException::withMessages([
                    'error' => 'This is not a GitHub integration.'
                ]);
            }

            // Check if the repository already exists for this provider
            $existingRepo = IntegrationRepository::forProvider($provider)
                ->where('full_name', $validated['full_name'])
                ->first();

            if ($existingRepo) {
                return back()->with('error', 'Repository already exists.');
            }

            // Use our enhanced model method instead of helper
            $repository = IntegrationRepository::findOrCreateByName($provider, $validated['full_name']);

            // Get GitHub integration service
            $integration = $this->getGitHubIntegration($provider);
            if ($integration) {
                // Create a webhook using the dedicated service
                $webhook = $this->webhookService->createWebhook($repository);

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
        });
    }

    /**
     * Get repositories for a GitHub integration.
     */
    public function list(Request $request, IntegrationProvider $provider)
    {
        if ($provider->type !== 'github') {
            return response()->json(['error' => 'This is not a GitHub integration.'], 400);
        }

        // Using the model scope
        $repositories = IntegrationRepository::forProvider($provider)
            ->orderBy('name')
            ->get();

        return response()->json(['repositories' => $repositories]);
    }

    /**
     * Remove a GitHub repository.
     */
    public function remove(Request $request, IntegrationRepository $repository)
    {
        // Use our model method instead of helper method
        if ($repository->hasLinks()) {
            return back()->with('error', 'Cannot remove repository that has linked issues. Please unlink all issues first.');
        }

        // Use a database transaction to ensure atomicity
        return DB::transaction(function () use ($repository) {
            // Delete the webhook using the webhook service
            if ($repository->getWebhookId()) {
                $deleted = $this->webhookService->deleteWebhook($repository);

                if ($deleted) {
                    Log::info('Deleted webhook from GitHub repository', [
                        'repository' => $repository->full_name,
                        'webhook_id' => $repository->getWebhookId()
                    ]);
                } else {
                    Log::warning('Failed to delete webhook from GitHub repository', [
                        'repository' => $repository->full_name,
                        'webhook_id' => $repository->getWebhookId()
                    ]);
                }
            }

            $repository->delete();

            return back()->with('success', 'Repository removed successfully');
        });
    }
}
