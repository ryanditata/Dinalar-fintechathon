import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { type Stock } from '@/types';
import {
    Activity,
    Calendar,
    ChartArea,
    ChartNetwork,
    Check,
    Clock,
    Loader2,
    RefreshCw,
    ShieldAlert,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface StockAnalysisSheetProps {
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

/**
 * Komponen Bottom Page Sheet Analisis Saham Khusus Tampilan Mobile.
 * Menggantikan dialog desktop dengan bottom-sheet native iOS/Android style.
 */
export function StockAnalysisSheet({
    stock,
    isOpen,
    onClose,
    onAddToBasket,
    isAlreadyInBasket,
    timeframeLimits,
    initialTimeframe,
}: StockAnalysisSheetProps) {
    if (!stock) return null;

    const minAllowedDate = timeframeLimits?.min_date
        ? timeframeLimits.min_date.substring(0, 10)
        : '2023-01-01';

    const maxAllowedDate = stock.latest_price?.date
        ? stock.latest_price.date.substring(0, 10)
        : timeframeLimits?.max_date
            ? timeframeLimits.max_date.substring(0, 10)
            : new Date().toISOString().substring(0, 10);

    // Helper kalkulasi tanggal mulai lookback (3x horison) dari preset
    const calculateLookbackStartDate = (
        preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all',
        anchorDateStr: string
    ): string => {
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

    // State Input Parameter
    const [startDate, setStartDate] = useState<string>(
        initialTimeframe?.start || minAllowedDate
    );
    const [endDate, setEndDate] = useState<string>(
        initialTimeframe?.end || maxAllowedDate
    );
    const [activePreset, setActivePreset] = useState<string>(
        initialTimeframe?.preset || (initialTimeframe?.start ? '' : '1D')
    );
    const [effectiveTimeframe, setEffectiveTimeframe] = useState<{
        start: string;
        end: string;
        horizon_start?: string;
    }>({
        start: initialTimeframe?.start || '',
        end: initialTimeframe?.end || '',
        horizon_start: '',
    });

    // State Data & Metrics
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [historicalPrices, setHistoricalPrices] = useState<
        Array<{ date: string; close_price: number; daily_return: number }>
    >([]);
    const [metrics, setMetrics] = useState<{
        period_return: number;
        expected_return: number;
        volatility: number;
        min_price: number;
        max_price: number;
        data_points: number;
        horizon_data_points?: number;
        base_price?: number;
        latest_price?: number;
    }>({
        period_return: 0,
        expected_return: 0,
        volatility: 0,
        min_price: 0,
        max_price: 0,
        data_points: 0,
        horizon_data_points: 0,
        base_price: 0,
        latest_price: 0,
    });

    // Inisialisasi saat sheet dibuka
    useEffect(() => {
        if (isOpen && stock) {
            const preset = initialTimeframe?.preset !== undefined
                ? initialTimeframe.preset
                : (initialTimeframe?.start ? '' : '1D');
            setActivePreset(preset);

            const initialStart = initialTimeframe?.start || (preset ? calculateLookbackStartDate(preset as any, maxAllowedDate) : minAllowedDate);
            const initialEnd = initialTimeframe?.end || maxAllowedDate;
            setStartDate(initialStart);
            setEndDate(initialEnd);

            if (preset) {
                fetchHistoricalAnalysis({ preset });
            } else {
                fetchHistoricalAnalysis({ start: initialStart, end: initialEnd });
            }
        }
    }, [isOpen, stock, initialTimeframe?.start, initialTimeframe?.end, initialTimeframe?.preset]);

    // Fetch data historis
    const fetchHistoricalAnalysis = async (paramsObj: { preset?: string; start?: string; end?: string }) => {
        if (!stock) return;
        setIsLoading(true);
        try {
            const clean = stock.ticker.replace('.JK', '');
            const params = new URLSearchParams();
            if (paramsObj.preset) {
                params.set('preset', paramsObj.preset);
                params.set('end_date', maxAllowedDate);
            } else {
                if (paramsObj.start) params.set('start_date', paramsObj.start);
                if (paramsObj.end) params.set('end_date', paramsObj.end);
            }

            const res = await fetch(`/user/saham/${clean}/historical?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setHistoricalPrices(data.prices || []);
                if (data.timeframe) {
                    const lookbackStart = data.timeframe.start_date || '';
                    const horizonStart = data.timeframe.horizon_start_date || lookbackStart;
                    const end = data.timeframe.end_date || '';

                    setEffectiveTimeframe({
                        start: lookbackStart,
                        end: end,
                        horizon_start: horizonStart,
                    });

                    if (paramsObj.preset) {
                        setStartDate(lookbackStart);
                        setEndDate(end);
                    }
                }
                setMetrics(
                    data.metrics || {
                        period_return: 0,
                        expected_return: 0,
                        volatility: 0,
                        min_price: 0,
                        max_price: 0,
                        data_points: 0,
                        horizon_data_points: 0,
                        base_price: 0,
                        latest_price: 0,
                    }
                );
            }
        } catch (err) {
            console.error('Failed to load historical stock analysis:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreset = (preset: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all') => {
        setActivePreset(preset);
        setStartDate(calculateLookbackStartDate(preset, maxAllowedDate));
        setEndDate(maxAllowedDate);
        fetchHistoricalAnalysis({ preset });
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setActivePreset('');
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setActivePreset('');
    };

    const handleApplyDateRange = () => {
        setActivePreset('');
        fetchHistoricalAnalysis({ start: startDate, end: endDate });
    };

    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '-';
        return `${Number(val).toLocaleString('id-ID')}`;
    };

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

    const lastPrice = stock.latest_price ? Number(stock.latest_price.close_price) : 0;
    const changeVal = stock.change_percent;

    const isShortTimeframe = useMemo(() => {
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

    const sheetRef = useRef<HTMLDivElement | null>(null);
    const scrollBodyRef = useRef<HTMLDivElement | null>(null);
    const dragStartY = useRef(0);
    const dragStartX = useRef(0);
    const dragStartTime = useRef(0);
    const currentDragY = useRef(0);
    const isDragging = useRef(false);
    const canDrag = useRef(false);
    const canDragFromBody = useRef(false);

    const getSheetElement = useCallback(() => {
        return sheetRef.current || (document.querySelector('[data-slot="sheet-content"]') as HTMLDivElement | null);
    }, []);

    const finishDrag = useCallback((deltaY: number) => {
        isDragging.current = false;
        canDrag.current = false;
        canDragFromBody.current = false;

        const sheetEl = getSheetElement();
        const timeElapsed = Date.now() - dragStartTime.current;
        const velocity = deltaY / Math.max(1, timeElapsed); // px/ms
        const shouldDismiss = deltaY > 80 || (deltaY > 30 && velocity > 0.4);

        const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement | null;

        if (shouldDismiss && sheetEl) {
            sheetEl.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
            sheetEl.style.transform = 'translate3d(0, 100%, 0)';
            if (overlay) {
                overlay.style.transition = 'opacity 200ms ease-out';
                overlay.style.opacity = '0';
            }
            setTimeout(() => {
                onClose();
                if (sheetEl) {
                    sheetEl.style.transition = '';
                    sheetEl.style.transform = '';
                }
                if (overlay) {
                    overlay.style.transition = '';
                    overlay.style.opacity = '';
                }
            }, 200);
        } else if (sheetEl) {
            sheetEl.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
            sheetEl.style.transform = 'translate3d(0, 0, 0)';
            if (overlay) {
                overlay.style.transition = 'opacity 220ms ease-out';
                overlay.style.opacity = '';
            }
            setTimeout(() => {
                if (sheetEl) {
                    sheetEl.style.transition = '';
                    sheetEl.style.transform = '';
                }
                if (overlay) {
                    overlay.style.transition = '';
                }
            }, 220);
        }
    }, [getSheetElement, onClose]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, input, select, textarea, a, [role="button"]')) {
            if (!target.closest('[data-drag-handle="true"]')) return;
        }

        dragStartY.current = e.clientY;
        dragStartX.current = e.clientX;
        dragStartTime.current = Date.now();
        currentDragY.current = 0;
        isDragging.current = true;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.current) return;
            const deltaY = Math.max(0, moveEvent.clientY - dragStartY.current);
            currentDragY.current = deltaY;
            const sheetEl = getSheetElement();
            if (sheetEl) {
                sheetEl.style.transition = 'none';
                sheetEl.style.transform = `translate3d(0, ${deltaY}px, 0)`;
            }
            const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement | null;
            if (overlay) {
                const sheetHeight = sheetEl?.offsetHeight || 600;
                const progress = Math.min(1, deltaY / sheetHeight);
                overlay.style.opacity = `${Math.max(0, 1 - progress * 0.8)}`;
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            finishDrag(currentDragY.current);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [finishDrag, getSheetElement]);

    useEffect(() => {
        if (!isOpen) return;

        let cleanupListeners: (() => void) | null = null;

        const attach = () => {
            const sheetEl = getSheetElement();
            if (!sheetEl) return;

            sheetEl.style.transition = '';
            sheetEl.style.transform = '';

            const onTouchStart = (e: TouchEvent) => {
                if (e.touches.length !== 1) return;
                const touch = e.touches[0];
                dragStartY.current = touch.clientY;
                dragStartX.current = touch.clientX;
                currentDragY.current = 0;
                dragStartTime.current = Date.now();
                isDragging.current = false;

                const target = e.target as HTMLElement | null;
                if (target?.closest('button[aria-label="Tutup"]')) {
                    canDrag.current = false;
                    return;
                }

                const isHandle = !!target?.closest('[data-drag-handle="true"]');
                const isHeader = !!target?.closest('[data-drag-header="true"]');

                if (isHandle || isHeader) {
                    canDrag.current = true;
                    canDragFromBody.current = false;
                } else {
                    const isScrollBody = !!target?.closest('[data-scroll-body="true"]');
                    if (isScrollBody) {
                        const scrollTop = scrollBodyRef.current?.scrollTop ?? 0;
                        canDrag.current = scrollTop <= 2;
                        canDragFromBody.current = scrollTop <= 2;
                    } else {
                        canDrag.current = false;
                        canDragFromBody.current = false;
                    }
                }
            };

            const onTouchMove = (e: TouchEvent) => {
                if (!canDrag.current || e.touches.length !== 1) return;
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - dragStartX.current);
                const deltaY = touch.clientY - dragStartY.current;

                if (!isDragging.current && deltaX > Math.abs(deltaY) && deltaX > 6) {
                    canDrag.current = false;
                    return;
                }

                if (canDragFromBody.current) {
                    const scrollTop = scrollBodyRef.current?.scrollTop ?? 0;
                    if (scrollTop > 2) {
                        canDrag.current = false;
                        isDragging.current = false;
                        return;
                    }
                }

                if (!isDragging.current && deltaY > 8) {
                    isDragging.current = true;
                }

                if (isDragging.current) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    const clampedDeltaY = Math.max(0, deltaY);
                    currentDragY.current = clampedDeltaY;
                    sheetEl.style.transition = 'none';
                    sheetEl.style.transform = `translate3d(0, ${clampedDeltaY}px, 0)`;

                    const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement | null;
                    if (overlay) {
                        const sheetHeight = sheetEl.offsetHeight || 600;
                        const progress = Math.min(1, clampedDeltaY / sheetHeight);
                        overlay.style.opacity = `${Math.max(0, 1 - progress * 0.8)}`;
                    }
                }
            };

            const onTouchEnd = () => {
                if (!isDragging.current) {
                    canDrag.current = false;
                    canDragFromBody.current = false;
                    return;
                }
                finishDrag(currentDragY.current);
            };

            sheetEl.addEventListener('touchstart', onTouchStart, { passive: true });
            sheetEl.addEventListener('touchmove', onTouchMove, { passive: false });
            sheetEl.addEventListener('touchend', onTouchEnd, { passive: true });
            sheetEl.addEventListener('touchcancel', onTouchEnd, { passive: true });

            cleanupListeners = () => {
                sheetEl.removeEventListener('touchstart', onTouchStart);
                sheetEl.removeEventListener('touchmove', onTouchMove);
                sheetEl.removeEventListener('touchend', onTouchEnd);
                sheetEl.removeEventListener('touchcancel', onTouchEnd);
            };
        };

        const frameId = requestAnimationFrame(attach);

        return () => {
            cancelAnimationFrame(frameId);
            cleanupListeners?.();
            const sheetEl = getSheetElement();
            if (sheetEl) {
                sheetEl.style.transition = '';
                sheetEl.style.transform = '';
            }
            const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement | null;
            if (overlay) {
                overlay.style.transition = '';
                overlay.style.opacity = '';
            }
        };
    }, [isOpen, finishDrag, getSheetElement]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                ref={sheetRef}
                side="bottom"
                className="w-full max-w-[430px] mx-auto rounded-t-[28px] max-h-[92vh] flex flex-col p-0 border-t border-zinc-200/90 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden focus:outline-hidden z-50 [&>button.opacity-70]:hidden [&>button:last-child]:hidden will-change-transform"
            >
                {/* 1. DRAG HANDLE INDICATOR (Native Mobile Look & Slide to Close) */}
                <div
                    data-drag-handle="true"
                    onMouseDown={handleMouseDown}
                    className="w-full pt-3 pb-2 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
                    title="Geser ke bawah untuk menutup"
                >
                    <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full transition-transform active:scale-105" />
                </div>

                {/* Tombol Custom di Atas Header Emiten & Harga (Posisi Bawaan Sheet) */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3.5 right-4 z-10 size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
                    aria-label="Tutup"
                >
                    <X className="size-4" />
                </button>

                {/* 2. HEADER EMITEN & HARGA */}
                <SheetHeader
                    data-drag-header="true"
                    onMouseDown={handleMouseDown}
                    className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white/95 dark:bg-zinc-900/95 cursor-grab active:cursor-grabbing select-none"
                >
                    <div className="flex items-center justify-between gap-3">
                        {/* Kiri: Avatar & Info Ticker */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="h-13 w-13 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-base sm:text-lg shadow-2xs shrink-0">
                                {stock.ticker.replace('.JK', '').slice(0, 4)}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <SheetTitle className="text-lg font-extrabold font-mono tracking-tight text-zinc-900 dark:text-white">
                                        {stock.ticker.replace('.JK', '')}
                                    </SheetTitle>

                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] py-0 px-1.5 font-semibold rounded-full ${
                                            stock.bursa === 'NYSE'
                                                ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                                                : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                                        }`}
                                    >
                                        {stock.bursa || 'IDX'}
                                    </Badge>

                                    {stock.sector && (
                                        <Badge
                                            variant="outline"
                                            className="text-[9px] py-0 px-1.5 font-medium border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 truncate max-w-[110px]"
                                        >
                                            {stock.sector}
                                        </Badge>
                                    )}
                                </div>

                                <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                    {stock.name || stock.ticker}
                                </SheetDescription>
                            </div>
                        </div>

                        {/* Kanan: Ringkasan Harga */}
                        {lastPrice > 0 && (
                            <div className="text-right shrink-0">
                                <div className="text-sm font-extrabold font-mono text-zinc-900 dark:text-white leading-tight">
                                    {stock.bursa === 'NYSE' ? `${lastPrice.toFixed(2)}` : `${formatRupiah(lastPrice)}`}
                                </div>
                                {changeVal !== null && changeVal !== undefined && (
                                    <span
                                        className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 rounded-full ${changeVal >= 0
                                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                                                : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                                            }`}
                                    >
                                        {changeVal >= 0 ? `▲ +${changeVal.toFixed(2)}%` : `▼ ${changeVal.toFixed(2)}%`}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </SheetHeader>

                {/* 3. SCROLLABLE CONTENT BODY */}
                <div
                    ref={scrollBodyRef}
                    data-scroll-body="true"
                    className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain"
                >
                    {/* 3A. HORISON ANALISIS CEPAT (Horizontal Scroll Pill) */}
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                            <span className="flex items-center gap-1.5">
                                <ChartNetwork className="size-3.5 text-emerald-600 shrink-0" />
                                <span>Horison Analisis</span>
                            </span>
                        </div>

                        {/* Preset Horizontal Scroll Row */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {(['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'all'] as const).map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handlePreset(preset)}
                                    className={`h-7 px-3 rounded-full text-xs font-mono font-medium shrink-0 transition-all active:scale-95 ${activePreset === preset
                                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                            : 'bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/40'
                                        }`}
                                >
                                    {preset === 'all' ? 'All' : preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3B. RENTANG TANGGAL KUSTOM */}
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 space-y-2.5">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                            <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                            <span>Rentang Waktu</span>
                        </span>

                        <div className="grid grid-cols-3 gap-2 items-end">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-zinc-500">Mulai</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    min={minAllowedDate}
                                    max={endDate || maxAllowedDate}
                                    onChange={handleStartDateChange}
                                    className="h-8 text-xs font-mono bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg px-1.5 w-full"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] text-zinc-500">Selesai</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    min={startDate || minAllowedDate}
                                    max={maxAllowedDate}
                                    onChange={handleEndDateChange}
                                    className="h-8 text-xs font-mono bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg px-1.5 w-full"
                                />
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={handleApplyDateRange}
                                className="w-full h-8 text-xs font-semibold gap-1 px-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 flex items-center justify-center shadow-2xs"
                            >
                                <RefreshCw className={`size-3 shrink-0 ${isLoading && !activePreset ? 'animate-spin' : ''}`} />
                                <span className="truncate">Terapkan</span>
                            </Button>
                        </div>
                    </div>

                    {/* Warning Rentang Singkat (< 30 hari bursa) */}
                    {isShortTimeframe && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                            <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                                <strong>Rentang Singkat:</strong> Data &lt; 30 hari ({metrics.data_points} hari bursa). Rujukan utama pergerakan adalah <strong>Return Periode</strong>.
                            </span>
                        </div>
                    )}

                    {/* 3C. GRAFIK HARGA PENUTUPAN */}
                    {isLoading ? (
                        <div className="h-44 flex flex-col items-center justify-center gap-2 text-zinc-500">
                            <Loader2 className="size-6 animate-spin text-emerald-600" />
                            <span className="text-xs">Menghitung return historis &amp; volatilitas...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs overflow-hidden">
                                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                                        <ChartArea className="size-3.5 text-emerald-600" />
                                        <span>Grafik Harga Penutupan</span>
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] py-0 px-1.5 font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                    >
                                        <Clock className="size-2.5 mr-1 text-emerald-600" />
                                        {metrics.data_points} Hari Bursa
                                    </Badge>
                                </div>

                                <CardContent className="p-2">
                                    <div className="h-44 w-full">
                                        {historicalPrices.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={historicalPrices}
                                                    margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorStockPriceMobile" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }}
                                                        tickLine={false}
                                                        minTickGap={20}
                                                        tickFormatter={formatDate}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }}
                                                        domain={['auto', 'auto']}
                                                        tickLine={false}
                                                        width={45}
                                                        tickFormatter={(v) => v.toLocaleString('id-ID')}
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const d = payload[0].payload;
                                                                return (
                                                                    <div className="rounded-lg border border-zinc-200 bg-white/95 dark:bg-zinc-900/95 p-2 shadow-md text-xs space-y-0.5">
                                                                        <div className="font-mono text-zinc-400 text-[9px]">
                                                                            {formatDate(d.date)}
                                                                        </div>
                                                                        <div className="font-bold text-zinc-900 dark:text-white text-[11px]">
                                                                            Rp {formatRupiah(d.close_price)}
                                                                        </div>
                                                                        <div
                                                                            className={`font-mono text-[10px] font-semibold ${d.daily_return >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                                                }`}
                                                                        >
                                                                            {d.daily_return > 0 ? '+' : ''}{d.daily_return}%
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
                                                        stroke="#059669"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill="url(#colorStockPriceMobile)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                                                Tidak ada data harga pada rentang ini.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3D. 4 KARTU METRIK KUANTITATIF (2x2 GRID) */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {/* 1. Return Periode */}
                                {(() => {
                                    const isPos = (metrics.period_return ?? 0) >= 0;
                                    return (
                                        <div
                                            className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-colors shadow-2xs ${isPos
                                                    ? 'border-emerald-500/25 bg-emerald-500/10'
                                                    : 'border-rose-500/25 bg-rose-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className={`flex items-center gap-1 ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {isPos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                                    <span>Return Periode</span>
                                                </span>
                                            </div>
                                            <div className={`text-lg font-extrabold font-mono my-1 ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {(metrics.period_return ?? 0) > 0 ? `+${metrics.period_return}%` : `${metrics.period_return ?? 0}%`}
                                            </div>
                                            <p className="text-[9px] text-zinc-500 leading-tight">
                                                Perubahan selama {metrics.horizon_data_points ?? metrics.data_points} hari bursa
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* 2. Rentang Harga */}
                                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 flex flex-col justify-between shadow-2xs">
                                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                        <Clock className="size-3 text-zinc-600" />
                                        <span>Rentang Harga</span>
                                    </div>
                                    <div className="my-1 space-y-0.5 font-mono text-[10px]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-400">Low:</span>
                                            <span className="text-rose-600 font-bold">{formatRupiah(metrics.min_price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-400">High:</span>
                                            <span className="text-emerald-600 font-bold">{formatRupiah(metrics.max_price)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 leading-tight">Harga terendah & tertinggi</p>
                                </div>

                                {/* 3. Expected Return */}
                                {(() => {
                                    const isExpPos = (metrics.expected_return ?? 0) >= 0;
                                    return (
                                        <div
                                            className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-colors shadow-2xs ${
                                                isExpPos
                                                    ? 'border-emerald-500/25 bg-emerald-500/10'
                                                    : 'border-rose-500/25 bg-rose-500/10'
                                            }`}
                                        >
                                            <div
                                                className={`text-[11px] font-bold flex items-center gap-1 ${
                                                    isExpPos ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                                }`}
                                            >
                                                {isExpPos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                                <span>Expected Return</span>
                                            </div>
                                            <div
                                                className={`text-lg font-extrabold font-mono my-1 ${
                                                    isExpPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {(metrics.expected_return ?? 0) > 0 ? `+${metrics.expected_return}%` : `${metrics.expected_return ?? 0}%`}
                                            </div>
                                            <p className="text-[9px] text-zinc-500 leading-tight">Proyeksi tahunan model</p>
                                        </div>
                                    );
                                })()}

                                {/* 4. Volatilitas */}
                                <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-2.5 flex flex-col justify-between shadow-2xs">
                                    <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                                        <Activity className="size-3 text-blue-600" />
                                                <span>Volatilitas</span>
                                            </div>
                                    <div className="text-lg font-extrabold font-mono my-1 text-blue-900 dark:text-blue-100">
                                                {metrics.volatility}%
                                            </div>
                                            <p className="text-[9px] text-zinc-500 leading-tight">Risiko fluktuasi tahunan</p>
                                        </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. STICKY BOTTOM ACTION CTA */}
                <div
                    className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shrink-0"
                    style={{
                        paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                    }}
                >
                    <button
                        type="button"
                        onClick={handleConfirmAddToBasket}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
                    >
                        {isAlreadyInBasket ? (
                            <>
                                <Check className="size-6 stroke-[2.5]" />
                                <span>Perbarui</span>
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="size-6 stroke-[2]" />
                                <span>Tambahkan</span>
                            </>
                        )}
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default StockAnalysisSheet;
