import { type PaginatedData, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface HistoryItem {
    id: number;
    user_id: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    tickers: string[];
    best_portfolios?: {
        sharpe?: { return?: number; risk?: number; sharpe?: number; expected_return?: number; volatility?: number; sharpe_ratio?: number; [key: string]: any };
        max_sharpe?: { return?: number; risk?: number; sharpe?: number; expected_return?: number; volatility?: number; sharpe_ratio?: number; [key: string]: any };
        min_variance?: { return?: number; risk?: number; sharpe?: number; expected_return?: number; volatility?: number; sharpe_ratio?: number; [key: string]: any };
        [key: string]: any;
    };
    created_at: string;
}

export interface UsePortfolioHistorySWROptions {
    history?: HistoryItem[] | PaginatedData<HistoryItem> | { data: HistoryItem[] };
}

interface StoredHistoryCache {
    userId: number | string;
    items: HistoryItem[];
    timestamp: number;
}

// In-memory RAM cache map keyed by user ID
const inMemoryHistoryCache: Map<string, StoredHistoryCache> = new Map();
const CACHE_PREFIX = 'dinalar_history_swr_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

function getNormalizedHistoryList(
    raw?: HistoryItem[] | PaginatedData<HistoryItem> | { data: HistoryItem[] }
): HistoryItem[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
        return raw.data;
    }
    return [];
}

function getStoredHistoryCache(userId: number | string): HistoryItem[] | null {
    const key = String(userId);

    // 1. In-memory RAM check
    const mem = inMemoryHistoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
        return mem.items;
    }

    // 2. SessionStorage check
    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (raw) {
                const parsed: StoredHistoryCache = JSON.parse(raw);
                if (String(parsed.userId) === key && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                    inMemoryHistoryCache.set(key, parsed);
                    return parsed.items;
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    return null;
}

function saveStoredHistoryCache(userId: number | string, items: HistoryItem[]) {
    const key = String(userId);
    const entry: StoredHistoryCache = {
        userId,
        items,
        timestamp: Date.now(),
    };
    inMemoryHistoryCache.set(key, entry);

    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
        } catch {
            // Ignore quota errors
        }
    }
}

/**
 * Hook to implement Stale-While-Revalidate (SWR) for the Portfolio Optimization History page.
 * Immediately displays cached portfolio list and stats on revisit (0ms delay),
 * while silently revalidating in the background when Inertia's deferred props arrive.
 */
export function usePortfolioHistorySWR(props: UsePortfolioHistorySWROptions) {
    const page = usePage<SharedData>();
    const userId = page.props.auth?.user?.id || 'guest';

    const incomingList = useMemo(() => getNormalizedHistoryList(props.history), [props.history]);
    const cached = useMemo(() => getStoredHistoryCache(userId), [userId]);

    const [list, setList] = useState<HistoryItem[]>(() => {
        if (props.history !== undefined) {
            return incomingList;
        }
        return cached || [];
    });

    const hasCachedHistory = cached !== null || props.history !== undefined;
    const isRevalidating = props.history === undefined && cached !== null;

    // Sync state and save cache when Inertia finishes loading deferred props
    useEffect(() => {
        if (props.history !== undefined) {
            const fresh = getNormalizedHistoryList(props.history);
            setList(fresh);
            saveStoredHistoryCache(userId, fresh);
        }
    }, [props.history, userId]);

    // Local / optimistic helper when an item is edited
    const updateHistoryItem = useCallback(
        (id: number, updatedFields: Partial<HistoryItem>) => {
            setList((prev) => {
                const next = prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
                saveStoredHistoryCache(userId, next);
                return next;
            });
        },
        [userId]
    );

    // Local / optimistic helper when an item is deleted
    const removeHistoryItem = useCallback(
        (id: number) => {
            setList((prev) => {
                const next = prev.filter((item) => item.id !== id);
                saveStoredHistoryCache(userId, next);
                return next;
            });
        },
        [userId]
    );

    return {
        list,
        hasCachedHistory,
        isRevalidating,
        updateHistoryItem,
        removeHistoryItem,
    };
}
