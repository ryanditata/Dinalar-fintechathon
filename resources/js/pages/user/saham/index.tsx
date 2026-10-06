import StockAnalysisModal, { type AnalyzedStockPayload } from '@/components/StockAnalysisModal';
import SparklineChart from '@/components/SparklineChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData, type SharedData, type Stock } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Check,
    LineChart,
    Plus,
    Search,
    ShoppingBag,
    Sparkles,
    RefreshCw,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
];

const SECTORS = [
    'Technology',
    'Financial Services',
    'Industrials',
    'Consumer Cyclical',
    'Communication Services',
    'Healthcare',
    'Energy',
    'Consumer Defensive',
    'Basic Materials',
    'Real Estate',
    'Utilities',
];

interface Props {
    stocks: Stock[] | PaginatedData<Stock>;
    filters?: {
        search?: string;
        bursa?: string;
        sector?: string;
    };
    bursa_list?: string[];
    availableSectors?: string[];
    total_count?: number;
    timeframe_limits?: {
        min_date?: string | null;
        max_date?: string | null;
    };
}

export default function UserStockIndex({
    stocks,
    filters = {},
    bursa_list = ['IDX', 'NYSE'],
    availableSectors,
    total_count,
    timeframe_limits,
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBursa, setSelectedBursa] = useState(filters.bursa || 'all');
    const [selectedSector, setSelectedSector] = useState(filters.sector || 'all');

    const pageProps = usePage<SharedData>().props;
    const serverBasketTickers = (pageProps.basket_tickers as string[]) || [];

    // Basket State (Synchronized with Database via shared props)
    const [basketStocks, setBasketStocks] = useState<string[]>(() => {
        if (serverBasketTickers.length > 0) return serverBasketTickers;
        if (typeof window !== 'undefined') {
            try {
                const saved = sessionStorage.getItem('user_basket_tickers');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    const [detailedBasketStocks, setDetailedBasketStocks] = useState<Record<string, AnalyzedStockPayload>>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = sessionStorage.getItem('user_basket_detailed_stocks');
                return saved ? JSON.parse(saved) : {};
            } catch (e) {
                return {};
            }
        }
        return {};
    });

    // Sinkronkan state dengan server props basket_tickers
    useEffect(() => {
        if (serverBasketTickers && serverBasketTickers.length > 0) {
            setBasketStocks(serverBasketTickers);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('user_basket_tickers', JSON.stringify(serverBasketTickers));
            }
        }
    }, [serverBasketTickers]);

    // Modal Dialog State (Kotak 1 & 2 Flowchart fase_pemilihan_saham.png)
    const [selectedStockForModal, setSelectedStockForModal] = useState<Stock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Sync state dari sessionStorage setiap kali modal dibuka/ditutup
    useEffect(() => {
        if (typeof window !== 'undefined' && isModalOpen) {
            try {
                const savedTickers = sessionStorage.getItem('user_basket_tickers');
                if (savedTickers) setBasketStocks(JSON.parse(savedTickers));

                const savedDetails = sessionStorage.getItem('user_basket_detailed_stocks');
                if (savedDetails) setDetailedBasketStocks(JSON.parse(savedDetails));
            } catch (e) {
                console.error('Failed sync from sessionStorage:', e);
            }
        }
    }, [isModalOpen]);

    // Helper format harga IDR dari database
    const formatPrice = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Filter server-side
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchQuery, selectedBursa, selectedSector);
    };

    const handleBursaChange = (bursa: string) => {
        setSelectedBursa(bursa);
        applyFilters(searchQuery, bursa, selectedSector);
    };

    const handleSectorChange = (sector: string) => {
        setSelectedSector(sector);
        applyFilters(searchQuery, selectedBursa, sector);
    };

    const applyFilters = (search: string, bursa: string, sector: string) => {
        router.get(
            '/user/saham',
            {
                search: search || undefined,
                bursa: bursa !== 'all' ? bursa : undefined,
                sector: sector !== 'all' ? sector : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        applyFilters('', selectedBursa, selectedSector);
    };

    // Buka Modal Analisis & Pemilihan Saham (Fase 1)
    const handleOpenAnalysisModal = (stock: Stock) => {
        setSelectedStockForModal(stock);
        setIsModalOpen(true);
    };

    // Handler Add to Basket dari Modal (Kotak 5 Flowchart)
    const handleAddAnalyzedStockToBasket = (payload: AnalyzedStockPayload) => {
        const ticker = payload.ticker;
        const clean = ticker.replace('.JK', '');

        // Update list tickers
        let updatedTickers = [...basketStocks];
        if (!updatedTickers.includes(ticker) && !updatedTickers.includes(clean)) {
            updatedTickers.push(ticker);
        }
        setBasketStocks(updatedTickers);

        // Update list detailed objects in sessionStorage
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('user_basket_tickers', JSON.stringify(updatedTickers));

                const savedDetailsStr = sessionStorage.getItem('user_basket_detailed_stocks');
                let savedDetails: Record<string, AnalyzedStockPayload> = savedDetailsStr ? JSON.parse(savedDetailsStr) : {};
                savedDetails[ticker] = payload;
                savedDetails[clean] = payload;
                sessionStorage.setItem('user_basket_detailed_stocks', JSON.stringify(savedDetails));
                setDetailedBasketStocks(savedDetails);
            } catch (e) {
                console.error('Failed saving basket to sessionStorage:', e);
            }
        }

        // Simpan ke database via backend route
        router.post('/user/analyze/basket', payload as any, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(`Saham ${clean} berhasil ditambahkan ke keranjang portofolio!`);
            },
            onError: () => {
                toast.error(`Gagal menyimpan saham ${clean} ke keranjang.`);
            },
        });
    };

    const stockList = Array.isArray(stocks) ? stocks : stocks?.data || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Eksplorasi Saham" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 mx-auto w-full pb-16">
                {/* 1. HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                    {/* Background Decorative Glow Orbs */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-500/15 blur-xl" />

                    <div className="relative z-10 flex items-center gap-4 w-full justify-between overflow-hidden min-h-9">
                        <div className="shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                Market Explorer
                            </span>
                        </div>

                        {/* Running Ticker (Marquee) */}
                        {stockList.length > 0 && (
                            <div className="flex-1 overflow-hidden flex items-center relative mask-image-linear-edges">
                                <div className="flex animate-marquee whitespace-nowrap py-0.5">
                                    {[...stockList, ...stockList].map((item, idx) => {
                                        const change = item.change_percent;
                                        const isUp = change !== null && change !== undefined && change > 0;
                                        const isDown = change !== null && change !== undefined && change < 0;

                                        const colorClass = isUp
                                            ? 'text-emerald-500'
                                            : isDown
                                                ? 'text-rose-500'
                                                : 'text-gray-400';

                                        return (
                                            <div
                                                key={`${item.id}-${idx}`}
                                                className="font-mono font-bold text-sm mx-4 flex items-center gap-1.5 shrink-0 select-none"
                                            >
                                                <span className="text-foreground/90">{item.ticker.replace('.JK', '')}</span>
                                                <span className={`flex items-center gap-0.5 ${colorClass}`}>
                                                    {isUp ? '▲' : isDown ? '▼' : '•'}
                                                    {change !== null && change !== undefined
                                                        ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
                                                        : '0.00%'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. AREA SEARCH & FILTER (Top Bar) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between w-full gap-3 sm:gap-4">
                    {/* KELOMPOK ATAS / KIRI (Search Input + Mobile Cart Button) */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto flex-1 max-w-none lg:max-w-md xl:max-w-lg">
                        <form onSubmit={handleSearch} className="flex-1 min-w-0 lg:w-96 lg:flex-none">
                            <div className="relative w-full h-10">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari kode atau nama saham..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-9 h-10 text-sm bg-background border-border/70 shadow-2xs w-full rounded-lg"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Keranjang Button untuk Mobile/Tablet (< lg) */}
                        <Button
                            asChild
                            variant="default"
                            className="lg:hidden relative gap-2 shadow-xs cursor-pointer h-10 px-3.5 sm:px-4 text-xs sm:text-sm shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        >
                            <Link href="/user/analyze/keranjang">
                                <ShoppingBag className="h-4 w-4" />
                                <span className="hidden sm:inline">Keranjang</span>
                                <Badge
                                    variant="secondary"
                                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-primary-foreground text-primary shadow-xs border border-primary/20 p-0"
                                >
                                    {basketStocks.length}
                                </Badge>
                            </Link>
                        </Button>
                    </div>

                    {/* KELOMPOK BAWAH / KANAN (Toggle Bursa, Filter Sektor & Desktop Cart Button) */}
                    <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
                        {/* Toggle Filter Bursa */}
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs sm:text-sm h-10 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleBursaChange('all')}
                                className={`px-2.5 sm:px-3 py-1.5 h-full flex items-center rounded-md font-medium transition-colors cursor-pointer text-xs sm:text-sm ${
                                    selectedBursa === 'all'
                                        ? 'bg-background text-foreground shadow-xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Semua
                            </button>
                            {(bursa_list || ['IDX', 'NYSE']).map((bursa) => {
                                const isSelected = selectedBursa === bursa;
                                const colorClass =
                                    bursa === 'IDX'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : bursa === 'NYSE'
                                            ? 'text-purple-600 dark:text-purple-400'
                                            : 'text-foreground';

                                return (
                                    <button
                                        key={bursa}
                                        type="button"
                                        onClick={() => handleBursaChange(bursa)}
                                        className={`px-2.5 sm:px-3 py-1.5 h-full flex items-center rounded-md font-medium transition-colors cursor-pointer text-xs sm:text-sm ${
                                            isSelected
                                                ? `bg-background ${colorClass} shadow-xs font-semibold`
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {bursa}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Sektor */}
                        <div className="flex-1 lg:flex-initial min-w-[130px] sm:min-w-[155px]">
                            <Select value={selectedSector} onValueChange={handleSectorChange}>
                                <SelectTrigger className="w-full sm:w-[155px] h-10 text-xs sm:text-sm bg-background border-border/70 rounded-lg focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer">
                                    <SelectValue placeholder="Semua Sektor" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="all">Semua Sektor</SelectItem>
                                    {(availableSectors || SECTORS).map((sector) => (
                                        <SelectItem key={sector} value={sector}>
                                            {sector}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Keranjang Summary Button untuk Desktop (>= lg) */}
                        <Button
                            asChild
                            variant="default"
                            className="hidden lg:inline-flex relative gap-2 shadow-xs cursor-pointer h-10 px-4 text-xs sm:text-sm shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        >
                            <Link href="/user/analyze/keranjang">
                                <ShoppingBag className="h-4 w-4" />
                                <span>Keranjang</span>
                                <Badge
                                    variant="secondary"
                                    className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-primary-foreground text-primary shadow-xs border border-primary/20 p-0"
                                >
                                    {basketStocks.length}
                                </Badge>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Info Total */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground px-1 -mt-2 -mb-2">
                    <span>
                        Menampilkan <strong className="text-foreground">{stockList.length}</strong> emiten saham
                        {total_count !== undefined && total_count !== stockList.length ? ` dari total ${total_count} saham` : ''}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedBursa !== 'all' && (
                            <span>
                                Bursa: <strong className="text-primary">{selectedBursa}</strong>
                            </span>
                        )}
                        {selectedSector !== 'all' && (
                            <span>
                                Sektor: <strong className="text-foreground">{selectedSector}</strong>
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. CARD GRID AREA */}
                {stockList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center flex flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
                            <Search className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Tidak Ada Saham Ditemukan</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                            Tidak ditemukan emiten yang cocok dengan kriteria pencarian "{searchQuery}". Coba kata kunci lain atau reset filter.
                        </p>
                        <Button
                            size="sm"
                            onClick={() => {
                                setSearchQuery('');
                                handleBursaChange('all');
                            }}
                            className="mt-4 gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset Pencarian</span>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stockList.map((stock) => {
                            const isAdded = basketStocks.includes(stock.ticker) || basketStocks.includes(stock.ticker.replace('.JK', ''));
                            const changeVal = stock.change_percent;

                            return (
                                <Card
                                    key={stock.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleOpenAnalysisModal(stock)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleOpenAnalysisModal(stock);
                                        }
                                    }}
                                    className={`group border cursor-pointer select-none transition-all duration-200 hover:shadow-md hover:border-primary/50 active:scale-[0.99] bg-card focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                                        isAdded ? 'ring-1 ring-primary/40 border-primary/40' : 'border-border/70'
                                    }`}
                                >
                                    <div className="flex items-center justify-between p-4 gap-3">
                                        {/* AREA KIRI: Informasi Emiten */}
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-base text-foreground font-mono tracking-tight group-hover:text-primary transition-colors">
                                                    {stock.ticker.replace('.JK', '')}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] py-0 px-1.5 font-semibold ${
                                                        stock.bursa === 'NYSE'
                                                            ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                                                            : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                                                    }`}
                                                >
                                                    {stock.bursa || 'IDX'}
                                                </Badge>
                                            </div>
                                            <p
                                                className="text-xs text-muted-foreground truncate max-w-36 sm:max-w-44 mt-0.5"
                                                title={stock.name || stock.ticker}
                                            >
                                                {stock.name || stock.ticker.replace('.JK', '')}
                                            </p>
                                        </div>

                                        {/* AREA TENGAH: Sparkline */}
                                        <div className="flex-1 px-1 flex items-center justify-center">
                                            <SparklineChart
                                                prices={stock.recent_prices || []}
                                                className="w-18 h-8"
                                            />
                                        </div>

                                        {/* AREA KANAN: Harga & Tombol '+' Modal Trigger */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-base font-mono text-foreground leading-tight">
                                                    {stock.latest_price
                                                        ? formatPrice(stock.latest_price.close_price)
                                                        : '-'}
                                                </span>
                                                {changeVal !== null && changeVal !== undefined ? (
                                                    <span
                                                        className={`text-xs font-medium font-mono ${
                                                            changeVal > 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : changeVal < 0
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {changeVal > 0 ? `▲ +${changeVal.toFixed(2)}%` : changeVal < 0 ? `▼ ${changeVal.toFixed(2)}%` : '0.00%'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-400">-</span>
                                                )}
                                            </div>

                                            {/* TOMBOL '+' TRIGGER MODAL (Kotak 1 Flowchart) */}
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant={isAdded ? 'default' : 'outline'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenAnalysisModal(stock);
                                                }}
                                                className={`h-9 w-9 rounded-lg cursor-pointer transition-all shrink-0 ${
                                                    isAdded
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                                        : 'border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40'
                                                }`}
                                                title={isAdded ? 'Buka Analisis (Sudah di Keranjang)' : 'Analisis & Tambah ke Keranjang'}
                                            >
                                                {isAdded ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 4. MODAL DIALOG ANALISIS & PEMILIHAN SAHAM */}
            <StockAnalysisModal
                stock={selectedStockForModal}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToBasket={handleAddAnalyzedStockToBasket}
                isAlreadyInBasket={
                    selectedStockForModal
                        ? basketStocks.includes(selectedStockForModal.ticker) ||
                          basketStocks.includes(selectedStockForModal.ticker.replace('.JK', ''))
                        : false
                }
                timeframeLimits={timeframe_limits}
                initialTimeframe={
                    selectedStockForModal
                        ? detailedBasketStocks[selectedStockForModal.ticker]?.timeframe ||
                          detailedBasketStocks[selectedStockForModal.ticker.replace('.JK', '')]?.timeframe
                        : undefined
                }
            />
        </AppLayout>
    );
}
