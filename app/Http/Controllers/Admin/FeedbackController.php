<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use App\Models\Vote;
use App\Models\Board;
use App\Models\Status;
use App\Models\Comment;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Notifications\FeedbackStatusChanged;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $board = $request->input('board');
        $status = $request->input('status');
        $sort = $request->input('sort') ?? 'voted';

        $boards = Board::select('id', 'name', 'posts', 'slug')->get();
        $statuses = Status::select('id', 'name', 'color')->get();
        $query = Post::with('by', 'board', 'status');

        if ($board && $board !== 'all') {
            $query->where('board_id', $board);
        }

        if ($status && $status !== 'all') {
            $query->where('status_id', $status);
        }

        if ($sort) {
            if ($sort === 'oldest') {
                $query->orderBy('created_at', 'asc');
            } elseif ($sort === 'voted') {
                $query->orderBy('vote', 'desc');
            } elseif ($sort === 'commented') {
                $query->orderBy('comments', 'desc');
            } elseif ($sort === 'latest') {
                $query->orderBy('created_at', 'desc');
            }
        }

        $posts = $query->paginate(30)->withQueryString();

        return inertia('Admin/Feedbacks/Index', [
            'posts' => $posts,
            'boards' => $boards,
            'statuses' => $statuses,
        ]);
    }

    public function show(Post $post)
    {
        $post->load('creator', 'board', 'status', 'by');

        $boards = Board::select('id', 'name', 'posts', 'slug')->get();
        $statuses = Status::select('id', 'name', 'color')->get();

        return inertia('Admin/Feedbacks/Show', [
            'post' => $post,
            'boards' => $boards,
            'statuses' => $statuses,
            'votes' => Vote::select('id', 'user_id')->onPost($post)->with('user')->take(10)->get(),
        ]);
    }

    public function update(Request $request, Post $post)
    {
        $request->validate([
            'board_id'  => 'required|exists:boards,id',
            'status_id' => 'required|exists:statuses,id',
            'comment'   => 'nullable|string',
            'notify'    => 'nullable|boolean'
        ]);

        if ($post->status_id !== $request->input('status_id')) {
            Comment::create([
                'post_id'   => $post->id,
                'user_id'   => auth()->user()->id,
                'body'      => $request->input('comment') ?? '',
                'status_id' => $request->input('status_id'),
            ]);

            if ($request->input('notify') === true) {
                $this->notify($post);
            }
        }

        $post->update([
            'board_id' => $request->input('board_id'),
            'status_id' => $request->input('status_id'),
        ]);

        return redirect()->back()->with('success', 'Feedback updated successfully.');
    }

    private function notify($post)
    {
        // get all voters
        $voters = $post->votes()->with('user')
            ->where('user_id', '!=', auth()->user()->id)
            ->get();

        if (!$voters->count()) {
            return;
        }

        $voters->each(function ($voter) use ($post) {
            $voter->user->notify(new FeedbackStatusChanged($post));
        });
    }

    public function addVote(Post $post, Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if ($post->votes()->where('user_id', $request->user_id)->exists()) {
            return redirect()->back()->with('error', 'The user has already voted.');
        }

        $post->votes()->create([
            'user_id' => $request->user_id,
            'board_id' => $post->board_id,
        ]);

        return redirect()->back()->with('success', 'Vote added successfully.');
    }
}
