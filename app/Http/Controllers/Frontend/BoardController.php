<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\Vote;
use App\Models\Board;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class BoardController extends Controller
{
    public function show(Request $request, Board $board)
    {
        $orderBy = 'vote';
        $sortFields = [
            'latest' => 'created_at',
            'oldest' => 'created_at',
            'voted' => 'vote',
            'commented' => 'comments',
        ];
        $postsQuery = Post::where('board_id', $board->id);

        // If the user is logged in, add the subquery to check for votes
        if (Auth::check()) {
            $userId = Auth::id();

            $postsQuery->addSelect([
                'has_voted' => Vote::selectRaw('count(*)')
                    ->whereColumn('post_id', 'posts.id')
                    ->where('user_id', $userId)
                    ->take(1)
            ]);
        }

        if ($request->has('sort') && in_array($request->sort, array_keys($sortFields))) {
            $orderBy = $sortFields[$request->sort];
        }

        $postsQuery->orderBy($orderBy, 'desc');
        $posts = $postsQuery->get();

        $data = [
            'board' => $board,
            'posts' => $posts,
        ];

        return inertia('Frontend/Board/Show', $data);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Board  $board
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Board $board)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        try {
            $post = Post::create([
                'title'      => $request->title,
                'body'       => $request->body,
                'board_id'   => $board->id,
                'status_id'  => null,
                'created_by' => auth()->user()->id,
            ]);

            // add vote by the creator
            $post->votes()->create([
                'user_id' => auth()->user()->id,
                'board_id' => $board->id,
            ]);
        } catch (\Throwable $th) {
            // throw a validation error for title
            return redirect()->back()->withErrors([
                'title' => $th->getMessage(),
            ]);

        }

        // redirect to the single post
        return redirect()->route('post.show', [$board, $post]);
    }
}
