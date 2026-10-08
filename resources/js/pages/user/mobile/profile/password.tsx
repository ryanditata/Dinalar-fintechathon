import InputError from '@/components/input-error';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function MobilePasswordPage() {
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const passwordInput = useRef<HTMLInputElement>(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        data,
        setData,
        put,
        errors,
        processing,
        reset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                toast.success('Kata sandi berhasil diperbarui.');
            },
            onError: (err) => {
                if (err.current_password) {
                    currentPasswordInput.current?.focus();
                } else if (err.password) {
                    passwordInput.current?.focus();
                }
                toast.error('Gagal memperbarui kata sandi. Periksa kembali isian Anda.');
            },
        });
    };

    const hasMinLength = data.password.length >= 8;
    const isMatched = data.password && data.password === data.password_confirmation;

    return (
        <MobileAppLayout hideBottomNav>
            <Head title="Ganti Kata Sandi" />

            {/* Top Navigation Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                <Link
                    href="/user/profile"
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    aria-label="Kembali ke profil"
                >
                    <ArrowLeft className="size-5 stroke-[2]" />
                </Link>
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight text-center flex-1">
                    Password
                </h1>
                <div className="size-10" aria-hidden="true" />
            </header>

            <div className="space-y-3.5 pt-1 px-3 pb-8">

                {/* 2. Form Ganti Kata Sandi */}
                <section className="rounded-[24px] bg-white p-4.5 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                        <KeyRound className="size-4 text-emerald-600" />
                        <h3 className="text-[15px] font-semibold text-zinc-900">
                            Update Password
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Kata Sandi Saat Ini */}
                        <div className="space-y-1">
                            <label
                                htmlFor="current_password"
                                className="text-[12px] font-medium text-zinc-600 block"
                            >
                                Kata Sandi Saat Ini
                            </label>
                            <div className="relative">
                                <input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    placeholder="Masukkan kata sandi saat ini"
                                    autoComplete="current-password"
                                    className="w-full h-11 px-3.5 pr-11 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
                                    aria-label={showCurrentPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.current_password} />
                        </div>

                        {/* Kata Sandi Baru */}
                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="text-[12px] font-medium text-zinc-600 block"
                            >
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    ref={passwordInput}
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    autoComplete="new-password"
                                    className="w-full h-11 px-3.5 pr-11 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
                                    aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} />

                            {/* Checklist Indikator Panjang */}
                            {data.password.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <div
                                        className={`size-3.5 rounded-full flex items-center justify-center ${
                                            hasMinLength
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-zinc-200 text-zinc-400'
                                        }`}
                                    >
                                        <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                    <span
                                        className={`text-[11px] ${
                                            hasMinLength ? 'text-emerald-700 font-medium' : 'text-zinc-500'
                                        }`}
                                    >
                                        Minimal 8 karakter
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Konfirmasi Kata Sandi Baru */}
                        <div className="space-y-1">
                            <label
                                htmlFor="password_confirmation"
                                className="text-[12px] font-medium text-zinc-600 block"
                            >
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    autoComplete="new-password"
                                    className="w-full h-11 px-3.5 pr-11 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
                                    aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} />

                            {/* Status Kesesuaian */}
                            {data.password_confirmation.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <div
                                        className={`size-3.5 rounded-full flex items-center justify-center ${
                                            isMatched
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-rose-500 text-white'
                                        }`}
                                    >
                                        <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                    <span
                                        className={`text-[11px] ${
                                            isMatched
                                                ? 'text-emerald-700 font-medium'
                                                : 'text-rose-600 font-medium'
                                        }`}
                                    >
                                        {isMatched ? 'Kata sandi cocok' : 'Kata sandi belum cocok'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <span>Update</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </MobileAppLayout>
    );
}
