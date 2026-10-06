import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    basket_tickers?: string[];
    basket_count?: number;
    flash?: {
        success?: string | null;
        error?: string | null;
        info?: string | null;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    last_seen_at?: string | null;
    is_online?: boolean;
    portfolio_optimizations_count?: number;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface StockPrice {
    id: number;
    stock_id: number;
    date: string;
    close_price: string | number;
    created_at: string;
    updated_at: string;
}

export interface Stock {
    id: number;
    ticker: string;
    name: string | null;
    bursa: string | null;
    sector?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    prices_count?: number;
    latest_price?: StockPrice | null;
    change?: number | null;
    change_percent?: number | null;
    previous_price?: number | null;
    recent_prices?: number[];
    analysis_count?: number;
}

export interface StockStatistics {
    total_stocks: number;
    total_prices: number;
    idx_conventional_count: number;
    nyse_count: number;
    jii_count?: number;
    active_stocks_count: number;
    last_price_date: string | null;
    online_users_count?: number;
    today_optimizations_count?: number;
    total_optimizations_count?: number;
}

export interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
}

export interface PortfolioOptimizationRecord {
    id: number;
    user_id: number;
    share_token?: string;
    title: string;
    reference_code?: string;
    initial_capital: number;
    risk_free_rate?: number;
    start_date?: string | null;
    end_date?: string | null;
    tickers: string[];
    best_portfolios?: Record<string, any> | Array<any>;
    efficient_frontier?: Array<any>;
    quantile_analysis?: Record<string, any>;
    individual_assets?: Record<string, any>;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface OptimizationHistoryStatistics {
    today_optimizations_count: number;
    total_optimizations_count: number;
    avg_capital: number;
    top_stock: {
        ticker: string;
        count: number;
    };
}


