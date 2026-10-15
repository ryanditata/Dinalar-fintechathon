import { useEffect, useMemo, useState } from 'react';

export interface StockItem {
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

export interface PortfolioItem {
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

export interface DashboardProps {
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

interface StoredDashboardCache extends DashboardProps {
    userId?: number;
    timestamp: number;
}

// Module-level in-memory cache (survives client-side route changes within SPA!)
let inMemoryCache: StoredDashboardCache | null = null;

const CACHE_KEY = 'dinalar_dashboard_swr_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

function getStoredCache(currentUserId?: number): StoredDashboardCache | null {
    // 1. Check in-memory RAM cache first
    if (inMemoryCache && Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS) {
        if (!currentUserId || !inMemoryCache.userId || inMemoryCache.userId === currentUserId) {
            return inMemoryCache;
        }
    }

    // 2. Fallback to sessionStorage
    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
                const parsed: StoredDashboardCache = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
                    if (!currentUserId || !parsed.userId || parsed.userId === currentUserId) {
                        inMemoryCache = parsed;
                        return inMemoryCache;
                    }
                }
            }
        } catch {
            // Ignore storage parse errors
        }
    }

    return null;
}

function saveStoredCache(data: Partial<DashboardProps>, currentUserId?: number) {
    const existing = inMemoryCache || ({} as Partial<StoredDashboardCache>);
    const updated: StoredDashboardCache = {
        ...existing,
        ...data,
        userId: currentUserId || existing.userId,
        timestamp: Date.now(),
    };
    inMemoryCache = updated;

    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore storage quota or disabled errors
        }
    }
}

/**
 * Manually invalidate/clear the dashboard SWR cache (e.g. after a new optimization is created).
 */
export function clearDashboardSWR() {
    inMemoryCache = null;
    if (typeof window !== 'undefined') {
        try {
            sessionStorage.removeItem(CACHE_KEY);
        } catch {
            // Ignore
        }
    }
}

/**
 * Hook to implement Stale-While-Revalidate (SWR) on the User Dashboard.
 * When navigating back to the dashboard, it immediately displays the cached data (0ms delay),
 * and updates seamlessly when fresh deferred props arrive.
 */
export function useDashboardSWR(props: DashboardProps, currentUserId?: number) {
    const cached = useMemo(() => getStoredCache(currentUserId), [currentUserId]);

    // Initial state: Take fresh props if available, otherwise take from cache
    const [popularStocks, setPopularStocks] = useState<StockItem[]>(() => {
        if (props.popular_stocks && props.popular_stocks.length > 0) {
            return props.popular_stocks;
        }
        return cached?.popular_stocks || [];
    });

    const [topGainers, setTopGainers] = useState<StockItem[]>(() => {
        if (props.top_gainers && props.top_gainers.length > 0) {
            return props.top_gainers;
        }
        return cached?.top_gainers || [];
    });

    const [topLosers, setTopLosers] = useState<StockItem[]>(() => {
        if (props.top_losers && props.top_losers.length > 0) {
            return props.top_losers;
        }
        return cached?.top_losers || [];
    });

    const [recentOptimizations, setRecentOptimizations] = useState<PortfolioItem[]>(() => {
        if (props.recent_optimizations && props.recent_optimizations.length > 0) {
            return props.recent_optimizations;
        }
        return cached?.recent_optimizations || [];
    });

    const [latestPortfolio, setLatestPortfolio] = useState<PortfolioItem | null>(() => {
        if (props.latest_portfolio !== undefined) {
            return props.latest_portfolio;
        }
        return cached?.latest_portfolio || null;
    });

    // Check if we currently have valid market data to display immediately
    const hasCachedMarketData =
        popularStocks.length > 0 || topGainers.length > 0 || topLosers.length > 0;

    // Check if we are currently revalidating in the background
    const isRevalidating =
        (!props.popular_stocks || props.popular_stocks.length === 0) && hasCachedMarketData;

    // Synchronize and revalidate whenever fresh props arrive from Inertia
    useEffect(() => {
        let hasChanges = false;
        const updates: Partial<DashboardProps> = {};

        if (props.popular_stocks && props.popular_stocks.length > 0) {
            setPopularStocks(props.popular_stocks);
            updates.popular_stocks = props.popular_stocks;
            hasChanges = true;
        }

        if (props.top_gainers && props.top_gainers.length > 0) {
            setTopGainers(props.top_gainers);
            updates.top_gainers = props.top_gainers;
            hasChanges = true;
        }

        if (props.top_losers && props.top_losers.length > 0) {
            setTopLosers(props.top_losers);
            updates.top_losers = props.top_losers;
            hasChanges = true;
        }

        if (props.recent_optimizations && props.recent_optimizations.length > 0) {
            setRecentOptimizations(props.recent_optimizations);
            updates.recent_optimizations = props.recent_optimizations;
            hasChanges = true;
        }

        if (props.latest_portfolio !== undefined) {
            setLatestPortfolio(props.latest_portfolio);
            updates.latest_portfolio = props.latest_portfolio;
            hasChanges = true;
        }

        if (props.total_user_optimizations !== undefined) {
            updates.total_user_optimizations = props.total_user_optimizations;
        }

        if (props.total_stocks_count !== undefined) {
            updates.total_stocks_count = props.total_stocks_count;
        }

        if (props.last_updated) {
            updates.last_updated = props.last_updated;
        }

        if (hasChanges) {
            saveStoredCache(updates, currentUserId);
        }
    }, [
        props.popular_stocks,
        props.top_gainers,
        props.top_losers,
        props.recent_optimizations,
        props.latest_portfolio,
        props.total_user_optimizations,
        props.total_stocks_count,
        props.last_updated,
        currentUserId,
    ]);

    return {
        popular_stocks: popularStocks,
        top_gainers: topGainers,
        top_losers: topLosers,
        recent_optimizations: recentOptimizations,
        latest_portfolio: latestPortfolio,
        total_user_optimizations: props.total_user_optimizations ?? cached?.total_user_optimizations ?? 0,
        total_stocks_count: props.total_stocks_count ?? cached?.total_stocks_count ?? 0,
        risk_free_rate: props.risk_free_rate ?? cached?.risk_free_rate ?? 6.0,
        last_updated: props.last_updated ?? cached?.last_updated,
        hasCachedMarketData,
        isRevalidating,
    };
}
