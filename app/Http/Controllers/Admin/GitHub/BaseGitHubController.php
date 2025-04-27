<?php

namespace App\Http\Controllers\Admin\GitHub;

use App\Factories\IntegrationFactory;
use App\Http\Controllers\Controller;
use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\PostIntegrationLink;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BaseGitHubController extends Controller
{
    /**
     * Get a configured GitHub integration service instance
     *
     * @param IntegrationProvider|int|null $provider
     * @return GitHubIntegration|null
     */
    protected function getGitHubIntegration($provider = null)
    {
        /** @var IntegrationFactory $factory */
        $factory = app(IntegrationFactory::class);

        /** @var GitHubIntegration $integration */
        $integration = $factory->make('github');

        if (!$integration) {
            Log::error('GitHub integration not available');
            return null;
        }

        // If a provider was passed, set it on the integration
        if ($provider) {
            // If an ID was passed, find the provider
            if (is_numeric($provider)) {
                $provider = $this->getGitHubProvider($provider);
                if (!$provider) {
                    return null;
                }
            }

            $integration->setProvider($provider);
        }

        return $integration;
    }

    /**
     * Get a GitHub provider by ID and verify it's a GitHub provider
     *
     * @param int $providerId
     * @return IntegrationProvider|null
     */
    protected function getGitHubProvider($providerId)
    {
        $provider = IntegrationProvider::find($providerId);

        if (!$provider) {
            Log::error('Provider not found', [
                'provider_id' => $providerId
            ]);
            return null;
        }

        if ($provider->type !== 'github') {
            Log::error('Provider is not a GitHub integration', [
                'provider_id' => $provider->id,
                'provider_type' => $provider->type
            ]);
            return null;
        }

        return $provider;
    }

    /**
     * Find a repository by full name for a specific provider
     *
     * @param IntegrationProvider $provider
     * @param string $fullName
     * @return IntegrationRepository|null
     */
    protected function findOrCreateRepository(IntegrationProvider $provider, string $fullName)
    {
        return IntegrationRepository::firstOrCreate(
            [
                'integration_provider_id' => $provider->id,
                'full_name' => $fullName
            ],
            [
                'name' => basename($fullName)
            ]
        );
    }

    /**
     * Check if a repository has any linked issues
     *
     * @param IntegrationRepository $repository
     * @return bool
     */
    protected function repositoryHasLinks(IntegrationRepository $repository)
    {
        return PostIntegrationLink::where('integration_repository_id', $repository->id)->exists();
    }

    /**
     * Handle common GitHub API errors
     *
     * @param Request $request
     * @param string $errorMessage
     * @param int $statusCode
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    protected function handleGitHubError(Request $request, string $errorMessage, int $statusCode = 500)
    {
        Log::error('GitHub API error: ' . $errorMessage);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['error' => $errorMessage], $statusCode);
        }

        return redirect()->back()->with('error', $errorMessage);
    }
}
