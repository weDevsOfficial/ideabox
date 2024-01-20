<?php

namespace App\Http\Controllers\Admin;

use App\Models\Board;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BoardController extends Controller
{
    public function index()
    {
        $data = [
            'boards' => Board::all(),
        ];

        return inertia('Admin/Boards/Index', $data);
    }

    public function show(Board $board)
    {
        $data = [
            'board' => $board,
        ];

        return inertia('Admin/Boards/Show', $data);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Board::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'privacy' => 'public',
            'allow_posts' => true,
            'order' => Board::count() + 1,
            'settings' => [
                'form' => [
                    'heading' => 'Suggest a feature',
                    'description' => 'What would you like to see in the future?',
                    'button' => 'Feature title',
                    'fields' => [
                        'title' => [
                            'label' => 'Title',
                            'placeholder' => 'Enter a short title',
                        ],
                        'details' => [
                            'label' => 'Details',
                            'placeholder' => 'Enter a detailed description of your feature request',
                        ],
                    ],
                ]
            ],
        ]);

        return redirect()->back()->with('success', 'Board created.');
    }

    public function update(Request $request, Board $board)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'privacy' => 'required|string|in:public,private',
            'allow_posts' => 'required|boolean',
            'settings' => 'required|array',
            'settings.heading' => 'required|string|max:255',
            'settings.description' => 'required|string|max:255',
            'settings.button' => 'required|string|max:50',
            'settings.fields.*.label' => 'required|string|max:100',
            'settings.fields.*.placeholder' => 'required|string|max:100',
        ]);

        $board->update([
            'name' => $request->name,
            'slug' => $request->slug,
            'privacy' => $request->privacy,
            'allow_posts' => $request->allow_posts,
            'settings' => [
                'form' => [
                    'heading' => $request->settings['heading'],
                    'description' => $request->settings['description'],
                    'button' => $request->settings['button'],
                    'fields' => [
                        'title' => [
                            'label' => $request->settings['fields']['title']['label'],
                            'placeholder' => $request->settings['fields']['title']['placeholder'],
                        ],
                        'details' => [
                            'label' => $request->settings['fields']['details']['label'],
                            'placeholder' => $request->settings['fields']['details']['placeholder'],
                        ],
                    ],
                ]
            ],
        ]);

        return redirect()->route('admin.boards.show', $board)->with('success', 'Board updated.');
    }

    public function destroy(Board $board)
    {
        if ($board->posts()->count() > 0) {
            return redirect()->back()->with('error', 'Board has posts. Delete posts first.');
        }

        $board->delete();

        return redirect()->route('admin.boards.index')->with('success', 'Board deleted.');
    }
}
