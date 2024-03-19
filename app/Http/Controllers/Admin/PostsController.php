<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PostsController extends Controller
{
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
            'title' => $request->title,
            'body' => $request->body,
            'status_id' => $request->status_id,
            'board_id' => $request->board_id,
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
}
