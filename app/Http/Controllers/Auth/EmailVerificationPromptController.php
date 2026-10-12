<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\DeviceViewResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $dashboardRoute = $request->user()->isAdmin() ? route('admin.dashboard', absolute: false) : route('user.dashboard', absolute: false);

        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended($dashboardRoute)
                    : Inertia::render(DeviceViewResolver::resolve('auth/verify-email', $request), ['status' => $request->session()->get('status')]);
    }
}
