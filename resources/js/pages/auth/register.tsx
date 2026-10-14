import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function Register() {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.register_title', 'Buat Akun Baru')} description={t('auth.register_subtitle', 'Mulai rancang dan optimalkan portofolio investasi saham Anda dengan mudah.')}>
            <Head title={t('nav.register', 'Daftar')} />

            <div className="flex flex-col gap-6">
                {/* 1. Quick Google Registration Button */}
                <GoogleAuthButton text={t('auth.google_register', 'Daftar dengan Google')} />

                {/* 2. Visual Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2.5 text-muted-foreground font-medium text-[11px] tracking-wider">
                            {t('auth.register_with_email', 'Atau daftar dengan email')}
                        </span>
                    </div>
                </div>

                {/* 3. Standard Registration Form */}
                <Form
                    method="post"
                    action={route('register')}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t('auth.fullname_label', 'Nama Lengkap')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        placeholder={t('auth.fullname_placeholder', 'Contoh: Ryan Pratama')}
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">{t('auth.email_label', 'Alamat Email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        name="email"
                                        placeholder={t('auth.email_placeholder', 'nama@email.com')}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">{t('auth.password_label', 'Kata Sandi')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder={t('auth.password_placeholder', 'Masukkan kata sandi')}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">{t('auth.confirm_password_label', 'Konfirmasi Kata Sandi')}</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder={t('auth.confirm_password_placeholder', 'Ulangi kata sandi')}
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <Button type="submit" className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" tabIndex={5} disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? t('auth.registering', 'Membuat Akun...') : t('auth.register_btn', 'Daftar Akun Baru')}
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                {t('auth.have_account_prompt', 'Sudah memiliki akun?')}{' '}
                                <TextLink href={route('login')} tabIndex={6}>
                                    {t('auth.login_here', 'Masuk di Sini')}
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
