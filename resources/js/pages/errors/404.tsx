import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import React from 'react';

export default function NotFoundPage({ status = 404 }: { status?: number }) {
    const { auth } = (usePage().props as any) || {};
    const homeUrl = auth?.user ? (auth.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard') : '/';

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = homeUrl;
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/20 dark:bg-background/95 p-4 sm:p-6 relative overflow-hidden select-none">
            {/* Background Decorative Glow Orbs */}
            <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl" />

            {/* Main Center Card */}
            <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-xl p-8 sm:p-10 text-center relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                {/* Logo & Brand Header */}
                <div className="flex items-center justify-center mb-6">
                    <img
                        src="/images/newLogo.png?v=3"
                        alt="Dinalar Logo"
                        className="h-14 w-auto object-contain"
                    />
                </div>

                {/* Primary Message */}
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2">
                    Halaman tidak ditemukan di <span className="text-emerald-600 dark:text-emerald-400">Dinalar</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
                    Silakan kembali untuk mengakses layanan dan fitur analisis portofolio saham dari platform Dinalar!
                </p>

                {/* Stylized 404 Display */}
                <div className="my-2 flex flex-col items-center">
                    <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-emerald-600 dark:text-emerald-500 drop-shadow-xs">
                        {status}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 tracking-wide">
                        Halaman tidak dapat ditemukan
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex items-center w-full justify-center">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali ke Halaman Sebelumnya</span>
                    </button>
                </div>
            </div>

            {/* Copyright Footer */}
            <div className="mt-8 text-center text-[11px] sm:text-xs text-muted-foreground font-mono">
                &copy; {new Date().getFullYear()} Dinalar - AI Stock Portfolio Optimization Platform. All Rights Reserved.
            </div>

            <Head title="404 - Halaman Tidak Ditemukan" />
        </div>
    );
}
