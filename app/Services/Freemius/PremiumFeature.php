<?php

declare(strict_types=1);

namespace App\Services\Freemius;

/**
 * Registry of features that require an active Freemius license when SaaS
 * mode is enabled. Add a constant here and an entry in all() to gate a new
 * feature; it will automatically be enforced by the `premium` middleware and
 * exposed to the frontend through the shared Inertia props.
 */
class PremiumFeature
{
    public const INTEGRATIONS = 'integrations';

    public const AI_ASSIST = 'ai_assist';

    /**
     * All gated features with their display metadata.
     *
     * @return array<string, array{label: string, description: string}>
     */
    public static function all(): array
    {
        return [
            self::INTEGRATIONS => [
                'label' => 'Integrations',
                'description' => 'Connect IdeaBox to GitHub and other external tools.',
            ],
            self::AI_ASSIST => [
                'label' => 'AI Assist',
                'description' => 'Generate feature descriptions and summaries with AI.',
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    public static function exists(string $feature): bool
    {
        return array_key_exists($feature, self::all());
    }
}
