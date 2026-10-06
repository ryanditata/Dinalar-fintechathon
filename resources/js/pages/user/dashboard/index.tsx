import SparklineChart from '@/components/SparklineChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    ShoppingBag,
    BriefcaseBusiness,
    CandlestickChart,
    ChevronRight,
    Clock,
    Coins,
    FolderClock,
    History,
    Info,
    Layers,
    LineChart,
    Moon,
    Plus,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Sun,
    Sunrise,
    Sunset,
    Tag,
    TrendingDown,
    TrendingUp,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/user/dashboard',
    },
];

interface StockItem {
    id: number;
    ticker: string;
    name: string;
    bursa?: string;
    latest_price?: {
        close_price: number;
        date: string;
    };
    change?: number | null;
    change_percent?: number | null;
    recent_prices?: number[];
    analysis_count?: number;
}

interface PortfolioItem {
    id: number;
    user_id: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    risk_free_rate?: number;
    tickers: string[];
    best_portfolios?: {
        sharpe?: {
            return: number;
            risk: number;
            sharpe: number;
        };
        min_variance?: {
            return: number;
            risk: number;
            sharpe: number;
        };
        max_return?: {
            return: number;
            risk: number;
            sharpe: number;
        };
    };
    created_at: string;
}

interface DashboardProps {
    popular_stocks?: StockItem[];
    top_gainers?: StockItem[];
    top_losers?: StockItem[];
    recent_optimizations?: PortfolioItem[];
    latest_portfolio?: PortfolioItem | null;
    total_user_optimizations?: number;
    total_stocks_count?: number;
    risk_free_rate?: number;
    last_updated?: string;
}

export default function UserDashboard({
    popular_stocks = [],
    top_gainers = [],
    top_losers = [],
    recent_optimizations = [],
    latest_portfolio = null,
    total_user_optimizations = 0,
    total_stocks_count = 0,
    risk_free_rate = 6.0,
    last_updated,
}: DashboardProps) {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;
    const serverBasketCount = pageProps.basket_count;
    const serverBasketTickers = pageProps.basket_tickers;
    const [stockTab, setStockTab] = useState<'popular' | 'gainers' | 'losers'>('popular');

    // Basket Stocks State from Database & SessionStorage
    const [basketStocks, setBasketStocks] = useState<string[]>(() => {
        if (serverBasketTickers && serverBasketTickers.length > 0) return serverBasketTickers;
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

    useEffect(() => {
        if (serverBasketTickers) {
            setBasketStocks(serverBasketTickers);
        }
    }, [serverBasketTickers]);

    useEffect(() => {
        const handleStorageChange = () => {
            if (typeof window !== 'undefined') {
                try {
                    const saved = sessionStorage.getItem('user_basket_tickers');
                    setBasketStocks(saved ? JSON.parse(saved) : []);
                } catch (e) {
                    setBasketStocks([]);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Dynamic greeting based on current time
    const getGreetingInfo = () => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            return { text: 'Selamat Pagi', icon: Sunrise, color: 'text-amber-500' };
        }
        if (hour >= 11 && hour < 15) {
            return { text: 'Selamat Siang', icon: Sun, color: 'text-amber-500' };
        }
        if (hour >= 15 && hour < 18) {
            return { text: 'Selamat Sore', icon: Sunset, color: 'text-orange-500' };
        }
        return { text: 'Selamat Malam', icon: Moon, color: 'text-indigo-400' };
    };

    const greeting = getGreetingInfo();
    const GreetingIcon = greeting.icon;

    // Helper format Rupiah
    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '-';
        return `${Number(val).toLocaleString('id-ID')}`;
    };

    // Format Percentage
    const formatPercent = (val: number | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '0.00%';
        return `${Number(val).toFixed(2)}%`;
    };

    // Format Date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Get active stock tab list
    const activeStockList =
        stockTab === 'popular'
            ? popular_stocks
            : stockTab === 'gainers'
                ? top_gainers
                : top_losers;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 mx-auto w-full pb-20">
                {/* 1. HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-500/15 blur-xl" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center min-w-0 max-w-full">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs max-w-full">
                                <GreetingIcon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${greeting.color}`} />
                                <span className="truncate">{greeting.text}, {auth.user.name}</span>
                            </span>
                        </div>

                        <div className="flex flex-row-reverse sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                            {/* Tombol Keranjang */}
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="relative h-9 w-9 shrink-0 overflow-visible border-emerald-600/20 bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 shadow-xs cursor-pointer"
                            >
                                <Link href="/user/analyze/keranjang">
                                    <ShoppingBag className="h-4 w-4" />
                                    <Badge
                                        variant="default"
                                        className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold leading-none bg-emerald-600 hover:bg-emerald-600 text-white border-2 border-background shadow-xs pointer-events-none z-10"
                                    >
                                        {serverBasketCount !== undefined ? serverBasketCount : basketStocks.length}
                                    </Badge>
                                </Link>
                            </Button>

                            {/* Tombol Jelajahi */}
                            <Button
                                asChild
                                size="sm"
                                className="gap-2 shadow-xs cursor-pointer h-9 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial justify-center"
                            >
                                <Link href="/user/saham">
                                    Jelajahi Saham
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. TOP / POPULAR STOCKS & MOVERS */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">Pantauan Saham Bursa</h2>
                        </div>

                        {/* Tabs Switcher */}
                        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/60 p-1 text-xs font-semibold self-start sm:self-auto">
                            <button
                                onClick={() => setStockTab('popular')}
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${stockTab === 'popular'
                                        ? 'bg-background text-foreground shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Saham Pilihan
                            </button>
                            <button
                                onClick={() => setStockTab('gainers')}
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${stockTab === 'gainers'
                                        ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Top Gainers
                            </button>
                            <button
                                onClick={() => setStockTab('losers')}
                                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${stockTab === 'losers'
                                        ? 'bg-background text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Top Losers
                            </button>
                        </div>
                    </div>

                    {activeStockList.length === 0 ? (
                        <Card className="border border-border/70 p-8 text-center">
                            <p className="text-xs text-muted-foreground">Belum ada data saham populer tersimpan saat ini.</p>
                            <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                                <Link href="/user/saham">Eksplorasi Saham</Link>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeStockList.map((stock) => {
                                const cleanTicker = stock.ticker.replace('.JK', '');
                                const isPositive = (stock.change_percent || 0) >= 0;
                                const lastPrice = stock.latest_price ? Number(stock.latest_price.close_price) : 0;

                                return (
                                    <Card
                                        key={stock.id}
                                        onClick={() => router.visit('/user/saham')}
                                        className="border border-border/70 shadow-2xs hover:border-primary/50 hover:shadow-md transition-all duration-200 group cursor-pointer active:scale-[0.99]"
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                                                            {cleanTicker}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] py-0 px-1.5 font-semibold ${
                                                                stock.bursa === 'NYSE'
                                                                    ? 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                                                                    : 'border-blue-500/30 text-blue-600 bg-blue-500/5'
                                                            }`}
                                                        >
                                                            {stock.bursa || 'IDX'}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground block truncate max-w-[180px] mt-0.5">
                                                        {stock.name}
                                                    </span>
                                                </div>

                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-[11px] h-7 px-2 cursor-pointer border-border/60 hover:bg-emerald-600 hover:text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link href="/user/saham">Analisis</Link>
                                                </Button>
                                            </div>

                                            <div className="flex items-end justify-between pt-1">
                                                <div>
                                                    <span className="font-mono font-extrabold text-sm text-foreground block">
                                                        {lastPrice > 0 ? formatRupiah(lastPrice) : '-'}
                                                    </span>
                                                    {stock.change_percent !== null && stock.change_percent !== undefined && (
                                                        <span
                                                            className={`text-[11px] font-mono font-bold flex items-center gap-0.5 mt-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                                }`}
                                                        >
                                                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                            {isPositive ? '+' : ''}
                                                            {stock.change_percent.toFixed(2)}%
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Mini Sparkline Chart */}
                                                {stock.recent_prices && stock.recent_prices.length > 1 && (
                                                    <div className="w-24 h-8 shrink-0">
                                                        <SparklineChart prices={stock.recent_prices} className="w-24 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. OVERVIEW & QUICK METRICS */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">Overview</h2>
                        </div>
                    </div>

                    {/* 4 Quick Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                        {/* Card 1: Simulasi Tersimpan */}
                        <Card className="border border-border/70 shadow-2xs bg-card/50 hover:border-emerald-500/40 transition-colors">
                            <Link href="/user/analyze/history" className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden block">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <History className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Portofolio Tersimpan</span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                        {total_user_optimizations} <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">Portofolio</span>
                                    </span>
                                </div>
                            </Link>
                        </Card>

                        {/* Card 2: Saham Dianalisis */}
                        <Card className="border border-border/70 shadow-2xs bg-card/50 hover:border-emerald-500/40 transition-colors">
                            <Link href="/user/saham" className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden block">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Total Saham</span>
                                    <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                        {total_stocks_count} <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">Saham</span>
                                    </span>
                                </div>
                            </Link>
                        </Card>

                        {/* Card 3: Optimasi AI */}
                        <Card className="border border-border/70 shadow-2xs bg-card/50 hover:border-emerald-500/40 transition-colors">
                            <Link href="/user/analyze/keranjang" className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden block">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Optimasi AI</span>
                                    <span className="text-xs sm:text-sm font-extrabold text-foreground truncate block">
                                        NSGA-II + Markowitz
                                    </span>
                                </div>
                            </Link>
                        </Card>

                        {/* Card 4: Risk-Free Rate */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="border border-border/70 shadow-2xs bg-card/50 cursor-pointer hover:border-emerald-500/40 transition-colors">
                                        <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Risk-Free Rate (Rf)</span>
                                                <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                                    {risk_free_rate}% <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">SBN/BI</span>
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Digunakan sebagai acuan dalam perhitungan Sharpe Ratio.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* 4. PORTFOLIO / ANALYSIS SUMMARY CARD (If Latest Portfolio Exists) */}
                {latest_portfolio && latest_portfolio.best_portfolios?.sharpe ? (
                    <Card className="border border-primary/30 bg-gradient-to-r from-emerald-500/10 via-card to-background shadow-xs overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <span>Portofolio Terakhir Anda</span>
                                        <span className="inline-flex items-center gap-1 font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                            {latest_portfolio.reference_code || `DNL${latest_portfolio.user_id}-${latest_portfolio.id}`}
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Riwayat portofolio terbaru pada {formatDate(latest_portfolio.created_at)} ({latest_portfolio.tickers?.length || 0} Saham)
                                    </CardDescription>
                                </div>

                                <Button asChild size="sm" className="gap-1 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                                    <Link href={`/user/analyze/result/${latest_portfolio.id}`}>
                                        <span>Detail</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                                    <span className="text-[11px] text-muted-foreground font-sans block">Expected Return E(R)</span>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatPercent(latest_portfolio.best_portfolios.sharpe.return)}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 font-sans font-semibold">Tahunan</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(10, (latest_portfolio.best_portfolios.sharpe.return || 0) * 3))}%` }} />
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                                    <span className="text-[11px] text-muted-foreground font-sans block">Volatilitas Risiko (σ)</span>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-extrabold text-foreground">
                                            {formatPercent(latest_portfolio.best_portfolios.sharpe.risk)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-sans font-semibold">Risiko Pasat</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(10, (latest_portfolio.best_portfolios.sharpe.risk || 0) * 3))}%` }} />
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                                    <span className="text-[11px] text-muted-foreground font-sans block">Sharpe Ratio</span>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-extrabold text-primary">
                                            {latest_portfolio.best_portfolios.sharpe.sharpe?.toFixed(2) || '0.00'}
                                        </span>
                                        <span className="text-[10px] text-primary font-sans font-semibold">Optimal</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(10, (latest_portfolio.best_portfolios.sharpe.sharpe || 0) * 50))}%` }} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border border-border/70 bg-muted/10">
                        <div className="p-6 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Belum Memiliki Portofolio Tersimpan</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                    Mulai optimasi portofolio dengan memilih minimal 2 saham dari menu Eksplorasi Saham.
                                </p>
                            </div>
                            <Button asChild size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Link href="/user/saham">
                                    <Search className="h-3.5 w-3.5" />
                                    <span>Eksplorasi Saham Sekarang</span>
                                </Link>
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

// Helper formatting timestamp
function lastDateFormatted(dateStr?: string) {
    if (!dateStr) return new Date().toLocaleDateString('id-ID');
    try {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}
