<?php

namespace App\Services\GitHub;

use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\PostIntegrationLink;
use App\Models\Status;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookService
{
    /**
     * The GitHub integration instance
     */
    protected GitHubIntegration $integration;

    /**
     * Constructor
     */
    public function __construct(GitHubIntegration $integration)
    {
        $this->integration = $integration;
    }

    /**
     * Create a webhook for a repository
     *
     * @param IntegrationRepository $repository The repository to add webhook to
     * @param string|null $webhookUrl Custom webhook URL (otherwise use default route)
     * @return array|null Webhook data or null on failure
     */
    public function createWebhook(IntegrationRepository $repository, ?string $webhookUrl = null): ?array
    {
        try {
            if (!$repository->provider) {
                Log::error('Cannot create webhook: Repository has no provider', [
                    'repository_id' => $repository->id,
                    'repository' => $repository->full_name
                ]);
                return null;
            }

            // Set provider on integration
            $this->integration->setProvider($repository->provider);

            // Generate a webhook secret
            $webhookSecret = Str::random(40);

            // Create the webhook on GitHub with our secret
            $webhookData = $this->integration->createRepositoryWebhook($repository, $webhookUrl);

            if (!$webhookData || empty($webhookData['id'])) {
                Log::error('Failed to create webhook', [
                    'repository' => $repository->full_name
                ]);
                return null;
            }

            // Store webhook details in repository
            $repository->storeWebhookDetails($webhookData['id'], $webhookSecret);

            return $webhookData;
        } catch (\Exception $e) {
            Log::error('Webhook creation error', [
                'repository' => $repository->full_name,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Delete a webhook for a repository
     *
     * @param IntegrationRepository $repository The repository to remove webhook from
     * @return bool Success or failure
     */
    public function deleteWebhook(IntegrationRepository $repository): bool
    {
        try {
            $webhookId = $repository->getWebhookId();
            if (!$webhookId) {
                // No webhook to delete
                return true;
            }

            if (!$repository->provider) {
                Log::error('Cannot delete webhook: Repository has no provider', [
                    'repository_id' => $repository->id,
                    'repository' => $repository->full_name
                ]);
                return false;
            }

            // Set provider on integration
            $this->integration->setProvider($repository->provider);

            // Delete the webhook from GitHub
            $success = $this->integration->deleteRepositoryWebhook($repository, $webhookId);

            if ($success) {
                // Remove webhook details from repository
                $repository->removeWebhookDetails();
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('Webhook deletion error', [
                'repository' => $repository->full_name,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Verify a webhook signature
     *
     * @param Request $request The webhook request
     * @param string $repositoryFullName Repository full name
     * @param string $payload The raw webhook payload
     * @return bool Whether the signature is valid
     */
    public function verifySignature(Request $request, string $repositoryFullName, string $payload): bool
    {
        try {
            $signature = $request->header('X-Hub-Signature-256');

            if (empty($signature)) {
                Log::warning('GitHub webhook missing signature header', [
                    'ip' => $request->ip(),
                    'repository' => $repositoryFullName
                ]);
                return false;
            }

            // Find the repository
            $repository = IntegrationRepository::where('full_name', $repositoryFullName)->first();
            if (!$repository) {
                Log::warning('Repository not found for webhook', [
                    'repository' => $repositoryFullName
                ]);
                return false;
            }

            // Get webhook secret
            $secret = $repository->getWebhookSecret();
            if (!$secret) {
                Log::warning('Webhook secret not found for repository', [
                    'repository' => $repositoryFullName
                ]);
                return false;
            }

            // Calculate expected signature using raw payload
            $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

            return hash_equals($expectedSignature, $signature);
        } catch (\Exception $e) {
            Log::error('Webhook signature verification error', [
                'repository' => $repositoryFullName,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Process a GitHub issue event from a webhook
     *
     * @param array $payload The webhook payload
     * @return array Status information about the processing
     */
    public function processIssueEvent(array $payload): array
    {
        if (!isset($payload['action']) || !isset($payload['issue']) || !isset($payload['repository'])) {
            return [
                'success' => false,
                'message' => 'Invalid payload format'
            ];
        }

        $action = $payload['action'];
        $issueNumber = $payload['issue']['number'];
        $repositoryFullName = $payload['repository']['full_name'];

        if ($action === 'closed' || $action === 'reopened') {
            // Find the integration link for this issue using the scope
            $link = PostIntegrationLink::byIssue($repositoryFullName, $issueNumber)->first();

            if (!$link) {
                return [
                    'success' => false,
                    'message' => 'No integration link found for this issue'
                ];
            }

            // Update the link status
            $link->update(['status' => $payload['issue']['state']]);

            // For closed issues, check if all linked issues are closed
            if ($action === 'closed') {
                $this->updatePostStatusIfAllIssuesClosed($link->post);
            }

            return [
                'success' => true,
                'message' => 'Issue status updated',
                'action' => $action,
                'issue' => $issueNumber,
            ];
        }

        return [
            'success' => true,
            'message' => 'Issue event ignored'
        ];
    }

    /**
     * Update post status if all linked GitHub issues are closed
     *
     * @param \App\Models\Post $post
     * @return bool Whether the post status was updated
     */
    protected function updatePostStatusIfAllIssuesClosed($post): bool
    {
        // Get all GitHub links for this post using the scope
        $links = PostIntegrationLink::where('post_id', $post->id)
            ->GitHub()
            ->get();

        if ($links->isEmpty()) {
            return false;
        }

        // Check if all issues are closed
        $allClosed = $links->every(function ($link) {
            return $link->isClosed();
        });

        if ($allClosed) {
            // Find the "completed" status
            $completedStatus = Status::where('name', 'Complete')
                ->orWhere('name', 'Completed')
                ->orWhere('name', 'Done')
                ->first();

            if ($completedStatus) {
                $post->update(['status_id' => $completedStatus->id]);

                Log::info('Post status updated to complete because all GitHub issues are closed', [
                    'post_id' => $post->id,
                    'status_id' => $completedStatus->id,
                    'issue_count' => $links->count()
                ]);

                return true;
            } else {
                Log::warning('Could not find completed status for auto-update', [
                    'post_id' => $post->id
                ]);
            }
        }

        return false;
    }
}
