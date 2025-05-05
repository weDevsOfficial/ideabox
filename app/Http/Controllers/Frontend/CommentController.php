<?php

declare(strict_types=1);

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\Comment;
use App\Helpers\Formatting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Jobs\SendCommentNotifications;

class CommentController extends Controller
{
    // index function
    public function index(Request $request, Post $post)
    {
        $sort = $request->has('sort') && in_array($request->sort, ['latest', 'oldest']) ? $request->sort : 'oldest';
        $orderBy = ($sort === 'latest') ? 'desc' : 'asc';

        $comments = $post->comments()->with('user', 'status')->orderBy('created_at', $orderBy)->get();

        // Group comments by parent_id
        $groupedComments = $comments->groupBy('parent_id');

        // Recursive function to build comment tree
        $buildCommentTree = function ($parentId = null) use (&$buildCommentTree, &$groupedComments, $orderBy) {
            $result = [];

            if (isset($groupedComments[$parentId])) {
                foreach ($groupedComments[$parentId] as $comment) {
                    $children = $buildCommentTree($comment->id);
                    $comment->body = Formatting::transformBody($comment->body);
                    $comment->children = $children;
                    $result[] = $comment;
                }

                // Sort comments by creation date
                usort($result, function ($a, $b) use ($orderBy) {
                    $comparison = $a->created_at <=> $b->created_at;
                    return $orderBy === 'desc' ? -$comparison : $comparison;
                });
            }
            return $result;
        };

        // Build the comment tree
        $commentTree = $buildCommentTree();

        return response()->json($commentTree);
    }

    public function store(Request $request, Post $post)
    {
        $parentId = intval($request->parent_id);
        $request->validate([
            'body' => 'required',
            'post_id' => 'required|exists:posts,id',
            // parent_id is optional, 0 is the default value. If it's not 0, it must exist in the comments table
            'parent_id' => $parentId === 0 ? 'nullable' : 'exists:comments,id',
        ]);

        $comment = $post->comments()->create([
            'body' => strip_tags($request->body),
            'user_id' => auth()->user()->id,
            'parent_id' => $parentId === 0 ? null : $parentId,
        ]);

        // Load required relationships immediately for both displaying and notifying
        $comment->load('user');
        $comment->children = [];

        // Dispatch notifications in the background
        SendCommentNotifications::dispatch($post, $comment);

        return response()->json($comment);
    }
}
