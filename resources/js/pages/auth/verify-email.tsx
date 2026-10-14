import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.verify_title', 'Verifikasi Email')}
            description={t('auth.verify_subtitle', 'Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.')}
        >
            <Head title={t('auth.verify_title', 'Verifikasi Email')} />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t('auth.verification_link_sent', 'Tautan verifikasi baru berhasil dikirimkan ke alamat email yang Anda daftarkan.')}
                </div>
            )}

            <Form method="post" action={route('verification.send')} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {processing
                                ? t('auth.resending_verification', 'Mengirim Ulang...')
                                : t('auth.resend_verification_btn', 'Kirim Ulang Email Verifikasi')}
                        </Button>

                        <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                            {t('auth.logout_btn', 'Keluar dari Akun (Log Out)')}
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
