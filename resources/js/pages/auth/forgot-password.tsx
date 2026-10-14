// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.forgot_title', 'Lupa Kata Sandi?')} description={t('auth.forgot_subtitle', 'Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.')}>
            <Head title={t('auth.forgot_title', 'Lupa Kata Sandi?')} />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
            <div className="space-y-6">
                <Form method="post" action={route('password.email')}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email_label', 'Alamat Email')}</Label>
                                <Input id="email" type="email" name="email" autoComplete="off" autoFocus placeholder={t('auth.email_placeholder', 'nama@email.com')} />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? t('auth.sending_link', 'Mengirim Tautan...') : t('auth.send_reset_link_btn', 'Kirim Tautan Pemulihan')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>{t('auth.remember_password_prompt', 'Ingat kata sandi Anda?')}</span>{' '}
                    <TextLink href={route('login')}>{t('auth.back_to_login', 'Kembali Masuk')}</TextLink>
                </div>
            </div>
          
        </AuthLayout>
    );
}
