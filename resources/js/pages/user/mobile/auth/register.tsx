import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import InputError from '@/components/input-error';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Check, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';

export default function MobileRegister() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const hasMinLength = data.password.length >= 8;
    const isMatched = data.password && data.password === data.password_confirmation;

    return (
        <MobileAuthLayout
            title="Buat Akun Baru"
            subtitle="Mulai rancang dan optimalkan portofolio investasi saham Anda dengan mudah."
            backHref={route('login')}
        >
            <div className="space-y-4">
                {/* 1. Quick Google OAuth Button */}
                <GoogleAuthButton
                    text="Daftar dengan Google"
                    className="!h-11 !rounded-full !border-zinc-200 !bg-zinc-50 hover:!bg-zinc-100 !text-zinc-800 hover:!text-zinc-900 !text-xs font-semibold !shadow-2xs active:scale-[0.98]"
                />

                {/* 2. Visual Divider */}
                <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-zinc-400 font-medium text-[11px] uppercase tracking-wider">
                            Atau daftar dengan email
                        </span>
                    </div>
                </div>

                {/* 3. Form Registrasi */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Input Nama Lengkap */}
                    <div className="space-y-1">
                        <label
                            htmlFor="name"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            Nama Lengkap
                        </label>
                        <div className="relative">
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Ryan Pratama"
                                autoComplete="name"
                                autoFocus
                                required
                                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1">
                        <label
                            htmlFor="email"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            Alamat Email
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nama@email.com"
                                autoComplete="email"
                                required
                                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Input Kata Sandi */}
                    <div className="space-y-1">
                        <label
                            htmlFor="password"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                autoComplete="new-password"
                                required
                                className="w-full h-11 px-3.5 pl-10 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all cursor-pointer"
                                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} />

                        {/* Checklist Karakter */}
                        {data.password.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <div
                                    className={`size-3.5 rounded-full flex items-center justify-center transition-colors ${
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

                    {/* Input Konfirmasi Kata Sandi */}
                    <div className="space-y-1">
                        <label
                            htmlFor="password_confirmation"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            Konfirmasi Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Ulangi kata sandi"
                                autoComplete="new-password"
                                required
                                className="w-full h-11 px-3.5 pl-10 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all cursor-pointer"
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
                                    className={`size-3.5 rounded-full flex items-center justify-center transition-colors ${
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
                            className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Membuat Akun...</span>
                                </>
                            ) : (
                                <span>Daftar Akun Baru</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Switch to Login */}
                <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-100">
                    Sudah memiliki akun?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 active:underline"
                    >
                        Masuk di Sini
                    </Link>
                </div>
            </div>
        </MobileAuthLayout>
    );
}
