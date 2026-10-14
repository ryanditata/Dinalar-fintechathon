import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n/LanguageContext';
import { Form } from '@inertiajs/react';
import { useRef } from 'react';

export default function DeleteUser() {
    const { t } = useTranslation();
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <HeadingSmall
                title={t('settings.delete_account_title', 'Hapus Akun')}
                description={t('settings.delete_account_desc', 'Hapus akun Anda beserta seluruh data dan riwayatnya secara permanen')}
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">{t('settings.warning_title', 'Peringatan')}</p>
                    <p className="text-sm">{t('settings.warning_desc', 'Harap berhati-hati, tindakan ini tidak dapat dibatalkan.')}</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="cursor-pointer">{t('profile.delete_account', 'Hapus Akun')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>{t('profile.delete_confirm_title', 'Apakah Anda yakin ingin menghapus akun?')}</DialogTitle>
                        <DialogDescription>
                            {t('profile.delete_confirm_desc', 'Setelah akun dihapus, seluruh data dan riwayat optimasi akan dihapus secara permanen. Masukkan kata sandi Anda untuk konfirmasi.')}
                        </DialogDescription>

                        <Form
                            method="delete"
                            action={route('profile.destroy')}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="sr-only">
                                            {t('profile.password_title', 'Kata Sandi')}
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder={t('profile.enter_password_placeholder', 'Kata sandi akun Anda')}
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="secondary" onClick={() => resetAndClearErrors()} className="cursor-pointer">
                                                {t('common.cancel', 'Batal')}
                                            </Button>
                                        </DialogClose>

                                        <Button variant="destructive" disabled={processing} asChild className="cursor-pointer">
                                            <button type="submit">{t('profile.delete_account', 'Hapus Akun')}</button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
