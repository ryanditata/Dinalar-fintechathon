import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n/LanguageContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStockAnalysisSWR, type PresetType } from '@/hooks/useStockAnalysisSWR';
import { type Stock } from '@/types';
import {
    Activity,
    Calendar,
    Check,
    Clock,
    History,
    LineChart,
    ChartArea,
    ChartNetwork,
    Loader2,
    RefreshCw,
    ShieldAlert,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface AnalyzedStockPayload {
    ticker: string;
    stock: Stock;
    timeframe: {
        start: string;
        end: string;
        lookback_start?: string;
        preset?: string;
    };
    benchmark?: string;
    metrics: {
        period_return?: number;
        expected_return: number;
        volatility: number;
        min_price: number;
        max_price: number;
        data_points?: number;
        horizon_data_points?: number;
        base_price?: number;
        latest_price?: number;
    };
    prices?: Array<{ date: string; close_price: number; daily_return: number }>;
}

interface Props {
    stock: Stock | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToBasket: (data: AnalyzedStockPayload) => void;
    isAlreadyInBasket: boolean;
    timeframeLimits?: {
        min_date?: string | null;
        max_date?: string | null;
    };
    initialTimeframe?: {
        start?: string;
        end?: string;
        preset?: string;
    };
    initialBenchmark?: string;
}

export default function StockAnalysisModal({
    stock,
    isOpen,
    onClose,
    onAddToBasket,
    isAlreadyInBasket,
    timeframeLimits,
    initialTimeframe,
}: Props) {
    const { t, language } = useTranslation();

    if (!stock) return null;

    // Menentukan batas tanggal acuan
    const minAllowedDate = timeframeLimits?.min_date
        ? timeframeLimits.min_date.substring(0, 10)
        : '2023-01-01';

    const maxAllowedDate = stock.latest_price?.date
        ? stock.latest_price.date.substring(0, 10)
        : timeframeLimits?.max_date
            ? timeframeLimits.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);

    // SWR Analysis Layer: Instantly renders cached historical chart & metrics (0ms delay)
    const {
        startDate,
        endDate,
        activePreset,
        effectiveTimeframe,
        historicalPrices,
        metrics,
        isLoading,
        isRevalidating,
        handlePreset,
        handleStartDateChange,
        handleEndDateChange,
        handleApplyDateRange,
    } = useStockAnalysisSWR({
        stock,
        isOpen,
        maxAllowedDate,
        minAllowedDate,
        initialTimeframe,
    });

    const isUsdStock = stock.bursa ? stock.bursa !== 'IDX' : !stock.ticker.endsWith('.JK');

    // Format harga saham (pure angka: non-IDX desimal titik en-US, IDX pemisah ribuan titik id-ID)
    const formatStockPrice = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '-';
        const num = Number(val);
        if (isUsdStock) {
            const hasDecimals = num % 1 !== 0;
            return num.toLocaleString('en-US', {
                minimumFractionDigits: hasDecimals ? 2 : 0,
                maximumFractionDigits: 2,
            });
        }
        return num.toLocaleString('id-ID');
    };

    // Format Tanggal (Contoh: 16 Sep 2026 / Sep 16, 2026)
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const locale = language === 'en' ? 'en-US' : 'id-ID';
        try {
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const parts = cleanDateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                return new Date(year, month, day).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            }
            return new Date(dateStr).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const lastPrice = stock.latest_price ? Number(stock.latest_price.close_price) : 0;
    const changeVal = stock.change_percent;

    // Deteksi jika rentang waktu sangat pendek (< 30 hari bursa: hanya 1D dan 5D)
    const isShortTimeframe = useMemo(() => {
        // 1M ke atas sekarang memakai 3x lookback sehingga tidak short
        if (activePreset && ['1D', '5D'].includes(activePreset)) return true;
        if (metrics.data_points > 0 && metrics.data_points < 30) return true;
        try {
            const s = new Date(effectiveTimeframe.start || startDate);
            const e = new Date(effectiveTimeframe.end || endDate);
            const diffDays = (e.getTime() - s.getTime()) / (1000 * 3600 * 24);
            return diffDays < 30;
        } catch {
            return false;
        }
    }, [activePreset, effectiveTimeframe, startDate, endDate, metrics.data_points]);

    // Handle Submit to Basket
    const handleConfirmAddToBasket = () => {
        const payload: AnalyzedStockPayload = {
            ticker: stock.ticker,
            stock,
            timeframe: {
                start: effectiveTimeframe.horizon_start || (activePreset ? effectiveTimeframe.start : startDate),
                end: activePreset ? (effectiveTimeframe.end || endDate) : endDate,
                lookback_start: activePreset ? effectiveTimeframe.start : undefined,
                preset: activePreset,
            },
            metrics: {
                period_return: metrics.period_return,
                expected_return: metrics.expected_return,
                volatility: metrics.volatility,
                min_price: metrics.min_price,
                max_price: metrics.max_price,
                data_points: metrics.data_points,
                horizon_data_points: metrics.horizon_data_points,
                base_price: metrics.base_price,
                latest_price: metrics.latest_price,
            },
            prices: historicalPrices,
        };
        onAddToBasket(payload);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border/80">
                {/* 1. HEADER (Ticker, Bursa, Sektor, Nama Emiten & Harga Terakhir) */}
                <DialogHeader className="p-4 sm:p-5 pb-3.5 border-b border-border/60 shrink-0 bg-background">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        {/* Kiri: Avatar, Ticker, Bursa, Sektor, & Nama Emiten */}
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar Badge */}
                            <div className="h-13 w-13 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-base sm:text-lg shadow-2xs shrink-0">
                                {stock.ticker.replace('.JK', '').slice(0, 4)}
                            </div>

                            <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-lg sm:text-xl font-extrabold font-mono tracking-tight text-foreground">
                                        {stock.ticker.replace('.JK', '')}
                                    </DialogTitle>

                                    {/* Bursa Badge */}
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] sm:text-[11px] py-0.5 px-2 font-semibold rounded-full ${
                                            stock.bursa === 'NASDAQ'
                                                ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                                                : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                                        }`}
                                    >
                                        {stock.bursa || 'IDX'}
                                    </Badge>

                                    {/* Sektor Badge */}
                                    {stock.sector ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] sm:text-[11px] py-0.5 px-2 font-medium bg-background border-border/80 text-foreground"
                                        >
                                            {stock.sector}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] sm:text-[11px] py-0.5 px-2 font-normal border-dashed text-muted-foreground"
                                        >
                                            {t('stock_modal.no_sector', 'Belum Ada Sektor')}
                                        </Badge>
                                    )}
                                </div>

                                <DialogDescription className="text-xs sm:text-sm text-muted-foreground truncate max-w-xs sm:max-w-md">
                                    {stock.name || stock.ticker}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Kanan: Ringkasan Harga Terakhir & Perubahan */}
                        {lastPrice > 0 && (
                            <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1.5 sm:gap-0.5 shrink-0 bg-muted/20 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-border/50 sm:border-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base sm:text-lg font-bold font-mono text-foreground">
                                        {formatStockPrice(lastPrice)}
                                    </span>
                                </div>
                                {changeVal !== null && changeVal !== undefined && (
                                    <span
                                        className={`inline-flex items-center text-[10px] sm:text-[11px] font-mono font-semibold px-1.5 rounded-full ${
                                            changeVal >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15'
                                                : 'text-rose-600 dark:text-rose-400 bg-rose-500/15'
                                        }`}
                                    >
                                        {changeVal >= 0 ? `▲ +${changeVal.toFixed(2)}%` : `▼ ${changeVal.toFixed(2)}%`}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* SCROLLABLE BODY AREA */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* 2A. HORISON ANALISIS CEPAT */}
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                <ChartNetwork className="h-4 w-4 text-primary shrink-0" />
                                <span>{t('stock_modal.analysis_horizon', 'Horison Analisis')}</span>
                            </span>
                        </div>

                        {/* Preset Timeframe Buttons */}
                        <div className="flex flex-wrap items-center gap-1">
                            {(['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'all'] as const).map((preset) => (
                                <Button
                                    key={preset}
                                    type="button"
                                    size="sm"
                                    variant={activePreset === preset ? 'default' : 'outline'}
                                    onClick={() => handlePreset(preset)}
                                    className={`h-6 text-[10px] px-2.5 cursor-pointer font-mono transition-all ${activePreset === preset
                                            ? 'shadow-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {preset === 'all' ? 'All' : preset}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 2B. RENTANG TANGGAL KUSTOM */}
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <span>{t('stock_modal.date_range', 'Rentang Waktu')}</span>
                            </span>
                        </div>

                        {/* Input Tanggal & Tombol Refresh */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
                            {/* Grid 2-Kolom: Tanggal Mulai & Tanggal Selesai */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 flex-1">
                                {/* Start Date */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground">
                                        {t('stock_modal.start_date', 'Tanggal Mulai')}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        min={minAllowedDate}
                                        max={endDate || maxAllowedDate}
                                        onChange={handleStartDateChange}
                                        className="h-9 text-xs font-mono bg-background border-border/70 rounded-md focus-visible:ring-1 focus-visible:ring-primary shadow-2xs w-full"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground">
                                        {t('stock_modal.end_date', 'Tanggal Selesai')}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        min={startDate || minAllowedDate}
                                        max={maxAllowedDate}
                                        onChange={handleEndDateChange}
                                        className="h-9 text-xs font-mono bg-background border-border/70 rounded-md focus-visible:ring-1 focus-visible:ring-primary shadow-2xs w-full"
                                    />
                                </div>
                            </div>

                            {/* Refresh Button */}
                            <div className="shrink-0">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleApplyDateRange}
                                    className="h-9 text-xs font-semibold gap-1.5 px-4 cursor-pointer w-full sm:w-auto border border-border/60 hover:bg-muted shadow-2xs flex items-center justify-center"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${(isLoading || isRevalidating) && !activePreset ? 'animate-spin' : ''}`} />
                                    <span>{t('stock_modal.apply', 'Terapkan')}</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Warning Box untuk Rentang Singkat (< 3 Bulan) */}
                    {isShortTimeframe && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 shadow-2xs">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                                <strong>{t('stock_modal.short_range_note_title', 'Catatan Rentang Singkat:')}</strong>{' '}
                                {t('stock_modal.short_range_note_desc', { days: metrics.data_points })}
                            </span>
                        </div>
                    )}

                    {/* 3. GRAFIK TREN HARGA PENUTUPAN (ATAS) & KARTU METRIK DI BAWAHNYA */}
                    {isLoading ? (
                        <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-7 w-7 animate-spin text-primary" />
                            <span className="text-xs">{t('stock_modal.calculating_analysis', 'Menghitung return historis & volatilitas...')}</span>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {/* GRAFIK TREN HARGA PENUTUPAN (LEBAR PENUH DI ATAS) */}
                            <Card className="border border-border/70 shadow-2xs">
                                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                        <ChartArea className="h-3.5 w-3.5 text-primary" />
                                        <span>{t('stock_modal.closing_price_chart', 'Grafik Harga Penutupan')}</span>
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] py-0 px-2 font-mono font-semibold bg-muted/50 border-border/60 text-muted-foreground"
                                    >
                                        <Clock className="h-2.5 w-2.5 mr-1 text-primary" />
                                        {t('stock_modal.trading_days', { days: metrics.data_points })}
                                    </Badge>
                                </div>
                                <CardContent className="p-3">
                                    <div className="h-48 sm:h-52 w-full min-w-0">
                                        {historicalPrices.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                <AreaChart
                                                    data={historicalPrices}
                                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorStockPrice" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
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
                                                        width={60}
                                                        tickFormatter={(v) => isUsdStock ? Number(v).toFixed(2) : Number(v).toLocaleString('id-ID')}
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const d = payload[0].payload;
                                                                return (
                                                                    <div className="rounded-lg border border-border/80 bg-background/95 p-2.5 shadow-md text-xs font-sans space-y-1">
                                                                        <div className="font-mono text-muted-foreground text-[10px]">
                                                                            {formatDate(d.date)}
                                                                        </div>
                                                                        <div className="font-bold text-foreground">
                                                                            {t('stock_modal.price_label', 'Harga')}: {formatStockPrice(d.close_price)}
                                                                        </div>
                                                                        <div
                                                                            className={`font-mono text-[11px] font-semibold ${d.daily_return >= 0
                                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                                    : 'text-rose-600 dark:text-rose-400'
                                                                                }`}
                                                                        >
                                                                            {t('stock_modal.daily_return_label', 'Return Harian')}: {d.daily_return > 0 ? '+' : ''}
                                                                            {d.daily_return}%
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
                                                        fill="url(#colorStockPrice)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                                {t('stock_modal.no_price_data', 'Tidak ada data harga pada rentang ini.')}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 4 KARTU METRIK KUANTITATIF FINANSIAL DI BAWAH GRAFIK */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* 1. Card Total Period Return (Capital Gain) */}
                                {(() => {
                                    const isPeriodPositive = (metrics.period_return ?? 0) >= 0;
                                    const periodStartDate = effectiveTimeframe.horizon_start || effectiveTimeframe.start || startDate;
                                    const periodEndDate = effectiveTimeframe.end || endDate;

                                    return (
                                        <div
                                            className={`rounded-xl border p-3 flex flex-col justify-between shadow-2xs transition-colors ${
                                                isPeriodPositive
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20'
                                                    : 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20'
                                            }`}
                                        >
                                            <div
                                                className={`flex flex-col items-start gap-1 text-xs font-bold ${
                                                    isPeriodPositive
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-rose-700 dark:text-rose-400'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1 w-full truncate">
                                                    {isPeriodPositive ? (
                                                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                                    ) : (
                                                        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                                                    )}
                                                    <span>{t('stock_modal.period_return', 'Return Periode')}</span>
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[9px] py-0 px-1.5 font-mono uppercase shrink-0 ${
                                                        isPeriodPositive
                                                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                                            : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {activePreset
                                                        ? t('stock_modal.period_return_preset', { preset: activePreset === 'all' ? 'All' : activePreset })
                                                        : t('stock_modal.custom_period', 'Periode Custom')}
                                                </Badge>
                                            </div>
                                            <div
                                                className={`text-xl sm:text-2xl font-extrabold font-mono my-1 ${
                                                    isPeriodPositive
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {(metrics.period_return ?? 0) > 0
                                                    ? `+${metrics.period_return}%`
                                                    : `${metrics.period_return ?? 0}%`}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground leading-tight">
                                                    {t('stock_modal.price_change_days', { days: metrics.horizon_data_points ?? metrics.data_points })}
                                                </p>
                                                {periodStartDate && periodEndDate && (
                                                    <p
                                                        className="text-[10px] text-muted-foreground leading-tight"
                                                        title={`${formatDate(periodStartDate)} → ${formatDate(periodEndDate)}`}
                                                    >
                                                        {periodStartDate !== periodEndDate
                                                            ? `${formatDate(periodStartDate)} → ${formatDate(periodEndDate)}`
                                                            : formatDate(periodEndDate)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* 2. Card Rentang Harga Periode Ini */}
                                <div className="rounded-xl border border-border/70 bg-card p-3 flex flex-col justify-between shadow-2xs">
                                    <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground font-bold">
                                        <span className="flex items-center gap-1 w-full truncate text-foreground">
                                            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{t('stock_modal.price_range', 'Rentang Harga')}</span>
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[9px] py-0 px-1.5 font-mono uppercase bg-muted text-muted-foreground shrink-0"
                                        >
                                            {t('stock_modal.low_high', 'Low / High')}
                                        </Badge>
                                    </div>
                                    <div className="my-1 space-y-0.5 font-mono">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-muted-foreground">{t('stock_modal.low', 'Low')}:</span>
                                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                                                {formatStockPrice(metrics.min_price)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-muted-foreground">{t('stock_modal.high', 'High')}:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                {formatStockPrice(metrics.max_price)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        {t('stock_modal.price_range_desc', 'Harga terendah & tertinggi selama periode')}
                                    </p>
                                </div>

                                {/* 3. Card Expected Return E(R) Tahunan */}
                                {(() => {
                                    const isExpPositive = (metrics.expected_return ?? 0) >= 0;
                                    return (
                                        <div
                                            className={`rounded-xl border p-3 flex flex-col justify-between shadow-2xs transition-colors ${
                                                isExpPositive
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20'
                                                    : 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20'
                                            }`}
                                        >
                                            <div
                                                className={`flex flex-col items-start gap-1 text-xs font-bold ${
                                                    isExpPositive
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-rose-700 dark:text-rose-400'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1 w-full truncate">
                                                    {isExpPositive ? (
                                                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                                    ) : (
                                                        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                                                    )}
                                                    <span>{t('stock_modal.expected_return', 'Expected Return')}</span>
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[9px] py-0 px-1.5 font-mono uppercase shrink-0 ${
                                                        isExpPositive
                                                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                                            : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {t('stock_modal.annual_expected_return', 'Expected Return Tahunan')}
                                                </Badge>
                                            </div>
                                            <div
                                                className={`text-xl sm:text-2xl font-extrabold font-mono my-1 ${
                                                    isExpPositive
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {(metrics.expected_return ?? 0) > 0
                                                    ? `+${metrics.expected_return}%`
                                                    : `${metrics.expected_return ?? 0}%`}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                {t('stock_modal.projection_1y', { days: metrics.data_points })}
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* 4. Card Risiko Volatilitas (σ) Tahunan */}
                                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 flex flex-col justify-between shadow-2xs">
                                    <div className="flex flex-col items-start gap-1 text-xs text-blue-700 dark:text-blue-400 font-bold">
                                        <span className="flex items-center gap-1 w-full truncate">
                                            <Activity className="h-3.5 w-3.5 shrink-0" />
                                            <span>{t('stock_modal.volatility', 'Volatilitas')}</span>
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[9px] py-0 px-1.5 font-mono uppercase bg-blue-500/20 text-blue-800 dark:text-blue-300 shrink-0"
                                        >
                                            {t('stock_modal.annual_volatility', 'Volatilitas Tahunan')}
                                        </Badge>
                                    </div>
                                    <div className="text-xl sm:text-2xl font-extrabold font-mono text-foreground my-1">
                                        {metrics.volatility}%
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        {t('stock_modal.annual_fluctuation', { days: metrics.data_points })}
                                    </p>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* 4. FOOTER ACTION: STICKY BOTTOM DI BAWAH MODAL */}
                <DialogFooter className="p-3.5 sm:p-4 border-t border-border/60 shrink-0 bg-background/95 backdrop-blur flex flex-row items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="default"
                        onClick={onClose}
                        className="text-xs sm:text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                        {t('stock_modal.close', 'Tutup')}
                    </Button>

                    <Button
                        type="button"
                        size="default"
                        onClick={handleConfirmAddToBasket}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer text-xs sm:text-sm font-semibold"
                    >
                        {isAlreadyInBasket ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span>{t('stock_modal.update', 'Perbarui')}</span>
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="h-4 w-4" />
                                <span>{t('stock_modal.add_to_basket', 'Tambahkan')}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
