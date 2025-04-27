<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\PostIntegrationLink;
use App\Models\Status;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;

class GitHubWebhookController extends Controller
{
    /**
     * Handle GitHub webhook events.
     */
    public function handle(Request $request)
    {
        $payload = $request->all();

        // Extract repository name from payload for logging
        $repositoryName = $payload['repository']['full_name'] ?? 'unknown';
        $event = $request->header('X-GitHub-Event');

        // Security check: Verify the GitHub signature for webhook
        if (!$this->verifyGitHubSignature($request, $repositoryName)) {
            Log::warning('GitHub webhook signature verification failed', [
                'repository' => $repositoryName,
                'ip' => $request->ip()
            ]);
            return response()->json(['success' => false, 'message' => 'Signature verification failed'], 403);
        }

        if ($event === 'issues') {
            return $this->handleIssueEvent($payload);
        }

        return response()->json(['success' => true, 'message' => 'Event ignored']);
    }

    /**
     * Handle issue-related events from GitHub.
     */
    protected function handleIssueEvent(array $payload)
    {
        if (!isset($payload['action']) || !isset($payload['issue']) || !isset($payload['repository'])) {
            return response()->json(['success' => false, 'message' => 'Invalid payload format']);
        }

        $action = $payload['action'];
        $issueNumber = $payload['issue']['number'];
        $repositoryFullName = $payload['repository']['full_name'];

        if ($action === 'closed' || $action === 'reopened') {
            // Find the integration link for this issue
            $link = PostIntegrationLink::whereHas('repository', function ($query) use ($repositoryFullName) {
                $query->where('full_name', $repositoryFullName);
            })->where('external_id', $issueNumber)->first();

            if (!$link) {
                return response()->json([
                    'success' => false,
                    'message' => 'No integration link found for this issue'
                ]);
            }

            // Update the link status
            $link->update(['status' => $payload['issue']['state']]);

            Log::info('GitHub issue status updated', [
                'repository' => $repositoryFullName,
                'issue' => $issueNumber,
                'status' => $payload['issue']['state'],
                'post_id' => $link->post->id
            ]);

            // For closed issues, check if all linked issues are closed
            if ($action === 'closed') {
                $this->updatePostStatusIfAllIssuesClosed($link->post);
            }

            return response()->json([
                'success' => true,
                'message' => 'Issue status updated',
                'action' => $action,
                'issue' => $issueNumber,
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Issue event ignored']);
    }

    /**
     * Update post status if all linked GitHub issues are closed
     *
     * @param \App\Models\Post $post
     * @return void
     */
    protected function updatePostStatusIfAllIssuesClosed($post)
    {
        // Get all GitHub links for this post
        $links = PostIntegrationLink::where('post_id', $post->id)
            ->whereHas('provider', function ($query) {
                $query->where('type', 'github');
            })
            ->get();

        if ($links->isEmpty()) {
            return;
        }

        // Check if all issues are closed
        $allClosed = $links->every(function ($link) {
            return $link->status === 'closed';
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
            } else {
                Log::warning('Could not find completed status for auto-update', [
                    'post_id' => $post->id
                ]);
            }
        }
    }

    /**
     * Verify GitHub webhook signature
     *
     * @param Request $request
     * @param string $repositoryName
     * @return bool
     */
    protected function verifyGitHubSignature(Request $request, string $repositoryName): bool
    {
        $signature = $request->header('X-Hub-Signature-256');

        if (empty($signature)) {
            Log::warning('GitHub webhook missing signature header', [
                'ip' => $request->ip(),
                'repository' => $repositoryName
            ]);
            return false;
        }

        // Get the GitHubIntegration service
        $gitHubIntegration = App::make(GitHubIntegration::class);

        // Use the integration's validateSignature method with the raw content
        $payloadContent = $request->getContent();

        // Find the repository to attach to the integration for checking
        $repository = IntegrationRepository::where('full_name', $repositoryName)->first();

        if (!$repository) {
            Log::warning('Repository not found for webhook', [
                'repository' => $repositoryName
            ]);
            return false;
        }

        $gitHubIntegration->setProvider($repository->provider);

        // Call the integration's validateSignature method
        $isValid = $gitHubIntegration->validateSignature($payloadContent, $signature);

        if (!$isValid) {
            Log::warning('GitHub webhook signature validation failed', [
                'ip' => $request->ip(),
                'repository' => $repositoryName
            ]);
        }

        return $isValid;
    }
}
