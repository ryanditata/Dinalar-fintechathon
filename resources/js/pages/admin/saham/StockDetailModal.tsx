import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Stock } from '@/types';
import {
    Activity,
    AlertCircle,
    Building2,
    Calendar,
    Check,
    ChevronRight,
    Clock,
    Copy,
    Database,
    Edit,
    ExternalLink,
    Layers,
    LineChart as LineChartIcon,
    Loader2,
    Power,
    Sparkles,
    Tag,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { copyTextToClipboard } from '@/hooks/useExportShare';

interface PriceRecord {
    id?: number;
    date: string;
    close_price: number;
}

interface PriceStats {
    high: number | null;
    low: number | null;
    avg: number | null;
    count: number;
}

interface StockDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stock: Stock | null;
    onEdit?: (stock: Stock) => void;
    onToggleActive?: (stock: Stock) => void;
    isToggling?: boolean;
}

export default function StockDetailModal({
    open,
    onOpenChange,
    stock,
    onEdit,
    onToggleActive,
    isToggling = false,
}: StockDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'info'>('chart');
    const [copied, setCopied] = useState(false);

    // API Price History State
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const [pricesList, setPricesList] = useState<PriceRecord[]>([]);
    const [chartData, setChartData] = useState<PriceRecord[]>([]);
    const [stats, setStats] = useState<PriceStats | null>(null);

    // Helper formatting
    const formatPrice = (val: number | string | null | undefined) => {
        if (val === null || val === undefined) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (dateStr: string | null | undefined) => {
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

    // Copy Ticker to clipboard
    const handleCopyTicker = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!stock?.ticker) return;

        const success = await copyTextToClipboard(stock.ticker);
        if (success) {
            setCopied(true);
            toast.success(`Ticker ${stock.ticker} berhasil disalin ke clipboard!`);
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error(`Gagal menyalin ticker ${stock.ticker}`);
        }
    };

    // Fetch full prices when modal opens or stock changes
    useEffect(() => {
        if (!open || !stock) {
            setPricesList([]);
            setChartData([]);
            setStats(null);
            return;
        }

        let isMounted = true;
        setIsLoadingPrices(true);

        fetch(`/admin/saham/${stock.id}/prices`)
            .then((res) => {
                if (!res.ok) throw new Error('Gagal mengambil riwayat harga');
                return res.json();
            })
            .then((data) => {
                if (!isMounted) return;
                if (data.success) {
                    setPricesList(data.prices || []);
                    setChartData(data.chart_prices || []);
                    setStats(data.stats || null);
                }
            })
            .catch((err) => {
                console.warn('Could not fetch detailed prices for stock detail modal:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoadingPrices(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open, stock?.id]);

    // Chart data: menampilkan seluruh data riwayat yang tersedia
    const filteredChartData = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            // Fallback to recent_prices if chartData not loaded yet
            if (stock?.recent_prices && stock.recent_prices.length > 0) {
                return stock.recent_prices.map((p, idx) => ({
                    date: `T-${stock.recent_prices!.length - idx}`,
                    close_price: p,
                }));
            }
            return [];
        }

        return chartData;
    }, [chartData, stock?.recent_prices]);

    // Calculate chart stats based on visible data
    const chartMetrics = useMemo(() => {
        if (filteredChartData.length === 0) return null;
        const prices = filteredChartData.map((d) => d.close_price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const first = prices[0];
        const last = prices[prices.length - 1];
        const diff = last - first;
        const diffPercent = first > 0 ? (diff / first) * 100 : 0;

        return { high, low, avg, diff, diffPercent, count: prices.length };
    }, [filteredChartData]);

    // Min and Max for Chart Y-Axis Domain with padding
    const yDomain = useMemo(() => {
        if (!chartMetrics) return ['auto', 'auto'];
        const pad = (chartMetrics.high - chartMetrics.low) * 0.1 || chartMetrics.high * 0.05 || 10;
        return [Math.floor(Math.max(0, chartMetrics.low - pad)), Math.ceil(chartMetrics.high + pad)];
    }, [chartMetrics]);

    if (!stock) return null;

    const latestClose = stock.latest_price
        ? typeof stock.latest_price.close_price === 'string'
            ? parseFloat(stock.latest_price.close_price)
            : stock.latest_price.close_price
        : null;

    const isPositive = (stock.change_percent ?? 0) > 0;
    const isNegative = (stock.change_percent ?? 0) < 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl">
                {/* Header Banner */}
                <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            {/* Avatar Badge */}
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-2xs shrink-0">
                                {stock.ticker.replace('.JK', '')}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-xl font-bold tracking-tight">
                                        {stock.ticker}
                                    </DialogTitle>
                                    <button
                                        type="button"
                                        onClick={handleCopyTicker}
                                        aria-label="Salin kode ticker"
                                        className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                                        title="Salin kode ticker"
                                    >
                                        {copied ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>

                                    {/* Bursa Badge */}
                                    {stock.bursa && (
                                        <Badge
                                            variant="secondary"
                                            className={`text-[11px] font-semibold rounded-full ${
                                                stock.bursa.includes('NYSE')
                                                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                                            }`}
                                        >
                                            {stock.bursa}
                                        </Badge>
                                    )}

                                    {/* Sektor Badge */}
                                    {stock.sector ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[11px] font-medium bg-background border-border/80 text-foreground"
                                        >
                                            {stock.sector}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-[11px] font-normal border-dashed text-muted-foreground"
                                        >
                                            Belum Ada Sektor
                                        </Badge>
                                    )}

                                    {/* Scraper Status Badge */}
                                    {stock.is_active ? (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                            Aktif
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-muted-foreground border-muted-foreground/30 text-[11px]"
                                        >
                                            Nonaktif
                                        </Badge>
                                    )}
                                </div>

                                <DialogDescription className="text-sm font-medium text-foreground/80">
                                    {stock.name || 'Emiten Saham Terdaftar'}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Price summary badge in header */}
                        {latestClose !== null && (
                            <div className="text-left sm:text-right shrink-0 bg-background/80 p-2.5 rounded-lg border border-border/60 shadow-2xs sm:min-w-[150px]">
                                <div className="text-xs text-muted-foreground font-medium">Harga Penutupan</div>
                                <div className="text-lg font-bold text-foreground">
                                    {formatPrice(latestClose)}
                                </div>
                                <div
                                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                        isPositive
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : isNegative
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    {isPositive ? (
                                        <>
                                            <TrendingUp className="h-3 w-3" />
                                            <span>+{stock.change_percent?.toFixed(2)}%</span>
                                            {stock.change !== null && stock.change !== undefined && (
                                                <span className="font-normal text-[10px]">
                                                    (+{formatPrice(stock.change)})
                                                </span>
                                            )}
                                        </>
                                    ) : isNegative ? (
                                        <>
                                            <TrendingDown className="h-3 w-3" />
                                            <span>{stock.change_percent?.toFixed(2)}%</span>
                                            {stock.change !== null && stock.change !== undefined && (
                                                <span className="font-normal text-[10px]">
                                                    ({formatPrice(stock.change)})
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span>0.00%</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Tab Controls */}
                <div className="flex items-center justify-between px-5 sm:px-6 pt-3 border-b border-border/60 bg-background">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('chart')}
                            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'chart'
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <LineChartIcon className="h-3.5 w-3.5" />
                            Grafik Harga
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('table')}
                            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'table'
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Database className="h-3.5 w-3.5" />
                            Riwayat Harga
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('info')}
                            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'info'
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            Detail
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                    {/* Key Metrics Quick Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Card className="border-border/60 bg-card/60 shadow-2xs p-3">
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <Activity className="h-3 w-3 text-purple-500" />
                                Penutupan Sesi Lalu
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-foreground mt-1">
                                {formatPrice(stock.previous_price)}
                            </div>
                        </Card>

                        <Card className="border-border/60 bg-card/60 shadow-2xs p-3">
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-blue-500" />
                                Tanggal Harga Terakhir
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-foreground mt-1 truncate">
                                {stock.latest_price ? formatDate(stock.latest_price.date) : '-'}
                            </div>
                        </Card>

                        <Card className="border-border/60 bg-card/60 shadow-2xs p-3">
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <Database className="h-3 w-3 text-emerald-500" />
                                Total Riwayat Bursa
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-foreground mt-1">
                                {stock.prices_count || stats?.count || 0} hari
                            </div>
                        </Card>

                        <Card className="border-border/60 bg-card/60 shadow-2xs p-3">
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <Tag className="h-3 w-3 text-amber-500" />
                                Sektor Industri
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-foreground mt-1 truncate">
                                {stock.sector || '-'}
                            </div>
                        </Card>
                    </div>

                    {/* Tab: Chart & Visuals */}
                    {activeTab === 'chart' && (
                        <div className="space-y-4">
                            {/* Price Chart Container */}
                            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-2 border-b border-border/50 gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                            <LineChartIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">
                                                Grafik Pergerakan Harga
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground">
                                                Visualisasi seluruh riwayat harga penutupan harian yang tersedia.
                                            </p>
                                        </div>
                                    </div>

                                    {chartMetrics && (
                                        <div className="flex items-center gap-3 text-xs">
                                            <div>
                                                <span className="text-muted-foreground text-[10px] block">Tertinggi</span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {formatPrice(chartMetrics.high)}
                                                </span>
                                            </div>
                                            <div className="h-6 w-px bg-border/60" />
                                            <div>
                                                <span className="text-muted-foreground text-[10px] block">Terendah</span>
                                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                    {formatPrice(chartMetrics.low)}
                                                </span>
                                            </div>
                                            <div className="h-6 w-px bg-border/60" />
                                            <div>
                                                <span className="text-muted-foreground text-[10px] block">Rata-rata</span>
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(chartMetrics.avg)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isLoadingPrices && filteredChartData.length === 0 ? (
                                    <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="text-xs">Memuat data harga saham...</p>
                                    </div>
                                ) : filteredChartData.length > 0 ? (
                                    <div className="h-[240px] w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={filteredChartData}
                                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorStockDetail" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }}
                                                    tickLine={false}
                                                    minTickGap={25}
                                                    tickFormatter={formatDate}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }}
                                                    domain={['auto', 'auto']}
                                                    tickLine={false}
                                                    width={55}
                                                    tickFormatter={(v) => v.toLocaleString('id-ID')}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const item = payload[0].payload as PriceRecord;
                                                            return (
                                                                <div className="rounded-lg border border-border/80 bg-background/95 p-2.5 shadow-lg backdrop-blur-sm text-xs">
                                                                    <div className="text-muted-foreground mb-1">
                                                                        {formatDate(item.date)}
                                                                    </div>
                                                                    <div className="font-bold text-foreground text-sm">
                                                                        {formatPrice(item.close_price)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="close_price"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorStockDetail)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                                        <p className="text-xs">Belum ada data harga historis yang tercatat untuk emiten ini.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Price History Table */}
                    {activeTab === 'table' && (
                        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                            <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/30">
                                <div>
                                    <h4 className="text-sm font-semibold">Tabel Riwayat</h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        Menampilkan 60 catatan harga penutupan harian terakhir.
                                    </p>
                                </div>
                                {isLoadingPrices && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead className="text-xs font-semibold">Tanggal Bursa</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Harga Penutupan</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Perubahan Sesi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pricesList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-28 text-center text-xs text-muted-foreground">
                                                    {isLoadingPrices ? 'Sedang memuat data...' : 'Tidak ada riwayat harga tercatat.'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pricesList.map((item, index) => {
                                                const prev = pricesList[index + 1];
                                                const diff = prev ? item.close_price - prev.close_price : null;
                                                const diffPct = prev && prev.close_price > 0 ? (diff! / prev.close_price) * 100 : null;

                                                return (
                                                    <TableRow key={item.id || item.date} className="hover:bg-muted/40">
                                                        <TableCell className="text-xs font-medium text-foreground py-2.5">
                                                            {formatDate(item.date)}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-semibold text-right py-2.5">
                                                            {formatPrice(item.close_price)}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-right py-2.5">
                                                            {diffPct !== null ? (
                                                                <span
                                                                    className={`inline-flex items-center gap-0.5 font-medium ${
                                                                        diffPct > 0
                                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                                            : diffPct < 0
                                                                            ? 'text-rose-600 dark:text-rose-400'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {diffPct > 0 ? '▲ +' : diffPct < 0 ? '▼ ' : ''}
                                                                    {diffPct.toFixed(2)}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Tab: Metadata & Audit */}
                    {activeTab === 'info' && (
                        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-2xs">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Detail Saham</h4>
                                <p className="text-xs text-muted-foreground">
                                    Rincian identitas emiten saham.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">ID Database</span>
                                    <span className="font-mono font-semibold text-foreground">#{stock.id}</span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Kode Saham (Ticker)</span>
                                    <span className="font-mono font-bold text-foreground">{stock.ticker}</span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Nama Perusahaan</span>
                                    <span className="font-medium text-foreground">{stock.name || '-'}</span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Bursa</span>
                                    <span className="font-medium text-foreground">
                                        {stock.bursa || '-'}
                                    </span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Sektor Industri</span>
                                    <span className="font-medium text-foreground">{stock.sector || 'Belum Ditentukan'}</span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Status Otomasi Scraper</span>
                                    <span className="font-medium text-foreground">
                                        {stock.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Dibuat Pada</span>
                                    <span className="font-medium text-foreground">
                                        {stock.created_at ? formatDate(stock.created_at) : '-'}
                                    </span>
                                </div>

                                <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <span className="text-muted-foreground block text-[11px]">Terakhir Diperbarui</span>
                                    <span className="font-medium text-foreground">
                                        {stock.updated_at ? formatDate(stock.updated_at) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <DialogFooter className="p-4 sm:px-6 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center gap-2.5">

                    <div className="flex items-center gap-2 justify-end">
                        {onEdit && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    onEdit(stock);
                                }}
                                className="text-xs gap-1.5"
                            >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Saham
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="default"
                            onClick={() => onOpenChange(false)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
