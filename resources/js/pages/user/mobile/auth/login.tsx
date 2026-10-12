import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import InputError from '@/components/input-error';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';

interface MobileLoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function MobileLogin({ status, canResetPassword = true }: MobileLoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <MobileAuthLayout
            title="Selamat Datang"
            subtitle="Masuk ke akun Anda untuk memantau dan mengoptimalkan portofolio saham."
            status={status}
        >
            <div className="space-y-4">
                {/* 1. Quick Google OAuth Button */}
                <GoogleAuthButton
                    text="Masuk dengan Google"
                    className="!h-11 !rounded-full !border-zinc-200 !bg-zinc-50 hover:!bg-zinc-100 !text-zinc-800 hover:!text-zinc-900 !text-xs font-semibold !shadow-2xs active:scale-[0.98]"
                />

                {/* 2. Visual Divider */}
                <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-zinc-400 font-medium text-[11px] uppercase tracking-wider">
                            Atau lanjutkan dengan email
                        </span>
                    </div>
                </div>

                {/* 3. Form Login */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
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
                                autoFocus
                                required
                                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="text-[12px] font-medium text-zinc-700 block"
                            >
                                Kata Sandi
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 active:underline"
                                >
                                    Lupa kata sandi?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Masukkan kata sandi"
                                autoComplete="current-password"
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
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-2 pt-0.5">
                        <input
                            type="checkbox"
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <label
                            htmlFor="remember"
                            className="text-xs text-zinc-600 select-none cursor-pointer font-medium"
                        >
                            Ingat saya di perangkat ini
                        </label>
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
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Masuk ke Akun</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Switch to Register */}
                <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-100">
                    Belum memiliki akun?{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 active:underline"
                    >
                        Daftar Sekarang
                    </Link>
                </div>
            </div>
        </MobileAuthLayout>
    );
}
