import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileHeader } from '@/pages/user/mobile/components/MobileHeader';
import { QuickActionTiles } from '@/pages/user/mobile/components/QuickActionTiles';
import { StockItemCard } from '@/pages/user/mobile/components/StockItemCard';
import { WalletLeatherHero } from '@/pages/user/mobile/components/WalletLeatherHero';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, Sparkles, TrendingUp, Zap } from 'lucide-react';
import React, { useState } from 'react';

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
    };
    created_at: string;
}

interface MobileDashboardProps {
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

export default function MobileDashboard({
    popular_stocks = [],
    top_gainers = [],
    top_losers = [],
    recent_optimizations = [],
    latest_portfolio = null,
    total_user_optimizations = 0,
    total_stocks_count = 0,
    risk_free_rate = 6.0,
    last_updated,
}: MobileDashboardProps) {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;

    const [activeTab, setActiveTab] = useState<'popular' | 'gainers' | 'losers'>('popular');

    const displayedStocks =
        activeTab === 'popular'
            ? popular_stocks.slice(0, 5)
            : activeTab === 'gainers'
            ? top_gainers.slice(0, 5)
            : top_losers.slice(0, 5);

    const heroAmount = latest_portfolio
        ? latest_portfolio.initial_capital
        : 10000000;

    const heroRefCode = latest_portfolio?.reference_code || 'DNL-PORT-01';

    return (
        <MobileAppLayout title="Beranda | Dinalar Mobile">
            {/* 1. Header (Avatar 40 & Keranjang Saham) */}
            <MobileHeader />

            <div className="space-y-3.5 pt-1">
                {/* 2. Wallet Card (Hero Dompet Kulit Gelap Berjahit & Rivet) */}
                <WalletLeatherHero
                    amount={heroAmount}
                    cardHolder={auth?.user?.name ? auth.user.name.toUpperCase() : 'INVESTOR DINALAR'}
                    referenceCode={heroRefCode}
                    label={latest_portfolio ? latest_portfolio.title : 'Modal Portofolio AI'}
                    sublabel={latest_portfolio ? 'Portofolio Terakhir' : 'Estimasi Modal'}
                />

                {/* 3. Quick Action Tiles x3 (Pasar Saham, Keranjang, Riwayat AI) */}
                <QuickActionTiles />

                {/* 4. Container Putih Besar (Section 6.5 & 7.1) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[18px] font-semibold text-emerald-600 tracking-tight">
                            Bursa Pilihan
                        </h3>
                        <Link
                            href="/user/saham"
                            className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        >
                            <ChevronRight/>
                        </Link>
                    </div>

                    {/* Filter Segment Mini */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-xl mb-3.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('popular')}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                activeTab === 'popular'
                                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            Populer
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('gainers')}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                activeTab === 'gainers'
                                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            Top Gainers
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('losers')}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                activeTab === 'losers'
                                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            Top Losers
                        </button>
                    </div>

                    {/* List Saham (StockItemCard) */}
                    <div className="space-y-2">
                        {displayedStocks.length > 0 ? (
                            displayedStocks.map((stock) => (
                                <StockItemCard
                                    key={stock.id}
                                    ticker={stock.ticker}
                                    name={stock.name}
                                    bursa={stock.bursa || 'IDX'}
                                    price={stock.latest_price?.close_price}
                                    change={stock.change}
                                    changePercent={stock.change_percent}
                                    recentPrices={stock.recent_prices}
                                    analysisCount={stock.analysis_count}
                                    actionLabel="Analisis"
                                    onActionClick={() => {
                                        router.get('/user/saham', {
                                            search: stock.ticker.replace('.JK', ''),
                                        });
                                    }}
                                    onClick={() => {
                                        router.get('/user/saham', {
                                            search: stock.ticker.replace('.JK', ''),
                                        });
                                    }}
                                />
                            ))
                        ) : (
                            <div className="py-8 text-center text-xs text-zinc-500">
                                Belum ada data pergerakan saham.
                            </div>
                        )}
                    </div>
                </section>

                {/* 5. Riwayat Terakhir Card (Jika Ada Portofolio Tersimpan) */}
                {recent_optimizations.length > 0 && (
                    <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[18px] font-semibold text-emerald-600 tracking-tight">
                            Riwayat Portofolio
                        </h3>
                        <Link
                            href="/user/analyze/history"
                            className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        >
                            <ChevronRight/>
                        </Link>
                    </div>

                        <div className="space-y-2">
                            {recent_optimizations.slice(0, 3).map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/user/analyze/result/${item.id}`}
                                    className="block p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-emerald-500 transition-all"
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-zinc-900 truncate max-w-[400px]">
                                            {item.title}
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-600 font-sans">
                                            Rp {item.initial_capital.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        {item.tickers.slice(0, 4).map((t, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-zinc-500 border border-zinc-200 font-mono"
                                            >
                                                {t.replace('.JK', '')}
                                            </span>
                                        ))}
                                        {item.tickers.length > 4 && (
                                            <span className="text-[10px] text-zinc-500">
                                                +{item.tickers.length - 4} lagi
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Bottom Nav Floating Pill */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
