import InputError from '@/components/input-error';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

export default function MobileConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <MobileAuthLayout
            title="Konfirmasi Kata Sandi"
            subtitle="Ini adalah area sensitif aplikasi. Harap masukkan kata sandi akun Anda untuk melanjutkan."
        >
            <div className="space-y-4">
                {/* Visual Icon */}
                <div className="flex justify-center py-2">
                    <div className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <ShieldCheck className="size-7 stroke-[1.75]" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="Masukkan kata sandi akun"
                                autoComplete="current-password"
                                autoFocus
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Mengonfirmasi...</span>
                            </>
                        ) : (
                            <span>Konfirmasi & Lanjutkan</span>
                        )}
                    </button>
                </form>
            </div>
        </MobileAuthLayout>
    );
}
