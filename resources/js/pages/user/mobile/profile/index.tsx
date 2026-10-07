import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronRight,
    HelpCircle,
    Info,
    KeyRound,
    LogOut,
    Mail,
    Shield,
    Sparkles,
    User as UserIcon,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ProfileProps {
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function MobileProfilePage({ mustVerifyEmail, status }: ProfileProps) {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;
    const user = auth.user;

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        router.patch(
            '/settings/profile',
            { name, email },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Informasi profil berhasil diperbarui.');
                },
                onError: () => {
                    toast.error('Gagal memperbarui profil.');
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <MobileAppLayout title="Profil Akun | Dinalar Mobile">
            {/* Top Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user/dashboard"
                        className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="size-5 stroke-[2]" />
                    </Link>
                    <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight">
                        Akun Saya
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-rose-600 shadow-xs active:scale-95 transition-transform"
                    aria-label="Logout"
                >
                    <LogOut className="size-4 stroke-[2]" />
                </button>
            </header>

            <div className="space-y-3.5 pt-1 pb-16">
                {/* 1. Profile Hero Card */}
                <section className="mx-1 rounded-[24px] bg-white p-5 border border-zinc-200 shadow-xs flex flex-col items-center text-center">
                    {/* Avatar 3D Styling */}
                    <div className="relative size-20 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-rose-500 p-[3px] shadow-sm">
                        <div className="size-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="size-full bg-slate-900 text-white flex items-center justify-center font-bold text-2xl font-sans">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-[18px] font-bold text-zinc-900 mt-3 tracking-tight">
                        {user.name}
                    </h2>
                    <p className="text-[13px] text-zinc-500 mt-0.5">{user.email}</p>

                    <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            INVESTOR MEMBER
                        </span>
                        <span className="text-[11px] font-semibold font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            VERIFIKASI AKTIF
                        </span>
                    </div>
                </section>

                {/* 2. Form Update Profil */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3.5">
                    <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                        Ubah Data Pribadi
                    </h3>

                    <form onSubmit={handleUpdate} className="space-y-3">
                        <div>
                            <label className="text-[12px] font-medium text-zinc-500 block mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-medium text-zinc-500 block mb-1">
                                Alamat Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="w-full h-11 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs"
                        >
                            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </section>

                {/* 3. Menu Pintasan */}
                <section className="mx-1 rounded-[24px] bg-white p-2 border border-zinc-200 shadow-xs divide-y divide-zinc-100">
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
                                    Ganti Kata Sandi
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                    Keamanan akun login
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-zinc-500" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => alert('Dinalar Portfolio Optimizer v2.0 - Fintechathon 2026')}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                                <Info className="size-4 stroke-[1.8]" />
                            </div>
                            <div>
                                <span className="text-[14px] font-medium text-zinc-900 block">
                                    Tentang Dinalar AI
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                    Versi aplikasi 2.0.0
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 text-zinc-500" />
                    </button>
                </section>

                {/* Tombol Logout Merah */}
                <div className="mx-1 pt-2">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <LogOut className="size-4 stroke-[2]" />
                        <span>Keluar dari Akun (Logout)</span>
                    </button>
                </div>
            </div>

            {/* Bottom Nav Floating Pill */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
