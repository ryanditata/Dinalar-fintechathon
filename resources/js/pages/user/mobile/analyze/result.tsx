import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { PolylineTrendChart } from '@/pages/user/mobile/components/PolylineTrendChart';
import { SegmentedPillControl } from '@/pages/user/mobile/components/SegmentedPillControl';
import { StatCardsTrio } from '@/pages/user/mobile/components/StatCardsTrio';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type Stock } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Copy,
    Download,
    Layers,
    MoreHorizontal,
    Share2,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface BestPortfolioItem {
    return: number;
    risk: number;
    sharpe: number;
    sortino?: number;
    omega?: number;
    weights: Record<string, number>;
    allocation_idr: Record<string, number>;
    lot_estimation?: Record<string, number>;
}

interface PortfolioOptimizationRecord {
    id: number;
    user_id: number;
    reference_code?: string;
    share_token?: string;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    start_date: string | null;
    end_date: string | null;
    tickers: string[];
    best_portfolios: {
        sharpe: BestPortfolioItem;
        min_variance: BestPortfolioItem;
        sortino?: BestPortfolioItem;
        max_return?: BestPortfolioItem;
    };
    efficient_frontier: Array<{ return: number; risk: number; sharpe: number }>;
    created_at: string;
}

interface ResultProps {
    optimization: PortfolioOptimizationRecord;
    stocks: Record<string, Stock>;
    history?: Array<{
        id: number;
        user_id?: number;
        reference_code?: string;
        title: string;
        initial_capital: number;
        created_at: string;
    }>;
    isPublic?: boolean;
    shareUrl?: string;
}

export default function MobileResultPage({
    optimization,
    stocks = {},
    history = [],
    isPublic = false,
}: ResultProps) {
    const { best_portfolios, initial_capital, efficient_frontier, title, reference_code } =
        optimization;

    // Profile state: 'sharpe' | 'min_variance' | 'sortino'
    const [selectedProfile, setSelectedProfile] = useState<'sharpe' | 'min_variance' | 'sortino'>('sharpe');
    const [isSharing, setIsSharing] = useState<boolean>(false);

    // Active Profile Data
    const activeData: BestPortfolioItem = useMemo(() => {
        if (selectedProfile === 'min_variance' && best_portfolios.min_variance) {
            return best_portfolios.min_variance;
        }
        if (selectedProfile === 'sortino' && best_portfolios.sortino) {
            return best_portfolios.sortino;
        }
        return best_portfolios.sharpe || best_portfolios.min_variance;
    }, [selectedProfile, best_portfolios]);

    // Format Efficient Frontier Points for PolylineTrendChart
    const chartData = useMemo(() => {
        if (!efficient_frontier || efficient_frontier.length === 0) {
            return [];
        }
        // Urutkan berdasarkan risiko menaik
        const sorted = [...efficient_frontier].sort((a, b) => a.risk - b.risk);
        return sorted.map((pt, idx) => ({
            date: `R: ${(pt.risk * 100).toFixed(1)}%`,
            value: Number((pt.return * 100).toFixed(2)),
            label: `Return ${(pt.return * 100).toFixed(2)}% | Sharpe ${pt.sharpe.toFixed(2)}`,
        }));
    }, [efficient_frontier]);

    // Format Trio Stats
    const returnVal = (activeData.return * 100).toFixed(2);
    const riskVal = (activeData.risk * 100).toFixed(2);
    const sharpeVal = activeData.sharpe.toFixed(2);

    // Filter Allocations where weight > 0
    const allocations = useMemo(() => {
        if (!activeData || !activeData.weights) return [];
        const entries = Object.entries(activeData.weights);

        // Normalize tickers by avoiding duplicate .JK vs clean
        const seen = new Set<string>();
        const res: Array<{
            ticker: string;
            clean: string;
            weight: number;
            nominal: number;
            lot: number;
            stock?: Stock;
        }> = [];

        for (const [t, w] of entries) {
            const clean = t.replace('.JK', '');
            if (seen.has(clean) || w <= 0.001) continue;
            seen.add(clean);

            const weightPct = w > 1 ? w : w * 100;
            const nominal =
                activeData.allocation_idr?.[t] ??
                activeData.allocation_idr?.[clean] ??
                (initial_capital * weightPct) / 100;
            const lot =
                activeData.lot_estimation?.[t] ??
                activeData.lot_estimation?.[clean] ??
                0;
            const stock = stocks[t] || stocks[clean] || stocks[`${clean}.JK`];

            res.push({
                ticker: t,
                clean,
                weight: weightPct,
                nominal,
                lot,
                stock,
            });
        }

        return res.sort((a, b) => b.weight - a.weight);
    }, [activeData, stocks, initial_capital]);

    // Copy Share Link
    const handleShare = async () => {
        try {
            setIsSharing(true);
            const res = await fetch(`/user/analyze/share/${optimization.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.url) {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(data.url);
                    toast.success('Link portofolio berhasil disalin ke clipboard!');
                } else {
                    toast.info(`Link publik: ${data.url}`);
                }
            } else {
                toast.error('Gagal membuat tautan berbagi.');
            }
        } catch (e) {
            toast.error('Terjadi kesalahan saat membuat tautan berbagi.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <MobileAppLayout title="Analytics Portofolio | Dinalar Mobile">
            {/* Top Bar (Section 6.2 in desain.md) */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={isPublic ? '/' : '/user/analyze/history'}
                        className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="size-5 stroke-[2]" />
                    </Link>
                    <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight">
                        Analytics Portofolio
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform"
                    aria-label="Bagikan Portofolio"
                >
                    <Share2 className="size-4 stroke-[1.8]" />
                </button>
            </header>

            <div className="space-y-3.5 pt-1 pb-16">
                {/* 1. Judul + Nominal Total Modal (Section 7.3 in desain.md) */}
                <div className="px-4 pt-1">
                    <span className="text-[13px] text-zinc-500 font-medium block">
                        Total Modal Investasi
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[16px] font-bold text-zinc-900 -translate-y-1">
                            Rp
                        </span>
                        <span className="text-[28px] font-bold tracking-tight text-zinc-900 font-sans tabular-nums leading-none">
                            {initial_capital.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200/70 font-semibold text-zinc-900">
                            {reference_code || `DNL-REF-${optimization.id}`}
                        </span>
                        <span className="truncate max-w-[220px]">{title}</span>
                    </div>
                </div>

                {/* 2. Line Chart: Efficient Frontier (Section 6.11 in desain.md) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[14px] font-semibold text-zinc-900">
                                Kurva Efisien (Markowitz Frontier)
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                                Trade-off Risiko vs Return Portofolio
                            </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                            NSGA-II AI
                        </span>
                    </div>

                    <PolylineTrendChart
                        data={chartData}
                        valuePrefix="Return "
                        valueSuffix="%"
                        startDateLabel="Risiko Terendah"
                        endDateLabel="Return Maksimal"
                        height={160}
                    />
                </section>

                {/* 3. Stat Cards Trio: Return, Risiko, Sharpe (Section 6.10 in desain.md) */}
                <div className="mx-1">
                    <StatCardsTrio
                        stats={[
                            {
                                label: 'Expected Return',
                                value: `+${returnVal}%`,
                                color: 'text-emerald-600',
                            },
                            {
                                label: 'Volatilitas Risiko',
                                value: `${riskVal}%`,
                                color: 'text-zinc-900',
                            },
                            {
                                label: 'Sharpe Ratio',
                                value: sharpeVal,
                                isHighlight: true,
                            },
                        ]}
                    />
                </div>

                {/* 4. Container Putih: Segmented Control + Daftar Alokasi Aset (Section 6.12 & 7.3) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                            Komposisi Aset Optimal
                        </h3>
                        <span className="text-[12px] font-medium text-zinc-500">
                            {allocations.length} Saham Terpilih
                        </span>
                    </div>

                    {/* Segmented Control Pill (Section 6.12) */}
                    <SegmentedPillControl<'sharpe' | 'min_variance' | 'sortino'>
                        selectedId={selectedProfile}
                        onChange={(id) => setSelectedProfile(id)}
                        options={[
                            { id: 'sharpe', label: 'Max Sharpe' },
                            { id: 'min_variance', label: 'Min Risiko' },
                            ...(best_portfolios.sortino
                                ? [{ id: 'sortino' as const, label: 'Sortino' }]
                                : []),
                        ]}
                    />

                    {/* List Saham Alokasi */}
                    <div className="space-y-2.5 pt-1">
                        {allocations.map((item) => (
                            <div
                                key={item.ticker}
                                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs"
                            >
                                {/* Baris 1: Detail Saham & Bobot */}
                                <div className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[12px] font-bold text-zinc-900">
                                                {item.clean.slice(0, 3)}
                                            </span>
                                            <span className="text-[9px] text-zinc-500">
                                                {item.stock?.bursa || 'IDX'}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-[15px] font-semibold text-zinc-900 leading-tight">
                                                {item.clean}
                                            </h4>
                                            <p className="text-[12px] text-zinc-500 truncate max-w-[140px]">
                                                {item.stock?.name || 'Emiten Terpilih'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[15px] font-bold text-zinc-900 font-sans tabular-nums">
                                            Rp {Math.round(item.nominal).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[12px] font-bold text-emerald-600 tabular-nums mt-0.5">
                                            Bobot {item.weight.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Baris 2 Footer (bg-zinc-100) */}
                                <div className="bg-zinc-100 px-3 py-1.5 flex items-center justify-between border-t border-zinc-200 text-xs">
                                    <span className="text-zinc-500 flex items-center gap-1 font-medium">
                                        <Layers className="size-3" />
                                        Estimasi: {item.lot > 0 ? `${item.lot} Lot` : '< 1 Lot'}
                                    </span>
                                    <span className="text-zinc-900 font-mono font-medium">
                                        Harga: Rp{' '}
                                        {(
                                            item.stock?.latest_price?.close_price || 0
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom Nav Floating Pill */}
            {!isPublic && <FloatingBottomNav />}
        </MobileAppLayout>
    );
}
