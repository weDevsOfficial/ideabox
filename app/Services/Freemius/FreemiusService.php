<?php

declare(strict_types=1);

namespace App\Services\Freemius;

use App\Facades\Settings;
use App\Models\License;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

/**
 * Encapsulates everything Freemius-specific: reading admin-managed config,
 * building the embedded checkout configuration, verifying webhook
 * authenticity, persisting the license snapshot, and answering the single
 * question the rest of the app cares about — "is premium unlocked?".
 */
class FreemiusService
{
    private const LICENSE_CACHE_KEY = 'freemius_license_active';

    /**
     * Event type fragments that should grant / revoke premium access.
     */
    private const ACTIVATING_EVENTS = [
        'license.created', 'license.updated', 'license.activated', 'license.extended',
        'subscription.created', 'payment.created', 'install.activated',
        'install.trial.started', 'after.purchase',
    ];

    private const DEACTIVATING_EVENTS = [
        'license.cancelled', 'license.expired', 'license.deleted', 'license.deactivated',
        'subscription.cancelled', 'install.deactivated', 'install.trial.expired',
        'install.uninstalled',
    ];

    public function isEnabled(): bool
    {
        return (bool) Settings::get('freemius_enabled', false);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->productId()) && ! empty($this->publicKey());
    }

    /**
     * SaaS gating is only active when the admin has both enabled it and
     * supplied the credentials needed to actually sell/verify licenses.
     */
    public function saasEnabled(): bool
    {
        return $this->isEnabled() && $this->isConfigured();
    }

    public function productId(): ?string
    {
        $value = Settings::get('freemius_product_id');

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    public function publicKey(): ?string
    {
        $value = Settings::get('freemius_public_key');

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    public function secretKey(): ?string
    {
        $value = Settings::get('freemius_secret_key');

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    public function planId(): ?string
    {
        $value = Settings::get('freemius_plan_id');

        return $value !== null && $value !== '' ? (string) $value : null;
    }

    /**
     * Configuration handed to the frontend to bootstrap FS.Checkout.
     *
     * @return array<string, mixed>
     */
    public function checkoutConfig(): array
    {
        return [
            'enabled' => $this->saasEnabled(),
            'configured' => $this->isConfigured(),
            'product_id' => $this->productId(),
            'public_key' => $this->publicKey(),
            'plan_id' => $this->planId(),
        ];
    }

    /**
     * Whether the install currently holds an active premium license.
     */
    public function hasActiveLicense(): bool
    {
        return Cache::rememberForever(
            self::LICENSE_CACHE_KEY,
            fn () => License::query()->active()->exists()
        );
    }

    /**
     * Can the install use the given (possibly premium) feature right now?
     *
     * - Unknown / non-premium features are always allowed.
     * - When SaaS mode is off, everything is unlocked (open-source mode).
     * - Otherwise an active license is required.
     */
    public function canUse(string $feature): bool
    {
        if (! PremiumFeature::exists($feature)) {
            return true;
        }

        if (! $this->saasEnabled()) {
            return true;
        }

        return $this->hasActiveLicense();
    }

    /**
     * Map of every premium feature to whether it is currently unlocked,
     * shared with the frontend for conditional rendering.
     *
     * @return array<string, bool>
     */
    public function featureAvailability(): array
    {
        $result = [];

        foreach (PremiumFeature::keys() as $feature) {
            $result[$feature] = $this->canUse($feature);
        }

        return $result;
    }

    /**
     * Verify a webhook request body against the X-Signature header using the
     * product secret key (HMAC-SHA256, hex), timing-safe.
     */
    public function verifyWebhookSignature(string $rawBody, ?string $signature): bool
    {
        $secret = $this->secretKey();

        if (empty($secret) || empty($signature)) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * Process a verified webhook payload, updating the local license state.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleWebhook(array $payload): void
    {
        $type = (string) Arr::get($payload, 'type', '');
        $objects = (array) Arr::get($payload, 'objects', []);

        $license = $this->extractLicense($objects);

        if ($license === null) {
            return;
        }

        $isActive = $this->isActivatingEvent($type)
            ? true
            : ($this->isDeactivatingEvent($type) ? false : $this->licenseLooksActive($license));

        $this->storeLicense($license, $type, $isActive);
    }

    /**
     * Record a purchase reported by the embedded checkout (admin-initiated).
     *
     * @param  array<string, mixed>  $response  The FS.Checkout purchaseCompleted payload.
     */
    public function recordPurchase(array $response): ?License
    {
        $license = $this->extractLicense($response);

        if ($license === null) {
            return null;
        }

        return $this->storeLicense($license, 'checkout.purchase', $this->licenseLooksActive($license));
    }

    /**
     * Persist (insert/update) a normalized license and refresh the gate cache.
     *
     * @param  array<string, mixed>  $license
     */
    private function storeLicense(array $license, string $source, bool $isActive): License
    {
        $licenseId = (string) ($license['id'] ?? '');

        $record = License::query()->updateOrCreate(
            ['provider' => 'freemius', 'license_id' => $licenseId],
            [
                'plan_id' => isset($license['plan_id']) ? (string) $license['plan_id'] : null,
                'plan_title' => $license['plan_title'] ?? null,
                'pricing_id' => isset($license['pricing_id']) ? (string) $license['pricing_id'] : null,
                'freemius_user_id' => isset($license['user_id']) ? (string) $license['user_id'] : null,
                'install_id' => isset($license['install_id']) ? (string) $license['install_id'] : null,
                'subscription_id' => isset($license['subscription_id']) ? (string) $license['subscription_id'] : null,
                'status' => $isActive ? 'active' : 'inactive',
                'is_active' => $isActive,
                'expiration' => $this->parseExpiration($license['expiration'] ?? null),
                'data' => ['source' => $source, 'license' => $license],
            ]
        );

        $this->forgetCache();

        return $record;
    }

    /**
     * Pull a normalized license array out of any of the shapes Freemius uses
     * (checkout response, webhook `objects`, or a bare license object).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>|null
     */
    private function extractLicense(array $data): ?array
    {
        $candidate = $data['license']
            ?? $data['purchase']
            ?? (isset($data['id'], $data['plan_id']) ? $data : null);

        if (! is_array($candidate)) {
            return null;
        }

        // A purchase/payment object references the license rather than being one.
        if (! isset($candidate['id']) && isset($candidate['license_id'])) {
            $candidate['id'] = $candidate['license_id'];
        }

        if (empty($candidate['id'])) {
            return null;
        }

        // Fold subscription/install context in when present alongside the license.
        if (isset($data['subscription']['id'])) {
            $candidate['subscription_id'] = $data['subscription']['id'];
        }
        if (isset($data['install']['id'])) {
            $candidate['install_id'] = $data['install']['id'];
        }
        if (isset($data['plan']['title'])) {
            $candidate['plan_title'] = $data['plan']['title'];
        }

        return $candidate;
    }

    /**
     * @param  array<string, mixed>  $license
     */
    private function licenseLooksActive(array $license): bool
    {
        if (array_key_exists('is_cancelled', $license) && $license['is_cancelled']) {
            return false;
        }

        $expiration = $this->parseExpiration($license['expiration'] ?? null);

        return $expiration === null || $expiration->isFuture();
    }

    private function parseExpiration(mixed $value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function isActivatingEvent(string $type): bool
    {
        return $this->matchesEvent($type, self::ACTIVATING_EVENTS);
    }

    private function isDeactivatingEvent(string $type): bool
    {
        return $this->matchesEvent($type, self::DEACTIVATING_EVENTS);
    }

    /**
     * @param  array<int, string>  $events
     */
    private function matchesEvent(string $type, array $events): bool
    {
        foreach ($events as $event) {
            if ($type === $event || str_starts_with($type, $event)) {
                return true;
            }
        }

        return false;
    }

    public function forgetCache(): void
    {
        Cache::forget(self::LICENSE_CACHE_KEY);
    }
}
