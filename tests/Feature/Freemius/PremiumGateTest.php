<?php

declare(strict_types=1);

use App\Facades\Settings;
use App\Models\License;
use App\Models\User;
use App\Services\Freemius\FreemiusService;
use App\Services\Freemius\PremiumFeature;

function enableSaas(): void
{
    Settings::set('freemius_enabled', true);
    Settings::set('freemius_product_id', '12345');
    Settings::set('freemius_public_key', 'pk_test');
    Settings::set('freemius_secret_key', 'sk_test');
    Settings::set('freemius_plan_id', '678');
    app(FreemiusService::class)->forgetCache();
}

function activeLicense(): License
{
    $license = License::create([
        'provider' => 'freemius',
        'license_id' => 'lic_1',
        'plan_id' => '678',
        'status' => 'active',
        'is_active' => true,
        'expiration' => null,
    ]);

    app(FreemiusService::class)->forgetCache();

    return $license;
}

it('unlocks every feature when SaaS mode is disabled', function () {
    $freemius = app(FreemiusService::class);

    expect($freemius->saasEnabled())->toBeFalse();
    expect($freemius->canUse(PremiumFeature::INTEGRATIONS))->toBeTrue();
    expect($freemius->canUse(PremiumFeature::AI_ASSIST))->toBeTrue();
});

it('locks premium features when SaaS is enabled without a license', function () {
    enableSaas();
    $freemius = app(FreemiusService::class);

    expect($freemius->saasEnabled())->toBeTrue();
    expect($freemius->hasActiveLicense())->toBeFalse();
    expect($freemius->canUse(PremiumFeature::INTEGRATIONS))->toBeFalse();
    expect($freemius->canUse(PremiumFeature::AI_ASSIST))->toBeFalse();
});

it('unlocks premium features when an active license exists', function () {
    enableSaas();
    activeLicense();
    $freemius = app(FreemiusService::class);

    expect($freemius->hasActiveLicense())->toBeTrue();
    expect($freemius->canUse(PremiumFeature::INTEGRATIONS))->toBeTrue();
});

it('treats an expired license as inactive', function () {
    enableSaas();
    License::create([
        'provider' => 'freemius',
        'license_id' => 'lic_expired',
        'is_active' => true,
        'expiration' => now()->subDay(),
    ]);
    app(FreemiusService::class)->forgetCache();

    expect(app(FreemiusService::class)->hasActiveLicense())->toBeFalse();
});

it('always allows features that are not in the premium registry', function () {
    enableSaas();

    expect(app(FreemiusService::class)->canUse('something_free'))->toBeTrue();
});

it('redirects to billing when an admin opens a locked integrations page', function () {
    enableSaas();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.integrations.index'))
        ->assertRedirect(route('admin.billing.index'));
});

it('allows the integrations page once a license is active', function () {
    enableSaas();
    activeLicense();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.integrations.index'))
        ->assertOk();
});

it('blocks the AI generation route with 403 when locked', function () {
    enableSaas();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->postJson(route('api.generate-feature-description'), ['title' => 'Test'])
        ->assertForbidden();
});
