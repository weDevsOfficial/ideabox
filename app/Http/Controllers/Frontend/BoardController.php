<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\Status;
use App\Models\Vote;
use App\Models\Board;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\NewFeedbackPosted;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class BoardController extends Controller
{
    public function show(Request $request, Board $board)
    {
        $orderBy = 'vote';
        $sortFields = [
            'latest'    => 'created_at',
            'oldest'    => 'created_at',
            'voted'     => 'vote',
            'commented' => 'comments',
        ];

        $postsQuery = Post::query()->where('board_id', $board->id);
        $statuses = Status::select('id')
                          ->inFrontend()
                          ->get();

        // Group the status conditions
        $postsQuery->where(function ($query) use ($statuses) {
            $query->whereIn('status_id', $statuses->pluck('id'))
                  ->orWhereNull('status_id');
        });

        // Handle search query if present
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $postsQuery->where(function ($query) use ($search) {
                $query->where('title', 'LIKE', "%{$search}%")
                      ->orWhere('body', 'LIKE', "%{$search}%");
            });
        }

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

        $postsQuery->orderBy($orderBy, $request->sort === 'oldest' ? 'asc' : 'desc');
        $posts = $postsQuery->cursorPaginate(20);

        $data = [
            'board' => $board,
            'posts' => $posts,
            'filters' => [
                'sort' => $request->sort,
                'search' => $request->search,
            ],
        ];

        if ($request->wantsJson()) {
            return response()->json($data);
        }

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
                'title'      => strip_tags($request->title),
                'body'       => strip_tags($request->body),
                'board_id'   => $board->id,
                'status_id'  => null,
                'created_by' => auth()->user()->id,
            ]);

            // add vote by the creator
            $post->votes()->create([
                'user_id' => auth()->user()->id,
                'board_id' => $board->id,
            ]);

            $this->notifyAdmins($post);
        } catch (\Throwable $th) {
            return redirect()->back()->withErrors([
                'title' => $th->getMessage(),
            ]);
        }

        return redirect()->route('post.show', [$board, $post]);
    }

    /**
     * Notify all admins about the new feedback.
     */
    private function notifyAdmins(Post $post)
    {
        if ($post->creator->role === 'admin') {
            return;
        }

        $admins = User::admin()->get();

        Notification::send($admins, new NewFeedbackPosted($post));
    }
}
