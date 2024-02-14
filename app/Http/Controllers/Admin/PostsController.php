<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PostsController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'body' => 'required',
            'status_id' => 'required|exists:statuses,id',
            'board_id' => 'required|exists:boards,id',
        ]);

        $post = Post::create([
            'title' => $request->title,
            'body' => $request->body,
            'status_id' => $request->status_id,
            'board_id' => $request->board_id,
        ]);

        return redirect()->route('admin.feedbacks.show', $post)->with('success', 'Post created successfully');
    }
}
