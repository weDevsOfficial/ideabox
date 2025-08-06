<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\Board;
use App\Models\Status;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class HomeController extends Controller
{
    public function index()
    {
        $boards = Board::withOpenPostsCount();

        $statuses = Status::select('id', 'name', 'color')
            ->inRoadmap()
            ->get();

        $posts = Post::whereIn('status_id', $statuses->pluck('id'))
            ->withVote()
            ->get();

        $data = [
            'boards' => $boards,
            'roadmaps' => $statuses,
            'posts' => $posts,
        ];

        return inertia('Frontend/Home', $data);
    }
}
