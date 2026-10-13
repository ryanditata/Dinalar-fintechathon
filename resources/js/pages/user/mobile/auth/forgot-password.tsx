import InputError from '@/components/input-error';
import { useTranslation } from '@/i18n/LanguageContext';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import React from 'react';

interface MobileForgotPasswordProps {
    status?: string;
}

export default function MobileForgotPassword({ status }: MobileForgotPasswordProps) {
    const { language, t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email', { lang: language }));
    };

    return (
        <MobileAuthLayout
            title={t('auth.forgot_title', 'Lupa Kata Sandi?')}
            subtitle={t('auth.forgot_subtitle', 'Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.')}
            backHref={route('login')}
            status={status}
        >
            <div className="space-y-4">
                {/* Visual Icon Header */}
                <div className="flex justify-center py-2">
                    <div className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <KeyRound className="size-7 stroke-[1.75]" />
                    </div>
                </div>

                {/* Form Kirim Reset Password */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder={t('auth.email_placeholder', 'nama@email.com')}
                                autoComplete="email"
                                autoFocus
                                required
                                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                        </div>
                        <InputError message={errors.email} />
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
                                <span>{t('auth.sending_link', 'Mengirim Tautan...')}</span>
                            </>
                        ) : (
                            <span>{t('auth.send_reset_link_btn', 'Kirim Tautan Pemulihan')}</span>
                        )}
                    </button>
                </form>

                {/* Return to Login */}
                <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-100">
                    {t('auth.remember_password_prompt', 'Ingat kata sandi Anda?')}{' '}
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
