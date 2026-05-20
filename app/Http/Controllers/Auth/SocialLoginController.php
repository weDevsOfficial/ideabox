<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Unable to authenticate with Google. Please try again.');
        }

        // Check if user exists with this Google ID
        $user = User::query()->where('google_id', $googleUser->getId())->first();

        if ($user) {
            // Ensure email is verified for existing Google users
            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            Auth::login($user, true);

            return redirect()->intended('/');
        }

        // Check if user exists with this email
        $user = User::query()->where('email', $googleUser->getEmail())->first();

        if ($user) {
            // Link Google account to existing user and mark email as verified
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);

            Auth::login($user, true);

            return redirect()->intended('/');
        }

        // Create new user with email already verified (Google verified it)
        // The Registered event listener checks hasVerifiedEmail() before sending
        $user = User::query()->create([
            'name' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'avatar_url' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
            'role' => User::ROLE_USER,
        ]);

        event(new Registered($user));

        Auth::login($user, true);

        return redirect()->intended('/');
    }
}
