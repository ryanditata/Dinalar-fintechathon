import { ChevronRight } from 'lucide-react';
import React from 'react';

export interface AllocationProgressBarProps {
    label?: string;
    currentValue?: number | string;
    totalValue?: number | string;
    percentage?: number; // 0 to 100
    actionLabel?: string;
    onActionClick?: () => void;
}

export function AllocationProgressBar({
    label = 'Alokasi Keranjang Saham',
    currentValue,
    totalValue,
    percentage = 45,
    actionLabel = 'Atur Parameter Optimasi',
    onActionClick,
}: AllocationProgressBarProps) {
    // Clamp percentage between 0 and 100
    const clampedPercent = Math.min(Math.max(percentage, 0), 100);

    return (
        <div className="w-full rounded-2xl bg-white border border-zinc-200 p-3 shadow-xs">
            {/* 1. Track Progress (Tinggi 24, Radius Full, Padding 3) */}
            <div className="relative h-6 w-full rounded-full border border-zinc-200 bg-zinc-100 p-[3px] overflow-hidden flex items-center">
                {/* Sisa Limit: Background Diagonal Hatch (135 deg) */}
                <div
                    className="absolute inset-[3px] rounded-full pattern-hatch"
                    style={{
                        background:
                            'repeating-linear-gradient(135deg, #A7F3D0 0 2px, #F0FDF4 2px 6px)',
                    }}
                />

                {/* Bagian Terisi: Gradient Progress */}
                <div
                    className="relative h-full rounded-full transition-all duration-300 z-10 bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{
                        width: `${clampedPercent}%`,
                    }}
                >
                    {/* Thumb: Lingkaran 14pt Primary + Ring Putih 3pt + Shadow */}
                    <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-3.5 rounded-full bg-emerald-600 ring-[3px] ring-white shadow-sm z-20"
                    />
                </div>
            </div>

            {/* 2. Baris Info (Margin Atas 12) */}
            <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">{label}</span>
                <div className="flex items-baseline font-sans tabular-nums">
                    <span className="font-bold text-zinc-900 text-sm">
                        {currentValue !== undefined ? currentValue : `${clampedPercent.toFixed(0)}%`}
                    </span>
                    {totalValue !== undefined && (
                        <span className="text-zinc-500 text-xs ml-0.5 font-normal">
                            /{totalValue}
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Divider & Baris Aksi */}
            {actionLabel && (
                <>
                    <div className="mt-3 h-[1px] bg-zinc-200 w-full" />
                    <button
                        type="button"
                        onClick={onActionClick}
                        className="w-full pt-2.5 pb-0.5 flex items-center justify-between text-left group active:opacity-75 transition-opacity"
                    >
                        <span className="text-[14px] font-medium text-zinc-900 group-hover:text-emerald-600 transition-colors">
                            {actionLabel}
                        </span>
                        <ChevronRight className="size-4 text-zinc-500 group-hover:text-emerald-600 transition-colors" />
                    </button>
                </>
            )}
        </div>
    );
}

export default AllocationProgressBar;
