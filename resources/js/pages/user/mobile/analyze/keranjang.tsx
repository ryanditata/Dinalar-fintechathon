import SparklineChart from '@/components/SparklineChart';
import StockAnalysisSheet, { type AnalyzedStockPayload } from '@/pages/user/mobile/components/StockAnalysisSheet';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type Stock } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    ChartNetwork,
    Loader2,
    Play,
    Plus,
    RefreshCw,
    ShoppingBag,
    Sliders,
    Trash,
    TrendingDown,
    TrendingUp,
    X,
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
    // 1. BASKET STATE FROM DATABASE
    const [basketTickers, setBasketTickers] = useState<string[]>(serverBasketTickers);
    const [detailedBasketStocks, setDetailedBasketStocks] = useState<Record<string, AnalyzedStockPayload>>(serverDetailedStocks);
    const [isProcessingBasket, setIsProcessingBasket] = useState<boolean>(false);
    const [isUpdatingTimeframe, setIsUpdatingTimeframe] = useState<boolean>(false);

    // Modal Edit Parameter & Clear Confirmation
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

    // Helper calculate lookback start date
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

    // Deteksi preset awal dari database jika seragam
    const initialBasketPreset = useMemo(() => {
        if (serverBasketTickers.length === 0) return '';
        const presets = serverBasketTickers
            .map((t) => {
                const clean = t.replace('.JK', '');
                const detail = serverDetailedStocks[t] || serverDetailedStocks[clean];
                return detail?.timeframe?.preset;
            })
            .filter(Boolean);
        if (presets.length > 0 && presets.every((p) => p === presets[0])) {
            return (presets[0] as string) || '';
        }
        return '';
    }, [serverBasketTickers, serverDetailedStocks]);

    // 2. PARAMETERS STATE
    const [initialCapital, setInitialCapital] = useState<number>(10000000);
    const [riskFreeRate, setRiskFreeRate] = useState<number>(6.0);
    const [activePreset, setActivePreset] = useState<string>(() => {
        if (serverBasketTickers.length > 0) {
            const first = serverBasketTickers[0];
            const clean = first.replace('.JK', '');
            const detail = serverDetailedStocks[first] || serverDetailedStocks[clean];
            if (detail?.timeframe?.preset !== undefined) {
                return detail.timeframe.preset || '';
            }
        }
        return initialBasketPreset || '1Y';
    });
    const [startDate, setStartDate] = useState<string>(() => {
        if (serverBasketTickers.length > 0) {
            const first = serverBasketTickers[0];
            const clean = first.replace('.JK', '');
            const detail = serverDetailedStocks[first] || serverDetailedStocks[clean];
            const bursaStart = detail?.timeframe?.lookback_start || detail?.timeframe?.start;
            if (bursaStart) return bursaStart;
        }
        const maxDate = global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10);
        if (initialBasketPreset) {
            return calculateLookbackStartDate(initialBasketPreset as any, maxDate);
        }
        return calculateLookbackStartDate('1Y', maxDate);
    });
    const [endDate, setEndDate] = useState<string>(() => {
        if (serverBasketTickers.length > 0) {
            const first = serverBasketTickers[0];
            const clean = first.replace('.JK', '');
            const detail = serverDetailedStocks[first] || serverDetailedStocks[clean];
            if (detail?.timeframe?.end) return detail.timeframe.end;
        }
        return global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10);
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Sync Server Props & sessionStorage
    useEffect(() => {
        setBasketTickers(serverBasketTickers);
        setDetailedBasketStocks(serverDetailedStocks);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('user_basket_tickers', JSON.stringify(serverBasketTickers));
            sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(serverDetailedStocks));
        }

        // Sinkronkan Rentang Waktu dan Preset dengan tanggal bursa lookback riil
        if (serverBasketTickers.length > 0) {
            const first = serverBasketTickers[0];
            const clean = first.replace('.JK', '');
            const detail = serverDetailedStocks[first] || serverDetailedStocks[clean];
            if (detail?.timeframe) {
                const bursaStart = detail.timeframe.lookback_start || detail.timeframe.start;
                const bursaEnd = detail.timeframe.end;
                if (bursaStart) setStartDate(bursaStart);
                if (bursaEnd) setEndDate(bursaEnd);
                if (detail.timeframe.preset !== undefined) {
                    setActivePreset(detail.timeframe.preset || '');
                }
            }
        }
    }, [serverBasketTickers, serverDetailedStocks]);

    // Migrasi item lama dari sessionStorage ke database jika database masih kosong
    useEffect(() => {
        if (serverBasketTickers.length === 0 && typeof window !== 'undefined') {
            try {
                const savedTickers = sessionStorage.getItem('user_basket_tickers');
                const savedDetails = sessionStorage.getItem('user_basket_detailed_stocks');
                const parsedTickers: string[] = savedTickers ? JSON.parse(savedTickers) : [];
                const parsedDetails = savedDetails ? JSON.parse(savedDetails) : {};

                if (parsedTickers.length > 0) {
                    parsedTickers.forEach((t) => {
                        const clean = t.replace('.JK', '');
                        const payload = parsedDetails[t] || parsedDetails[clean] || { ticker: t };
                        router.post('/user/analyze/basket', payload, {
                            preserveScroll: true,
                        });
                    });
                }
            } catch (e) {
                console.error('Error migrating session storage basket:', e);
            }
        }
    }, []);

    // Urutan saham di keranjang berdasarkan urutan server
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

    // Hitung saham-saham di keranjang yang memiliki return negatif (< 0)
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
    const hasMinStocks = basketStocks.length >= 2;
    const canOptimize = hasMinStocks && !hasNegativeReturn && !isSubmitting;

    // Helper format Rupiah
    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return 'Rp -';
        return `Rp ${Number(val).toLocaleString('id-ID')}`;
    };

    // Helper format tanggal (Contoh: 16 Sep 2026)
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const parts = cleanDateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                return new Date(year, month, day).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            }
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Helper format rentang tanggal
    const formatDateRange = (startStr?: string, endStr?: string) => {
        const s = startStr || startDate;
        const e = endStr || endDate;
        if (!s || !e) return '-';
        return `${formatDate(s)} - ${formatDate(e)}`;
    };

    // Apply Timeframe to entire basket
    const applyTimeframeToBasket = (params: { preset?: string; start_date?: string; end_date?: string }) => {
        setIsUpdatingTimeframe(true);
        router.post('/user/analyze/basket/timeframe', params, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const label = params.preset ? (params.preset === 'all' ? 'All' : params.preset) : 'kustom';
                toast.success(`Horison seluruh saham berhasil disinkronkan ke ${label}.`);

                const details = (page?.props?.detailed_basket_stocks || {}) as Record<string, AnalyzedStockPayload>;
                const tickers = (page?.props?.basket_tickers || serverBasketTickers) as string[];
                if (tickers.length > 0) {
                    const first = tickers[0];
                    const clean = first.replace('.JK', '');
                    const detail = details[first] || details[clean];
                    if (detail?.timeframe) {
                        const bursaStart = detail.timeframe.lookback_start || detail.timeframe.start;
                        const bursaEnd = detail.timeframe.end;
                        if (bursaStart) setStartDate(bursaStart);
                        if (bursaEnd) setEndDate(bursaEnd);
                        if (detail.timeframe.preset !== undefined) {
                            setActivePreset(detail.timeframe.preset || '');
                        }
                    }
                }
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0] || 'Gagal memperbarui horison saham.';
                toast.error(msg as string);
            },
            onFinish: () => {
                setIsUpdatingTimeframe(false);
            },
        });
    };

    // Klik Preset Timeframe
    const handlePresetChange = (preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all') => {
        setActivePreset(preset);
        const maxAllowedDate = global_timeframe.max_date
            ? global_timeframe.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);
        const newStart = calculateLookbackStartDate(preset, maxAllowedDate);
        setStartDate(newStart);
        setEndDate(maxAllowedDate);

        if (basketStocks.length > 0) {
            applyTimeframeToBasket({ preset });
        }
    };

    // Input manual tanggal
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setActivePreset('');
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setActivePreset('');
    };

    // Tombol Terapkan manual
    const handleApplyDateRange = () => {
        setActivePreset('');
        if (basketStocks.length > 0) {
            applyTimeframeToBasket({ start_date: startDate, end_date: endDate });
        }
    };

    // Remove single stock
    const handleRemoveStock = (ticker: string) => {
        const clean = ticker.replace('.JK', '');
        setIsProcessingBasket(true);
        router.delete(`/user/analyze/basket/${clean}`, {
            preserveScroll: true,
            onSuccess: () => {
                const nextTickers = basketTickers.filter(
                    (t) => t !== ticker && t !== clean && t !== `${clean}.JK`
                );
                setBasketTickers(nextTickers);

                const nextDetails = { ...detailedBasketStocks };
                delete nextDetails[ticker];
                delete nextDetails[clean];
                delete nextDetails[`${clean}.JK`];
                setDetailedBasketStocks(nextDetails);

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('user_basket_tickers', JSON.stringify(nextTickers));
                    sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(nextDetails));
                }
                toast.success(`Saham ${clean} dihapus dari keranjang.`);
            },
            onError: () => {
                toast.error(`Gagal menghapus saham ${clean}.`);
            },
            onFinish: () => {
                setIsProcessingBasket(false);
            },
        });
    };

    // Clear All Basket
    const executeClearAll = () => {
        setIsProcessingBasket(true);
        router.delete('/user/analyze/basket', {
            preserveScroll: true,
            onSuccess: () => {
                setBasketTickers([]);
                setDetailedBasketStocks({});
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('user_basket_tickers');
                    sessionStorage.removeItem('user_basket_detailed_stocks');
                }
                setIsClearModalOpen(false);
                toast.success('Keranjang berhasil dikosongkan.');
            },
            onError: () => {
                toast.error('Gagal mengosongkan keranjang.');
            },
            onFinish: () => {
                setIsProcessingBasket(false);
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

        setIsProcessingBasket(true);
        router.post('/user/analyze/basket', payload as any, {
            preserveScroll: true,
            onSuccess: () => {
                const nextDetails = {
                    ...detailedBasketStocks,
                    [t]: payload,
                    [clean]: payload,
                };
                setDetailedBasketStocks(nextDetails);
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(nextDetails));
                }
                toast.success(`Parameter analisis ${clean} berhasil diperbarui.`);
                setIsEditModalOpen(false);
                setEditingStock(null);
            },
            onError: () => {
                toast.error(`Gagal memperbarui parameter ${clean}.`);
            },
            onFinish: () => {
                setIsProcessingBasket(false);
            },
        });
    };

    // Submit Start Optimization
    const handleStartAnalyze = (e: React.FormEvent) => {
        e.preventDefault();

        if (basketStocks.length < 2) {
            toast.error('Pilih minimal 2 saham di keranjang untuk menjalankan optimasi.');
            return;
        }

        if (hasNegativeReturn) {
            const list = negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ');
            toast.error(`Tidak dapat melanjutkan: saham (${list}) memiliki return negatif. Sesuaikan horison waktu.`);
            return;
        }

        setIsSubmitting(true);

        const maxDate = global_timeframe.max_date
            ? global_timeframe.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);

        const selectedTickers = basketStocks.map((s) => s.ticker);
        const stocks_timeframes: Record<string, { start_date: string; end_date: string }> = {};

        selectedTickers.forEach((ticker) => {
            const clean = ticker.replace('.JK', '');
            const detailed = detailedBasketStocks[ticker] || detailedBasketStocks[clean];
            const itemStartDate = detailed?.timeframe?.lookback_start || detailed?.timeframe?.start;

            stocks_timeframes[ticker] = {
                start_date: itemStartDate ? itemStartDate.substring(0, 10) : startDate,
                end_date: detailed?.timeframe?.end ? detailed.timeframe.end.substring(0, 10) : endDate,
            };
        });

        const payload = {
            tickers: selectedTickers,
            initial_capital: initialCapital,
            start_date: startDate,
            end_date: endDate,
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
                const msg = Object.values(errs)[0] || 'Terjadi kesalahan saat memproses optimasi.';
                toast.error(msg as string);
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <MobileAppLayout hideBottomNav>
            <Head title="Keranjang Saham" />

            {/* Top Bar */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                <Link
                    href="/user/saham"
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    aria-label="Kembali ke katalog saham"
                >
                    <ArrowLeft className="size-5 stroke-[2]" />
                </Link>
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight text-center flex-1">
                    Keranjang
                </h1>
                {basketStocks.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => setIsClearModalOpen(true)}
                        className="size-10 rounded-full bg-white border border-zinc-200 text-rose-600 hover:text-rose-700 active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        title="Kosongkan Keranjang"
                        aria-label="Kosongkan Keranjang"
                    >
                        <Trash className="size-4 stroke-[1.8]" />
                    </button>
                ) : (
                    <div className="size-10" aria-hidden="true" />
                )}
            </header>

            <div className="space-y-3 pt-1 pb-24">

                {/* 1. Container Putih: Daftar Saham di Keranjang */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="size-4 text-emerald-600" />
                                <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                    Saham Terpilih ({basketStocks.length})
                                </h3>
                            </div>
                            <Link
                                href="/user/saham"
                                className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                <Plus className="size-4 stroke-[2.5]" />
                            </Link>
                        </div>

                        {basketStocks.length > 0 ? (
                            <div className="space-y-3">
                                {basketStocks.map((stock) => {
                                    const clean = stock.ticker.replace('.JK', '');
                                    const detailed =
                                        detailedBasketStocks[stock.ticker] ||
                                        detailedBasketStocks[clean];
                                    const lastPrice = stock.latest_price
                                        ? Number(stock.latest_price.close_price)
                                        : 0;

                                    const expectedReturn: number | undefined =
                                        detailed?.metrics?.expected_return !== undefined && detailed?.metrics?.expected_return !== null
                                            ? Number(detailed.metrics.expected_return)
                                            : detailed?.metrics?.period_return !== undefined && detailed?.metrics?.period_return !== null
                                                ? Number(detailed.metrics.period_return)
                                                : stock.change_percent !== undefined && stock.change_percent !== null
                                                    ? Number(stock.change_percent)
                                                    : undefined;

                                    const hasReturn = typeof expectedReturn === 'number';
                                    const isPositive = hasReturn ? expectedReturn >= 0 : true;

                                    const effectiveStartDate = detailed?.timeframe?.lookback_start || detailed?.timeframe?.start;
                                    const timeframeEnd = detailed?.timeframe?.end;
                                    const timeframePreset = detailed?.timeframe?.preset;
                                    const dataPoints = detailed?.prices?.length || detailed?.metrics?.data_points;

                                    const chartPrices =
                                        detailed?.prices && detailed.prices.length > 0
                                            ? detailed.prices.map((p: any) =>
                                                typeof p === 'object' && p !== null
                                                    ? Number(p.close_price)
                                                    : Number(p)
                                            )
                                            : stock.recent_prices || [];

                                    return (
                                        <div
                                            key={stock.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleOpenEdit(stock)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleOpenEdit(stock);
                                                }
                                            }}
                                            className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs space-y-3 hover:border-emerald-500/40 active:scale-[0.99] transition-all cursor-pointer"
                                        >
                                            {/* Row 1: Header Ticker, Name, Bursa, and Action Buttons */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-[15px] font-bold text-zinc-900 leading-tight">
                                                                {clean}
                                                            </h4>
                                                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500">
                                                                {stock.bursa || 'IDX'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 truncate max-w-[170px] mt-0.5">
                                                            {stock.name || clean}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Icons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveStock(stock.ticker);
                                                        }}
                                                        className="size-8 rounded-lg bg-zinc-100 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                                                        title="Hapus dari Keranjang"
                                                        aria-label={`Hapus ${clean} dari keranjang`}
                                                    >
                                                        <Trash className="size-3.5 stroke-[1.8]" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Row 2: Grid Harga Terakhir (Sparkline) & Expected Return */}
                                            <div className="grid grid-cols-2 gap-2.5 items-stretch">
                                                {/* Box 1: Harga & Sparkline */}
                                                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[10px] text-zinc-400 font-medium block">
                                                            Harga Terakhir
                                                        </span>
                                                        <span className="text-[13px] font-bold text-zinc-900 font-mono tabular-nums">
                                                            {lastPrice > 0 ? formatRupiah(lastPrice) : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="pt-1.5">
                                                        <SparklineChart prices={chartPrices} className="w-full h-7" />
                                                    </div>
                                                </div>

                                                {/* Box 2: Expected Return */}
                                                <div
                                                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${hasReturn
                                                        ? isPositive
                                                            ? 'border-emerald-200 bg-emerald-50/50'
                                                            : 'border-rose-200 bg-rose-50/50'
                                                        : 'border-zinc-200 bg-zinc-50'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={`text-[10px] font-semibold flex items-center gap-1 ${hasReturn
                                                                    ? isPositive
                                                                        ? 'text-emerald-700'
                                                                        : 'text-rose-700'
                                                                    : 'text-zinc-500'
                                                                    }`}
                                                            >
                                                                {isPositive ? (
                                                                    <TrendingUp className="size-3" />
                                                                ) : (
                                                                    <TrendingDown className="size-3" />
                                                                )}
                                                                <span>Expected Return</span>
                                                            </span>
                                                            <span
                                                                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${isPositive
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                                    }`}
                                                            >
                                                                {timeframePreset
                                                                    ? timeframePreset === 'all'
                                                                        ? 'All'
                                                                        : timeframePreset
                                                                    : dataPoints
                                                                        ? `${dataPoints}D`
                                                                        : 'Custom'}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`text-[15px] font-bold font-mono tabular-nums block mt-1 ${hasReturn
                                                                ? isPositive
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                                : 'text-zinc-500'
                                                                }`}
                                                        >
                                                            {hasReturn
                                                                ? expectedReturn > 0
                                                                    ? `+${expectedReturn.toFixed(2)}%`
                                                                    : `${expectedReturn.toFixed(2)}%`
                                                                : '-'}
                                                        </span>
                                                    </div>

                                                    {detailed?.metrics?.volatility !== undefined && (
                                                        <span className="text-[9px] text-zinc-500 block truncate pt-1">
                                                            Risiko Volatilitas {detailed.metrics.volatility}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Row 3: Rentang Tanggal Lookback Riil */}
                                            <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="size-3 text-emerald-600" />
                                                    <span className="font-mono">
                                                        {formatDateRange(effectiveStartDate, timeframeEnd)} | {dataPoints} Hari Bursa
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="py-10 text-center space-y-3">
                                <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                                    <ShoppingBag className="size-7 stroke-[1.8]" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900">Keranjang Masih Kosong</h4>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                                        Pilih minimal 2 saham dari katalog bursa Dinalar untuk memulai optimasi portofolio AI.
                                    </p>
                                </div>
                                <Link
                                    href="/user/saham"
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs active:scale-95 transition-transform"
                                >
                                    <TrendingUp className="size-3.5" />
                                    <span>Mulai Eksplorasi Saham</span>
                                </Link>
                            </div>
                        )}
                    </section>

                {/* 2. Banner Peringatan */}
                {hasNegativeReturn && (
                    <div className="mx-1 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                        <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                            <span className="font-bold block text-rose-900">
                                Return Negatif Terdeteksi
                            </span>
                            <p className="mt-0.5 text-rose-700 leading-relaxed text-[11px]">
                                Saham ({negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ')}) memiliki tren return bernilai negatif pada horison ini. Mohon ubah horison waktu atau hapus dari keranjang agar analisis dapat diproses.
                            </p>
                        </div>
                    </div>
                )}

                {/* Kurang Dari 2 Saham Warning Banner */}
                {!hasMinStocks && basketStocks.length > 0 && (
                    <div className="mx-1 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                            <span className="font-bold block text-amber-900">
                                Minimal 2 Saham Berbeda
                            </span>
                            <p className="mt-0.5 text-amber-700 leading-relaxed text-[11px]">
                                Tambahkan minimal 1 saham lagi ke keranjang agar algoritma Markowitz dapat menghitung portofolio optimal.
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. Container Putih: Parameter Modal, Bunga & Horison */}
                <section className="mx-1 rounded-[24px] bg-white p-4.5 border border-zinc-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <div className="flex items-center gap-2">
                                <Sliders className="size-4 text-emerald-600" />
                                <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                    Optimasi Parameter
                                </h3>
                            </div>
                        </div>

                        {/* Input Modal Investasi */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-medium text-zinc-900">
                                    Total Modal Investasi (IDR)
                                </label>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-900 font-mono">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min={1000000}
                                    step={500000}
                                    value={initialCapital}
                                    onChange={(e) => setInitialCapital(Number(e.target.value) || 0)}
                                    className="w-full h-11 pl-11 pr-3 rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-bold text-zinc-900 font-sans tabular-nums focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Risk-Free Rate */}
                        <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[12px] font-medium text-zinc-900 block">
                                        Risk-Free Rate (%)
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                        Acuan suku bunga bebas risiko (SBN / BI Rate)
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
                                        className="w-16 h-8 text-center text-xs font-bold rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-emerald-500 font-sans tabular-nums"
                                    />
                                    <span className="text-xs font-semibold text-zinc-500">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Horison Analisis Portofolio (Preset) */}
                        <div className="space-y-2 pt-2 border-t border-zinc-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-zinc-900 flex items-center gap-1.5">
                                    <ChartNetwork className="size-3.5 text-emerald-600 shrink-0" />
                                    <span>Horison Analisis</span>
                                </span>
                            </div>

                            {/* Preset Timeframe Buttons Grid */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {(['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'all'] as const).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        disabled={isUpdatingTimeframe}
                                        onClick={() => handlePresetChange(preset)}
                                        className={`h-7 px-3 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 ${activePreset === preset
                                            ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200/80'
                                            }`}
                                    >
                                        {isUpdatingTimeframe && activePreset === preset && (
                                            <Loader2 className="size-3 animate-spin" />
                                        )}
                                        <span>{preset === 'all' ? 'All' : preset}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rentang Waktu (Manual Input Tanggal) */}
                        <div className="space-y-2 pt-2 border-t border-zinc-100">
                            <span className="text-[12px] font-medium text-zinc-900 flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                                <span>Rentang Waktu</span>
                            </span>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-400 block font-medium">Mulai</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={global_timeframe.min_date ? global_timeframe.min_date.substring(0, 10) : '2023-01-01'}
                                            max={endDate || (global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10))}
                                            onChange={handleStartDateChange}
                                            className="w-full h-8 px-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[12px] font-mono text-zinc-900 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-400 block font-medium">Selesai</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate || (global_timeframe.min_date ? global_timeframe.min_date.substring(0, 10) : '2023-01-01')}
                                            max={global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10)}
                                            onChange={handleEndDateChange}
                                            className="w-full h-8 px-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[12px] font-mono text-zinc-900 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 shrink-0">
                                    <button
                                        type="button"
                                        disabled={isUpdatingTimeframe || basketStocks.length === 0}
                                        onClick={handleApplyDateRange}
                                        className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                        title="Terapkan rentang waktu ke seluruh saham"
                                        aria-label="Terapkan rentang tanggal manual"
                                    >
                                        <RefreshCw className={`size-3.5 ${isUpdatingTimeframe && !activePreset ? 'animate-spin text-emerald-600' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Order Summary Card */}
                        {basketStocks.length > 0 && (
                            <section className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/80 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between text-zinc-500">
                                    <span>Jumlah Saham Terpilih:</span>
                                    <span className="font-mono font-bold text-zinc-900">{basketStocks.length} Saham</span>
                                </div>
                                {hasNegativeReturn && (
                                    <div className="flex items-center justify-between text-rose-600 font-semibold">
                                        <span>Return Negatif:</span>
                                        <span className="font-mono font-bold">{negativeReturnStocks.length} Saham</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-zinc-500">
                                    <span>Model Optimasi AI:</span>
                                    <span className="font-mono font-semibold text-emerald-600">NSGA-II + Markowitz</span>
                                </div>

                                {/* List Ticker Badges */}
                                <div className="pt-2 border-t border-zinc-200/70 flex flex-wrap gap-1.5">
                                    {basketStocks.map((s) => {
                                        const clean = s.ticker.replace('.JK', '');
                                        const isNeg = negativeReturnStocks.some((n) => n.id === s.id);
                                        return (
                                            <span
                                                key={s.id}
                                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isNeg
                                                    ? 'border-rose-300 text-rose-700 bg-rose-50'
                                                    : 'border-zinc-200 text-zinc-700 bg-white'
                                                    }`}
                                            >
                                                {clean}
                                            </span>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </section>
            </div>

            {/* 5. Sticky Execution Bar di Bawah */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 pt-3 shadow-lg"
                style={{
                    paddingBottom: 'max(34px, calc(16px + env(safe-area-inset-bottom, 0px)))',
                }}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="shrink-0 flex flex-col justify-center">
                        <span className="text-[11px] text-zinc-400 block font-medium leading-none mb-1.5">
                            Total Dipilih
                        </span>
                        <span className="text-[15px] font-bold text-zinc-900 font-mono leading-none">
                            {basketStocks.length} Saham
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleStartAnalyze}
                        disabled={!canOptimize}
                        className={`flex-1 h-12 rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all duration-200 cursor-pointer ${canOptimize
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-70'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Memproses Optimasi</span>
                            </>
                        ) : (
                            <>
                                <Play className="size-4 fill-white" />
                                <span>Analyze</span>
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
                    initialTimeframe={
                        detailedBasketStocks[editingStock.ticker]?.timeframe ||
                        detailedBasketStocks[editingStock.ticker.replace('.JK', '')]?.timeframe
                    }
                />
            )}

            {/* Modal Dialog Konfirmasi Kosongkan Keranjang */}
            {isClearModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isProcessingBasket && setIsClearModalOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl bg-white p-5 border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                                <AlertCircle className="size-5" />
                                <span>Kosongkan Keranjang</span>
                            </div>
                            <button
                                type="button"
                                disabled={isProcessingBasket}
                                onClick={() => setIsClearModalOpen(false)}
                                className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Tutup Dialog"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            Apakah Anda yakin ingin mengosongkan seluruh isi keranjang portofolio? Seluruh saham dan pengaturan parameter yang telah Anda pilih akan dihapus.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                disabled={isProcessingBasket}
                                onClick={() => setIsClearModalOpen(false)}
                                className="flex-1 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isProcessingBasket}
                                onClick={executeClearAll}
                                className="flex-1 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-rose-900/10 cursor-pointer"
                            >
                                {isProcessingBasket ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menghapus</span>
                                    </>
                                ) : (
                                    <span>Ya, Kosongkan</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileAppLayout>
    );
}
