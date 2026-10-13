import { useTranslation } from '@/i18n/LanguageContext';
import { MobileAuthLayout } from '@/pages/user/mobile/auth/MobileAuthLayout';
import { Link, useForm } from '@inertiajs/react';
import { Loader2, LogOut, MailCheck } from 'lucide-react';
import React from 'react';

interface MobileVerifyEmailProps {
    status?: string;
}

export default function MobileVerifyEmail({ status }: MobileVerifyEmailProps) {
    const { language, t } = useTranslation();
    const { post, processing } = useForm({});

    const handleResend = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('verification.send', { lang: language }));
    };

    return (
        <MobileAuthLayout
            title={t('auth.verify_title', 'Verifikasi Email')}
            subtitle={t('auth.verify_subtitle', 'Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.')}
            status={
                status === 'verification-link-sent'
                    ? t('auth.verification_link_sent', 'Tautan verifikasi baru berhasil dikirimkan ke alamat email yang Anda daftarkan.')
                    : status
            }
        >
            <div className="space-y-4">
                {/* Visual Icon */}
                <div className="flex justify-center py-2">
                    <div className="size-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <MailCheck className="size-8 stroke-[1.75]" />
                    </div>
                </div>

                {/* Form Kirim Ulang Verifikasi */}
                <form onSubmit={handleResend} className="space-y-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>{t('auth.resending_verification', 'Mengirim Ulang...')}</span>
                            </>
                        ) : (
                            <span>{t('auth.resend_verification_btn', 'Kirim Ulang Email Verifikasi')}</span>
                        )}
                    </button>
                </form>

                {/* Tombol Logout */}
                <div className="pt-2 text-center border-t border-zinc-100">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-rose-600 active:scale-95 transition-colors cursor-pointer py-1"
                    >
                        <LogOut className="size-3.5" />
                        <span>{t('auth.logout_btn', 'Keluar dari Akun (Log Out)')}</span>
                    </Link>
                </div>
            </div>
        </MobileAuthLayout>
    );
}
