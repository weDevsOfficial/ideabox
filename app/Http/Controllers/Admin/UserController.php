<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Notifications\NewAccountNotification;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $users = User::admin()
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            })
            ->get()
            ->makeVisible('email');

        return inertia('Admin/User/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:' . User::ROLE_ADMIN . ',' . User::ROLE_USER,
        ]);

        $password = $request->password ?? Str::random(16);
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($password),
            'role'     => $request->role,
        ]);

        if ($request->wantsJson()) {
            return response()->json($user);
        }

        if (!$request->filled('password')) {
            $user->notify(new NewAccountNotification($password));
            return redirect()->route('admin.users.index')->with('success', 'User added successfully. Password has been sent via email.');
        }

        return redirect()->route('admin.users.index')->with('success', 'User added successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->posts()->exists()) {
            return redirect()->route('admin.users.index')->with('error', 'User has created feedbacks, you can\'t delete the user..');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function allUsers(Request $request)
    {
        $search = $request->input('search', '');

        $users = User::where('role', User::ROLE_USER)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            })
            ->get()
            ->makeVisible('email');

        return inertia('Admin/User/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string',
            'role' => 'sometimes|required|in:' . User::ROLE_ADMIN . ',' . User::ROLE_USER,
            'password' => 'sometimes|nullable|min:8',
        ]);

        $userData = [
            'name' => $request->name,
        ];

        if ($request->has('role')) {
            $userData['role'] = $request->role;
        }

        if ($request->filled('password')) {
            $userData['password'] = bcrypt($request->password);
        }

        $user->update($userData);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }
}
