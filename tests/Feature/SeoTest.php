<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Post;
use App\Models\User;
use App\Models\Board;
use App\Models\Status;
use App\Facades\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up default settings
        Settings::set('meta_title', 'IdeaBox Test');
        Settings::set('meta_description', 'Test Description');
        Settings::set('og_image', '/images/og-image.png');
        Settings::set('app_name', 'IdeaBox');
    }

    public function test_home_page_has_correct_meta_tags(): void
    {
        $response = $this->get(route('home'));

        $response->assertStatus(200);
        $response->assertSee('<title inertia>IdeaBox Test</title>', false);
        $response->assertSee('<meta name="description" content="Test Description" inertia>', false);
        $response->assertSee('<meta property="og:title" content="IdeaBox Test" inertia>', false);
        $response->assertSee('<meta property="og:type" content="website" inertia>', false);
        $response->assertSee('<meta property="og:image" content="/images/og-image.png" inertia>', false);
    }

    public function test_board_page_has_correct_meta_tags(): void
    {
        $board = Board::factory()->create([
            'name' => 'Test Board',
        ]);

        $response = $this->get(route('board.show', $board->slug));

        $response->assertStatus(200);
        $response->assertSee('<title inertia>Test Board - IdeaBox Test</title>', false);
        $response->assertSee('<meta name="description" content="Test Description" inertia>', false);
        $response->assertSee('<meta property="og:title" content="Test Board - IdeaBox Test" inertia>', false);
        $response->assertSee('<meta property="og:type" content="website" inertia>', false);
    }

    public function test_post_page_has_correct_meta_tags(): void
    {
        $user = User::factory()->create(['name' => 'Test User']);
        $board = Board::factory()->create(['name' => 'Test Board']);
        $status = Status::factory()->create(['name' => 'Open']);

        $post = Post::factory()->create([
            'title' => 'Test Post',
            'body' => 'Test Post Body with enough content to test excerpt generation properly.',
            'board_id' => $board->id,
            'created_by' => $user->id,
            'status_id' => $status->id,
        ]);

        $response = $this->get(route('post.show', [$board->slug, $post->slug]));

        $response->assertStatus(200);
        $response->assertSee('<title inertia>Test Post - IdeaBox Test</title>', false);
        $response->assertSee('<meta property="og:type" content="article" inertia>', false);
        $response->assertSee('<meta property="article:author" content="Test User" inertia>', false);
        $response->assertSee('<meta property="article:section" content="Open" inertia>', false);
    }
}
