<?php

declare(strict_types=1);

namespace App\Services;

final class SettingDefinitions
{
    /**
     * Get all setting definitions organized by group.
     *
     * @return array
     */
    public static function all(): array
    {
        return [
            // General Settings Group
            'general' => [
                'label' => 'General',
                'settings' => [
                    'app_name' => [
                        'type' => 'string',
                        'label' => 'Application Name',
                        'description' => 'The name of the application shown in the header',
                        'default' => 'IdeaBox',
                    ],
                    'app_logo' => [
                        'type' => 'string',
                        'label' => 'Application Logo',
                        'description' => 'Main logo for light mode',
                        'default' => '/images/logo.svg',
                    ],
                    'app_logo_dark' => [
                        'type' => 'string',
                        'label' => 'Dark Mode Logo',
                        'description' => 'Logo for dark mode (optional)',
                        'default' => '/images/logo-dark.svg',
                    ],
                    'footer_text' => [
                        'type' => 'text',
                        'label' => 'Footer Text',
                        'description' => 'Text shown in the footer',
                        'default' => '© 2025 IdeaBox. All rights reserved.',
                    ],
                ],
            ],

            // SEO Settings Group
            'seo' => [
                'label' => 'SEO',
                'settings' => [
                    'meta_title' => [
                        'type' => 'string',
                        'label' => 'Meta Title',
                        'description' => 'Default page title for SEO',
                        'default' => ' IdeaBox Feedback & Roadmap',
                    ],
                    'meta_description' => [
                        'type' => 'text',
                        'label' => 'Meta Description',
                        'description' => 'Default meta description for SEO',
                        'default' => 'Public roadmap and feedback portal for IdeaBox',
                    ],
                    'og_image' => [
                        'type' => 'string',
                        'label' => 'Open Graph Image',
                        'description' => 'Image for Open Graph. Recommended size: 1200x630px',
                        'default' => '/images/og-image.png',
                    ],
                ],
            ],

            // Links Settings Group
            'links' => [
                'label' => 'Links',
                'settings' => [
                    'header_links' => [
                        'type' => 'json',
                        'label' => 'Header Links',
                        'description' => 'Additional links for the header',
                        'default' => [
                            ['label' => 'Home', 'href' => 'https://example.com/', 'is_external' => true],
                        ],
                    ],
                    'footer_links' => [
                        'type' => 'json',
                        'label' => 'Footer Links',
                        'description' => 'Links shown in the footer',
                        'default' => [
                            ['label' => 'Terms of Service', 'href' => 'https://example.com/terms', 'is_external' => true],
                            ['label' => 'Privacy Policy', 'href' => 'https://example.com/privacy', 'is_external' => true],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Get a specific setting definition.
     *
     * @param string $key
     * @return array|null
     */
    public static function get(string $key): ?array
    {
        foreach (self::all() as $groupKey => $group) {
            if (isset($group['settings'][$key])) {
                return array_merge(
                    ['key' => $key],
                    $group['settings'][$key],
                    ['group' => $groupKey]
                );
            }
        }
        return null;
    }

    /**
     * Get default value for a setting.
     *
     * @param string $key
     * @return mixed
     */
    public static function getDefault(string $key): mixed
    {
        $definition = self::get($key);
        return $definition ? $definition['default'] : null;
    }

    /**
     * Get all settings for a specific group.
     *
     * @param string $groupKey
     * @return array
     */
    public static function getGroup(string $groupKey): array
    {
        if (!isset(self::all()[$groupKey])) {
            return [];
        }

        $group = self::all()[$groupKey];
        $result = [];

        foreach ($group['settings'] as $key => $setting) {
            $result[$key] = array_merge(
                ['key' => $key],
                $setting,
                ['group' => $groupKey]
            );
        }

        return $result;
    }

    /**
     * Get all available group names.
     *
     * @return array
     */
    public static function getGroups(): array
    {
        return array_keys(self::all());
    }

    /**
     * Get all group labels.
     *
     * @return array
     */
    public static function getGroupLabels(): array
    {
        $result = [];
        foreach (self::all() as $key => $group) {
            $result[$key] = $group['label'];
        }
        return $result;
    }
}
