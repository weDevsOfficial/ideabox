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
            // Get post before deleting comment to update comment count
            $post = $comment->post;

            // Determine if we need to handle child comments
            $childComments = Comment::where('parent_id', $comment->id)->get();

            if ($childComments->count() > 0) {
                // Option: Set children parent_id to null or reparent to grandparent
                foreach ($childComments as $child) {
                    $child->update(['parent_id' => $comment->parent_id]);
                }
            }

            $comment->delete();

            // Update post comment count
            if ($post) {
                $post->comments = $post->comments()->count();
                $post->save();
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

    /**
     * Get comment statistics for admin dashboard
     */
    public function statistics()
    {
        $today = Comment::whereDate('created_at', today())->count();
        $week = Comment::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $month = Comment::whereMonth('created_at', now()->month)->count();
        $total = Comment::count();

        $recentComments = Comment::with(['user', 'post'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentComments as $comment) {
            $comment->body_excerpt = Formatting::excerpt($comment->body, 100);
        }

        return response()->json([
            'today' => $today,
            'this_week' => $week,
            'this_month' => $month,
            'total' => $total,
            'recent' => $recentComments,
        ]);
    }
}
