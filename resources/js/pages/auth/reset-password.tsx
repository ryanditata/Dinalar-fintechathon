import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.reset_title', 'Atur Ulang Kata Sandi')} description={t('auth.reset_subtitle', 'Buat kata sandi baru yang kuat dan aman untuk akun Dinalar Anda.')}>
            <Head title={t('auth.reset_title', 'Atur Ulang Kata Sandi')} />

            <Form
                method="post"
                action={route('password.store')}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('auth.email_label', 'Alamat Email')}</Label>
                            <Input id="email" type="email" name="email" autoComplete="email" value={email} className="mt-1 block w-full" readOnly />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('auth.new_password_label', 'Kata Sandi Baru')}</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder={t('profile.new_password_placeholder', 'Minimal 8 karakter')}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">{t('auth.confirm_new_password_label', 'Konfirmasi Kata Sandi Baru')}</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder={t('auth.confirm_new_password_placeholder', 'Ulangi kata sandi baru')}
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </div>

                        <Button type="submit" className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {processing ? t('auth.saving_new_password', 'Menyimpan Kata Sandi...') : t('auth.save_new_password_btn', 'Simpan Kata Sandi Baru')}
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
