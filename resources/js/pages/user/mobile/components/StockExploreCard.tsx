import SparklineChart from '@/components/SparklineChart';
import { Check, Plus } from 'lucide-react';
import React from 'react';

export interface StockExploreCardProps {
    ticker: string;
    name?: string | null;
    bursa?: string | null;
    price?: number | string | null;
    change?: number | null;
    changePercent?: number | null;
    recentPrices?: number[];
    isAdded?: boolean;
    onActionClick?: () => void;
    onClick?: () => void;
}

export function StockExploreCard({
    ticker,
    name,
    bursa = 'IDX',
    price,
    changePercent,
    recentPrices,
    isAdded = false,
    onActionClick,
    onClick,
}: StockExploreCardProps) {
    const cleanTicker = ticker.replace('.JK', '');
    const numPrice = typeof price === 'number' ? price : Number(price) || 0;

    const formattedPrice =
        numPrice > 0
            ? new Intl.NumberFormat('id-ID', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
              }).format(numPrice)
            : price !== undefined && price !== null
            ? String(price)
            : '-';

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onClick) onClick();
                }
            }}
            className={`group w-full rounded-2xl bg-white select-none transition-all duration-200 hover:shadow-xs hover:border-emerald-500/50 active:scale-[0.99] cursor-pointer ${
                isAdded
                    ? 'border border-emerald-500/50 shadow-xs'
                    : 'border border-zinc-200 shadow-2xs'
            }`}
        >
            <div className="flex items-center justify-between px-3.5 py-6 gap-2.5">
                {/* AREA KIRI: Informasi Emiten */}
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-base text-zinc-900 font-mono tracking-tight group-hover:text-emerald-600 transition-colors">
                            {cleanTicker}
                        </span>
                        <span
                            className={`text-[9px] py-0 px-1.5 font-semibold font-mono rounded-full border ${
                                bursa === 'NYSE'
                                    ? 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                                    : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                            }`}
                        >
                            {bursa || 'IDX'}
                        </span>
                    </div>
                    <p
                        className="text-xs text-zinc-500 truncate max-w-[115px] sm:max-w-[160px] mt-0.5"
                        title={name || cleanTicker}
                    >
                        {name || cleanTicker}
                    </p>
                </div>

                {/* AREA TENGAH: Sparkline Chart */}
                <div className="flex-1 px-1 flex items-center justify-center min-w-0">
                    {recentPrices && recentPrices.length > 1 ? (
                        <SparklineChart
                            prices={recentPrices}
                            className="w-16 h-8"
                        />
                    ) : null}
                </div>

                {/* AREA KANAN: Harga, Return & Tombol '+' / Check Trigger Modal */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-[15px] font-mono text-zinc-900 leading-tight">
                            {formattedPrice}
                        </span>
                        {changePercent !== null && changePercent !== undefined ? (
                            <span
                                className={`text-[11px] font-medium font-mono tabular-nums ${
                                    changePercent > 0
                                        ? 'text-emerald-600'
                                        : changePercent < 0
                                        ? 'text-rose-600'
                                        : 'text-zinc-500'
                                }`}
                            >
                                {changePercent > 0
                                    ? `▲ +${changePercent.toFixed(2)}%`
                                    : changePercent < 0
                                    ? `▼ ${changePercent.toFixed(2)}%`
                                    : '0.00%'}
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-zinc-400">-</span>
                        )}
                    </div>

                    {/* TOMBOL '+' TRIGGER MODAL (Kotak 1 Flowchart) */}
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
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95 ${
                            isAdded
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-500/50'
                        }`}
                        title={isAdded ? 'Sudah di Keranjang (Buka Analisis)' : 'Analisis & Tambah ke Keranjang'}
                        aria-label={isAdded ? `Sudah di Keranjang ${cleanTicker}` : `Analisis dan Tambah ${cleanTicker}`}
                    >
                        {isAdded ? (
                            <Check className="size-4 stroke-[2.5]" />
                        ) : (
                            <Plus className="size-4 stroke-[2.5]" />
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}

export default StockExploreCard;
