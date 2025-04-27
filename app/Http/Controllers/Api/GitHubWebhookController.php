<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationRepository;
use App\Services\GitHub\WebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GitHubWebhookController extends Controller
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
     * Handle GitHub webhook events.
     */
    public function handle(Request $request)
    {
        $rawPayload = file_get_contents('php://input');
        $payload = json_decode($rawPayload, true);

        // Extract repository name from payload for logging
        $repositoryName = $payload['repository']['full_name'] ?? 'unknown';
        $event = $request->header('X-GitHub-Event');

        // if the event is a ping, we don't need to process it
        if ($event === 'ping') {
            return response()->json(['success' => true, 'message' => 'Ping received']);
        }

        // Security check: Verify the GitHub signature for webhook
        if (!$this->webhookService->verifySignature($request, $repositoryName, $rawPayload)) {
            Log::warning('GitHub webhook signature verification failed', [
                'repository' => $repositoryName,
            ]);
            return response()->json(['success' => false, 'message' => 'Signature verification failed'], 403);
        }

        if ($event === 'issues') {
            $result = $this->webhookService->processIssueEvent($payload);
            return response()->json($result);
        }

        return response()->json(['success' => true, 'message' => 'Event received']);
    }
}
