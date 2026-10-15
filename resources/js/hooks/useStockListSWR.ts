import { useEffect, useMemo, useState } from 'react';
import { type PaginatedData, type Stock } from '@/types';

export interface StockListProps {
    stocks?: Stock[] | PaginatedData<Stock>;
    filters?: {
        search?: string;
        bursa?: string;
        sector?: string;
    };
    total_count?: number;
}

interface StoredStockCache {
    stocks: Stock[];
    totalCount?: number;
    timestamp: number;
}

// In-memory cache map keyed by filter representation
const inMemoryCacheMap: Map<string, StoredStockCache> = new Map();
const CACHE_PREFIX = 'dinalar_stocks_swr_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

function getFilterKey(filters?: StockListProps['filters']): string {
    const s = (filters?.search || '').trim().toLowerCase();
    const b = (filters?.bursa || 'all').trim().toLowerCase();
    const sec = (filters?.sector || 'all').trim().toLowerCase();
    return `${s}__${b}__${sec}`;
}

function getStoredStockCache(filterKey: string): StoredStockCache | null {
    // 1. In-memory check
    const mem = inMemoryCacheMap.get(filterKey);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
        return mem;
    }

    // 2. SessionStorage check
    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(`${CACHE_PREFIX}${filterKey}`);
            if (raw) {
                const parsed: StoredStockCache = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                    inMemoryCacheMap.set(filterKey, parsed);
                    return parsed;
                }
            }
        } catch {
            // Ignore storage parse errors
        }
    }

    // 3. Fallback: If specific filter not in cache, check base catalog
    if (filterKey !== '__all__all') {
        const base = inMemoryCacheMap.get('__all__all');
        if (base && Date.now() - base.timestamp < CACHE_TTL_MS) {
            return base;
        }
    }

    return null;
}

function saveStoredStockCache(filterKey: string, stocks: Stock[], totalCount?: number) {
    const item: StoredStockCache = {
        stocks,
        totalCount,
        timestamp: Date.now(),
    };
    inMemoryCacheMap.set(filterKey, item);

    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(`${CACHE_PREFIX}${filterKey}`, JSON.stringify(item));
        } catch {
            // Ignore quota errors
        }
    }
}

/**
 * Hook to implement Stale-While-Revalidate (SWR) for the Stock Catalog page.
 * When navigating back to /user/saham, it immediately displays the cached stock list (0ms delay),
 * and updates seamlessly when fresh deferred props arrive from Inertia.
 */
export function useStockListSWR(props: StockListProps) {
    const filterKey = useMemo(() => getFilterKey(props.filters), [props.filters]);
    const cached = useMemo(() => getStoredStockCache(filterKey), [filterKey]);

    const incomingStocks: Stock[] = useMemo(() => {
        if (!props.stocks) return [];
        return Array.isArray(props.stocks) ? props.stocks : props.stocks.data || [];
    }, [props.stocks]);

    // Initial state: Take fresh props if available, otherwise take from cache
    const [stocks, setStocks] = useState<Stock[]>(() => {
        if (incomingStocks.length > 0) {
            return incomingStocks;
        }
        return cached?.stocks || [];
    });

    const [totalCount, setTotalCount] = useState<number | undefined>(() => {
        return props.total_count ?? cached?.totalCount;
    });

    // Check if we currently have valid stock data to display immediately
    const hasCachedStocks = stocks.length > 0;

    // Check if we are revalidating in the background
    const isRevalidating = incomingStocks.length === 0 && hasCachedStocks;

    // Revalidate and update cache when fresh props arrive from Inertia
    useEffect(() => {
        if (incomingStocks.length > 0) {
            setStocks(incomingStocks);
            if (props.total_count !== undefined) {
                setTotalCount(props.total_count);
            }
            saveStoredStockCache(filterKey, incomingStocks, props.total_count);
        }
    }, [incomingStocks, props.total_count, filterKey]);

    return {
        stocks,
        totalCount,
        hasCachedStocks,
        isRevalidating,
    };
}
