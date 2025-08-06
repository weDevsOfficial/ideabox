<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use App\Models\Vote;
use App\Models\Board;
use App\Models\Status;
use App\Models\Comment;
use App\Helpers\Formatting;
use Illuminate\Http\Request;
use App\Services\OpenAIService;
use App\Models\PostIntegrationLink;
use App\Http\Controllers\Controller;
use App\Models\IntegrationRepository;
use App\Jobs\SendStatusChangeNotifications;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $board = $request->input('board');
        $status = $request->input('status');
        $sort = $request->input('sort') ?? 'voted';
        $search = $request->input('search');

        $boards = Board::select('id', 'name', 'posts', 'slug')->get();
        $statuses = Status::select('id', 'name', 'color')->get();
        $query = Post::with('by', 'board', 'status');

        if ($board && $board !== 'all') {
            $query->where('board_id', $board);
        }

        if ($status && $status !== 'all') {
            if ($status === 'open') {
                $openStatusIds = Status::query()->inFrontend()->pluck('id');
                $query->where(function ($q) use ($openStatusIds) {
                    $q->whereIn('status_id', $openStatusIds)
                      ->orWhereNull('status_id');
                });
            } elseif ($status === 'none') {
                $query->whereNull('status_id');
            } else {
                $query->where('status_id', $status);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
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

        $posts = $query->paginate(30)->appends(request()->query());

        return inertia('Admin/Feedbacks/Index', [
            'posts' => $posts,
            'boards' => $boards,
            'statuses' => $statuses,
            'hasOpenAIKey' => !empty(config('services.openai.api_key')),
        ]);
    }

    /**
     * Show the specified resource.
     */
    public function show(Post $post)
    {
        $post->load('creator', 'board', 'status', 'by');

        $boards = Board::select('id', 'name', 'posts', 'slug')->get();
        $statuses = Status::select('id', 'name', 'color')->get();

        $post->raw_body = $post->body;
        $post->body = Formatting::transformBody($post->body);

        // GitHub integration
        $linkedIssues = [];

        $repositories = IntegrationRepository::query()
            ->whereHas('provider', function ($query) {
                $query->where('type', 'github');
            })
            ->get();

        if ($repositories->count()) {
            $linkedIssues = PostIntegrationLink::query()
                ->where('post_id', $post->id)
                ->get();
        }

        return inertia('Admin/Feedbacks/Show', [
            'post' => $post,
            'boards' => $boards,
            'statuses' => $statuses,
            'votes' => Vote::select('id', 'user_id')->onPost($post)->with('user')->take(10)->get(),
            'repositories' => $repositories,
            'linkedIssues' => $linkedIssues,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'title' => 'required',
            'body' => 'required',
            'status_id' => 'required|exists:statuses,id',
            'board_id' => 'required|exists:boards,id',
        ];

        if ($request->has('behalf_id') && $request->behalf_id) {
            $rules['behalf_id'] = 'exists:users,id';
        }

        $request->validate($rules);

        $args = [
            'title'     => strip_tags($request->title),
            'body'      => strip_tags($request->body),
            'status_id' => $request->status_id,
            'board_id'  => $request->board_id,
        ];

        if ($request->behalf_id) {
            $args['created_by'] = $request->behalf_id;
            $args['by'] = auth()->id();
        }

        $post = Post::create($args);

        if ($post) {
            $post->votes()->create([
                'user_id' => $post->created_by,
                'board_id' => $post->board_id,
            ]);
        }

        return redirect()->route('admin.feedbacks.show', $post)->with('success', 'Post created successfully');
    }

    public function updateContent(Request $request, Post $post)
    {
        $request->validate([
            'title' => 'required',
            'body' => 'required',
        ]);

        $post->update([
            'title' => strip_tags($request->title),
            'body' => strip_tags($request->body),
        ]);

        return redirect()->route('admin.feedbacks.show', $post)->with('success', 'Content updated successfully.');
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
                SendStatusChangeNotifications::dispatch($post);
            }
        }

        $post->update([
            'board_id' => $request->input('board_id'),
            'status_id' => $request->input('status_id'),
        ]);

        return redirect()->back()->with('success', 'Feedback updated successfully.');
    }

    public function destroy(Post $post)
    {
        $post->delete();

        return redirect()->route('admin.feedbacks.index')->with('success', 'Feedback deleted successfully.');
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

    public function generateDescription(Request $request, OpenAIService $openAIService)
    {
        $request->validate([
            'title' => 'required|string|max:255'
        ]);

        try {
            $description = $openAIService->generateFeatureDescription($request->title);
            return response()->json(['description' => $description]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate description'], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate(['search' => ['string', 'nullable']]);
        $search = $request->input('search');

        if (empty($search)) {
            return response()->json([]);
        }

        $query = Post::query();

        $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('body', 'like', "%{$search}%");
        });

        $posts = $query->take(10)->get();

        return response()->json($posts);
    }
}
