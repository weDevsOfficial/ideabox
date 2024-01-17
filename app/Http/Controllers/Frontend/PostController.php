<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Vote;

class PostController extends Controller
{
    public function show(Board $board, $post)
    {
        $post = Post::where('slug', $post)->withVote()->firstOrFail();
        $post->load('creator');

        $data = [
            'post' => $post,
            'board' => $board,
            'votes' => Vote::select('id', 'user_id')->onPost($post)->with('user')->take(10)->get(),
            'status' => $post->status_id ? $post->status : null,
            'comments' => $post->comments()->with('user')->get(),
        ];

        return inertia('Frontend/Post', $data);
    }

    public function vote(Request $request, Post $post)
    {
        $vote = $post->votes()->where('user_id', auth()->user()->id)->first();
        $hasVoted = false;

        if ($vote) {
            $vote->delete();
        } else {
            $post->votes()->create([
                'user_id' => auth()->user()->id,
                'board_id' => $post->board_id,
            ]);

            $hasVoted = true;
        }

        $post = $post->fresh();
        $post->has_voted = $hasVoted;

        return $post;
    }
}
