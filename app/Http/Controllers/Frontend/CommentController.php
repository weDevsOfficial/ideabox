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
        $buildCommentTree = function ($parentId = null) use (&$buildCommentTree, &$groupedComments) {
            $result = [];

            if (isset($groupedComments[$parentId])) {
                foreach ($groupedComments[$parentId] as $comment) {
                    $children = $buildCommentTree($comment->id);
                    $comment->body = Formatting::transformBody($comment->body);
                    $comment->children = $children;
                    $result[] = $comment;
                }

                // Sort comments by id
                usort($result, function ($a, $b) {
                    return $a->id - $b->id;
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
        $this->notifyUsers($post, $comment);

        return response()->json($comment);
    }

    /**
     * Notify all relevant users about a new comment.
     *
     * This includes:
     * - The post creator (if not the commenter)
     * - All users who commented on the post (except the commenter)
     * - All users who voted on the post (except the commenter)
     * - If replying to a comment, the parent comment author
     */
    private function notifyUsers(Post $post, Comment $comment): void
    {
        try {
            // Get the ID of the comment creator
            $commenterId = $comment->user_id;

            // Collect all user IDs that need to be notified, excluding the commenter
            $userIdQuery = $post->comments()
                ->where('user_id', '!=', $commenterId)
                ->pluck('user_id');

            // Add post creator if they're not the commenter
            if ($post->created_by && $post->created_by != $commenterId) {
                $userIdQuery = $userIdQuery->push($post->created_by);
            }

            // Add voters
            $userIdQuery = $userIdQuery->merge(
                $post->votes()
                    ->where('user_id', '!=', $commenterId)
                    ->pluck('user_id')
            );

            // If this is a reply, prioritize notifying the parent comment author
            if ($comment->parent_id) {
                $parentComment = Comment::find($comment->parent_id);
                if ($parentComment && $parentComment->user_id != $commenterId) {
                    $userIdQuery = $userIdQuery->prepend($parentComment->user_id);
                }
            }

            // Get unique IDs to avoid duplicate notifications
            $userIds = $userIdQuery->unique()->values();

            if ($userIds->isEmpty()) {
                return;
            }

            // Dispatch the job with batched processing of notifications
            SendCommentNotifications::dispatch($post, $comment, $userIds);

        } catch (\Throwable $e) {
            // Log error but don't interrupt the user experience
            Log::error('Failed to queue comment notifications', [
                'error' => $e->getMessage(),
                'post_id' => $post->id,
                'comment_id' => $comment->id,
            ]);
        }
    }
}
