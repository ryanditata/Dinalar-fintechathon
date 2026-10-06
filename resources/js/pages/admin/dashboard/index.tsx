import SparklineChart from '@/components/SparklineChart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData, type Stock, type StockStatistics } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Calendar,
    CalendarSync,
    Clock,
    History,
    Layers,
    Radio,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface OptimizationItem {
    id: number;
    user_id: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    tickers: string[];
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
}

interface MonthOption {
    value: string;
    label: string;
    year?: string;
    month?: string;
}

interface Props {
    statistics?: StockStatistics & {
        week_optimizations_count?: number;
        month_optimizations_count?: number;
    };
    recentStocks?: Stock[];
    selectedMonth?: string;
    selectedMonthLabel?: string;
    selectedMonthTotal?: number;
    selectedMonthAvg?: number;
    selectedMonthPeak?: number;
    availableMonths?: MonthOption[];
    optimizationTrendPrices?: number[];
    optimizationTrendDays?: Array<{ date: string; day?: number; label: string; count: number }>;
    recentOptimizations?: OptimizationItem[];
}

export default function Dashboard({
    statistics,
    recentStocks = [],
    selectedMonth,
    selectedMonthLabel,
    selectedMonthTotal,
    selectedMonthAvg,
    selectedMonthPeak,
    availableMonths = [],
    optimizationTrendPrices = [],
    optimizationTrendDays = [],
    recentOptimizations = [],
}: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const [isUpdatingChart, setIsUpdatingChart] = React.useState(false);

    const currentPeriod = React.useMemo(() => {
        if (!selectedMonth) return '2026-08';
        if (!selectedMonth.includes('-')) {
            const yr = new Date().getFullYear();
            return `${yr}-${selectedMonth.padStart(2, '0')}`;
        }
        return selectedMonth;
    }, [selectedMonth]);

    const monthOptions = React.useMemo(() => {
        if (availableMonths && availableMonths.length > 0) return availableMonths;
        const monthsName = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const years = [2026, 2025, 2024];
        const list: MonthOption[] = [];
        for (const yr of years) {
            for (let m = 12; m >= 1; m--) {
                list.push({
                    value: `${yr}-${String(m).padStart(2, '0')}`,
                    label: `${monthsName[m - 1]} ${yr}`,
                    year: String(yr),
                    month: String(m).padStart(2, '0'),
                });
            }
        }
        return list;
    }, [availableMonths]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handlePeriodChange = (periodValue: string) => {
        setIsUpdatingChart(true);
        router.get(
            '/admin/dashboard',
            { month: periodValue },
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'selectedMonth',
                    'selectedMonthLabel',
                    'selectedMonthTotal',
                    'selectedMonthAvg',
                    'selectedMonthPeak',
                    'availableMonths',
                    'optimizationTrendPrices',
                    'optimizationTrendDays',
                ],
                onFinish: () => {
                    setIsUpdatingChart(false);
                },
            }
        );
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            const datePart = new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(d);
            const timePart = new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).format(d).replace('.', ':');
            return `${datePart}, ${timePart}`;
        } catch {
            return dateStr;
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) return 'Selamat Pagi';
        if (hour >= 11 && hour < 15) return 'Selamat Siang';
        if (hour >= 15 && hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Welcome Card */}
                <div className="rounded-2xl border border-border/80 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{getGreeting()}, {auth.user.name}!</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Anda masuk sebagai <span className="font-semibold text-foreground uppercase">{auth.user.role as string}</span> di Sistem Analisis Saham.
                            </p>
                        </div>
                        <Button asChild className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href="/admin/saham">
                                Kelola Data Saham
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistics Overview */}
                {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                        {/* Card 1: User Online */}
                        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors cursor-pointer group">
                            <Link href="/admin/users" className="block p-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">User Online</CardTitle>
                                    <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {(statistics.online_users_count ?? 0).toLocaleString('id-ID')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aktif</span> dalam 5 menit
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>

                        {/* Card 2: Total Optimasi Hari Ini */}
                        <Card className="border-border/60 shadow-xs hover:border-blue-500/40 transition-colors cursor-pointer group">
                            <Link href="/admin/history" className="block p-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Optimasi Hari Ini</CardTitle>
                                    <CalendarSync className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {(statistics.today_optimizations_count ?? 0).toLocaleString('id-ID')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sesi optimasi hari ini
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>

                        {/* Card 3: Total Optimasi Keseluruhan */}
                        <Card className="border-border/60 shadow-xs hover:border-purple-500/40 transition-colors cursor-pointer group">
                            <Link href="/admin/history" className="block p-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Optimasi</CardTitle>
                                    <Layers className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {(statistics.total_optimizations_count ?? 0).toLocaleString('id-ID')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Akumulasi portofolio
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>

                        {/* Card 4: Total Saham */}
                        <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-colors cursor-pointer group">
                            <Link href="/admin/saham" className="block p-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Saham</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {statistics.total_stocks.toLocaleString('id-ID')}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{statistics.active_stocks_count} aktif</span> scraping
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>

                        {/* Card 5: Update Harga Terakhir */}
                        <Card className="border-border/60 shadow-xs hover:border-amber-500/40 transition-colors cursor-pointer group">
                            <Link href="/admin/saham" className="block p-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Harga Terkini</CardTitle>
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg sm:text-xl font-bold truncate" title={formatDate(statistics.last_price_date)}>
                                        {formatDate(statistics.last_price_date)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tanggal penutupan terbaru
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>
                )}

                {/* 2. OPTIMIZATION ACTIVITY CHART & RECENT OPTIMIZATIONS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Total Optimasi Sparkline Trend Chart (lg:col-span-7) */}
                    <Card className="lg:col-span-7 border-border/70 shadow-sm flex flex-col justify-between">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center">
                                    <div>
                                        <CardTitle className="text-lg font-bold">Tren Aktivitas Optimasi Portofolio</CardTitle>
                                        <CardDescription className="text-xs">
                                            Frekuensi optimasi portofolio harian pada bulan {selectedMonthLabel || 'ini'}.
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                    {/* Month & Year Selector */}
                                    <Select
                                        value={currentPeriod}
                                        onValueChange={handlePeriodChange}
                                        disabled={isUpdatingChart}
                                    >
                                        <SelectTrigger className="w-[160px] h-8 text-xs bg-background/80">
                                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder="Pilih Bulan & Tahun" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72">
                                            {monthOptions.map((m) => (
                                                <SelectItem key={m.value} value={m.value} className="text-xs">
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className={`space-y-4 pt-2 transition-opacity duration-200 ${isUpdatingChart ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {/* Summary Mini Bar for the selected month */}
                            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">Total Bulan Ini</span>
                                    <span className="font-bold text-foreground text-sm font-mono">
                                        {selectedMonthTotal ?? 0} <span className="font-normal text-[10px] text-muted-foreground">Sesi</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">Rata-rata Harian</span>
                                    <span className="font-bold text-foreground text-sm font-mono">
                                        {selectedMonthAvg ?? 0} <span className="font-normal text-[10px] text-muted-foreground">Sesi/hari</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">Puncak Tertinggi</span>
                                    <span className="font-bold text-foreground text-sm font-mono">
                                        {selectedMonthPeak ?? 0} <span className="font-normal text-[10px] text-muted-foreground">Sesi</span>
                                    </span>
                                </div>
                            </div>

                            {/* Sparkline Chart Component */}
                            <div className="relative rounded-xl border border-border/60 bg-gradient-to-b from-card/80 via-card/50 to-muted/20 p-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span className="font-medium flex items-center gap-1.5">
                                        <Activity className="h-3.5 w-3.5 text-emerald-500" />
                                        Grafik Optimasi
                                    </span>
                                    <span className="text-[11px] font-mono">
                                        {optimizationTrendDays?.[0]?.label} - {optimizationTrendDays?.[optimizationTrendDays.length - 1]?.label}
                                    </span>
                                </div>

                                <SparklineChart
                                    prices={optimizationTrendPrices && optimizationTrendPrices.length > 0 ? optimizationTrendPrices : [0, 0]}
                                    labels={optimizationTrendDays.map(d => `${d.label}`)}
                                    showTooltip={true}
                                    className="w-full h-44 sm:h-52"
                                />

                                {/* Date Timeline Ticks */}
                                {optimizationTrendDays && optimizationTrendDays.length > 0 && (
                                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/40 mt-2">
                                        <span>{optimizationTrendDays[0].label}</span>
                                        <span>{optimizationTrendDays[Math.floor(optimizationTrendDays.length / 2)].label}</span>
                                        <span>{optimizationTrendDays[optimizationTrendDays.length - 1].label}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Recent Optimizations List (lg:col-span-5) */}
                    <Card className="lg:col-span-5 border-border/70 shadow-sm flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div>
                                        <CardTitle className="text-lg font-bold">Optimasi Terbaru</CardTitle>
                                        <CardDescription className="text-xs">
                                            Portofolio yang baru saja dianalisis pengguna.
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button variant="link" size="sm" asChild className="p-0 text-xs text-primary">
                                    <Link href="/admin/history">Detail</Link>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-2.5 pt-0">
                            {recentOptimizations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground min-h-[220px]">
                                    <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-sm font-medium">Belum ada aktivitas optimasi</p>
                                    <p className="text-xs mt-1">Data simulasi portofolio user akan tampil di sini.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {recentOptimizations.map((item) => {
                                        const tickerList = Array.isArray(item.tickers)
                                            ? item.tickers.map((t) => t.replace('.JK', '')).join(', ')
                                            : '-';
                                        const tickerCount = Array.isArray(item.tickers) ? item.tickers.length : 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                                            >
                                                {/* Left: Avatar + User Info */}
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <Avatar className="h-9 w-9 overflow-hidden rounded-full border border-border/50 shrink-0">
                                                        <AvatarImage src={item.user?.avatar} alt={item.user?.name || 'User'} />
                                                        <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white font-semibold text-xs">
                                                            {getInitials(item.user?.name || 'User')}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        {/* Line 1: User Name + Reference Code Badge */}
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                                                                {item.user?.name || `User #${item.user_id}`}
                                                            </span>
                                                            <span className="font-mono text-[8px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                                                {item.reference_code || `DNL${item.user_id}-${item.id}`}
                                                            </span>
                                                        </div>

                                                        {/* Line 2: Ticker Count + Ticker List */}
                                                        <div className="flex items-center gap-1.5 mt-0.5 text-xs min-w-0">
                                                            <span className="font-bold text-foreground text-[11px] shrink-0">
                                                                {tickerCount} Saham
                                                            </span>
                                                            <span className="text-muted-foreground/40 shrink-0">•</span>
                                                            <span
                                                                className="text-[11px] text-muted-foreground truncate"
                                                                title={tickerList}
                                                            >
                                                                {tickerList}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Date/Time + Modal */}
                                                <div className="text-right shrink-0 flex flex-col items-end justify-center pl-1">
                                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
                                                        {formatDateTime(item.created_at)}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                                                        Rp {Number(item.initial_capital || 0).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
