<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Models\Post;
use App\Models\Board;
use App\Facades\Settings;
use Illuminate\Support\Facades\URL;

class StructuredData
{
    /**
     * Generate structured data for a post
     */
    public static function forPost(Post $post): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $post->title,
            'description' => Formatting::excerpt($post->body, 160),
            'author' => [
                '@type' => 'Person',
                'name' => $post->creator?->name ?? 'Anonymous',
            ],
            'datePublished' => $post->created_at->toIso8601String(),
            'dateModified' => $post->updated_at->toIso8601String(),
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => URL::route('post.show', [$post->board->slug, $post->slug]),
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => Settings::get('app_name'),
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => URL::to(Settings::get('app_logo')),
                ],
            ],
        ];
    }

    /**
     * Generate structured data for a board
     */
    public static function forBoard(Board $board): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => $board->name,
            'description' => $board->description ?? '',
            'url' => URL::route('board.show', $board->slug),
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => Settings::get('app_name'),
                'url' => URL::to('/'),
            ],
        ];
    }

    /**
     * Generate breadcrumb structured data
     *
     * @param array<array{title: string, url: string}> $items
     */
    public static function breadcrumbs(array $items): array
    {
        $itemListElements = [];

        foreach ($items as $position => $item) {
            $itemListElements[] = [
                '@type' => 'ListItem',
                'position' => $position + 1,
                'item' => [
                    '@id' => $item['url'],
                    'name' => $item['title'],
                ],
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $itemListElements,
        ];
    }
}
