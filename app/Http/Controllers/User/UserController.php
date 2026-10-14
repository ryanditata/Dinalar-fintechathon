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
        // 1. Jika dibuka dari APLIKASI TER-INSTALL (Capacitor / Android APK / iOS App):
        // Langsung arahkan ke alur aplikasi tanpa menampilkan landing page
        if (DeviceViewResolver::isNativeApp($request)) {
            if ($request->user()) {
                return redirect()->route('dashboard');
            }
            return redirect()->route('login');
        }

        // 2. Jika dibuka dari BROWSER (Safari di iPhone, Chrome di Android, Laptop/PC):
        // Tampilkan Landing Page promosi dan informasi platform
        return Inertia::render('user/landingPage', [
        ]);
    }
}
