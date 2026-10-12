<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\DeviceViewResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (DeviceViewResolver::isMobile($request)) {
            if ($request->user()) {
                return redirect()->route('dashboard');
            }
            return redirect()->route('login');
        }

        return Inertia::render('user/landingPage', [
        ]);
    }
}
