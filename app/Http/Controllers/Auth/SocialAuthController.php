<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            if (!$googleUser || !$googleUser->getEmail()) {
                return redirect()->route('login')->with('error', 'Gagal mendapatkan data akun Google. Pastikan email Google Anda valid.');
            }

            // 1. Cari berdasarkan google_id
            $user = User::where('google_id', $googleUser->getId())->first();

            // 2. Jika tidak ditemukan, cari berdasarkan email (account linking)
            if (!$user) {
                $user = User::where('email', $googleUser->getEmail())->first();

                if ($user) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar() ?? $user->avatar,
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ]);
                }
            }

            // 3. Jika user belum terdaftar sama sekali, buat user baru
            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName() ?? $googleUser->getNickname() ?? 'Google User',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'role' => 'user',
                    'email_verified_at' => now(),
                    'password' => null,
                    'last_seen_at' => now(),
                ]);
            } else {
                $user->update([
                    'last_seen_at' => now(),
                ]);
            }

            // 4. Autentikasi user & regenerasi session
            Auth::login($user, remember: true);
            $request->session()->regenerate();

            // 5. Redirect ke dashboard sesuai role
            if ($user->isAdmin()) {
                return redirect()->intended(route('admin.dashboard', absolute: false))->with('success', 'Berhasil masuk dengan Google!');
            }

            return redirect()->intended(route('user.dashboard', absolute: false))->with('success', 'Berhasil masuk dengan Google!');
        } catch (\Throwable $e) {
            Log::error('Google OAuth Error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return redirect()->route('login')->with('error', 'Gagal masuk dengan Google. Silakan coba lagi.');
        }
    }
}
