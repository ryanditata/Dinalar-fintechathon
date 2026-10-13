import InputError from '@/components/input-error';
import { useTranslation } from '@/i18n/LanguageContext';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

interface MobileResetPasswordProps {
    token: string;
    email: string;
}

export default function MobileResetPassword({ token, email }: MobileResetPasswordProps) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const hasMinLength = data.password.length >= 8;
    const isMatched = data.password && data.password === data.password_confirmation;

    return (
        <MobileAuthLayout
            title={t('auth.reset_title', 'Atur Ulang Kata Sandi')}
            subtitle={t('auth.reset_subtitle', 'Buat kata sandi baru yang kuat dan aman untuk akun Dinalar Anda.')}
            backHref={route('login')}
        >
            <div className="space-y-4">
                {/* Visual Icon */}
                <div className="flex justify-center py-1">
                    <div className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <ShieldCheck className="size-7 stroke-[1.75]" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Email Read-Only */}
                    <div className="space-y-1">
                        <label
                            htmlFor="email"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            {t('auth.email_label', 'Alamat Email')}
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                readOnly
                                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-600 cursor-not-allowed font-sans select-none"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Baru */}
                    <div className="space-y-1">
                        <label
                            htmlFor="password"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            {t('auth.new_password_label', 'Kata Sandi Baru')}
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={t('auth.min_8_chars_placeholder', 'Minimal 8 karakter')}
                                autoComplete="new-password"
                                autoFocus
                                required
                                className="w-full h-11 px-3.5 pl-10 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all cursor-pointer"
                                aria-label={showPassword ? t('auth.hide_password', 'Sembunyikan kata sandi') : t('auth.show_password', 'Tampilkan kata sandi')}
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
                                    {t('auth.min_8_chars_checklist', 'Minimal 8 karakter')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Konfirmasi Password Baru */}
                    <div className="space-y-1">
                        <label
                            htmlFor="password_confirmation"
                            className="text-[12px] font-medium text-zinc-700 block"
                        >
                            {t('auth.confirm_new_password_label', 'Konfirmasi Kata Sandi Baru')}
                        </label>
                        <div className="relative">
                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder={t('auth.confirm_new_password_placeholder', 'Ulangi kata sandi baru')}
                                autoComplete="new-password"
                                required
                                className="w-full h-11 px-3.5 pl-10 pr-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all cursor-pointer"
                                aria-label={showConfirmPassword ? t('auth.hide_password', 'Sembunyikan kata sandi') : t('auth.show_password', 'Tampilkan kata sandi')}
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
                                    {isMatched
                                        ? t('auth.passwords_match', 'Kata sandi cocok')
                                        : t('auth.passwords_mismatch', 'Kata sandi belum cocok')}
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
                                    <span>{t('auth.saving_new_password', 'Menyimpan Kata Sandi...')}</span>
                                </>
                            ) : (
                                <span>{t('auth.save_new_password_btn', 'Simpan Kata Sandi Baru')}</span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-100">
                    {t('auth.cancel_reset_prompt', 'Batal mereset?')}{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 active:underline"
                    >
                        {t('auth.back_to_login', 'Kembali Masuk')}
                    </Link>
                </div>
            </div>
        </MobileAuthLayout>
    );
}
