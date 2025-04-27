<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Inertia\Inertia;
use Inertia\Response;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use App\Models\IntegrationProvider;
use App\Models\PostIntegrationLink;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Factories\IntegrationFactory;
use App\Models\IntegrationRepository;
use App\Services\IntegrationRegistry;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Services\Integrations\GitHubIntegration;

class GitHubIntegrationController extends Controller
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
            return !empty($provider->access_token);
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
    public function connect(Request $request, IntegrationFactory $factory)
    {
        try {
            $request->validate([
                'client_id' => 'required',
                'client_secret' => 'required',
            ]);

            // Create GitHub integration instance
            /** @var \App\Services\Integrations\GitHubIntegration $integration */
            $integration = $factory->make('github');

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
                $provider = new IntegrationProvider();
                $provider->type = 'github';
                $provider->name = 'GitHub';
                $provider->access_token = null; // Initialize as null
                $provider->setConfig([
                    'client_id' => $request->input('client_id'),
                    'client_secret' => $request->input('client_secret'),
                ]);
                $provider->save();
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
        } catch (\Exception $e) {
            Log::error('GitHub connect error', [
                'error' => $e->getMessage(),
            ]);

            return $request->wantsJson()
                ? response()->json(['error' => 'Failed to initialize GitHub connection: ' . $e->getMessage()], 500)
                : Redirect::back()->with('error', 'Failed to initialize GitHub connection: ' . $e->getMessage());
        }
    }

    /**
     * Handle the callback from GitHub after authorization.
     */
    public function callback(Request $request, IntegrationFactory $factory)
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
        $provider = IntegrationProvider::find($providerId);
        if (!$provider || $provider->type !== 'github') {
            Log::error('GitHub callback - invalid provider', [
                'provider_id' => $providerId,
                'provider_exists' => (bool)$provider,
                'provider_type' => $provider ? $provider->type : null
            ]);
            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'Invalid provider. Please try connecting again.');
        }

        // Create GitHub integration with provider
        /** @var \App\Services\Integrations\GitHubIntegration $integration */
        $integration = $factory->make('github');
        if (!$integration) {
            Log::error('GitHub callback - integration not available');
            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'GitHub integration is not available.');
        }

        $integration->setProvider($provider);

        try {
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
        } catch (\Exception $e) {
            Log::error('GitHub callback exception: ' . $e->getMessage());

            return redirect()->route('admin.integrations.github.settings')
                ->with('error', 'Exception during GitHub integration: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect a GitHub integration.
     */
    public function disconnect(IntegrationProvider $provider)
    {
        try {
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
        } catch (\Exception $e) {
            Log::error('Failed to disconnect GitHub integration', [
                'error' => $e->getMessage(),
                'provider_id' => $provider->id
            ]);

            return Redirect::back()->with('error', 'Failed to disconnect GitHub integration: ' . $e->getMessage());
        }
    }

    /**
     * Search GitHub repositories.
     */
    public function searchRepositories(Request $request, IntegrationFactory $factory)
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|min:2',
                'provider_id' => 'required|exists:integration_providers,id'
            ]);

            $provider = IntegrationProvider::findOrFail($validated['provider_id']);

            if ($provider->type !== 'github') {
                return response()->json(['error' => 'This is not a GitHub integration.'], 400);
            }

            /** @var GitHubIntegration $integration */
            $integration = $factory->make('github');
            $integration->setProvider($provider);

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
        } catch (\Exception $e) {
            Log::error('GitHub repository search error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Search for issues in a repository
     */
    public function searchIssues(Request $request, IntegrationFactory $factory)
    {
        try {
            $search = $request->input('search');
            /** @var GitHubIntegration $integration */
            $integration = $factory->make('github');
            $provider = IntegrationProvider::where('id', $request->provider_id)
                ->where('type', 'github')
                ->firstOrFail();

            $integration->setProvider($provider);
            $repoId = $request->input('repository_id');
            $query = $search ?? '';

            $repository = IntegrationRepository::findOrFail($repoId);

            $client = new Client([
                'base_uri' => 'https://api.github.com/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $provider->access_token,
                    'Accept' => 'application/vnd.github.v3+json',
                    'User-Agent' => 'IdeaBox GitHub Integration',
                ],
            ]);

            $params = [
                'q' => $query . ' repo:' . $repository->full_name,
                'per_page' => 10,
            ];

            $response = $client->get('search/issues', ['query' => $params]);
            $issues = json_decode($response->getBody()->getContents(), true);

            return response()->json([
                'issues' => $issues['items'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error('GitHub searchIssues error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search issues'], 500);
        }
    }

    /**
     * Get a specific issue
     */
    public function getIssue(Request $request, IntegrationFactory $factory)
    {
        try {
            $request->validate([
                'provider_id' => 'required|exists:integration_providers,id',
                'repository_full_name' => 'required|string',
                'issue_number' => 'required|integer',
            ]);

            /** @var GitHubIntegration $integration */
            $integration = $factory->make('github');
            $provider = IntegrationProvider::where('id', $request->provider_id)
                ->where('type', 'github')
                ->firstOrFail();

            $integration->setProvider($provider);
            $repositoryFullName = $request->input('repository_full_name');
            $issueNumber = $request->input('issue_number');

            // Create a temporary repository object for the API call
            $repository = new \stdClass();
            $repository->full_name = $repositoryFullName;

            $client = new Client([
                'base_uri' => 'https://api.github.com/',
                'headers' => [
                    'Authorization' => 'Bearer ' . $provider->access_token,
                    'Accept' => 'application/vnd.github.v3+json',
                    'User-Agent' => 'IdeaBox GitHub Integration',
                ],
            ]);

            $response = $client->get("repos/{$repositoryFullName}/issues/{$issueNumber}");
            $issue = json_decode($response->getBody()->getContents(), true);

            return response()->json([
                'issue' => $issue,
            ]);
        } catch (\Exception $e) {
            Log::error('GitHub getIssue error: ' . $e->getMessage(), [
                'provider_id' => $request->provider_id ?? null,
                'repository_full_name' => $request->repository_full_name ?? null,
                'issue_number' => $request->issue_number ?? null,
            ]);
            return response()->json(['error' => 'Failed to get issue: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create an issue from a post
     */
    public function createIssue(Request $request, Post $post, IntegrationFactory $factory)
    {
        $post->load('board');

        try {
            $request->validate([
                'repository_id' => 'required|exists:integration_repositories,id',
                'title' => 'required|string',
                'body' => 'required|string',
            ]);

            $repository = IntegrationRepository::findOrFail($request->repository_id);
            $provider = IntegrationProvider::findOrFail($repository->integration_provider_id);

            /** @var GitHubIntegration $integration */
            $integration = $factory->make('github');
            $integration->setProvider($provider);

            $issueBody = $request->body;
            $issueBody .= "\n\n---";
            $issueBody .= "\n\n*(This issue was created from a post on IdeaBox: ";
            $issueBody .= "[" . $post->title . "](" . route('post.show', [$post->board->slug, $post->slug]) . ")*)";

            // Use the integration service to create the issue
            $issue = $integration->createIssue($repository, $request->title, $issueBody);

            if (!$issue) {
                return redirect()->back()->with('error', 'Failed to create GitHub issue');
            }

            PostIntegrationLink::create([
                'post_id' => $post->id,
                'integration_provider_id' => $provider->id,
                'integration_repository_id' => $repository->id,
                'external_id' => (string) $issue['number'],
                'external_url' => $issue['url'],
                'status' => 'active',
                'settings' => [
                    'title' => $issue['title'],
                ],
            ]);

            return redirect()->back()->with('success', 'Issue created successfully');
        } catch (\Exception $e) {
            Log::error('GitHub createIssue error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create issue: ' . $e->getMessage());
        }
    }

    /**
     * Link a GitHub issue to a post.
     */
    public function linkIssue(Request $request, Post $post, IntegrationFactory $factory)
    {
        try {
            $validated = $request->validate([
                'repository_id' => 'required|exists:integration_repositories,id',
                'integration_provider_id' => 'required|exists:integration_providers,id',
                'external_id' => 'required|string',
            ]);

            $repository = IntegrationRepository::findOrFail($validated['repository_id']);
            $provider = IntegrationProvider::findOrFail($repository->integration_provider_id);

            // Use the integration service
            /** @var GitHubIntegration $integration */
            $integration = $factory->make('github');
            $integration->setProvider($provider);

            // Get the issue details
            $issue = $integration->getIssue($repository, (int)$validated['external_id']);

            if (!$issue) {
                return redirect()->back()->with('error', 'Failed to fetch issue details from GitHub.');
            }

            // Check if the issue is already linked
            $existingLink = PostIntegrationLink::where('post_id', $post->id)
                ->where('integration_repository_id', $validated['repository_id'])
                ->where('external_id', $validated['external_id'])
                ->first();

            if ($existingLink) {
                return redirect()->back()->with('error', 'This issue is already linked to the post.');
            }

            PostIntegrationLink::create([
                'post_id' => $post->id,
                'integration_provider_id' => $validated['integration_provider_id'],
                'integration_repository_id' => $validated['repository_id'],
                'external_id' => $validated['external_id'],
                'external_url' => $issue['url'],
                'status' => 'active',
                'settings' => [
                    'title' => $issue['title'],
                ],
            ]);

            return redirect()->back()->with('success', 'Issue linked successfully');
        } catch (\Exception $e) {
            Log::error('GitHub linkIssue error: ' . $e->getMessage(), [
                'post_id' => $request->post_id ?? null,
                'repository_id' => $request->repository_id ?? null,
                'external_id' => $request->external_id ?? null,
            ]);

            return redirect()->back()->with('error', 'Failed to link issue: ' . $e->getMessage());
        }
    }

    /**
     * Unlink a GitHub issue from a post.
     */
    public function unlinkIssue(Post $post, int $linkId)
    {
        $link = PostIntegrationLink::findOrFail($linkId);

        if ($link->post_id !== $post->id) {
            return redirect()->back()->with('error', 'This issue is not linked to the post.');
        }

        $link->delete();

        return Redirect::back()->with('success', 'GitHub issue unlinked.');
    }

    /**
     * Add a GitHub repository.
     */
    public function addRepository(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'full_name' => 'required|string',
            'provider_id' => 'required|exists:integration_providers,id'
        ]);

        $provider = IntegrationProvider::findOrFail($validated['provider_id']);

        if ($provider->type !== 'github') {
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

        try {
            $repository = new IntegrationRepository();
            $repository->integration_provider_id = $provider->id;
            $repository->name = $request->input('name');
            $repository->full_name = $request->input('full_name');
            $repository->save();

            return redirect()->route('admin.integrations.github.settings')->with('success', 'Repository added successfully');
        } catch (\Exception $e) {
            return redirect()->route('admin.integrations.github.settings')->with('error', 'Failed to add repository: ' . $e->getMessage());
        }
    }

    /**
     * Get repositories for a GitHub integration.
     */
    public function getRepositories(IntegrationProvider $provider)
    {
        if ($provider->type !== 'github') {
            return response()->json(['error' => 'This is not a GitHub integration.'], 400);
        }

        try {
            $repositories = IntegrationRepository::where('integration_provider_id', $provider->id)
                ->orderBy('name')
                ->get();

            return response()->json(['repositories' => $repositories]);
        } catch (\Exception $e) {
            Log::error('GitHub get repositories error: ', [
                'message' => $e->getMessage(),
                'provider_id' => $provider->id
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove a GitHub repository.
     */
    public function removeRepository(IntegrationRepository $repository)
    {
        try {
            // Check if there are any links using this repository
            $hasLinks = PostIntegrationLink::where('integration_repository_id', $repository->id)->exists();

            if ($hasLinks) {
                return back()->with('error', 'Cannot remove repository that has linked issues. Please unlink all issues first.');
            }

            $repository->delete();
            return back()->with('success', 'Repository removed successfully');
        } catch (\Exception $e) {
            Log::error('GitHub remove repository error: ', [
                'message' => $e->getMessage(),
                'repository_id' => $repository->id
            ]);
            return back()->with('error', 'Failed to remove repository: ' . $e->getMessage());
        }
    }
}
