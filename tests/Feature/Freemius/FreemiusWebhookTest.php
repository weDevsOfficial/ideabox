<?php

declare(strict_types=1);

use App\Facades\Settings;
use App\Models\License;
use App\Services\Freemius\FreemiusService;

const WEBHOOK_SECRET = 'sk_webhook_secret';

beforeEach(function () {
    Settings::set('freemius_enabled', true);
    Settings::set('freemius_product_id', '12345');
    Settings::set('freemius_public_key', 'pk_test');
    Settings::set('freemius_secret_key', WEBHOOK_SECRET);
    app(FreemiusService::class)->forgetCache();
});

function postWebhook(array $payload, ?string $secret = WEBHOOK_SECRET): \Illuminate\Testing\TestResponse
{
    $body = json_encode($payload);
    $signature = $secret !== null ? hash_hmac('sha256', $body, $secret) : '';

    return test()->call(
        'POST',
        route('api.webhooks.freemius'),
        [],
        [],
        [],
        ['HTTP_X_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'],
        $body
    );
}

it('rejects a webhook with an invalid signature', function () {
    $response = test()->call(
        'POST',
        route('api.webhooks.freemius'),
        [],
        [],
        [],
        ['HTTP_X_SIGNATURE' => 'deadbeef', 'CONTENT_TYPE' => 'application/json'],
        json_encode(['type' => 'license.created', 'objects' => ['license' => ['id' => 1]]])
    );

    $response->assertStatus(401);
    expect(License::count())->toBe(0);
});

it('activates a license from a verified license.created webhook', function () {
    $response = postWebhook([
        'type' => 'license.created',
        'objects' => [
            'license' => ['id' => 9001, 'plan_id' => 678, 'expiration' => null],
            'plan' => ['title' => 'Premium'],
        ],
    ]);

    $response->assertOk();

    $license = License::first();
    expect($license)->not->toBeNull();
    expect($license->license_id)->toBe('9001');
    expect($license->plan_title)->toBe('Premium');
    expect($license->is_active)->toBeTrue();
    expect(app(FreemiusService::class)->hasActiveLicense())->toBeTrue();
});

it('deactivates a license on a cancellation webhook', function () {
    postWebhook([
        'type' => 'license.created',
        'objects' => ['license' => ['id' => 9001, 'expiration' => null]],
    ])->assertOk();

    expect(app(FreemiusService::class)->hasActiveLicense())->toBeTrue();

    postWebhook([
        'type' => 'subscription.cancelled',
        'objects' => ['license' => ['id' => 9001]],
    ])->assertOk();

    expect(License::first()->is_active)->toBeFalse();
    expect(app(FreemiusService::class)->hasActiveLicense())->toBeFalse();
});

it('respects an explicit expiration in the future', function () {
    postWebhook([
        'type' => 'license.updated',
        'objects' => [
            'license' => [
                'id' => 5,
                'expiration' => now()->addYear()->toDateTimeString(),
            ],
        ],
    ])->assertOk();

    expect(app(FreemiusService::class)->hasActiveLicense())->toBeTrue();
});
