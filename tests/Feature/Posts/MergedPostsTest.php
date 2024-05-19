<?php

use App\Models\Board;
use App\Models\Post;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user  = User::factory()->create( [
        'name'     => 'Admin User',
        'email'    => 'admin@example.com',
        'password' => bcrypt( 'password' ),
        'role'     => 'admin',
    ] );
    $this->board = Board::create([
        'name'       => 'Feedback',
        'slug'       => 'feedback',
        'order'      => 1,
        'privacy'    => 'public',
        'allow_posts' => true,
        'settings'   => [],
    ]);
    $this->status = Status::create([
        'name' => 'Open',
        'color' => 'green',
    ]);
});

test('post can be merged with another post', function () {
    $post = Post::factory()->create([
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ]);
    $mergedPost = Post::factory()->create([
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->post('admin/feedbacks/merge', [
            'post_id'        => $post->id,
            'merge_ids' => [$mergedPost->id],
            'status_id'      => $this->status->id,
        ]);

    $response->assertSessionHasNoErrors();
    $this->assertNotNull($mergedPost->refresh()->merged_with_post);
    $this->assertEquals($post->id, $mergedPost->merged_with_post);
});

test('post can be merged with one or more posts', function () {
    $post = Post::factory()->create([
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ]);
    $mergedPosts = Post::factory()->count(2)->create([
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->post('/admin/feedbacks/merge', [
            'post_id'        => $post->id,
            'merge_ids' => $mergedPosts->pluck('id')->toArray(),
            'status_id'      => $this->status->id,
        ]);

    $response->assertSessionHasNoErrors();
    $this->assertNotNull($mergedPosts->first()->refresh()->merged_with_post);
    $this->assertNotNull($mergedPosts->last()->refresh()->merged_with_post);
    $this->assertEquals($mergedPosts->first()->merged_with_post, $post->id);
    $this->assertEquals($mergedPosts->last()->merged_with_post, $post->id);
});
