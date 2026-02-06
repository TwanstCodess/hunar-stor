<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query();

        // گەڕان
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // فلتەری ڕۆڵ
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->search,
                'role' => $request->role ?? 'all',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,user',
        ], [
            'name.required' => 'ناو پێویستە',
            'name.max' => 'ناو زۆر درێژە',
            'email.required' => 'ئیمەیڵ پێویستە',
            'email.email' => 'فۆرماتی ئیمەیڵ هەڵەیە',
            'email.unique' => 'ئەم ئیمەیڵە پێشتر بەکارهاتووە',
            'password.required' => 'وشەی نهێنی پێویستە',
            'password.min' => 'وشەی نهێنی لانیکەم دەبێت ٨ پیت بێت',
            'password.confirmed' => 'دووبارەکردنەوەی وشەی نهێنی هاوتا نییە',
            'role.required' => 'ڕۆڵ پێویستە',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->route('users.index')
            ->with('success', 'بەکارهێنەر بە سەرکەوتوویی زیادکرا');
    }

    public function edit(User $user): Response
    {
        // هەژماری خۆی لە ڕۆڵی ئەدمین دەربێنێت
        $canChangeRole = auth()->user()->isAdmin() && auth()->id() !== $user->id;

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'canChangeRole' => $canChangeRole,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|in:admin,user',
        ], [
            'name.required' => 'ناو پێویستە',
            'email.required' => 'ئیمەیڵ پێویستە',
            'email.unique' => 'ئەم ئیمەیڵە پێشتر بەکارهاتووە',
            'password.min' => 'وشەی نهێنی لانیکەم دەبێت ٨ پیت بێت',
            'password.confirmed' => 'دووبارەکردنەوەی وشەی نهێنی هاوتا نییە',
        ]);

        // ڕێگە مەدە بەکارهێنەر ڕۆڵی خۆی بگۆڕێت
        if ($user->id === auth()->id()) {
            unset($validated['role']);
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (isset($validated['role'])) {
            $data['role'] = $validated['role'];
        }

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->route('users.index')
            ->with('success', 'بەکارهێنەر بە سەرکەوتوویی نوێکرایەوە');
    }

    public function destroy(User $user)
    {
        // ڕێگە مەدە بەکارهێنەر خۆی بسڕێتەوە
        if ($user->id === auth()->id()) {
            return back()->with('error', 'ناتوانیت هەژماری خۆت بسڕیتەوە');
        }

        // پشکنینی بەستەرەکان
        $hasRelations = $user->sales()->exists()
                     || $user->purchases()->exists()
                     || $user->payments()->exists()
                     || $user->expenses()->exists();

        if ($hasRelations) {
            return back()->with('error', 'ناتوانرێت ئەم بەکارهێنەرە بسڕدرێتەوە چونکە پەیوەندی بە کردارەکانەوە هەیە');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'بەکارهێنەر بە سەرکەوتوویی سڕایەوە');
    }
}
