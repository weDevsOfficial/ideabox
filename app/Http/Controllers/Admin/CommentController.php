<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Helpers\Formatting;

class CommentController extends Controller
{
    /**
     * List comments for admin dashboard
     */
    public function index(Request $request)
    {
        $comments = Comment::with(['user', 'post', 'post.board'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->appends(request()->query());

        return inertia('Admin/Comments/Index', [
            'comments' => $comments,
        ]);
    }

    /**
     * Show a specific comment
     */
    public function show(Comment $comment)
    {
        $comment->load(['user', 'post', 'post.board', 'post.status']);

        // Get context: parent comment if it exists, and child comments
        $parentComment = null;
        if ($comment->parent_id) {
            $parentComment = Comment::with('user')->find($comment->parent_id);
        }

        $childComments = Comment::with('user')
            ->where('parent_id', $comment->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return inertia('Admin/Comments/Show', [
            'comment' => $comment,
            'parentComment' => $parentComment,
            'childComments' => $childComments,
        ]);
    }

    /**
     * Update a comment
     */
    public function update(Request $request, Comment $comment)
    {
        $request->validate([
            'body' => 'required|string',
        ]);

        $comment->update([
            'body' => strip_tags($request->body),
            'edited_by' => auth()->id(),
            'edited_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Comment updated successfully');
    }

    /**
     * Delete a comment
     */
    public function destroy(Comment $comment)
    {
        try {
            // Get post ID before deleting comment
            $postId = $comment->post_id;

            // Bulk update all child comments in a single query
            Comment::query()
                ->where('parent_id', $comment->id)
                ->update(['parent_id' => $comment->parent_id]);

            $comment->delete();

            // Update post comment count directly in database if post exists
            if ($postId) {
                Post::query()
                    ->where('id', $postId)
                    ->update([
                        'comments' => Comment::query()
                            ->where('post_id', $postId)
                            ->count()
                    ]);
            }

            return response()->json(['message' => 'Comment deleted successfully']);
        } catch (\Throwable $e) {
            Log::error('Failed to delete comment', [
                'error' => $e->getMessage(),
                'comment_id' => $comment->id,
            ]);

            return response()->json(['message' => 'Failed to delete comment'], 500);
        }
    }

}
