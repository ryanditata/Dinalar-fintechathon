<?php

namespace App\Services;

use Illuminate\Http\Request;

class DeviceViewResolver
{
    /**
     * Menentukan apakah request berasal dari perangkat mobile / aplikasi.
     */
    public static function isMobile(?Request $request = null): bool
    {
        $request = $request ?: request();

        // 1. Cek query parameter override (misal untuk testing di desktop: ?device=mobile)
        if ($request->has('device')) {
            $deviceParam = strtolower((string) $request->query('device'));
            if ($deviceParam === 'mobile') {
                return true;
            }
            if ($deviceParam === 'desktop') {
                return false;
            }
        }

        // 2. Cek Header Capacitor / Hybrid App
        if ($request->hasHeader('X-Capacitor') || $request->hasHeader('X-Mobile-App')) {
            return true;
        }

        // 3. Cek User-Agent browser smartphone
        $userAgent = $request->header('User-Agent', '');
        return (bool) preg_match(
            '/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos|iphone|ipad|ipod)/i',
            $userAgent
        );
    }

    /**
     * Menyelesaikan view Inertia yang tepat.
     * Jika request adalah mobile dan file tampilan mobile tersedia di resources/js/pages/user/mobile/,
     * maka otomatis dialihkan ke view mobile tersebut.
     * Jika belum tersedia atau dibuka dari desktop, tetap menggunakan view desktop bawaan.
     */
    public static function resolve(string $view, ?Request $request = null): string
    {
        $request = $request ?: request();

        if (self::isMobile($request)) {
            // Contoh konversi: 'user/dashboard/index' -> 'user/mobile/dashboard/index'
            if (str_starts_with($view, 'user/')) {
                $mobileView = 'user/mobile/' . substr($view, 5);
                $mobileFilePath = resource_path("js/pages/{$mobileView}.tsx");

                if (file_exists($mobileFilePath)) {
                    return $mobileView;
                }
            }

            if ($view === 'settings/profile') {
                $mobileView = 'user/mobile/profile/edit';
                $mobileFilePath = resource_path("js/pages/{$mobileView}.tsx");

                if (file_exists($mobileFilePath)) {
                    return $mobileView;
                }
            }

            if ($view === 'settings/password') {
                $mobileView = 'user/mobile/profile/password';
                $mobileFilePath = resource_path("js/pages/{$mobileView}.tsx");

                if (file_exists($mobileFilePath)) {
                    return $mobileView;
                }
            }
        }

        return $view;
    }
}
