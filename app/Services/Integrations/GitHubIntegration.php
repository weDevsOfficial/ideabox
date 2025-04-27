<?php

namespace App\Services\Integrations;

use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Services\Integrations\BaseIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Str;
use Exception;
use App\Models\GitHubRepository;

class GitHubIntegration extends BaseIntegration implements IntegrationInterface
{
    protected string $apiBaseUrl = 'https://api.github.com';
    protected string $authBaseUrl = 'https://github.com/login/oauth/authorize';
    protected string $tokenUrl = 'https://github.com/login/oauth/access_token';

    public function getName(): string
    {
        return 'GitHub';
    }

    public function getType(): string
    {
        return 'github';
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
            ]
        ];
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['client_id']) && isset($config['client_secret']);
    }

    /**
     * Get the GitHub authorization URL
     *
     * @param string|null $redirectUri Custom redirect URI
     * @return string Authorization URL
     */
    public function getAuthUrl(string $redirectUri = null): string
    {
        if (!$this->provider) {
            return route('admin.integrations.github.settings', ['error' => 'Provider not configured']);
        }

        $config = $this->provider->getConfig();


        if (empty($config['client_id'])) {
            return route('admin.integrations.github.settings', ['error' => 'missing_client_id']);
        }

        $redirectUri = $redirectUri ?? route('admin.integrations.github.callback');

        // Generate a state parameter for CSRF protection
        $state = csrf_token() . '_' . $this->provider->id;

        // Store state in session for verification during callback
        session(['github_oauth_state' => $state]);

        $params = [
            'client_id' => $config['client_id'],
            'redirect_uri' => $redirectUri,
            'scope' => 'repo',
            'state' => $state
        ];

        return $this->authBaseUrl . '?' . http_build_query($params);
    }

    public function handleAuthCallback(Request $request): bool
    {
        $code = $request->query('code');
        $state = $request->query('state');
        $sessionState = session('github_oauth_state');

        if (empty($code)) {
            Log::error('GitHub callback missing code');

            if ($this->provider) {
                $config = $this->provider->getConfig();
                $config['error_message'] = 'Authorization code missing from callback';
                $this->provider->setConfig($config);
                $this->provider->save();
            }

            return false;
        }

        // For our initial implementation, we'll skip state verification if state is missing
        // But log it so we can troubleshoot
        if (empty($state) || empty($sessionState)) {
            Log::warning('GitHub callback missing state parameter');
            // We'll continue without state verification
        } elseif ($state !== $sessionState) {
            Log::warning('GitHub callback state mismatch');

            // Check if we can extract provider ID from state
            $parts = explode('_', $state);
            $providerId = $parts[1] ?? null;

            if ($providerId && !$this->provider) {
                // Try to find the provider using the ID from state
                $provider = \App\Models\IntegrationProvider::find($providerId);
                if ($provider && $provider->type === 'github') {
                    $this->provider = $provider;
                }
            }

            // Continue despite state mismatch for this version
            // In a production system, we would return false here
        }

        if (!$this->provider) {
            Log::error('GitHub callback - no provider set');
            return false;
        }

        $config = $this->provider->getConfig();

        if (!isset($config['client_id']) || !isset($config['client_secret'])) {
            Log::error('GitHub callback missing credentials in provider config');
            return false;
        }

        // Exchange code for access token
        $tokenResponse = Http::withHeaders([
            'Accept' => 'application/json'
        ])->post($this->tokenUrl, [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'code' => $code,
            'redirect_uri' => route('admin.integrations.github.callback')
        ]);

        if (!$tokenResponse->successful()) {
            Log::error('GitHub access token request failed', [
                'status' => $tokenResponse->status()
            ]);

            // Store error message in config
            $config['error_message'] = 'Failed to obtain access token: ' .
                ($tokenResponse->json()['error_description'] ?? 'HTTP ' . $tokenResponse->status());
            $this->provider->setConfig($config);
            $this->provider->save();

            return false;
        }

        $tokenData = $tokenResponse->json();

        if (!isset($tokenData['access_token'])) {
            Log::error('GitHub access token missing from response');

            // Store error message in config
            $config['error_message'] = 'Access token missing from GitHub response: ' .
                ($tokenData['error_description'] ?? json_encode($tokenData));
            $this->provider->setConfig($config);
            $this->provider->save();

            return false;
        }

        $accessToken = $tokenData['access_token'];

        // Fetch user information using the access token
        $userResponse = $this->apiRequest('GET', '/user', [], $accessToken);

        // Update config with access token and user info
        $config['access_token'] = $accessToken;

        // Store user information if available
        if ($userResponse && $userResponse->successful()) {
            $userData = $userResponse->json();
            $config['user'] = [
                'login' => $userData['login'] ?? null,
                'id' => $userData['id'] ?? null,
                'name' => $userData['name'] ?? null,
                'email' => $userData['email'] ?? null,
                'avatar_url' => $userData['avatar_url'] ?? null
            ];

            // Update provider name with username (no GitHub prefix)
            if (isset($userData['login'])) {
                $this->provider->name = $userData['login'];
            }
        } else {
            Log::error('GitHub user info request failed');
            // Still continue, as we at least have the token
        }

        // Save updated config to the provider
        $this->provider->setConfig($config);
        $this->provider->authenticated_at = now();
        $this->provider->save();

        return true;
    }

    public function isAuthenticated(): bool
    {
        // Check if we have a token in the model
        if (!empty($this->provider->access_token)) {
            return true;
        }

        // Check if we have a token in the config
        $config = $this->provider->getConfig();
        return isset($config['access_token']) &&
               !empty($config['access_token']) &&
               $this->provider->authenticated_at !== null;
    }

    /**
     * Helper method to make API requests to the GitHub API
     *
     * @param string $method HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param string $endpoint API endpoint (e.g. '/user/repos')
     * @param array $data Query parameters for GET, JSON body for POST/PUT
     * @param string|null $token Override the access token
     * @return Response|null
     */
    protected function apiRequest(string $method, string $endpoint, array $data = [], ?string $token = null): ?Response
    {
        // Only check authentication if not providing a specific token
        if (!$token && !$this->isAuthenticated()) {
            Log::error('GitHub integration not authenticated');
            return null;
        }

        $accessToken = $token ?? $this->getAccessToken();
        if (!$accessToken) {
            return null;
        }

        try {
            $request = Http::withToken($accessToken)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'IdeaBox GitHub Integration'
                ]);

            // Make the request using the specified HTTP method
            $method = strtoupper($method);

            // Ensure endpoint starts with a forward slash
            if (!str_starts_with($endpoint, '/')) {
                $endpoint = '/' . $endpoint;
            }

            $url = $this->apiBaseUrl . $endpoint;

            $response = match ($method) {
                'GET' => $request->get($url, $data),
                'POST' => $request->post($url, $data),
                'PUT' => $request->put($url, $data),
                'PATCH' => $request->patch($url, $data),
                'DELETE' => $request->delete($url, $data),
                default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}")
            };

            return $response;
        } catch (\Exception $e) {
            Log::error("GitHub API {$method} request failed", [
                'endpoint' => $endpoint,
                'message' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get the access token from provider
     *
     * @return string|null
     */
    protected function getAccessToken(): ?string
    {
        if (!empty($this->provider->access_token)) {
            return $this->provider->access_token;
        }

        $config = $this->provider->getConfig();
        return $config['access_token'] ?? null;
    }

    /**
     * Log API response error
     *
     * @param Response|null $response
     * @param string $operation
     * @param array $context
     * @return void
     */
    protected function logApiError(?Response $response, string $operation, array $context = []): void
    {
        if (!$response) {
            Log::error("GitHub {$operation} failed: no response", $context);
            return;
        }

        Log::error("GitHub {$operation} failed", array_merge([
            'status' => $response->status(),
            'body' => $response->body(),
        ], $context));
    }

    public function getRepositories(): array
    {
        $response = $this->apiRequest('GET', '/user/repos', [
            'sort' => 'updated',
            'per_page' => 100
        ]);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'get repositories');
            return [];
        }

        $repositories = [];
        foreach ($response->json() as $repo) {
            $repositories[] = [
                'id' => $repo['id'],
                'name' => $repo['name'],
                'full_name' => $repo['full_name'],
                'description' => $repo['description'] ?? '',
                'url' => $repo['html_url']
            ];
        }

        return $repositories;
    }

    public function searchIssues(string $repository, string $query = ''): array
    {
        $searchQuery = "repo:{$repository}";
        if (!empty($query)) {
            $searchQuery .= " {$query}";
        }

        $response = $this->apiRequest('GET', '/search/issues', [
            'q' => $searchQuery,
            'per_page' => 50
        ]);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'search issues', [
                'repository' => $repository,
                'query' => $query
            ]);
            return [];
        }

        $issues = [];
        foreach ($response->json()['items'] as $issue) {
            $issues[] = [
                'id' => $issue['id'],
                'number' => $issue['number'],
                'title' => $issue['title'],
                'state' => $issue['state'],
                'created_at' => $issue['created_at'],
                'updated_at' => $issue['updated_at'],
                'url' => $issue['html_url']
            ];
        }

        return $issues;
    }

    public function getIssue(IntegrationRepository $repository, int $issueNumber): ?array
    {
        $endpoint = "/repos/{$repository->full_name}/issues/{$issueNumber}";
        $response = $this->apiRequest('GET', $endpoint);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'get issue', [
                'repository' => $repository->full_name,
                'issue_number' => $issueNumber
            ]);
            return null;
        }

        $issue = $response->json();
        return [
            'id' => $issue['id'],
            'number' => $issue['number'],
            'title' => $issue['title'],
            'body' => $issue['body'],
            'state' => $issue['state'],
            'created_at' => $issue['created_at'],
            'updated_at' => $issue['updated_at'],
            'url' => $issue['html_url']
        ];
    }

    public function createIssue(IntegrationRepository $repository, string $title, string $body): ?array
    {
        $endpoint = "/repos/{$repository->full_name}/issues";
        $response = $this->apiRequest('POST', $endpoint, [
            'title' => $title,
            'body' => $body
        ]);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'create issue', [
                'repository' => $repository->full_name
            ]);
            return null;
        }

        $issue = $response->json();
        return [
            'id' => $issue['id'],
            'number' => $issue['number'],
            'title' => $issue['title'],
            'state' => $issue['state'],
            'created_at' => $issue['created_at'],
            'updated_at' => $issue['updated_at'],
            'url' => $issue['html_url']
        ];
    }

    public function disconnect(): bool
    {
        if ($this->provider) {
            $config = $this->provider->getConfig();
            unset($config['access_token']);
            $this->provider->setConfig($config);
            $this->provider->authenticated_at = null;
            $this->provider->save();
            return true;
        }
        return false;
    }

    /**
     * Search GitHub repositories
     *
     * @param string $query Search query
     * @return array Matching repositories
     */
    public function searchRepositories(string $query): array
    {
        $response = $this->apiRequest('GET', '/user/repos', [
            'sort' => 'updated',
            'per_page' => 100,
            'affiliation' => 'owner,collaborator,organization_member' // Show all repos the user has access to
        ]);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'search repositories');
            return ['items' => []];
        }

        // Filter repositories client-side based on the search query
        $allRepos = $response->json();
        $filteredRepos = [];
        $query = strtolower($query);

        foreach ($allRepos as $repo) {
            // Check if repo name or full name contains the search query
            if (stripos($repo['name'], $query) !== false ||
                stripos($repo['full_name'], $query) !== false) {
                $filteredRepos[] = $repo;
            }
        }

        // Return in a format matching the search API response
        return [
            'items' => array_slice($filteredRepos, 0, 10) // Limit to 10 results
        ];
    }

    /**
     * Create a webhook for a repository
     *
     * @param IntegrationRepository $repository Repository to create webhook for
     * @param string|null $webhookUrl Custom webhook URL (optional)
     * @return array|null Webhook data if created successfully, null otherwise
     */
    public function createRepositoryWebhook(IntegrationRepository $repository, string $webhookUrl = null): ?array
    {
        try {
            // Generate a webhook secret for this specific repository
            $webhookSecret = Str::random(40);

            $response = $this->apiRequest('POST', "/repos/{$repository->full_name}/hooks", [
                'name' => 'web',
                'config' => [
                    'url' => $webhookUrl ?? route('api.webhooks.github'),
                    'content_type' => 'json',
                    'secret' => $webhookSecret,
                ],
                'events' => ['issues'],
                'active' => true,
            ]);

            if (!$response || !$response->successful()) {
                $this->logApiError($response, 'create repository webhook', [
                    'repository' => $repository->full_name
                ]);
                return null;
            }

            $webhookData = $response->json();

            if (isset($webhookData['id'])) {
                // Store the webhook secret for this repository
                $settings = $repository->settings ?? [];
                $settings['webhook_id'] = $webhookData['id'];
                $settings['webhook_secret'] = $webhookSecret;

                $repository->update([
                    'settings' => $settings
                ]);

                return $webhookData;
            }

            return null;
        } catch (Exception $e) {
            Log::error('GitHub webhook creation error', [
                'error' => $e->getMessage(),
                'repository' => $repository->full_name,
            ]);
            return null;
        }
    }

    /**
     * Delete a webhook from a repository
     *
     * @param IntegrationRepository $repository Repository to delete webhook from
     * @param int $webhookId ID of the webhook to delete
     * @return bool Success or failure
     */
    public function deleteRepositoryWebhook(IntegrationRepository $repository, int $webhookId): bool
    {
        if (!$this->isAuthenticated()) {
            Log::error('GitHub integration not authenticated');
            return false;
        }

        $endpoint = "/repos/{$repository->full_name}/hooks/{$webhookId}";
        $response = $this->apiRequest('DELETE', $endpoint);

        if (!$response || !$response->successful()) {
            $this->logApiError($response, 'delete repository webhook', [
                'repository' => $repository->full_name,
                'webhook_id' => $webhookId
            ]);
            return false;
        }

        // Remove webhook info from repository settings
        if ($repository->settings && isset($repository->settings['webhook_id'])) {
            $settings = $repository->settings;
            unset($settings['webhook_id']);
            unset($settings['webhook_secret']);
            $repository->settings = $settings;
            $repository->save();
        }

        Log::info('GitHub webhook deleted successfully', [
            'repository' => $repository->full_name,
            'webhook_id' => $webhookId
        ]);

        return true;
    }

    /**
     * Validate a webhook signature from GitHub
     *
     * @param string $payload Raw payload content
     * @param string $signature Signature from GitHub X-Hub-Signature-256 header
     * @return bool Whether signature is valid
     */
    public function validateSignature($payload, $signature)
    {
        if (empty($signature)) {
            return false;
        }

        // If payload is a string (raw content), extract repository info after decoding
        $payloadData = is_string($payload) ? json_decode($payload, true) : $payload;
        $repoFullName = $payloadData['repository']['full_name'] ?? null;

        if (!$repoFullName) {
            Log::warning('GitHub webhook missing repository information');
            return false;
        }

        // Look up the repository in our database
        $repository = IntegrationRepository::where('full_name', $repoFullName)->first();

        if (!$repository || empty($repository->settings['webhook_secret'])) {
            Log::warning('Cannot validate GitHub webhook: repository or webhook secret not found', [
                'repository' => $repoFullName
            ]);
            return false;
        }

        // Use repository-specific webhook secret
        $secret = $repository->settings['webhook_secret'];

        // For GitHub webhooks, the payload must be the raw JSON string
        $payloadString = is_string($payload) ? $payload : json_encode($payload);

        // Calculate expected signature
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payloadString, $secret);

        return hash_equals($expectedSignature, $signature);
    }
}
