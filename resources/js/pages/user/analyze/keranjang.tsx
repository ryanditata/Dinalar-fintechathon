import SparklineChart from '@/components/SparklineChart';
import StockAnalysisModal, { AnalyzedStockPayload } from '@/components/StockAnalysisModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Stock } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    ChartNetwork,
    Clock,
    Coins,
    Play,
    Plus,
    Loader2,
    RefreshCw,
    Shield,
    ShoppingBag,
    Sliders,
    Timer,
    Trash,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/user/dashboard',
    },
    {
        title: 'Eksplorasi Saham',
        href: '/user/saham',
    },
    {
        title: 'Keranjang Saham',
        href: '/user/analyze/keranjang',
    },
];

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

export default function PortfolioSetupPage({
    available_stocks = [],
    basket_tickers: serverBasketTickers = [],
    detailed_basket_stocks: serverDetailedStocks = {},
    global_timeframe,
    recent_optimizations = [],
}: KeranjangProps) {
    // 1. BASKET STATE FROM DATABASE
    const [basketTickers, setBasketTickers] = useState<string[]>(serverBasketTickers);
    const [detailedBasketStocks, setDetailedBasketStocks] = useState<Record<string, AnalyzedStockPayload>>(serverDetailedStocks);
    const [isLoaded, setIsLoaded] = useState<boolean>(true);
    const [isProcessingBasket, setIsProcessingBasket] = useState<boolean>(false);
    const [isUpdatingTimeframe, setIsUpdatingTimeframe] = useState<boolean>(false);

    // Modal Edit Parameter State
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);

    // Sinkronisasi server props ke state & sinkronisasi sessionStorage
    useEffect(() => {
        setBasketTickers(serverBasketTickers);
        setDetailedBasketStocks(serverDetailedStocks);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('user_basket_tickers', JSON.stringify(serverBasketTickers));
            sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(serverDetailedStocks));
        }

        // Sinkronkan Rentang Waktu dan Preset dengan tanggal bursa lookback riil saham di keranjang (sesuai StockAnalysisModal)
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

    // Urutkan saham di keranjang berdasarkan urutan penambahan dari database
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

    // Hitung saham-saham di keranjang yang memiliki return bernilai negatif (< 0)
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

    const hasNegativeReturnStocks = negativeReturnStocks.length > 0;
    const hasMinStocks = basketStocks.length >= 2;

    // Helper kalkulasi tanggal mulai lookback (3x horison) dari preset
    const calculateLookbackStartDate = (
        preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all',
        anchorDateStr: string
    ): string => {
        const minAllowedDate = global_timeframe.min_date?.substring(0, 10) ?? '2023-01-01';

        if (preset === 'all') return minAllowedDate;

        const anchor = new Date(anchorDateStr);
        if (isNaN(anchor.getTime())) return minAllowedDate;

        const target = new Date(anchor);

        if (preset === '1D')       target.setDate(target.getDate() - 7);
        else if (preset === '5D')  target.setDate(target.getDate() - 21);
        else if (preset === '1M')  target.setMonth(target.getMonth() - 3);
        else if (preset === '3M')  target.setMonth(target.getMonth() - 9);
        else if (preset === '6M')  target.setFullYear(target.getFullYear() - 1);
        else if (preset === '1Y')  target.setFullYear(target.getFullYear() - 2);
        else if (preset === '3Y')  target.setFullYear(target.getFullYear() - 6);
        else if (preset === '5Y')  target.setFullYear(target.getFullYear() - 10);

        const formatted = target.toISOString().substring(0, 10);
        return formatted < minAllowedDate ? minAllowedDate : formatted;
    };

    // Deteksi preset yang sedang aktif di keranjang jika seluruh saham menggunakan preset yang sama
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
    const [activePreset, setActivePreset] = useState<string>(() => {
        if (serverBasketTickers.length > 0) {
            const first = serverBasketTickers[0];
            const clean = first.replace('.JK', '');
            const detail = serverDetailedStocks[first] || serverDetailedStocks[clean];
            if (detail?.timeframe?.preset !== undefined) {
                return detail.timeframe.preset || '';
            }
        }
        return initialBasketPreset;
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
        return global_timeframe.min_date ? global_timeframe.min_date.substring(0, 10) : '2023-01-01';
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
    const [riskFreeRate, setRiskFreeRate] = useState<number>(6.0);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Handler update massal horison / rentang tanggal ke seluruh saham di keranjang
    const applyTimeframeToBasket = (params: { preset?: string; start_date?: string; end_date?: string }) => {
        setIsUpdatingTimeframe(true);
        router.post('/user/analyze/basket/timeframe', params, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const label = params.preset ? (params.preset === 'all' ? 'All' : params.preset) : 'kustom';
                toast.success(`Horison analisis seluruh saham berhasil disinkronkan ke ${label}.`);

                // Sinkronkan input Rentang Waktu dengan tanggal bursa lookback riil hasil kalkulasi server (sama persis seperti StockAnalysisModal)
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
                console.error('Failed to update basket timeframe:', errors);
                const msg = Object.values(errors)[0] || 'Gagal memperbarui horison saham di keranjang.';
                toast.error(msg);
            },
            onFinish: () => {
                setIsUpdatingTimeframe(false);
            },
        });
    };

    // 1. Klik Preset -> Update activePreset, sinkronkan input Rentang Waktu (sesuai StockAnalysisModal), dan perbarui seluruh saham di keranjang
    const handlePreset = (preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all') => {
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

    // 2. Input manual Tanggal Mulai & Selesai -> Reset preset aktif
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setActivePreset('');
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setActivePreset('');
    };

    // 3. Tombol Terapkan untuk rentang waktu manual -> Perbarui seluruh saham di keranjang
    const handleApplyDateRange = () => {
        setActivePreset('');
        if (basketStocks.length > 0) {
            applyTimeframeToBasket({ start_date: startDate, end_date: endDate });
        }
    };

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

    // Helper format rentang tanggal (Contoh: 16 Sep 2025 - 16 Sep 2026)
    const formatDateRange = (startStr?: string, endStr?: string) => {
        const s = startStr || startDate;
        const e = endStr || endDate;
        if (!s || !e) return '-';
        return `${formatDate(s)} - ${formatDate(e)}`;
    };

    // 3. HANDLERS FOR BASKET MANIPULATION
    const handleRemoveStock = (ticker: string) => {
        const clean = ticker.replace('.JK', '');
        setIsProcessingBasket(true);
        router.delete(`/user/analyze/basket/${clean}`, {
            preserveScroll: true,
            onSuccess: () => {
                const newTickers = basketTickers.filter((t) => t !== ticker && t !== clean && t !== `${clean}.JK`);
                setBasketTickers(newTickers);

                const newDetails = { ...detailedBasketStocks };
                delete newDetails[ticker];
                delete newDetails[clean];
                delete newDetails[`${clean}.JK`];
                setDetailedBasketStocks(newDetails);

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('user_basket_tickers', JSON.stringify(newTickers));
                    sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(newDetails));
                }
                toast.success(`Saham ${clean} berhasil dihapus dari keranjang.`);
            },
            onError: () => {
                toast.error(`Gagal menghapus saham ${clean} dari keranjang.`);
            },
            onFinish: () => {
                setIsProcessingBasket(false);
            },
        });
    };

    const handleClearAll = () => {
        setIsClearModalOpen(true);
    };

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

    const handleOpenEditModal = (stock: Stock) => {
        setEditingStock(stock);
        setIsEditModalOpen(true);
    };

    const handleUpdateStockInBasket = (dataPayload: AnalyzedStockPayload) => {
        const t = dataPayload.ticker;
        const clean = t.replace('.JK', '');

        setIsProcessingBasket(true);
        router.post('/user/analyze/basket', dataPayload as any, {
            preserveScroll: true,
            onSuccess: () => {
                const newDetails = {
                    ...detailedBasketStocks,
                    [t]: dataPayload,
                    [clean]: dataPayload,
                };
                setDetailedBasketStocks(newDetails);
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(newDetails));
                }

                toast.success(`Parameter analisis untuk ${clean} berhasil diperbarui.`);
                setIsEditModalOpen(false);
                setEditingStock(null);
            },
            onError: () => {
                toast.error(`Gagal memperbarui parameter untuk ${clean}.`);
            },
            onFinish: () => {
                setIsProcessingBasket(false);
            },
        });
    };

    // 4. SUBMIT FORM KE BACKEND OPTIMIZE
    const handleStartAnalyze = (e: React.FormEvent) => {
        e.preventDefault();

        if (basketStocks.length < 2) {
            toast.error('Pilih minimal 2 saham di keranjang agar dapat melakukan analisis.');
            return;
        }

        if (hasNegativeReturnStocks) {
            const tickersList = negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ');
            toast.error(
                `Tidak dapat melakukan analisis: masih terdapat saham dengan return negatif (${tickersList}). Harap sesuaikan parameter rentang waktu saham tersebut atau hapus dari keranjang.`
            );
            return;
        }

        setIsSubmitting(true);

        const maxDate = global_timeframe.max_date
            ? global_timeframe.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);

        const effectiveGlobalStart = startDate;
        const effectiveGlobalEnd = endDate;

        const selectedTickers = basketStocks.map((s) => s.ticker);
        const stocks_timeframes: Record<string, { start_date: string; end_date: string }> = {};

        selectedTickers.forEach((ticker) => {
            const clean = ticker.replace('.JK', '');
            const detailed = detailedBasketStocks[ticker] || detailedBasketStocks[clean];

            const itemStartDate = detailed?.timeframe?.lookback_start || detailed?.timeframe?.start;

            stocks_timeframes[ticker] = {
                start_date: itemStartDate ? itemStartDate.substring(0, 10) : effectiveGlobalStart,
                end_date: detailed?.timeframe?.end ? detailed.timeframe.end.substring(0, 10) : effectiveGlobalEnd,
            };
        });

        const payload = {
            tickers: selectedTickers,
            initial_capital: initialCapital,
            start_date: effectiveGlobalStart,
            end_date: effectiveGlobalEnd,
            risk_free_rate: riskFreeRate,
            horizon_preset: activePreset,
            population_size: 200,
            generations: 100,
            crossover_rate: 0.9,
            mutation_rate: 0.1,
            stocks_timeframes: stocks_timeframes,
        };

        router.post('/user/analyze/optimize', payload, {
            onError: (errors) => {
                console.error('Optimize errors:', errors);
                const msg = Object.values(errors)[0] || 'Terjadi kesalahan saat memproses optimasi portofolio.';
                toast.error(msg);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keranjang Saham" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 mx-auto w-full pb-20">
                {/* HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-500/15 blur-xl" />

                    <div className="relative z-10 flex items-center gap-4 w-full justify-between overflow-hidden">
                        <div className="shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                Keranjang & Optimasi
                            </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button asChild size="sm" className="gap-2 shadow-xs cursor-pointer h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Link href="/user/saham">
                                    <Plus className="h-4 w-4" />
                                    Saham
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* E-COMMERCE STYLE CHECKOUT & SETUP LAYOUT (2-COLUMN GRID) */}
                <form onSubmit={handleStartAnalyze} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: DAFTAR SAHAM DI KERANJANG (lg:col-span-7 xl:col-span-8) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <Card className="border border-border/70 shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 px-4 sm:px-5 border-b border-border/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[32px]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4 text-primary" />
                                            <span>Keranjang Saham</span>
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 text-xs font-mono font-bold bg-primary/10 text-primary"
                                            >
                                                {basketStocks.length} Saham
                                            </Badge>
                                        </CardTitle>
                                        {isUpdatingTimeframe && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] py-0.5 px-2 text-primary border-primary/30 bg-primary/10 flex items-center gap-1 animate-pulse"
                                            >
                                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                <span>Menyinkronkan Seluruh Saham...</span>
                                            </Badge>
                                        )}
                                    </div>

                                    {basketStocks.length > 0 && (
                                        <div className="flex sm:justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearAll}
                                                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer gap-1.5 w-full sm:w-auto"
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                                <span>Kosongkan</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5">
                                {basketStocks.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
                                            <ShoppingBag className="h-6 w-6" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Keranjang Masih Kosong</h4>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                            Silakan kembali ke menu Eksplorasi Saham dan klik tombol <strong>'+'</strong> untuk memasukkan saham ke keranjang.
                                        </p>
                                        <Button asChild size="sm" className="mt-4 gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <Link href="/user/saham">
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                <span>Mulai Pilih Saham</span>
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
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
                                                const timeframeLookbackStart = detailed?.timeframe?.lookback_start;
                                                const timeframeStart = detailed?.timeframe?.start;
                                                const timeframeEnd = detailed?.timeframe?.end;
                                                const timeframePreset = detailed?.timeframe?.preset;
                                                const effectiveStartDate = timeframeLookbackStart || timeframeStart;
                                                const dataPoints =
                                                    detailed?.prices?.length || detailed?.metrics?.data_points;

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
                                                        onClick={() => handleOpenEditModal(stock)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                 e.preventDefault();
                                                                handleOpenEditModal(stock);
                                                            }
                                                        }}
                                                        className={`group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-2xs hover:shadow-md hover:border-primary/40 cursor-pointer select-none active:scale-[0.99] transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                                                            isUpdatingTimeframe ? 'opacity-60 pointer-events-none' : ''
                                                        }`}
                                                    >
                                                        {/* Top Section */}
                                                        <div>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-mono font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                                            {clean}
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-[9px] py-0 px-2 font-semibold rounded-full ${
                                                                                stock.bursa === 'NYSE'
                                                                                    ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10'
                                                                                    : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                                                                            }`}
                                                                        >
                                                                            {stock.bursa || 'IDX'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p
                                                                        className="text-xs text-muted-foreground"
                                                                        title={stock.name || clean}
                                                                    >
                                                                        {stock.name || clean}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenEditModal(stock);
                                                                        }}
                                                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                                                                        title="Ubah Parameter"
                                                                    >
                                                                        <Sliders className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveStock(stock.ticker);
                                                                        }}
                                                                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                                                        title="Hapus dari Keranjang"
                                                                    >
                                                                        <Trash className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Parent Grid Wrapper for Side-by-Side Layout on Tablet/Desktop */}
                                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                                                                {/* Section 1: Grafik Tren & Harga Terakhir */}
                                                                <div className="h-full flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                                            Harga Terakhir
                                                                        </span>
                                                                        <span className="font-mono text-sm font-bold text-foreground">
                                                                            {lastPrice > 0 ? formatRupiah(lastPrice) : '-'}
                                                                        </span>
                                                                        {dataPoints ? (
                                                                            <span className="text-[9px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                                                                                <Clock className="h-2.5 w-2.5 text-primary" />
                                                                                {dataPoints} Hari Bursa
                                                                            </span>
                                                                        ) : null}
                                                                    </div>

                                                                    <div className="flex flex-col items-end">
                                                                        <SparklineChart
                                                                            prices={chartPrices}
                                                                            className="w-24 h-8"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Section 2: Expected Return */}
                                                                {(() => {
                                                                    const hasReturn = typeof expectedReturn === 'number';
                                                                    const isPositive = hasReturn ? expectedReturn >= 0 : true;
                                                                    return (
                                                                        <div
                                                                            className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
                                                                                hasReturn
                                                                                    ? isPositive
                                                                                        ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15'
                                                                                        : 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/15'
                                                                                    : 'border-border/60 bg-muted/20'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span
                                                                                    className={`text-xs font-bold flex items-center gap-1.5 ${
                                                                                        hasReturn
                                                                                            ? isPositive
                                                                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                                                                : 'text-rose-700 dark:text-rose-400'
                                                                                            : 'text-muted-foreground'
                                                                                    }`}
                                                                                >
                                                                                    {isPositive ? (
                                                                                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                                                                    ) : (
                                                                                        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                                                                                    )}
                                                                                    <span>Expected Return</span>
                                                                                </span>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`text-[9px] py-0 px-1.5 font-mono font-bold uppercase rounded-md border ${
                                                                                        isPositive
                                                                                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                                                                            : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30'
                                                                                    }`}
                                                                                >
                                                                                    {timeframePreset
                                                                                            ? (timeframePreset === 'all' ? 'All' : timeframePreset)
                                                                                        : (dataPoints ? `${dataPoints}D` : 'Custom')}
                                                                                </Badge>
                                                                            </div>

                                                                            <div className="flex items-baseline gap-1 my-1">
                                                                                <span
                                                                                    className={`font-mono text-base font-extrabold tracking-tight ${
                                                                                        hasReturn
                                                                                            ? isPositive
                                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                                : 'text-rose-600 dark:text-rose-400'
                                                                                            : 'text-muted-foreground'
                                                                                    }`}
                                                                                >
                                                                                    {hasReturn
                                                                                        ? expectedReturn > 0
                                                                                            ? `+${expectedReturn}%`
                                                                                            : `${expectedReturn}%`
                                                                                        : '-'}
                                                                                </span>
                                                                            </div>

                                                                            {detailed?.metrics?.volatility !== undefined && (
                                                                                <p className="text-[10px] text-muted-foreground leading-tight">
                                                                                    Risiko volatilitas tahunan {detailed.metrics.volatility}%
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* Bottom Footer: Rentang Tanggal Terpilih */}
                                                        <div className="mt-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3 w-3 text-primary" />
                                                                <span className="font-mono">
                                                                    {formatDateRange(effectiveStartDate, timeframeEnd)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!hasMinStocks && basketStocks.length > 0 && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span>
                                                Tambahkan minimal 1 saham lagi ke keranjang agar dapat melakukan analisis.
                                            </span>
                                            {hasNegativeReturnStocks && (
                                                <span className="block text-rose-700 dark:text-rose-400 mt-1">
                                                    Perhatian: Saham ({negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ')}) memiliki return bernilai negatif.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {hasMinStocks && hasNegativeReturnStocks && (
                                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span>
                                                Tidak dapat melakukan analisis: masih terdapat saham dengan return negatif ({negativeReturnStocks.map((s) => s.ticker.replace('.JK', '')).join(', ')}). Harap sesuaikan parameter rentang waktu saham tersebut atau hapus dari keranjang.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: UNIFIED E-COMMERCE CHECKOUT & OPTIMIZATION PARAMETER PANEL */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky">
                        <Card className="border border-border/70 shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 px-4 sm:px-5 border-b border-border/50">
                                <div className="flex items-center justify-between min-h-[32px]">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Sliders className="h-4 w-4 text-primary" />
                                        <span>Optimasi Parameter</span>
                                    </CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5 space-y-4">
                                {/* 1. Modal Investasi */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold flex items-center justify-between">
                                        <span>Total Modal Investasi (IDR)</span>
                                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            min="1000000"
                                            step="500000"
                                            value={initialCapital}
                                            onChange={(e) => setInitialCapital(Number(e.target.value))}
                                            className="pl-9 font-mono text-sm font-bold bg-background"
                                            required
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                        Terbilang: {formatRupiah(initialCapital)}
                                    </span>
                                </div>

                                {/* 2. Risk Free Rate */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold flex items-center justify-between">
                                        <span>Risk-Free Rate (%)</span>
                                        <Shield className="h-3.5 w-3.5 text-emerald-600" />
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.1"
                                            value={riskFreeRate}
                                            onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                                            className="font-mono text-sm font-bold bg-background pr-16"
                                            required
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">
                                            % / thn
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block">
                                        Acuan suku bunga bebas risiko (SBN / BI Rate)
                                    </span>
                                </div>

                                {/* 3A. Horison Analisis Portofolio (Preset) */}
                                <div className="pt-4 border-t border-border/50 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                            <ChartNetwork className="h-4 w-4 text-primary shrink-0" />
                                            <span>Horison Analisis</span>
                                        </span>
                                    </div>

                                    {/* Preset Timeframe Buttons */}
                                    <div className="flex flex-wrap items-center gap-1">
                                        {(['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'all'] as const).map((preset) => (
                                            <Button
                                                key={preset}
                                                type="button"
                                                size="sm"
                                                disabled={isUpdatingTimeframe}
                                                variant={activePreset === preset ? 'default' : 'outline'}
                                                onClick={() => handlePreset(preset)}
                                                className={`h-6 text-[10px] px-2.5 cursor-pointer font-mono transition-all ${
                                                    activePreset === preset
                                                        ? 'shadow-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {isUpdatingTimeframe && activePreset === preset ? (
                                                    <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                                                ) : null}
                                                {preset === 'all' ? 'All' : preset}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3B. Rentang Waktu Portofolio (Input Manual) */}
                                <div className="pt-4 border-t border-border/50 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                                            <span>Rentang Waktu</span>
                                        </span>
                                    </div>

                                    {/* Grid Input Tanggal Manual & Tombol Terapkan */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-semibold text-muted-foreground">Tanggal Mulai</Label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    min={global_timeframe.min_date ? global_timeframe.min_date.substring(0, 10) : '2023-01-01'}
                                                    max={endDate || (global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10))}
                                                    onChange={handleStartDateChange}
                                                    className="font-mono text-xs bg-background h-8"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-semibold text-muted-foreground">Tanggal Selesai</Label>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    min={startDate || (global_timeframe.min_date ? global_timeframe.min_date.substring(0, 10) : '2023-01-01')}
                                                    max={global_timeframe.max_date ? global_timeframe.max_date.substring(0, 10) : new Date().toISOString().substring(0, 10)}
                                                    onChange={handleEndDateChange}
                                                    className="font-mono text-xs bg-background h-8"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Tombol Terapkan (sesuai StockAnalysisModal) */}
                                        <div className="shrink-0">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                disabled={isUpdatingTimeframe || basketStocks.length === 0}
                                                onClick={handleApplyDateRange}
                                                className="h-8 text-xs font-semibold gap-1.5 px-3 cursor-pointer w-full sm:w-auto border border-border/60 hover:bg-muted shadow-2xs flex items-center justify-center"
                                                title="Terapkan rentang waktu ke seluruh saham di keranjang"
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingTimeframe && !activePreset ? 'animate-spin text-primary' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. E-Commerce Order Summary Box */}
                                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Jumlah Saham Terpilih:</span>
                                        <span className="font-mono font-bold text-foreground">{basketStocks.length} Saham</span>
                                    </div>
                                    {hasNegativeReturnStocks && (
                                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
                                            <span>Return Negatif:</span>
                                            <span className="font-mono font-bold">{negativeReturnStocks.length} Saham</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Model Optimasi:</span>
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">NSGA-II + Markowitz</span>
                                    </div>
                                    {basketStocks.length > 0 && (
                                        <div className="pt-1.5 border-t border-border/40 flex flex-wrap gap-1">
                                            {basketStocks.map((s) => {
                                                const clean = s.ticker.replace('.JK', '');
                                                const isNeg = negativeReturnStocks.some((n) => n.id === s.id);
                                                return (
                                                    <Badge
                                                        key={s.id}
                                                        variant={isNeg ? 'outline' : 'secondary'}
                                                        className={`text-[10px] font-mono py-0 px-1.5 ${
                                                            isNeg
                                                                ? 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                                                                : ''
                                                        }`}
                                                        title={isNeg ? `${clean} memiliki return bernilai negatif` : ''}
                                                    >
                                                        {clean}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* 5. Primary Checkout CTA Button */}
                                <div className="space-y-1.5">
                                    <Button
                                        type="submit"
                                        disabled={!hasMinStocks || hasNegativeReturnStocks || isSubmitting}
                                        className="w-full h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs cursor-pointer rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Memproses Optimasi</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 fill-white" />
                                                <span>Analyze</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>

            {/* MODAL DIALOG UBAH PARAMETER TIMEFRAME DARI KERANJANG */}
            {editingStock && (
                <StockAnalysisModal
                    stock={editingStock}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingStock(null);
                    }}
                    onAddToBasket={handleUpdateStockInBasket}
                    isAlreadyInBasket={true}
                    timeframeLimits={global_timeframe}
                    initialTimeframe={
                        detailedBasketStocks[editingStock.ticker]?.timeframe ||
                        detailedBasketStocks[editingStock.ticker.replace('.JK', '')]?.timeframe
                    }
                />
            )}

            {/* MODAL KONFIRMASI KOSONGKAN KERANJANG */}
            <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Kosongkan Keranjang
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mengosongkan seluruh isi keranjang portofolio? Semua pengaturan parameter Anda akan hilang.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" size="sm" className="cursor-pointer">
                                Batal
                            </Button>
                        </DialogClose>
                        <Button variant="destructive" size="sm" onClick={executeClearAll} className="cursor-pointer">
                            Ya, Kosongkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
