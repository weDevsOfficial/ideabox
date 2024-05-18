<?php

use App\Models\Board;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\json;

uses( RefreshDatabase::class );

beforeEach( function () {
    $this->user  = User::factory()->create( [
        'name'     => 'Admin User',
        'email'    => 'admin@example.com',
        'password' => bcrypt( 'password' ),
        'role'     => 'admin',
    ] );
    $this->board = Board::create( [
        'name'        => 'Feedback',
        'slug'        => 'feedback',
        'order'       => 1,
        'privacy'     => 'public',
        'allow_posts' => true,
        'settings'    => [],
    ] );
} );

it( 'returns empty array when search parameter is missing', function () {
    $response = $this->actingAs( $this->user )
                     ->get( '/admin/feedbacks/search' );

    $response->assertStatus( 200 )
             ->assertJson( [] );
} );

it( 'returns posts matching the search query', function () {
    // Create posts for testing
    Post::factory()->create( [
        'title'      => 'Post One',
        'vote'       => 10,
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ] );
    Post::factory()->create( [
        'title'      => 'Another',
        'vote'       => 5,
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ] );
    Post::factory()->create( [
        'title'      => 'Post Two',
        'vote'       => 15,
        'board_id'   => $this->board->id,
        'created_by' => $this->user->id,
    ] );

    // Add search to the request
    $response = $this->actingAs( $this->user )
                     ->get( '/admin/feedbacks/search?search=Post' );

    $response->assertStatus( 200 )
             ->assertJsonCount( 2 )
             ->assertJsonFragment( [ 'title' => 'Post One' ] )
             ->assertJsonFragment( [ 'title' => 'Post Two' ] )
             ->assertJsonMissing( [ 'title' => 'Another' ] );
} );

it( 'excludes post with parent_id from results', function () {
    // Create posts for testing
    $post1 = Post::factory()->create( [ 'title' => 'Post One', 'vote' => 10, 'board_id' => $this->board->id, 'created_by' => $this->user->id ] );
    $post2 = Post::factory()->create( [ 'title' => 'Another Post', 'vote' => 5, 'board_id' => $this->board->id, 'created_by' => $this->user->id ] );

    $response = $this->actingAs( $this->user )
                     ->get( '/admin/feedbacks/search?search=Post&parent_id=' . $post1->id );

    $response->assertStatus(200)
             ->assertJsonCount(1)
             ->assertJsonFragment(['title' => 'Another Post'])
             ->assertJsonMissing(['title' => 'Post One']);
} );

it( 'orders results by vote in descending order', function () {
    // Create posts for testing
    Post::factory()->create( [ 'title' => 'Low Vote Post', 'vote' => 1, 'board_id' => $this->board->id, 'created_by' => $this->user->id ] );
    Post::factory()->create( [ 'title' => 'High Vote Post', 'vote' => 10, 'board_id' => $this->board->id, 'created_by' => $this->user->id ] );
    Post::factory()->create( [ 'title' => 'Medium Vote Post', 'vote' => 5, 'board_id' => $this->board->id, 'created_by' => $this->user->id ] );

    $response = $this->actingAs( $this->user )
                     ->get( '/admin/feedbacks/search?search=Post' );

    $response->assertStatus( 200 )
             ->assertJsonPath( '0.vote', 10 )
             ->assertJsonPath( '1.vote', 5 )
             ->assertJsonPath( '2.vote', 1 );
} );
