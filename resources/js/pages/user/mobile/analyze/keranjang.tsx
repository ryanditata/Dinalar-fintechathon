import StockAnalysisSheet, { type AnalyzedStockPayload } from '@/pages/user/mobile/components/StockAnalysisSheet';
import { AllocationProgressBar } from '@/pages/user/mobile/components/AllocationProgressBar';
import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type Stock } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Clock,
    Coins,
    Loader2,
    Play,
    Plus,
    Sliders,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface RecentOptimizationItem {
    id: number;
    user_id?: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    tickers: string[];
    created_at: string;
}

interface KeranjangProps {
    available_stocks: Stock[];
    basket_items?: any[];
    basket_tickers?: string[];
    detailed_basket_stocks?: Record<string, AnalyzedStockPayload>;
    global_timeframe: {
        min_date: string | null;
        max_date: string | null;
    };
    recent_optimizations?: RecentOptimizationItem[];
}

export default function MobileKeranjangPage({
    available_stocks = [],
    basket_tickers: serverBasketTickers = [],
    detailed_basket_stocks: serverDetailedStocks = {},
    global_timeframe,
}: KeranjangProps) {
    const [basketTickers, setBasketTickers] = useState<string[]>(serverBasketTickers);
    const [detailedBasketStocks, setDetailedBasketStocks] = useState<Record<string, AnalyzedStockPayload>>(serverDetailedStocks);
    const [initialCapital, setInitialCapital] = useState<number>(10000000);
    const [riskFreeRate, setRiskFreeRate] = useState<number>(6.0);
    const [activePreset, setActivePreset] = useState<string>('1Y');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isUpdatingTimeframe, setIsUpdatingTimeframe] = useState<boolean>(false);

    // Modal Edit Parameter State
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

    // Sync Server Props
    useEffect(() => {
        setBasketTickers(serverBasketTickers);
        setDetailedBasketStocks(serverDetailedStocks);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('user_basket_tickers', JSON.stringify(serverBasketTickers));
            sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(serverDetailedStocks));
        }
    }, [serverBasketTickers, serverDetailedStocks]);

    // Calculate Basket Stocks list
    const basketStocks = useMemo(() => {
        if (serverBasketTickers.length > 0) {
            return serverBasketTickers
                .map((ticker) => {
                    const clean = ticker.replace('.JK', '');
                    return available_stocks.find(
                        (s) => s.ticker === ticker || s.ticker === clean || s.ticker === `${clean}.JK`
                    );
                })
                .filter((s): s is Stock => s !== undefined);
        }
        return available_stocks;
    }, [available_stocks, serverBasketTickers]);

    // Check negative return stocks
    const negativeReturnStocks = useMemo(() => {
        return basketStocks.filter((stock) => {
            const clean = stock.ticker.replace('.JK', '');
            const detailed = detailedBasketStocks[stock.ticker] || detailedBasketStocks[clean];
            const stockReturn =
                detailed?.metrics?.expected_return !== undefined && detailed?.metrics?.expected_return !== null
                    ? Number(detailed.metrics.expected_return)
                    : detailed?.metrics?.period_return !== undefined && detailed?.metrics?.period_return !== null
                    ? Number(detailed.metrics.period_return)
                    : stock.change_percent !== undefined && stock.change_percent !== null
                    ? Number(stock.change_percent)
                    : undefined;

            return typeof stockReturn === 'number' && stockReturn < 0;
        });
    }, [basketStocks, detailedBasketStocks]);

    const hasNegativeReturn = negativeReturnStocks.length > 0;
    const canOptimize = basketStocks.length >= 2 && !hasNegativeReturn && !isSubmitting;

    // Helper lookback date calculator
    const calculateLookbackStartDate = (
        preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all',
        anchorDateStr: string
    ): string => {
        const minAllowedDate = global_timeframe.min_date?.substring(0, 10) ?? '2023-01-01';
        if (preset === 'all') return minAllowedDate;

        const anchor = new Date(anchorDateStr);
        if (isNaN(anchor.getTime())) return minAllowedDate;

        const target = new Date(anchor);
        if (preset === '1D') target.setDate(target.getDate() - 7);
        else if (preset === '5D') target.setDate(target.getDate() - 21);
        else if (preset === '1M') target.setMonth(target.getMonth() - 3);
        else if (preset === '3M') target.setMonth(target.getMonth() - 9);
        else if (preset === '6M') target.setFullYear(target.getFullYear() - 1);
        else if (preset === '1Y') target.setFullYear(target.getFullYear() - 2);
        else if (preset === '3Y') target.setFullYear(target.getFullYear() - 6);
        else if (preset === '5Y') target.setFullYear(target.getFullYear() - 10);

        const formatted = target.toISOString().substring(0, 10);
        return formatted < minAllowedDate ? minAllowedDate : formatted;
    };

    // Apply Timeframe to Basket
    const handlePresetChange = (preset: '1M' | '3M' | '6M' | '1Y' | 'all') => {
        setActivePreset(preset);
        if (basketStocks.length === 0) return;

        setIsUpdatingTimeframe(true);
        router.post(
            '/user/analyze/basket/timeframe',
            { preset },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Horison seluruh saham diset ke ${preset === 'all' ? 'Semua' : preset}`);
                },
                onError: () => {
                    toast.error('Gagal memperbarui horison saham.');
                },
                onFinish: () => {
                    setIsUpdatingTimeframe(false);
                },
            }
        );
    };

    // Remove single stock
    const handleRemoveStock = (ticker: string) => {
        const clean = ticker.replace('.JK', '');
        router.delete(`/user/analyze/basket/${clean}`, {
            preserveScroll: true,
            onSuccess: () => {
                const nextTickers = basketTickers.filter(
                    (t) => t !== ticker && t !== clean && t !== `${clean}.JK`
                );
                setBasketTickers(nextTickers);
                toast.success(`Saham ${clean} dihapus dari keranjang.`);
            },
            onError: () => {
                toast.error(`Gagal menghapus saham ${clean}.`);
            },
        });
    };

    // Clear All
    const handleClearBasket = () => {
        if (!confirm('Kosongkan seluruh saham dari keranjang portofolio?')) return;
        router.delete('/user/analyze/basket', {
            preserveScroll: true,
            onSuccess: () => {
                setBasketTickers([]);
                setDetailedBasketStocks({});
                toast.success('Keranjang berhasil dikosongkan.');
            },
        });
    };

    // Open Edit Modal
    const handleOpenEdit = (stock: Stock) => {
        setEditingStock(stock);
        setIsEditModalOpen(true);
    };

    // Update stock in basket
    const handleUpdateStock = (payload: AnalyzedStockPayload) => {
        const t = payload.ticker;
        const clean = t.replace('.JK', '');

        router.post('/user/analyze/basket', payload as any, {
            preserveScroll: true,
            onSuccess: () => {
                setDetailedBasketStocks((prev) => ({
                    ...prev,
                    [t]: payload,
                    [clean]: payload,
                }));
                toast.success(`Parameter ${clean} berhasil diperbarui.`);
                setIsEditModalOpen(false);
                setEditingStock(null);
            },
        });
    };

    // Start Optimization Submit
    const handleStartAnalyze = (e: React.FormEvent) => {
        e.preventDefault();

        if (basketStocks.length < 2) {
            toast.error('Pilih minimal 2 saham di keranjang untuk menjalankan optimasi.');
            return;
        }

        if (hasNegativeReturn) {
            const list = negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ');
            toast.error(`Terdapat saham dengan return negatif (${list}). Mohon sesuaikan horison.`);
            return;
        }

        setIsSubmitting(true);

        const maxDate = global_timeframe.max_date
            ? global_timeframe.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);
        const startDate = calculateLookbackStartDate(activePreset as any, maxDate);

        const selectedTickers = basketStocks.map((s) => s.ticker);
        const stocks_timeframes: Record<string, { start_date: string; end_date: string }> = {};

        selectedTickers.forEach((ticker) => {
            const clean = ticker.replace('.JK', '');
            const detailed = detailedBasketStocks[ticker] || detailedBasketStocks[clean];
            const itemStartDate = detailed?.timeframe?.lookback_start || detailed?.timeframe?.start;

            stocks_timeframes[ticker] = {
                start_date: itemStartDate ? itemStartDate.substring(0, 10) : startDate,
                end_date: detailed?.timeframe?.end ? detailed.timeframe.end.substring(0, 10) : maxDate,
            };
        });

        const payload = {
            tickers: selectedTickers,
            initial_capital: initialCapital,
            start_date: startDate,
            end_date: maxDate,
            risk_free_rate: riskFreeRate,
            horizon_preset: activePreset,
            population_size: 200,
            generations: 100,
            crossover_rate: 0.9,
            mutation_rate: 0.1,
            stocks_timeframes: stocks_timeframes,
        };

        router.post('/user/analyze/optimize', payload, {
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Terjadi kesalahan saat optimasi.';
                toast.error(msg as string);
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <MobileAppLayout>
            {/* Top Bar (Back button, Title, Clear Basket) */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user/saham"
                        className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="size-5 stroke-[2]" />
                    </Link>
                    <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight">
                        Keranjang Portofolio
                    </h1>
                </div>

                {basketStocks.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClearBasket}
                        className="text-[12px] font-medium text-rose-600 hover:text-rose-700 active:opacity-70 px-2 py-1"
                    >
                        Kosongkan
                    </button>
                )}
            </header>

            <div className="space-y-3 pt-1 pb-16">
                {/* 1. Progress Banner (AllocationProgressBar) */}
                <div className="mx-1">
                    <AllocationProgressBar
                        label="Kapasitas Model Portofolio"
                        currentValue={`${basketStocks.length} Saham`}
                        totalValue="10 Max"
                        percentage={(basketStocks.length / 10) * 100}
                        actionLabel="Syarat: Minimal 2 Saham Berbeda"
                        onActionClick={() => router.get('/user/saham')}
                    />
                </div>

                {/* 2. Container Putih: Parameter Optimasi */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                            Parameter Modal & Waktu
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                            Markowitz AI
                        </span>
                    </div>

                    {/* Input Modal Awal */}
                    <div>
                        <label className="text-[12px] font-medium text-zinc-500 block mb-1">
                            Modal Investasi (IDR)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-900">
                                Rp
                            </span>
                            <input
                                type="number"
                                min={100000}
                                step={100000}
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(Number(e.target.value) || 0)}
                                className="w-full h-11 pl-10 pr-3 rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-bold text-zinc-900 font-sans tabular-nums focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Quick Capital Pills */}
                        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                            {[5000000, 10000000, 25000000, 50000000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setInitialCapital(amt)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all ${
                                        initialCapital === amt
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white text-zinc-500 border-zinc-200'
                                    }`}
                                >
                                    {amt / 1000000} Jt
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horison Waktu / Lookback Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-medium text-zinc-500">
                                Horison Analisis Historis
                            </label>
                            {isUpdatingTimeframe && (
                                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" />
                                    Sinkronisasi...
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-xl">
                            {(['1M', '3M', '6M', '1Y', 'all'] as const).map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handlePresetChange(preset)}
                                    className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                        activePreset === preset
                                            ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-900'
                                    }`}
                                >
                                    {preset === 'all' ? 'All' : preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk Free Rate (SBN / BI Rate) */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200">
                        <div>
                            <span className="text-[12px] font-medium text-zinc-900 block">
                                Risk-Free Rate (SBN 10Y)
                            </span>
                            <span className="text-[11px] text-zinc-500">
                                Benchmark suku bunga bebas risiko
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                step={0.1}
                                min={0}
                                max={20}
                                value={riskFreeRate}
                                onChange={(e) => setRiskFreeRate(Number(e.target.value) || 0)}
                                className="w-16 h-8 text-center text-xs font-bold rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900"
                            />
                            <span className="text-xs font-semibold text-zinc-500">%</span>
                        </div>
                    </div>
                </section>

                {/* 3. Negative Return Warning Banner */}
                {hasNegativeReturn && (
                    <div className="mx-1 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                        <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                            <span className="font-bold block">
                                Return Negatif Terdeteksi:
                            </span>
                            <p className="mt-0.5 text-rose-700 leading-relaxed">
                                {negativeReturnStocks
                                    .map((s) => s.ticker.replace('.JK', ''))
                                    .join(', ')}{' '}
                                memiliki tren return negatif pada horison ini. Mohon ubah horison waktu atau hapus dari keranjang.
                            </p>
                        </div>
                    </div>
                )}

                {/* 4. Container Putih: Daftar Saham di Keranjang */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                            Saham Terpilih ({basketStocks.length})
                        </h3>
                        <Link
                            href="/user/saham"
                            className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1"
                        >
                            <Plus className="size-3.5" />
                            Tambah Saham
                        </Link>
                    </div>

                    {basketStocks.length > 0 ? (
                        <div className="space-y-2.5">
                            {basketStocks.map((stock) => {
                                const clean = stock.ticker.replace('.JK', '');
                                const detailed =
                                    detailedBasketStocks[stock.ticker] ||
                                    detailedBasketStocks[clean];
                                const expectedReturn =
                                    detailed?.metrics?.expected_return ??
                                    detailed?.metrics?.period_return ??
                                    stock.change_percent;

                                const isNeg =
                                    typeof expectedReturn === 'number' && expectedReturn < 0;

                                return (
                                    <div
                                        key={stock.id}
                                        className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[12px] font-bold text-zinc-900">
                                                        {clean.slice(0, 3)}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-500">
                                                        {stock.bursa || 'IDX'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-semibold text-zinc-900 leading-tight">
                                                        {clean}
                                                    </h4>
                                                    <p className="text-[12px] text-zinc-500 truncate max-w-[150px]">
                                                        {stock.name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-[14px] font-bold text-zinc-900 font-sans tabular-nums">
                                                    Rp{' '}
                                                    {(
                                                        stock.latest_price?.close_price || 0
                                                     ).toLocaleString('id-ID')}
                                                </div>
                                                {expectedReturn !== undefined && (
                                                    <span
                                                        className={`text-[11px] font-semibold block ${
                                                            isNeg ? 'text-rose-600' : 'text-emerald-600'
                                                        }`}
                                                    >
                                                        Return:{' '}
                                                        {typeof expectedReturn === 'number'
                                                            ? `${expectedReturn >= 0 ? '+' : ''}${expectedReturn.toFixed(2)}%`
                                                            : '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(stock)}
                                                className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                                            >
                                                <Sliders className="size-3" />
                                                Sesuaikan Horison
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStock(stock.ticker)}
                                                className="text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
                                            >
                                                <Trash2 className="size-3" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-10 text-center space-y-3">
                            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                                <Plus className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">
                                    Keranjang Masih Kosong
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Pilih minimal 2 saham dari katalog bursa untuk memulai optimasi.
                                </p>
                            </div>
                            <Link
                                href="/user/saham"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs active:scale-95 transition-transform"
                            >
                                Eksplorasi Saham Sekarang
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {/* Sticky Execution Bar di Atas Bottom Nav */}
            <div
                className="fixed inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 shadow-lg"
                style={{
                    bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
                }}
            >
                <div className="max-w-[430px] mx-auto flex items-center justify-between gap-3">
                    <div>
                        <span className="text-[11px] text-zinc-500 block">
                            Total Dipilih
                        </span>
                        <span className="text-[15px] font-bold text-zinc-900">
                            {basketStocks.length} Saham
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleStartAnalyze}
                        disabled={!canOptimize}
                        className={`flex-1 h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                            canOptimize
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                <span>Menghitung Portofolio...</span>
                            </>
                        ) : (
                            <>
                                <Play className="size-4 fill-white" />
                                <span>Jalankan Optimasi AI</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Bottom Page Sheet Edit Parameter Per Saham */}
            {editingStock && (
                <StockAnalysisSheet
                    stock={editingStock}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingStock(null);
                    }}
                    onAddToBasket={handleUpdateStock}
                    isAlreadyInBasket={true}
                    timeframeLimits={global_timeframe}
                />
            )}

            {/* Floating Bottom Nav */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
