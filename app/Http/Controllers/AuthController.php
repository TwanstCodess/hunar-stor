<?php
// app/Http/Controllers/AuthController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            $request->session()->regenerate();

            // ڕێنیشاندنی بەکارهێنەر بەپێی ڕۆڵ
            if (Auth::user()->isAdmin()) {
                return Redirect::intended('/dashboard');
            }

            return Redirect::intended('/');
        }

        throw ValidationException::withMessages([
            'email' => 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return Redirect::to('/login');
    }
}
