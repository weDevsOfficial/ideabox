<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // index function
    public function index(Request $request, Post $post)
    {
        $sort = $request->has('sort') && in_array($request->sort, ['latest', 'oldest']) ? $request->sort : 'latest';
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
                    $comment->children = $children;
                    $result[] = $comment;
                }
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
            'body' => $request->body,
            'user_id' => auth()->user()->id,
            'parent_id' => $parentId === 0 ? null : $parentId,
        ]);

        $comment->load('user');
        $comment->children = [];

        return response()->json($comment);
    }
}
