import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();

    return (
        <AuthLayout title={t('auth.login_title', 'Selamat Datang')} description={t('auth.login_subtitle', 'Masuk ke akun Anda untuk memantau dan mengoptimalkan portofolio saham.')}>
            <Head title={t('nav.login', 'Masuk')} />

            <div className="flex flex-col gap-6">
                {/* 1. Quick Google OAuth Button */}
                <GoogleAuthButton text={t('auth.google_login', 'Masuk dengan Google')} />

                {/* 2. Visual Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2.5 text-muted-foreground font-medium text-[11px] tracking-wider">
                            {t('auth.continue_with_email', 'Atau lanjutkan dengan email')}
                        </span>
                    </div>
                </div>

                {/* 3. Standard Email & Password Form */}
                <Form method="post" action={route('login')} resetOnSuccess={['password']} className="flex flex-col gap-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">{t('auth.email_label', 'Alamat Email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder={t('auth.email_placeholder', 'nama@email.com')}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">{t('auth.password_label', 'Kata Sandi')}</Label>
                                        {canResetPassword && (
                                            <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                                {t('auth.forgot_password', 'Lupa kata sandi?')}
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder={t('auth.password_placeholder', 'Masukkan kata sandi')}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox id="remember" name="remember" tabIndex={3} className="hover:cursor-pointer"/>
                                    <Label htmlFor="remember" className="cursor-pointer">{t('auth.remember_me', 'Ingat saya di perangkat ini')}</Label>
                                </div>

                                <Button type="submit" className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" tabIndex={4} disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? t('auth.signing_in', 'Memproses...') : t('auth.sign_in_btn', 'Masuk ke Akun')}
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                {t('auth.no_account_prompt', 'Belum memiliki akun?')}{' '}
                                <TextLink href={route('register')} tabIndex={5}>
                                    {t('auth.register_now', 'Daftar Sekarang')}
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
