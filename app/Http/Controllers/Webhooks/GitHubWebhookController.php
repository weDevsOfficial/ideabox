<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\IntegrationProvider;
use App\Models\PostIntegrationLink;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GitHubWebhookController extends Controller
{
    /**
     * Handle GitHub webhook events.
     */
    public function handle(Request $request)
    {
        $payload = $request->all();
        $event = $request->header('X-GitHub-Event');

        Log::info('GitHub webhook received', [
            'event' => $event,
            'action' => $payload['action'] ?? null,
        ]);

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
            $link->status = $payload['issue']['state'];
            $link->save();

            // Check if we should auto-update the post status
            $provider = $link->provider;
            $settings = $provider->settings ?? [];

            if (!empty($settings['auto_sync_status'])) {
                $statusMapping = $settings['status_mapping'] ?? [];
                $targetStatusId = $statusMapping[$payload['issue']['state']] ?? null;

                if ($targetStatusId) {
                    $status = Status::find($targetStatusId);

                    if ($status) {
                        $post = $link->post;
                        $post->status_id = $status->id;
                        $post->save();

                        Log::info('Post status updated from GitHub webhook', [
                            'post_id' => $post->id,
                            'status_id' => $status->id,
                            'issue_state' => $payload['issue']['state'],
                        ]);
                    }
                }
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
}
