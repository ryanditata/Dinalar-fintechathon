import SparklineChart from '@/components/SparklineChart';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

export interface StockItemCardProps {
    ticker: string;
    name?: string | null;
    bursa?: string | null;
    price?: number | string;
    change?: number | null;
    changePercent?: number | null;
    recentPrices?: number[];
    analysisCount?: number;
    subtext?: string | null;
    actionLabel?: string;
    onActionClick?: () => void;
    onClick?: () => void;
}

export function StockItemCard({
    ticker,
    name,
    bursa = 'IDX',
    price,
    change,
    changePercent,
    recentPrices,
    analysisCount,
    subtext,
    actionLabel = 'Analisis',
    onActionClick,
    onClick,
}: StockItemCardProps) {
    const cleanTicker = ticker.replace('.JK', '');
    const isPositive = (changePercent ?? 0) >= 0;
    const numPrice = typeof price === 'number' ? price : Number(price) || 0;

    const formattedPrice =
        numPrice > 0
            ? `${numPrice.toLocaleString('id-ID')}`
            : price !== undefined && price !== null
            ? String(price)
            : '-';

    return (
        <article
            onClick={onClick}
            className={`w-full rounded-2xl bg-white border border-zinc-200 shadow-2xs hover:border-emerald-500/50 hover:shadow-xs transition-all duration-200 group ${
                onClick ? 'cursor-pointer active:scale-[0.99]' : ''
            }`}
        >
            <div className="p-3.5 space-y-2.5">
                {/* Baris 1: Ticker, Badge Bursa, Nama Emiten & Tombol Aksi */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-extrabold text-[15px] text-zinc-900 group-hover:text-emerald-600 transition-colors">
                                {cleanTicker}
                            </span>
                            <span
                                className={`text-[9px] py-0 px-1.5 font-semibold rounded-full border ${
                                    bursa === 'NYSE'
                                        ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5'
                                        : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                                }`}
                            >
                                {bursa || 'IDX'}
                            </span>
                        </div>
                        <span className="text-xs text-zinc-500 block truncate max-w-[220px] mt-0.5">
                            {name}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onActionClick) {
                                onActionClick();
                            } else if (onClick) {
                                onClick();
                            }
                        }}
                        className="text-[11px] font-semibold h-7 px-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        {actionLabel}
                    </button>
                </div>

                {/* Baris 2: Harga & Persentase vs Sparkline Chart */}
                <div className="flex items-end justify-between pt-0.5 gap-2">
                    <div>
                        <span className="font-mono font-extrabold text-[14px] text-zinc-900 block leading-tight">
                            {formattedPrice}
                        </span>
                        {changePercent !== null && changePercent !== undefined && (
                            <span
                                className={`text-[11px] font-mono font-bold flex items-center gap-0.5 mt-0.5 tabular-nums ${
                                    isPositive ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                            >
                                {isPositive ? (
                                    <TrendingUp className="size-3" />
                                ) : (
                                    <TrendingDown className="size-3" />
                                )}
                                {isPositive ? '+' : ''}
                                {changePercent.toFixed(2)}%
                            </span>
                        )}
                    </div>

                    {/* Mini Sparkline Chart / Subtext */}
                    {recentPrices && recentPrices.length > 1 ? (
                        <div className="w-24 h-8 shrink-0">
                            <SparklineChart prices={recentPrices} className="w-24 h-8" />
                        </div>
                    ) : subtext ? (
                        <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[130px]">
                            {subtext}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export default StockItemCard;
