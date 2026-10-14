import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ConfirmPassword() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.confirm_title', 'Konfirmasi Kata Sandi')}
            description={t('auth.confirm_subtitle', 'Ini adalah area sensitif aplikasi. Harap masukkan kata sandi akun Anda untuk melanjutkan.')}
        >
            <Head title={t('auth.confirm_title', 'Konfirmasi Kata Sandi')} />

            <Form method="post" action={route('password.confirm')} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('auth.password_label', 'Kata Sandi')}</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                placeholder={t('auth.confirm_password_input_placeholder', 'Masukkan kata sandi akun')}
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {processing
                                    ? t('auth.confirming', 'Mengonfirmasi...')
                                    : t('auth.confirm_continue_btn', 'Konfirmasi & Lanjutkan')}
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
