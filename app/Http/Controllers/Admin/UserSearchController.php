<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class UserSearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');

        $users = User::where('name', 'LIKE', "%$query%")
                     ->orWhere('email', 'LIKE', "%$query%")
                     ->get()
                     ->take(10)
                     ->makeVisible('email');

        return response()->json($users);
    }
}
