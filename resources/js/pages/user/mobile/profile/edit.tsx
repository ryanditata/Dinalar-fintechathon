import InputError from '@/components/input-error';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    Loader2,
    Sparkles,
    Trash,
    User2,
    UserRoundCheck,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProfileEditProps {
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function MobileProfileEditPage({
    mustVerifyEmail,
    status,
}: ProfileEditProps) {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;
    const user = auth.user;

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const deletePasswordInput = useRef<HTMLInputElement>(null);

    // Form Update Profil
    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        name: user.name,
        email: user.email,
    });

    // Form Hapus Akun
    const {
        data: deleteData,
        setData: setDeleteData,
        delete: destroyAccount,
        processing: isDeleting,
        reset: resetDelete,
        errors: deleteErrors,
        clearErrors: clearDeleteErrors,
    } = useForm({
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Informasi profil berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui profil. Periksa kembali isian Anda.');
            },
        });
    };

    const handleDeleteAccount = (e: React.FormEvent) => {
        e.preventDefault();
        destroyAccount(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success('Akun Anda telah berhasil dihapus.');
            },
            onError: () => {
                deletePasswordInput.current?.focus();
            },
        });
    };

    const openDeleteModal = () => {
        resetDelete();
        clearDeleteErrors();
        setIsDeleteModalOpen(true);
        setTimeout(() => {
            deletePasswordInput.current?.focus();
        }, 100);
    };

    const closeDeleteModal = () => {
        if (!isDeleting) {
            setIsDeleteModalOpen(false);
            resetDelete();
            clearDeleteErrors();
        }
    };

    return (
        <MobileAppLayout hideBottomNav>
            <Head title="Informasi Profil" />

            {/* Top Navigation Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                <Link
                    href="/user/profile"
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    aria-label="Kembali ke profil"
                >
                    <ArrowLeft className="size-5 stroke-[2]" />
                </Link>
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight text-center flex-1">
                    Account
                </h1>
                <div className="size-10" aria-hidden="true" />
            </header>

            <div className="space-y-3.5 pt-1 px-3 pb-8">

                {/* 2. Form Pembaruan Profil */}
                <section className="rounded-[24px] bg-white p-4.5 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                        <UserRoundCheck  className="size-4 text-emerald-600" />
                        <h3 className="text-[15px] font-semibold text-zinc-900">
                            Update Account
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Nama Lengkap */}
                        <div className="space-y-1">
                            <label
                                htmlFor="name"
                                className="text-[12px] font-medium text-zinc-600 block"
                            >
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nama lengkap Anda"
                                autoComplete="name"
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        {/* Alamat Email */}
                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="text-[12px] font-medium text-zinc-600 block"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email@contoh.com"
                                autoComplete="username"
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                                required
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* Banner Verifikasi Email */}
                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] space-y-1.5">
                                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                                    <span>Email Belum Diverifikasi</span>
                                </div>
                                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                                    Silakan verifikasi email Anda untuk menikmati seluruh fitur Dinalar secara maksimal.
                                </p>
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800 text-[11px] cursor-pointer"
                                >
                                    Kirim ulang tautan verifikasi
                                </Link>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-1 text-[11px] font-medium text-emerald-700">
                                        Tautan verifikasi baru telah dikirim ke alamat email Anda.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                    </>
                                ) : recentlySuccessful ? (
                                    <>
                                        <span>Tersimpan</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Simpan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* 4. Kartu Zona Berbahaya (Hapus Akun) */}
                <section className="rounded-[24px] bg-rose-50/60 p-4.5 border border-rose-200/60 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 text-[15px] font-semibold">
                        <Trash className="size-4 text-rose-600 shrink-0" />
                        <span>Delete Account</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                        Warning! Please proceed with caution, this cannot be undone.
                    </p>
                    <button
                        type="button"
                        onClick={openDeleteModal}
                        className="w-full h-11 rounded-full bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                        <span>Delete account</span>
                    </button>
                </section>
            </div>

            {/* Modal Hapus Akun */}
            {isDeleteModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={closeDeleteModal}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white p-5 border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                                <Trash className="size-4" />
                                <span>Delete Account</span>
                            </div>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={closeDeleteModal}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Tutup Modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Description & Warning */}
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                            <p className="text-xs font-semibold text-rose-800">Are you sure you want to delete your account?</p>
                            <p className="text-[11px] text-rose-700 leading-relaxed">
                                Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.
                            </p>
                        </div>

                        {/* Form Konfirmasi Password */}
                        <form onSubmit={handleDeleteAccount} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[12px] font-medium text-zinc-600 block">
                                    Masukkan Kata Sandi untuk Konfirmasi
                                </label>
                                <input
                                    ref={deletePasswordInput}
                                    type="password"
                                    value={deleteData.password}
                                    onChange={(e) => {
                                        setDeleteData('password', e.target.value);
                                        if (deleteErrors.password) clearDeleteErrors('password');
                                    }}
                                    placeholder="Kata sandi akun Anda"
                                    className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-all font-sans"
                                    required
                                    autoFocus
                                />
                                <InputError message={deleteErrors.password} />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={closeDeleteModal}
                                    className="flex-1 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting || !deleteData.password}
                                    className="flex-1 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-rose-900/10 disabled:opacity-50 cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                        </>
                                    ) : (
                                        <span>Delete Account</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MobileAppLayout>
    );
}
