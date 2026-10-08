import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    ChevronRight,
    Info,
    KeyRound,
    LogOut,
    User2,
    User as UserIcon,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

export default function MobileProfilePage() {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;
    const user = auth.user;

    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <MobileAppLayout>
            <Head title="Profile" />

            {/* Top Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                <Link
                    href="/user/dashboard"
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    aria-label="Kembali ke dashboard"
                >
                    <ArrowLeft className="size-5 stroke-[2]" />
                </Link>
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight text-center flex-1">
                    Profile
                </h1>
                <div className="size-10" aria-hidden="true" />
            </header>

            <div className="space-y-3.5 pt-1 px-3 pb-20">
                {/* 1. Profile Hero Card */}
                <section className="rounded-[24px] bg-white p-5 border border-zinc-200 shadow-xs flex flex-col items-center text-center">
                    {/* Avatar Hijau Glass */}
                    <div className="relative size-20 rounded-full p-[3px] bg-gradient-to-tr from-emerald-500 via-emerald-200 to-teal-400 shadow-[0_0_22px_rgba(16,185,129,0.28)] flex items-center justify-center">
                        <div className="size-full rounded-full p-[2px] bg-gradient-to-b from-white/95 via-emerald-100 to-emerald-300/90 shadow-inner flex items-center justify-center">
                            <div className="relative size-full rounded-full overflow-hidden bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-emerald-100/60 flex items-center justify-center shadow-inner">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="size-full flex items-center justify-center bg-gradient-to-b from-white/40 to-transparent">
                                        <UserIcon className="size-9 text-emerald-600 stroke-[1.8] drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-[18px] font-bold text-zinc-900 mt-3 tracking-tight flex items-center justify-center gap-1">
                        {user.name}
                        <BadgeCheck className="size-6 fill-emerald-500 text-white shrink-0" />
                    </h2>
                    <p className="text-[13px] text-zinc-500 mt-0.5">{user.email}</p>
                </section>

                {/* 3. Menu Pintasan */}
                <section className="rounded-[24px] bg-white p-2 border border-zinc-200 shadow-xs divide-y divide-zinc-100">
                    <Link
                        href="/settings/profile"
                        className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                                <User2 className="size-4 stroke-[1.8]" />
                            </div>
                            <div>
                                <span className="text-[14px] font-medium text-zinc-900 block">
                                    Account
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                    Account information
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-zinc-500" />
                    </Link>

                    <Link
                        href="/settings/password"
                        className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                                <KeyRound className="size-4 stroke-[1.8]" />
                            </div>
                            <div>
                                <span className="text-[14px] font-medium text-zinc-900 block">
                                    Password
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                    Account security
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-zinc-500" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsAboutModalOpen(true)}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                                <Info className="size-4 stroke-[1.8]" />
                            </div>
                            <div>
                                <span className="text-[14px] font-medium text-zinc-900 block">
                                    About Dinalar
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                    Versi aplikasi 1.0.0
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-zinc-500" />
                    </button>

                    {/* Tombol Logout Merah */}
                    <div className="mx-1 pt-2">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                        >
                            <LogOut className="size-4 stroke-[2]" />
                            <span>Logout</span>
                        </button>
                    </div>
                </section>
            </div>

            {/* Modal Tentang Dinalar */}
            {isAboutModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsAboutModalOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white p-5 border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/newLogo.png?v=4"
                                    alt="Dinalar Logo"
                                    className="h-7 w-auto object-contain"
                                />
                                <span className="text-[11px] font-bold font-mono text-emerald-600">
                                    v1.0.0
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAboutModalOpen(false)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Tutup Modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5 pt-1">
                            <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                                Tentang Dinalar
                            </h3>
                            <p className="text-xs text-zinc-600 leading-relaxed">
                                Dinalar adalah platform optimasi portofolio saham berbasis Artificial Intelligence. Maksimalkan return dan kendalikan risiko saham pilihan Anda.
                            </p>
                        </div>

                        {/* Action Button */}
                        <button
                            type="button"
                            onClick={() => setIsAboutModalOpen(false)}
                            className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Nav Floating Pill */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
