<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Freemius\FreemiusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FreemiusWebhookController extends Controller
{
    public function __construct(private readonly FreemiusService $freemius)
    {
    }

    /**
     * Receive and process a Freemius webhook event.
     *
     * Authenticity is verified with the product secret key via the
     * X-Signature header (HMAC-SHA256 of the raw body).
     */
    public function handle(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-Signature');

        if (! $this->freemius->verifyWebhookSignature($rawBody, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawBody, true);

        if (! is_array($payload)) {
            return response()->json(['message' => 'Invalid payload'], 422);
        }

        try {
            $this->freemius->handleWebhook($payload);
        } catch (\Throwable $e) {
            Log::error('Freemius webhook processing failed', [
                'type' => $payload['type'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Processing error'], 500);
        }

        return response()->json(['message' => 'ok']);
    }
}
