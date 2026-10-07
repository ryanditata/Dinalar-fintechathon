import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    Edit2,
    Eye,
    History,
    Layers,
    Loader2,
    MoreHorizontal,
    Plus,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface HistoryItem {
    id: number;
    user_id: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    tickers: string[];
    created_at: string;
}

interface HistoryProps {
    history: PaginatedData<HistoryItem> | { data: HistoryItem[] };
}

export default function MobileHistoryPage({ history }: HistoryProps) {
    const list = 'data' in history ? history.data : [];

    // Edit Modal State
    const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
    const [editTitle, setEditTitle] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // Delete Modal State
    const [deletingItem, setDeletingItem] = useState<HistoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const openEdit = (item: HistoryItem) => {
        setEditingItem(item);
        setEditTitle(item.title);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (!editTitle.trim()) {
            toast.error('Judul portofolio tidak boleh kosong.');
            return;
        }

        setIsUpdating(true);
        router.put(
            `/user/analyze/history/${editingItem.id}`,
            { title: editTitle.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Judul portofolio berhasil diperbarui.');
                    setEditingItem(null);
                },
                onError: () => {
                    toast.error('Gagal memperbarui judul.');
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        setIsDeleting(true);

        router.delete(`/user/analyze/history/${deletingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Riwayat portofolio berhasil dihapus.');
                setDeletingItem(null);
            },
            onError: () => {
                toast.error('Gagal menghapus riwayat.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <MobileAppLayout title="Riwayat Portofolio | Dinalar Mobile">
            {/* Top Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user/dashboard"
                        className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="size-5 stroke-[2]" />
                    </Link>
                    <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight">
                        Riwayat Portofolio
                    </h1>
                </div>

                <Link
                    href="/user/analyze/keranjang"
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-xs active:scale-95 transition-transform"
                    aria-label="Buat Optimasi Baru"
                >
                    <Plus className="size-5 stroke-[2.2]" />
                </Link>
            </header>

            <div className="space-y-3 pt-1 pb-16">
                {/* 1. Summary Card */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs">
                    <span className="text-[13px] text-zinc-500 font-medium block">
                        Total Portofolio Tersimpan
                    </span>
                    <div className="text-[28px] font-bold text-zinc-900 font-sans tracking-tight mt-0.5">
                        {list.length} Portofolio
                    </div>
                    <p className="text-[12px] text-zinc-500 mt-1">
                        Dihitung menggunakan algoritma Modern Portfolio Theory & NSGA-II.
                    </p>
                </section>

                {/* 2. Daftar Riwayat Portofolio */}
                <section className="mx-1 space-y-2.5">
                    {list.length > 0 ? (
                        list.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs"
                            >
                                {/* Main Row (Padding 12) */}
                                <div className="p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            {item.reference_code || `DNL-REF-${item.id}`}
                                        </span>
                                        <span className="text-zinc-500 flex items-center gap-1 font-medium">
                                            <Clock className="size-3" />
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug">
                                            {item.title}
                                        </h3>
                                        <div className="text-[13px] font-bold text-zinc-900 font-sans mt-1">
                                            Modal: Rp {item.initial_capital.toLocaleString('id-ID')}
                                        </div>
                                    </div>

                                    {/* Tickers Chips */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        {item.tickers.map((t, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 font-semibold"
                                            >
                                                {t.replace('.JK', '')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Row (bg-zinc-100) */}
                                <div className="bg-zinc-100 px-3.5 py-2 flex items-center justify-between border-t border-zinc-200 text-xs">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(item)}
                                            className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium"
                                        >
                                            <Edit2 className="size-3" />
                                            Ubah Judul
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingItem(item)}
                                            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                                        >
                                            <Trash2 className="size-3" />
                                            Hapus
                                        </button>
                                    </div>

                                    <Link
                                        href={`/user/analyze/result/${item.id}`}
                                        className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                        <span>Buka Hasil</span>
                                        <Eye className="size-3.5" />
                                    </Link>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="py-12 text-center bg-white rounded-2xl border border-zinc-200 p-6 space-y-3">
                            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                                <History className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">
                                    Belum Ada Riwayat
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Hasil kalkulasi portofolio yang Anda jalankan akan tersimpan otomatis di sini.
                                </p>
                            </div>
                            <Link
                                href="/user/saham"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs"
                            >
                                Mulai Buat Portofolio
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal Edit Judul */}
            {editingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 border border-zinc-200 shadow-xl space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-zinc-900">
                                Ubah Judul Portofolio
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Sesuaikan nama untuk memudahkan pencarian di kemudian hari.
                            </p>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Nama portofolio..."
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                                autoFocus
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 flex items-center gap-1.5"
                                >
                                    {isUpdating && <Loader2 className="size-3 animate-spin" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deletingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 border border-zinc-200 shadow-xl space-y-3">
                        <h3 className="text-base font-bold text-zinc-900">
                            Hapus Riwayat Portofolio?
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Apakah Anda yakin ingin menghapus portofolio{' '}
                            <span className="font-semibold text-zinc-900">
                                "{deletingItem.title}"
                            </span>
                            ? Data ini tidak dapat dikembalikan.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingItem(null)}
                                className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 flex items-center gap-1.5"
                            >
                                {isDeleting && <Loader2 className="size-3 animate-spin" />}
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bottom Nav */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
