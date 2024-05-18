<?php

namespace App\Http\Controllers\Admin;

use App\Models\Status;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Validation\ValidationException;

class StatusController extends Controller
{
    public function index()
    {
        $statuses = Status::orderBy('order')->get();

        return inertia('Admin/Status', [
            'statuses' => $statuses
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:statuses,name',
            'color' => 'required|string',
        ]);

        Status::create([
            'name' => $request->name,
            'color' => $request->color,
            'order' => Status::count() + 1,
        ]);

        return redirect()->back()->with('success', 'Status created.');
    }

    public function update(Request $request)
    {
        $request->validate([
            'statuses' => 'required|array',
            'statuses.*.id' => 'required|integer|exists:statuses,id',
            'statuses.*.name' => 'required|string',
            'statuses.*.color' => 'required|string',
            'statuses.*.in_roadmap' => 'required|boolean',
            'statuses.*.in_frontend' => 'required|boolean',
            'deleted' => 'nullable|array',
            'deleted.*' => 'required|integer|exists:statuses,id',
        ]);

        $inRoadmapCount = collect($request->statuses)->filter(function ($status) {
            return $status['in_roadmap'] === true;
        })->count();

        if ($inRoadmapCount > 3) {
            throw ValidationException::withMessages([
                'statuses' => 'Only 3 statuses can be in the roadmap at a time.',
            ]);
        }

        foreach ($request->statuses as $status) {
            Status::find($status['id'])->update([
                'name' => $status['name'],
                'color' => $status['color'],
                'in_roadmap' => $status['in_roadmap'],
                'in_frontend' => $status['in_frontend'],
            ]);
        }

        Status::destroy($request->deleted);

        return redirect()->back()->with('success', 'Statuses updated.');
    }
}
