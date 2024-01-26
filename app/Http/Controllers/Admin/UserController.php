<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Notifications\NewAccountNotification;

class UserController extends Controller
{
    public function index()
    {
        $users = User::admin()->get()->makeVisible('email');

        return inertia('Admin/User/Index', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
        ]);

        $password = Str::random(16);
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($password),
            'role'     => User::ROLE_ADMIN,
        ]);

        $user->notify(new NewAccountNotification($password));

        return redirect()->route('admin.users.index')->with('success', 'User added successfully. Password has been sent via email.');
    }

    public function destroy(User $user)
    {
        if ($user->posts()->exists()) {
            return redirect()->route('admin.users.index')->with('error', 'User has created feedbacks, you can\'t delete the user..');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $user->update([
            'name' => $request->name,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }
}
