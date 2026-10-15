import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { HistoryListSkeleton } from '@/pages/user/mobile/components/MobileSkeletons';
import { MobileHeader } from '@/pages/user/mobile/components/MobileHeader';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type PaginatedData } from '@/types';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    Clock,
    Edit2,
    Eye,
    History,
    Layers,
    Loader2,
    MoreHorizontal,
    Trash,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { usePortfolioHistorySWR, type HistoryItem } from '@/hooks/usePortfolioHistorySWR';

interface HistoryProps {
    history?: HistoryItem[] | PaginatedData<HistoryItem> | { data: HistoryItem[] };
}

export default function MobileHistoryPage({ history: initialHistory }: HistoryProps) {
    const { t, language } = useTranslation();

    // SWR Caching Layer: Instant portfolio history on revisit (0ms delay)
    const {
        list,
        hasCachedHistory,
        isRevalidating,
        updateHistoryItem,
        removeHistoryItem,
    } = usePortfolioHistorySWR({ history: initialHistory });

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
            toast.error(t('history.title_required'));
            return;
        }

        setIsUpdating(true);
        const newTitle = editTitle.trim();
        router.put(
            `/user/analyze/history/${editingItem.id}`,
            { title: newTitle },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t('history.update_success'));
                    updateHistoryItem(editingItem.id, { title: newTitle });
                    setEditingItem(null);
                },
                onError: () => {
                    toast.error(t('history.update_error'));
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
        const deleteId = deletingItem.id;

        router.delete(`/user/analyze/history/${deleteId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('history.delete_success'));
                removeHistoryItem(deleteId);
                setDeletingItem(null);
            },
            onError: () => {
                toast.error(t('history.delete_error'));
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatMetricReturn = (val?: number | null) => {
        if (val === undefined || val === null) return '-';
        const num = Number(val);
        if (isNaN(num)) return '-';
        const percent = Math.abs(num) <= 1.0 && num !== 0 ? num * 100 : num;
        const sign = percent > 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    };

    const formatMetricRisk = (val?: number | null) => {
        if (val === undefined || val === null) return '-';
        const num = Number(val);
        if (isNaN(num)) return '-';
        const percent = Math.abs(num) <= 1.0 && num !== 0 ? num * 100 : num;
        return `${percent.toFixed(2)}%`;
    };

    const formatMetricSharpe = (val?: number | null) => {
        if (val === undefined || val === null) return '-';
        const num = Number(val);
        if (isNaN(num)) return '-';
        return num.toFixed(2);
    };

    const formatHistoryCapital = (capital: number, isUs: boolean) => {
        if (isUs) {
            return `$${capital.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        }
        return `${language === 'en' ? 'IDR' : 'Rp'} ${capital.toLocaleString('id-ID')}`;
    };

    const renderHistoryList = () => (
        <div className="space-y-2.5 pt-1">
            {list.length > 0 ? (
                list.map((item) => {
                    const isUsItem = Boolean(item.tickers && item.tickers.some((t) => !t.endsWith('.JK')));
                    const profile =
                        item.best_portfolios?.sharpe ||
                        item.best_portfolios?.max_sharpe ||
                        item.best_portfolios?.min_variance ||
                        (Array.isArray(item.best_portfolios) ? item.best_portfolios[0] : null);

                    const retVal = profile ? (profile.return ?? profile.expected_return) : null;
                    const riskVal = profile ? (profile.risk ?? profile.volatility) : null;
                    const sharpeVal = profile ? (profile.sharpe ?? profile.sharpe_ratio) : null;
                    const retNum = Number(retVal);
                    const isPositiveReturn = !isNaN(retNum) ? retNum >= 0 : true;

                    return (
                        <article
                            key={item.id}
                            onClick={() => router.visit(`/user/analyze/result/${item.id}`)}
                            className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs cursor-pointer hover:border-zinc-300 active:scale-[0.99] transition-all select-none"
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
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {/* Tickers Chips */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {item.tickers.map((t, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 font-semibold"
                                                >
                                                    {t.replace('.JK', '')}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="text-[13px] font-bold text-zinc-900 font-sans shrink-0">
                                            {formatHistoryCapital(item.initial_capital, isUsItem)}
                                        </div>
                                    </div>
                                </div>

                                {/* Return | Volatilitas | Sharpe Ratio */}
                                {profile && (
                                    <div className="flex items-center justify-between gap-1 text-[10.5px] font-medium text-zinc-500 pt-0.5">
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-zinc-400">{t('history.metric_return')}</span>
                                            <span
                                                className={`font-mono font-bold ${isPositiveReturn
                                                        ? 'text-emerald-600'
                                                        : 'text-rose-600'
                                                    }`}
                                            >
                                                {formatMetricReturn(retVal)}
                                            </span>
                                        </span>
                                        <span className="text-zinc-300">|</span>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-zinc-400">{t('history.metric_volatility')}</span>
                                            <span className="font-mono font-bold text-zinc-800">
                                                {formatMetricRisk(riskVal)}
                                            </span>
                                        </span>
                                        <span className="text-zinc-300">|</span>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-zinc-400">{t('history.metric_sharpe')}</span>
                                            <span className="font-mono font-bold text-zinc-800">
                                                {formatMetricSharpe(sharpeVal)}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Row (bg-zinc-100) */}
                            <div className="bg-zinc-100 px-3.5 py-2 flex items-center justify-between border-t border-zinc-200 text-xs">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEdit(item);
                                        }}
                                        className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium cursor-pointer"
                                    >
                                        <Edit2 className="size-3" />
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingItem(item);
                                        }}
                                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
                                    >
                                        <Trash className="size-3" />
                                        {t('common.delete')}
                                    </button>
                                </div>

                                <div className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
                                    <ChevronRight className="size-4" />
                                </div>
                            </div>
                        </article>
                    );
                })
            ) : (
                <div className="py-12 text-center bg-zinc-50/50 rounded-2xl border border-zinc-200 p-6 space-y-3">
                    <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                        <History className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900">
                            {t('history.empty_history_title')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {t('history.empty_history_desc_short')}
                        </p>
                    </div>
                    <Link
                        href="/user/saham"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs"
                    >
                        {t('history.create_portfolio_btn')}
                    </Link>
                </div>
            )}
        </div>
    );

    return (
        <MobileAppLayout>
            <Head title={t('history.title')} />

            {/* 1. Header (Avatar 40 & Keranjang Saham) */}
            <MobileHeader />

            <div className="space-y-3 pt-1">
                {/* 1. Section Container Putih: Riwayat Portofolio (Section 6.9 in desain.md) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3.5">

                    {/* Ringkasan Portofolio */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3.5">
                        <img
                            src="/images/riwayat.png"
                            alt={t('history.title')}
                            className="size-12 object-contain shrink-0 drop-shadow-xs select-none"
                        />
                        <div className="min-w-0">
                            <span className="text-[12px] text-zinc-500 font-medium block leading-tight">
                                {t('history.saved_portfolios')}
                            </span>
                            <div className="text-[26px] font-bold text-zinc-900 font-sans tracking-tight leading-tight mt-0.5">
                                {list.length} {t('history.portfolios_count')}
                            </div>
                        </div>
                    </div>

                    {/* Daftar Riwayat Portofolio: Tampilkan data cache langsung jika ada, fallback ke Deferred skeleton jika cold start */}
                    {hasCachedHistory ? (
                        renderHistoryList()
                    ) : (
                        <Deferred data="history" fallback={<HistoryListSkeleton count={4} />}>
                            {renderHistoryList()}
                        </Deferred>
                    )}
            </section>
            </div>

            {/* Modal Edit Judul */}
            {editingItem && (
                <div
                    className="fixed inset-0 z-100 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isUpdating && setEditingItem(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white p-5 border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
                                <Edit2 className="size-5 text-emerald-600" />
                                <span>{t('history.edit_title_modal')}</span>
                            </div>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setEditingItem(null)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label={t('common.close')}
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            {t('history.edit_title_desc')}
                        </p>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder={t('history.portfolio_name_placeholder')}
                                className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                autoFocus
                            />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-900/10 cursor-pointer"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>{t('common.saving')}</span>
                                        </>
                                    ) : (
                                        <span>{t('common.save')}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deletingItem && (
                <div
                    className="fixed inset-0 z-100 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isDeleting && setDeletingItem(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white p-5 border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                                <AlertCircle className="size-5" />
                                <span>{t('history.delete_modal_title')}</span>
                            </div>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingItem(null)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label={t('common.close')}
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            {t('history.delete_confirm_prefix')}{' '}
                            <span className="font-semibold text-zinc-900">
                                "{deletingItem.title}"
                            </span>
                            ? {t('history.delete_confirm_suffix')}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingItem(null)}
                                className="flex-1 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="flex-1 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-rose-900/10 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>{t('common.deleting')}</span>
                                    </>
                                ) : (
                                    <span>{t('common.yes_delete')}</span>
                                )}
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
