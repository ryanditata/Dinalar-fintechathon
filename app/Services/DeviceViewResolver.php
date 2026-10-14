<?php

namespace App\Services;

use Illuminate\Http\Request;

class DeviceViewResolver
{
    /**
     * Menentukan apakah request berasal dari Aplikasi Native/Hybrid ter-install
     * (Capacitor, Android APK WebView, iOS Native App, atau PWA Standalone).
     * Bukan sekadar pengunjung biasa yang membuka website dari browser Safari/Chrome.
     */
    public static function isNativeApp(?Request $request = null): bool
    {
        $request = $request ?: request();

        // 1. Cek parameter override aplikasi (misal: ?app=true atau ?source=app)
        if ($request->has('app') && in_array(strtolower((string) $request->query('app')), ['true', '1', 'yes'], true)) {
            return true;
        }
        if ($request->query('source') === 'app' || $request->query('device') === 'app') {
            return true;
        }

        // 2. Cek Header Khusus Capacitor / Hybrid Mobile App
        if ($request->hasHeader('X-Capacitor') || $request->hasHeader('X-Mobile-App') || $request->hasHeader('X-Native-App')) {
            return true;
        }

        // 3. Cek Header Android WebView (secara default Android WebView mengirimkan package ID)
        if ($request->hasHeader('X-Requested-With')) {
            $requestedWith = (string) $request->header('X-Requested-With');
            if (!in_array(strtolower($requestedWith), ['xmlhttprequest', 'com.android.browser'], true)) {
                return true;
            }
        }

        // 4. Cek User-Agent spesifik WebView / Capacitor
        $userAgent = $request->header('User-Agent', '');
        if (str_contains($userAgent, '; wv)') || str_contains($userAgent, 'Capacitor')) {
            return true;
        }

        return false;
    }

    /**
     * Menentukan apakah request berasal dari perangkat mobile / aplikasi.
     */
    public static function isMobile(?Request $request = null): bool
    {
        $request = $request ?: request();

        // 1. Cek query parameter override (misal untuk testing di desktop: ?device=mobile)
        if ($request->has('device')) {
            $deviceParam = strtolower((string) $request->query('device'));
            if ($deviceParam === 'mobile' || $deviceParam === 'app') {
                return true;
            }
            if ($deviceParam === 'desktop') {
                return false;
            }
        }

        // 2. Jika merupakan Native App, otomatis mobile
        if (self::isNativeApp($request)) {
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

            if (str_starts_with($view, 'auth/')) {
                $mobileView = 'user/mobile/auth/' . substr($view, 5);
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
