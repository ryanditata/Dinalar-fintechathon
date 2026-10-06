<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $searchTerm = trim($request->search);
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'online') {
                $query->where('last_seen_at', '>=', now()->subMinutes(5));
            } elseif ($request->status === 'offline') {
                $query->where(function($q) {
                    $q->whereNull('last_seen_at')
                      ->orWhere('last_seen_at', '<', now()->subMinutes(5));
                });
            }
        }

        $users = $query->withCount('portfolioOptimizations')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $statistics = [
            'total_users' => User::count(),
            'online_users_count' => User::where('last_seen_at', '>=', now()->subMinutes(5))->count(),
            'admin_count' => User::where('role', 'admin')->count(),
            'user_role_count' => User::where('role', 'user')->count(),
            'new_users_7d' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return Inertia::render('admin/users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
            'statistics' => $statistics,
        ]);
    }

    /**
     * Update the role of the specified user.
     */
    public function updateRole(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            abort(403, 'You cannot change your own role.');
        }

        $validated = $request->validate([
            'role' => ['required', 'in:admin,user'],
        ]);

        $user->update(['role' => $validated['role']]);

        return redirect()->back()->with('success', 'User role updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            abort(403, 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', \Illuminate\Validation\Rules\Password::defaults()],
            'role' => 'required|in:admin,user',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }
}
