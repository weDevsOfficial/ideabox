<?php

namespace Tests\Feature\Integrations;

use App\Models\Board;
use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\Post;
use App\Models\PostIntegrationLink;
use App\Models\User;
use App\Services\Integrations\GitHubIntegration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Illuminate\Support\Facades\URL;

class GitHubIntegrationTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the HTTP client for GitHub API calls
        Http::fake([
            'github.com/login/oauth/access_token' => Http::response(['access_token' => 'fake-token'], 200),
            'api.github.com/user' => Http::response([
                'login' => 'test-user',
                'id' => 12345,
                'name' => 'Test User',
                'avatar_url' => 'https://avatars.githubusercontent.com/u/12345'
            ], 200),
            'api.github.com/user/repos*' => Http::response([
                [
                    'id' => 98765,
                    'name' => 'test-repo',
                    'full_name' => 'test-user/test-repo',
                    'description' => 'Test repository',
                    'html_url' => 'https://github.com/test-user/test-repo',
                    'owner' => [
                        'login' => 'test-user',
                        'avatar_url' => 'https://avatars.githubusercontent.com/u/12345'
                    ]
                ]
            ], 200),
            'api.github.com/search/issues*' => Http::response([
                'items' => [
                    [
                        'id' => 12345,
                        'number' => 42,
                        'title' => 'Test Issue',
                        'state' => 'open',
                        'html_url' => 'https://github.com/test-user/test-repo/issues/42',
                        'created_at' => '2023-01-01T00:00:00Z',
                        'updated_at' => '2023-01-02T00:00:00Z'
                    ]
                ]
            ], 200),
            'api.github.com/repos/*/issues/*' => Http::response([
                'id' => 12345,
                'number' => 42,
                'title' => 'Test Issue',
                'body' => 'Test issue body',
                'state' => 'open',
                'html_url' => 'https://github.com/test-user/test-repo/issues/42',
                'created_at' => '2023-01-01T00:00:00Z',
                'updated_at' => '2023-01-02T00:00:00Z'
            ], 200),
            'api.github.com/repos/*/issues' => Http::response([
                'id' => 12345,
                'number' => 42,
                'title' => 'Test Issue',
                'body' => 'Test issue body',
                'state' => 'open',
                'html_url' => 'https://github.com/test-user/test-repo/issues/42'
            ], 201),
            // Add any missing endpoints needed for the tests
            'api.github.com/repos/test-user/test-repo/issues/42' => Http::response([
                'id' => 12345,
                'number' => 42,
                'title' => 'Test Issue',
                'body' => 'Test issue body',
                'state' => 'open',
                'html_url' => 'https://github.com/test-user/test-repo/issues/42',
                'created_at' => '2023-01-01T00:00:00Z',
                'updated_at' => '2023-01-02T00:00:00Z'
            ], 200),
        ]);

        // Mock the URL generator
        URL::shouldReceive('to')->andReturn('http://ideabox.test')->byDefault();
    }

    public function test_admin_can_view_github_settings_page()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Test accessing settings page
        $response = $this->actingAs($user)
            ->get(route('admin.integrations.github.settings'));

        $response->assertStatus(200);
        $response->assertInertia(
            fn ($page) => $page
            ->component('Admin/Integrations/GitHub/Settings')
            ->has('providers')
        );
    }

    public function test_admin_can_connect_github_account()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Test connect endpoint
        $response = $this->actingAs($user)
            ->post(route('admin.integrations.github.connect'), [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ]);

        // Should redirect to GitHub
        $response->assertStatus(302);
        $response->assertRedirect();

        // Verify provider was created
        $this->assertDatabaseHas('integration_providers', [
            'type' => 'github',
            'name' => 'GitHub', // Default name before authentication
        ]);
    }

    public function test_github_callback_handling()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create a pending provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
        ]);

        // Store provider ID in session
        session(['github_integration_provider_id' => $provider->id]);
        session(['github_oauth_state' => 'test-state']);

        // Test callback endpoint
        $response = $this->actingAs($user)
            ->get(route('admin.integrations.github.callback', [
                'code' => 'test-code',
                'state' => 'test-state',
            ]));

        // Should redirect to settings page
        $response->assertStatus(302);
        $response->assertRedirect(route('admin.integrations.github.settings'));

        // Verify provider was updated
        $this->assertDatabaseHas('integration_providers', [
            'id' => $provider->id,
            'type' => 'github',
            'name' => 'test-user', // Updated from GitHub profile
        ]);
    }

    public function test_admin_can_add_repository()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Test adding repository
        $response = $this->actingAs($user)
            ->post(route('admin.integrations.github.add-repository'), [
                'provider_id' => $provider->id,
                'name' => 'test-repo',
                'full_name' => 'test-user/test-repo',
            ]);

        // Should redirect to settings page
        $response->assertStatus(302);
        $response->assertRedirect(route('admin.integrations.github.settings'));

        // Verify repository was created
        $this->assertDatabaseHas('integration_repositories', [
            'integration_provider_id' => $provider->id,
            'name' => 'test-repo',
            'full_name' => 'test-user/test-repo',
        ]);
    }

    public function test_admin_can_search_repositories()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Test searching repositories
        $response = $this->actingAs($user)
            ->post(route('admin.integrations.github.search-repositories'), [
                'provider_id' => $provider->id,
                'query' => 'test',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['repositories']);
    }

    public function test_admin_can_create_issue_from_post()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Create repository
        $repository = IntegrationRepository::create([
            'integration_provider_id' => $provider->id,
            'name' => 'test-repo',
            'full_name' => 'test-user/test-repo',
        ]);

        // Create board and post
        $board = Board::factory()->create(['slug' => 'test-board']);
        $post = Post::factory()->create([
            'board_id' => $board->id,
            'created_by' => $user->id,
            'slug' => 'test-post',
        ]);

        // Mock URL::to and route functions
        $this->app['url']->shouldReceive('to')->andReturn('http://ideabox.test');
        $this->app['url']->shouldReceive('route')->with('post.show', [$board->slug, $post->slug])->andReturn('http://ideabox.test/b/test-board/test-post');

        // Test creating issue
        $response = $this->actingAs($user)
            ->from('/previous-page') // Set a referer for redirect back
            ->post(route('admin.integrations.github.create-issue', $post->id), [
                'repository_id' => $repository->id,
                'title' => 'Test Issue',
                'body' => 'Test issue body',
            ]);

        // Should redirect back
        $response->assertStatus(302);
        $response->assertRedirect('/previous-page');

        // Verify link was created
        $this->assertDatabaseHas('post_integration_links', [
            'post_id' => $post->id,
            'integration_provider_id' => $provider->id,
            'integration_repository_id' => $repository->id,
            'external_id' => '42', // from our mocked response
        ]);
    }

    public function test_admin_can_link_existing_issue()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Create repository
        $repository = IntegrationRepository::create([
            'integration_provider_id' => $provider->id,
            'name' => 'test-repo',
            'full_name' => 'test-user/test-repo',
        ]);

        // Create board and post
        $board = Board::factory()->create(['slug' => 'test-board']);
        $post = Post::factory()->create([
            'board_id' => $board->id,
            'created_by' => $user->id,
            'slug' => 'test-post',
        ]);

        // Mock URL generation
        $this->app['url']->shouldReceive('to')->andReturn('http://ideabox.test');

        // Test linking issue
        $response = $this->actingAs($user)
            ->from('/previous-page') // Set a referer for redirect back
            ->post(route('admin.integrations.github.link-issue', $post->id), [
                'repository_id' => $repository->id,
                'integration_provider_id' => $provider->id,
                'external_id' => '42',
            ]);

        // Should redirect back
        $response->assertStatus(302);
        $response->assertRedirect('/previous-page');

        // Verify link was created
        $this->assertDatabaseHas('post_integration_links', [
            'post_id' => $post->id,
            'integration_provider_id' => $provider->id,
            'integration_repository_id' => $repository->id,
            'external_id' => '42',
        ]);
    }

    public function test_admin_can_unlink_issue()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Create repository
        $repository = IntegrationRepository::create([
            'integration_provider_id' => $provider->id,
            'name' => 'test-repo',
            'full_name' => 'test-user/test-repo',
        ]);

        // Create board and post
        $board = Board::factory()->create(['slug' => 'test-board']);
        $post = Post::factory()->create([
            'board_id' => $board->id,
            'created_by' => $user->id,
            'slug' => 'test-post',
        ]);

        // Create link
        $link = PostIntegrationLink::create([
            'post_id' => $post->id,
            'integration_provider_id' => $provider->id,
            'integration_repository_id' => $repository->id,
            'external_id' => '42',
            'external_url' => 'https://github.com/test-user/test-repo/issues/42',
            'status' => 'active',
            'settings' => [
                'title' => 'Test Issue',
            ],
        ]);

        // Mock URL generation
        $this->app['url']->shouldReceive('to')->andReturn('http://ideabox.test');

        // Test unlinking issue
        $response = $this->actingAs($user)
            ->from('/previous-page') // Set a referer for redirect back
            ->delete(route('admin.integrations.github.unlink-issue', [
                'post' => $post->id,
                'linkId' => $link->id,
            ]));

        // Should redirect back
        $response->assertStatus(302);
        $response->assertRedirect('/previous-page');

        // Verify link was deleted
        $this->assertDatabaseMissing('post_integration_links', [
            'id' => $link->id,
        ]);
    }

    public function test_admin_can_remove_repository()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Create repository
        $repository = IntegrationRepository::create([
            'integration_provider_id' => $provider->id,
            'name' => 'test-repo',
            'full_name' => 'test-user/test-repo',
        ]);

        // Test removing repository
        $response = $this->actingAs($user)
            ->delete(route('admin.integrations.github.repositories.remove', $repository->id));

        // Should redirect back
        $response->assertStatus(302);

        // Verify repository was deleted
        $this->assertDatabaseMissing('integration_repositories', [
            'id' => $repository->id,
        ]);
    }

    public function test_admin_can_disconnect_github_account()
    {
        // Create admin user
        $user = User::factory()->create(['role' => 'admin']);

        // Create GitHub provider
        $provider = IntegrationProvider::create([
            'type' => 'github',
            'name' => 'GitHub Test',
            'access_token' => 'test-token',
            'settings' => [
                'client_id' => 'test-client-id',
                'client_secret' => 'test-client-secret',
            ],
            'authenticated_at' => now(),
        ]);

        // Test disconnecting account
        $response = $this->actingAs($user)
            ->delete(route('admin.integrations.github.disconnect', $provider->id));

        // Should redirect to settings page
        $response->assertStatus(302);
        $response->assertRedirect(route('admin.integrations.github.settings'));

        // Verify provider was deleted
        $this->assertDatabaseMissing('integration_providers', [
            'id' => $provider->id,
        ]);
    }
}
