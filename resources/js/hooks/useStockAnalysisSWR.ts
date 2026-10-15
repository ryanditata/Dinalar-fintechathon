import { type Stock } from '@/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type PresetType = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'all';

export interface HistoricalPriceItem {
    date: string;
    close_price: number;
    daily_return: number;
}

export interface AnalysisMetrics {
    period_return: number;
    expected_return: number;
    volatility: number;
    min_price: number;
    max_price: number;
    data_points: number;
    horizon_data_points?: number;
    base_price?: number;
    latest_price?: number;
}

export interface EffectiveTimeframe {
    start: string;
    end: string;
    horizon_start?: string;
}

export interface StoredAnalysisData {
    prices: HistoricalPriceItem[];
    metrics: AnalysisMetrics;
    timeframe: {
        start_date: string;
        horizon_start_date?: string;
        end_date: string;
        min_date?: string | null;
        max_date?: string | null;
        preset?: string;
    };
}

interface StoredAnalysisCacheItem {
    data: StoredAnalysisData;
    timestamp: number;
}

// Global in-memory RAM cache (shared across modal & mobile sheet)
const inMemoryAnalysisMap = new Map<string, StoredAnalysisCacheItem>();
const CACHE_PREFIX = 'dinalar_analysis_swr_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

export const defaultAnalysisMetrics: AnalysisMetrics = {
    period_return: 0,
    expected_return: 0,
    volatility: 0,
    min_price: 0,
    max_price: 0,
    data_points: 0,
    horizon_data_points: 0,
    base_price: 0,
    latest_price: 0,
};

/**
 * Calculates estimated lookback start date (3x multiplier) for quick presets.
 */
export function calculateLookbackStartDate(
    preset: PresetType | string,
    anchorDateStr: string,
    minDate: string = '2023-01-01'
): string {
    if (preset === 'all') return minDate;
    const anchor = new Date(anchorDateStr);
    if (isNaN(anchor.getTime())) return minDate;
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
    return formatted < minDate ? minDate : formatted;
}

/**
 * Generates a consistent cache key for stock historical analysis.
 */
export function getAnalysisCacheKey(
    ticker: string,
    params: { preset?: string; start?: string; end?: string }
): string {
    const clean = ticker.replace('.JK', '').trim().toUpperCase();
    if (params.preset) {
        return `${clean}__preset_${params.preset.toUpperCase()}`;
    }
    return `${clean}__range_${params.start || ''}_${params.end || ''}`;
}

/**
 * Retrieves cached analysis from RAM or sessionStorage.
 */
export function getStoredAnalysis(cacheKey: string): StoredAnalysisData | null {
    // 1. In-memory check
    const mem = inMemoryAnalysisMap.get(cacheKey);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
        return mem.data;
    }

    // 2. SessionStorage check
    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
            if (raw) {
                const parsed: StoredAnalysisCacheItem = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                    inMemoryAnalysisMap.set(cacheKey, parsed);
                    return parsed.data;
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    return null;
}

/**
 * Saves analysis data to both RAM and sessionStorage.
 */
export function saveStoredAnalysis(cacheKey: string, data: StoredAnalysisData) {
    const item: StoredAnalysisCacheItem = {
        data,
        timestamp: Date.now(),
    };
    inMemoryAnalysisMap.set(cacheKey, item);

    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify(item));
        } catch {
            // Ignore quota errors
        }
    }
}

interface UseStockAnalysisSWROptions {
    stock: Stock | null;
    isOpen: boolean;
    maxAllowedDate: string;
    minAllowedDate: string;
    initialTimeframe?: {
        start?: string;
        end?: string;
        preset?: string;
    };
}

/**
 * SWR Hook for Stock Historical Analysis Dialog & Mobile Sheet.
 * Immediately renders cached historical chart & metrics (0ms delay),
 * while silently revalidating data in the background.
 */
export function useStockAnalysisSWR({
    stock,
    isOpen,
    maxAllowedDate,
    minAllowedDate,
    initialTimeframe,
}: UseStockAnalysisSWROptions) {
    const activeRequestKeyRef = useRef<string>('');

    const [startDate, setStartDate] = useState<string>(
        initialTimeframe?.start || minAllowedDate
    );
    const [endDate, setEndDate] = useState<string>(
        initialTimeframe?.end || maxAllowedDate
    );
    const [activePreset, setActivePreset] = useState<string>(
        initialTimeframe?.preset !== undefined
            ? initialTimeframe.preset
            : (initialTimeframe?.start ? '' : '1D')
    );

    const [effectiveTimeframe, setEffectiveTimeframe] = useState<EffectiveTimeframe>({
        start: initialTimeframe?.start || '',
        end: initialTimeframe?.end || '',
        horizon_start: '',
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
    const [historicalPrices, setHistoricalPrices] = useState<HistoricalPriceItem[]>([]);
    const [metrics, setMetrics] = useState<AnalysisMetrics>(defaultAnalysisMetrics);

    const fetchHistoricalAnalysis = useCallback(
        async (paramsObj: { preset?: string; start?: string; end?: string }) => {
            if (!stock) return;

            const clean = stock.ticker.replace('.JK', '');
            const cacheKey = getAnalysisCacheKey(stock.ticker, paramsObj);
            activeRequestKeyRef.current = cacheKey;

            // 1. SWR Layer: Check if cache already has data
            const cached = getStoredAnalysis(cacheKey);
            if (cached) {
                setHistoricalPrices(cached.prices || []);
                setMetrics(cached.metrics || defaultAnalysisMetrics);
                if (cached.timeframe) {
                    const lookbackStart = cached.timeframe.start_date || '';
                    const horizonStart = cached.timeframe.horizon_start_date || lookbackStart;
                    const end = cached.timeframe.end_date || '';

                    setEffectiveTimeframe({
                        start: lookbackStart,
                        end,
                        horizon_start: horizonStart,
                    });

                    if (paramsObj.preset) {
                        setStartDate(lookbackStart);
                        setEndDate(end);
                    }
                }
                // SWR: Do NOT show blocking loader; display chart immediately
                setIsLoading(false);
                setIsRevalidating(true);
            } else {
                // Cold start: show loader
                setIsLoading(true);
                setIsRevalidating(false);
            }

            // 2. Network revalidation
            try {
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

                    // Guard against race conditions when switching presets rapidly
                    if (activeRequestKeyRef.current !== cacheKey) {
                        return;
                    }

                    const prices = data.prices || [];
                    const calculatedMetrics: AnalysisMetrics = data.metrics || defaultAnalysisMetrics;
                    const timeframe = data.timeframe;

                    setHistoricalPrices(prices);
                    setMetrics(calculatedMetrics);

                    if (timeframe) {
                        const lookbackStart = timeframe.start_date || '';
                        const horizonStart = timeframe.horizon_start_date || lookbackStart;
                        const end = timeframe.end_date || '';

                        setEffectiveTimeframe({
                            start: lookbackStart,
                            end,
                            horizon_start: horizonStart,
                        });

                        if (paramsObj.preset) {
                            setStartDate(lookbackStart);
                            setEndDate(end);
                        }
                    }

                    // Save to RAM and sessionStorage
                    saveStoredAnalysis(cacheKey, {
                        prices,
                        metrics: calculatedMetrics,
                        timeframe,
                    });
                }
            } catch (err) {
                console.error('Failed to load historical stock analysis:', err);
            } finally {
                if (activeRequestKeyRef.current === cacheKey) {
                    setIsLoading(false);
                    setIsRevalidating(false);
                }
            }
        },
        [stock, maxAllowedDate]
    );

    // Initialize or re-fetch when modal opens or stock changes
    useEffect(() => {
        if (isOpen && stock) {
            const preset =
                initialTimeframe?.preset !== undefined
                    ? initialTimeframe.preset
                    : (initialTimeframe?.start ? '' : '1D');

            setActivePreset(preset);

            const initialStart =
                initialTimeframe?.start ||
                (preset
                    ? calculateLookbackStartDate(preset as any, maxAllowedDate, minAllowedDate)
                    : minAllowedDate);
            const initialEnd = initialTimeframe?.end || maxAllowedDate;

            setStartDate(initialStart);
            setEndDate(initialEnd);

            if (preset) {
                fetchHistoricalAnalysis({ preset });
            } else {
                fetchHistoricalAnalysis({ start: initialStart, end: initialEnd });
            }
        }
    }, [
        isOpen,
        stock?.id,
        stock?.ticker,
        maxAllowedDate,
        minAllowedDate,
        initialTimeframe?.start,
        initialTimeframe?.end,
        initialTimeframe?.preset,
        fetchHistoricalAnalysis,
    ]);

    const handlePreset = useCallback(
        (preset: PresetType) => {
            setActivePreset(preset);
            const lookbackStart = calculateLookbackStartDate(preset, maxAllowedDate, minAllowedDate);
            setStartDate(lookbackStart);
            setEndDate(maxAllowedDate);
            fetchHistoricalAnalysis({ preset });
        },
        [fetchHistoricalAnalysis, maxAllowedDate, minAllowedDate]
    );

    const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setActivePreset('');
    }, []);

    const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setActivePreset('');
    }, []);

    const handleApplyDateRange = useCallback(() => {
        setActivePreset('');
        fetchHistoricalAnalysis({ start: startDate, end: endDate });
    }, [fetchHistoricalAnalysis, startDate, endDate]);

    return {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        activePreset,
        setActivePreset,
        effectiveTimeframe,
        historicalPrices,
        metrics,
        isLoading,
        isRevalidating,
        handlePreset,
        handleStartDateChange,
        handleEndDateChange,
        handleApplyDateRange,
        fetchHistoricalAnalysis,
    };
}
