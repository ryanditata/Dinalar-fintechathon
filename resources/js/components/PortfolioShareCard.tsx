import { type Stock } from '@/types';
import React, { forwardRef } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

export interface BestPortfolioItem {
    return: number;
    risk: number;
    sharpe: number;
    sortino?: number;
    omega?: number;
    weights?: Record<string, number>;
    allocation_idr?: Record<string, number>;
    lot_estimation?: Record<string, number>;
    capital_allocation?: Record<string, { weight_percent: number; nominal_idr: number }>;
    isCustom?: boolean;
    name?: string;
}

export interface PortfolioOptimizationRecord {
    id: number;
    user_id: number;
    title: string;
    reference_code?: string;
    initial_capital: number;
    risk_free_rate: number;
    start_date: string | null;
    end_date: string | null;
    tickers: string[];
    best_portfolios: {
        sharpe: BestPortfolioItem;
        min_variance: BestPortfolioItem;
        sortino?: BestPortfolioItem;
        omega?: BestPortfolioItem;
        max_return?: BestPortfolioItem;
    };
    created_at: string;
    updated_at?: string;
}

interface SingleShareCardProps {
    profile: BestPortfolioItem;
    profileType: 'min_variance' | 'sharpe' | 'max_return' | 'sortino';
    optimization: PortfolioOptimizationRecord;
    stocks?: Record<string, Stock>;
}

interface CompareShareCardProps {
    optimization: PortfolioOptimizationRecord;
    stocks?: Record<string, Stock>;
}

const PALETTE = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
];

// Helper format Rupiah
const formatIdr = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || isNaN(Number(val))) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

// Helper format Date
const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

/**
 * 1. SINGLE PROFILE SHARE CARD (Rasio ~ 4:5, Story & Social Media Ready)
 */
export const PortfolioShareCard = forwardRef<HTMLDivElement, SingleShareCardProps>(
    ({ profile, profileType, optimization, stocks = {} }, ref) => {
        const initialCapital = Number(optimization.initial_capital || 0);
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;

        const profileMeta = {
            min_variance: {
                badge: 'PROFIL KONSERVATIF',
                sub: 'Risiko Rendah (Minimum Variance)',
                accentColor: '#06b6d4',
                accentBg: 'rgba(6, 182, 212, 0.15)',
                accentBorder: 'rgba(6, 182, 212, 0.4)',
            },
            sharpe: {
                badge: 'PROFIL SEIMBANG',
                sub: 'Optimal Sharpe Ratio (Pilihan Utama)',
                accentColor: '#10b981',
                accentBg: 'rgba(16, 185, 129, 0.15)',
                accentBorder: 'rgba(16, 185, 129, 0.4)',
            },
            max_return: {
                badge: 'PROFIL AGRESIF',
                sub: 'Return Maksimal (Growth)',
                accentColor: '#f59e0b',
                accentBg: 'rgba(245, 158, 11, 0.15)',
                accentBorder: 'rgba(245, 158, 11, 0.4)',
            },
            sortino: {
                badge: 'PROFIL DOWNSIDE OPTIMAL',
                sub: 'Optimal Sortino Ratio',
                accentColor: '#8b5cf6',
                accentBg: 'rgba(139, 92, 246, 0.15)',
                accentBorder: 'rgba(139, 92, 246, 0.4)',
            },
        }[profileType] || {
            badge: 'REKOMENDASI PORTOFOLIO',
            sub: 'Optimasi NSGA-II',
            accentColor: '#10b981',
            accentBg: 'rgba(16, 185, 129, 0.15)',
            accentBorder: 'rgba(16, 185, 129, 0.4)',
        };

        // Extract assets allocation list sesuai data dari database & result.tsx
        let rawAllocMap: Record<string, { weight_percent: number; nominal_idr: number }> = {};

        if (profile.capital_allocation && Object.keys(profile.capital_allocation).length > 0) {
            rawAllocMap = profile.capital_allocation;
        } else if (profile.weights && Object.keys(profile.weights).length > 0) {
            Object.entries(profile.weights).forEach(([ticker, rawWeight]) => {
                const clean = ticker.replace('.JK', '');
                const weightVal = Number(rawWeight);
                const weightPercent = weightVal <= 1.0 ? weightVal * 100 : weightVal;
                const nominal =
                    profile.allocation_idr?.[ticker] ??
                    profile.allocation_idr?.[clean] ??
                    (weightPercent / 100) * initialCapital;

                rawAllocMap[ticker] = {
                    weight_percent: weightPercent,
                    nominal_idr: nominal,
                };
            });
        }

        const allocations = Object.entries(rawAllocMap)
            .map(([ticker, alloc]) => {
                const clean = ticker.replace('.JK', '');
                const stockData = stocks[ticker] || stocks[clean];
                const lastClose = stockData?.latest_price?.close_price ? Number(stockData.latest_price.close_price) : 0;
                const lot =
                    profile.lot_estimation?.[ticker] ??
                    profile.lot_estimation?.[clean] ??
                    (lastClose > 0 ? Math.floor(alloc.nominal_idr / (lastClose * 100)) : 0);

                return {
                    ticker: clean,
                    weightPercent: Number(alloc.weight_percent.toFixed(2)),
                    nominal: Math.round(alloc.nominal_idr),
                    lot,
                };
            })
            .filter((a) => a.weightPercent > 0.05)
            .sort((a, b) => b.weightPercent - a.weightPercent);

        const pieData = allocations.map((a, idx) => ({
            name: a.ticker,
            value: a.weightPercent,
            color: PALETTE[idx % PALETTE.length],
        }));

        return (
            <div
                ref={ref}
                style={{
                    width: '600px',
                    backgroundColor: '#0a0e17',
                    color: '#f8fafc',
                    fontFamily: '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    padding: '28px',
                    borderRadius: '24px',
                    border: '1px solid #1e293b',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative background glow orbs */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '240px',
                        height: '240px',
                        borderRadius: '9999px',
                        backgroundColor: profileMeta.accentColor,
                        opacity: 0.12,
                        filter: 'blur(60px)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-60px',
                        left: '-60px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '9999px',
                        backgroundColor: '#10b981',
                        opacity: 0.08,
                        filter: 'blur(50px)',
                        pointerEvents: 'none',
                    }}
                />

                {/* 1. HEADER SECTION */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img
                            src="/images/newLogo.png?v=3"
                            alt="Dinalar Logo"
                            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                        />
                    </div>

                    <div
                        style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            backgroundColor: profileMeta.accentBg,
                            border: `1px solid ${profileMeta.accentBorder}`,
                            color: profileMeta.accentColor,
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                        }}
                    >
                        {profileMeta.badge}
                    </div>
                </div>

                {/* 2. TITLE & SUBTITLE */}
                <div
                    style={{
                        backgroundColor: '#111827',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        border: '1px solid #1f2937',
                        marginBottom: '18px',
                    }}
                >
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '2px' }}>
                        {optimization.title || 'Portofolio Multi-Aset'}
                    </div>
                    <div style={{ fontSize: '12px', color: profileMeta.accentColor, fontWeight: 600 }}>
                        {profileMeta.sub}
                    </div>
                </div>

                {/* 3. KEY METRICS KPI GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {/* Return */}
                    <div
                        style={{
                            backgroundColor: '#111827',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: '1px solid #1e293b',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>
                            Expected Return (Tahunan)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
                            +{Number(profile.return || 0).toFixed(2)}%
                        </div>
                    </div>

                    {/* Risk */}
                    <div
                        style={{
                            backgroundColor: '#111827',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: '1px solid #1e293b',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>
                            Volatilitas Risiko (σ)
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace' }}>
                            {Number(profile.risk || 0).toFixed(2)}%
                        </div>
                    </div>

                    {/* Sharpe */}
                    <div
                        style={{
                            backgroundColor: '#111827',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            border: '1px solid #1e293b',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>
                            Sharpe Ratio
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', fontFamily: '"JetBrains Mono", monospace' }}>
                            {Number(profile.sharpe || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* 4. ASSET ALLOCATION (DONUT + TOP ASSETS LIST) */}
                <div
                    style={{
                        backgroundColor: '#111827',
                        borderRadius: '16px',
                        padding: '16px 18px',
                        border: '1px solid #1e293b',
                        marginBottom: '18px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                            Rincian Alokasi Aset Saham
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
                            Modal: {formatIdr(initialCapital)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Donut Chart with fixed explicit SVG dimensions */}
                        <div style={{ width: '130px', height: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PieChart width={130} height={130}>
                                <Pie
                                    data={pieData}
                                    cx={65}
                                    cy={65}
                                    innerRadius={36}
                                    outerRadius={60}
                                    paddingAngle={3}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a0e17" strokeWidth={2} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </div>

                        {/* Top Stock List */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {allocations.slice(0, 4).map((item, idx) => (
                                <div
                                    key={item.ticker}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        backgroundColor: '#0a0e17',
                                        border: '1px solid #1e293b',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '2px',
                                                backgroundColor: PALETTE[idx % PALETTE.length],
                                            }}
                                        />
                                        <span style={{ fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#f8fafc' }}>
                                            {item.ticker}
                                        </span>
                                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                                            ({item.weightPercent}%)
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>
                                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{formatIdr(item.nominal)}</span>
                                        {item.lot > 0 && (
                                            <span style={{ color: '#10b981', fontSize: '10px', marginLeft: '6px' }}>
                                                ~{item.lot} lot
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {allocations.length > 4 && (
                                <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right', marginTop: '2px' }}>
                                    + {allocations.length - 4} saham lainnya di portofolio
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. METADATA STRIP */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#64748b',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#0a0e17',
                        border: '1px solid #1e293b',
                        marginBottom: '16px',
                    }}
                >
                    <div>
                        Rentang Waktu: <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                            {optimization.start_date && optimization.end_date
                                ? `${formatDateStr(optimization.start_date)} - ${formatDateStr(optimization.end_date)}`
                                : formatDateStr(optimization.created_at)}
                        </span>
                    </div>
                    <div>
                        Risk-Free Rate: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{optimization.risk_free_rate}%</span>
                    </div>
                    <div>
                        Tanggal: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{formatDateStr(optimization.created_at)}</span>
                    </div>
                </div>

                {/* 6. FOOTER WATERMARK & CALL TO ACTION */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontSize: '10px',
                                fontWeight: 800,
                                fontFamily: '"JetBrains Mono", monospace',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            REF: {refCode}
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                        dinalar.my.id
                    </div>
                </div>
            </div>
        );
    }
);
PortfolioShareCard.displayName = 'PortfolioShareCard';

/**
 * 2. 3-PROFILE COMPARISON SHARE CARD (Landscape 16:9, Side-by-Side Comparison)
 */
export const PortfolioCompareShareCard = forwardRef<HTMLDivElement, CompareShareCardProps>(
    ({ optimization, stocks = {} }, ref) => {
        const initialCapital = Number(optimization.initial_capital || 0);
        const best = optimization.best_portfolios || {};
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;

        const profilesList = [
            {
                key: 'min_variance',
                title: 'Konservatif',
                subtitle: 'Minimum Variance (MVP)',
                color: '#06b6d4',
                bg: 'rgba(6, 182, 212, 0.1)',
                border: 'rgba(6, 182, 212, 0.3)',
                data: best.min_variance,
            },
            {
                key: 'sharpe',
                title: 'Seimbang',
                subtitle: 'Optimal Sharpe Ratio (Utama)',
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.15)',
                border: 'rgba(16, 185, 129, 0.4)',
                isFeatured: true,
                data: best.sharpe,
            },
            {
                key: 'max_return',
                title: 'Agresif',
                subtitle: 'Max Expected Return',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)',
                border: 'rgba(245, 158, 11, 0.3)',
                data: best.max_return || best.omega,
            },
        ];

        return (
            <div
                ref={ref}
                style={{
                    width: '920px',
                    backgroundColor: '#0a0e17',
                    color: '#f8fafc',
                    fontFamily: '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    padding: '30px',
                    borderRadius: '24px',
                    border: '1px solid #1e293b',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                            src="/images/newLogo.png?v=3"
                            alt="Dinalar Logo"
                            style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
                        />
                        <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                Perbandingan 3 Profil Rekomendasi Portofolio
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            Modal: {formatIdr(initialCapital)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Risk-Free Rate: {optimization.risk_free_rate}%
                        </div>
                    </div>
                </div>

                {/* 3 Columns Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    {profilesList.map((p) => {
                        const pData = p.data;
                        if (!pData) return null;

                        let allocMap: Record<string, { weight_percent: number; nominal_idr: number }> = {};
                        if (pData.capital_allocation && Object.keys(pData.capital_allocation).length > 0) {
                            allocMap = pData.capital_allocation;
                        } else if (pData.weights) {
                            Object.entries(pData.weights).forEach(([t, w]) => {
                                const clean = t.replace('.JK', '');
                                const wVal = Number(w);
                                const weightPercent = wVal <= 1.0 ? wVal * 100 : wVal;
                                const nominal =
                                    pData.allocation_idr?.[t] ??
                                    pData.allocation_idr?.[clean] ??
                                    (weightPercent / 100) * initialCapital;
                                allocMap[t] = {
                                    weight_percent: weightPercent,
                                    nominal_idr: nominal,
                                };
                            });
                        }

                        const topAssets = Object.entries(allocMap)
                            .map(([ticker, alloc]) => {
                                const clean = ticker.replace('.JK', '');
                                const stockData = stocks[ticker] || stocks[clean];
                                const lastClose = stockData?.latest_price?.close_price ? Number(stockData.latest_price.close_price) : 0;
                                const lot =
                                    pData.lot_estimation?.[ticker] ??
                                    pData.lot_estimation?.[clean] ??
                                    (lastClose > 0 ? Math.floor(alloc.nominal_idr / (lastClose * 100)) : 0);

                                return {
                                    ticker: clean,
                                    weightPercent: Number(alloc.weight_percent.toFixed(1)),
                                    nominal: Math.round(alloc.nominal_idr),
                                    lot,
                                };
                            })
                            .filter((a) => a.weightPercent > 0.05)
                            .sort((a, b) => b.weightPercent - a.weightPercent)
                            .slice(0, 3);

                        return (
                            <div
                                key={p.key}
                                style={{
                                    backgroundColor: '#111827',
                                    borderRadius: '16px',
                                    padding: '18px',
                                    border: p.isFeatured ? `2px solid ${p.color}` : '1px solid #1e293b',
                                    boxShadow: p.isFeatured ? `0 0 20px rgba(16, 185, 129, 0.15)` : 'none',
                                    position: 'relative',
                                }}
                            >
                                {p.isFeatured && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '16px',
                                            backgroundColor: '#10b981',
                                            color: '#ffffff',
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '9999px',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        REKOMENDASI UTAMA
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '9999px',
                                            backgroundColor: p.color,
                                        }}
                                    />
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: p.color }}>
                                        {p.title}
                                    </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                                    {p.subtitle}
                                </div>

                                {/* Metrics */}
                                <div
                                    style={{
                                        backgroundColor: '#0a0e17',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '6px',
                                        textAlign: 'center',
                                        marginBottom: '14px',
                                        border: '1px solid #1e293b',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '9px', color: '#64748b' }}>Return</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', fontFamily: '"JetBrains Mono", monospace' }}>
                                            +{Number(pData.return || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', color: '#64748b' }}>Risiko</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#06b6d4', fontFamily: '"JetBrains Mono", monospace' }}>
                                            {Number(pData.risk || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', color: '#64748b' }}>Sharpe</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', fontFamily: '"JetBrains Mono", monospace' }}>
                                            {Number(pData.sharpe || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Assets List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>
                                        Top Alokasi Saham:
                                    </div>
                                    {topAssets.map((a) => (
                                        <div
                                            key={a.ticker}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '11px',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                backgroundColor: '#0a0e17',
                                                border: '1px solid #1e293b',
                                                fontFamily: '"JetBrains Mono", monospace',
                                            }}
                                        >
                                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                                                {a.ticker} <span style={{ color: '#10b981', fontSize: '10px' }}>({a.weightPercent}%)</span>
                                            </span>
                                            <span style={{ color: '#94a3b8' }}>
                                                {formatIdr(a.nominal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', fontSize: '11px', color: '#64748b' }}>
                    <div>
                        Tanggal: {formatDateStr(optimization.created_at)}
                    </div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>
                        dinalar.my.id
                    </div>
                </div>
            </div>
        );
    }
);
PortfolioCompareShareCard.displayName = 'PortfolioCompareShareCard';
