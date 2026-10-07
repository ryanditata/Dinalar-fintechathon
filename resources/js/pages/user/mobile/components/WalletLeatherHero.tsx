import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

interface WalletLeatherHeroProps {
    amount?: number | string;
    cardHolder?: string;
    referenceCode?: string;
    label?: string;
    sublabel?: string;
    expectedReturn?: number | string | null;
    volatility?: number | string | null;
    sharpeRatio?: number | string | null;
}

export function WalletLeatherHero({
    amount = 43093.00,
    cardHolder = 'INVESTOR DINALAR',
    referenceCode = '828749-2847-03',
    label = 'Modal Portofolio AI',
    sublabel = 'Kalkulasi Algoritma Markowitz',
    expectedReturn,
    volatility,
    sharpeRatio,
}: WalletLeatherHeroProps) {
    const [hideAmount, setHideAmount] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dinalar_hide_wallet_balance') === 'true';
        }
        return false;
    });

    const toggleHide = () => {
        setHideAmount((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('dinalar_hide_wallet_balance', String(next));
            }
            return next;
        });
    };

    const formattedAmount =
        typeof amount === 'number'
            ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
            : amount;

    const formatMetricPercent = (val: number | string | null | undefined, fallback: string) => {
        if (val === null || val === undefined || val === '') return fallback;
        const num = Number(val);
        if (isNaN(num)) return String(val);
        const percent = num <= 1.0 && num > 0 ? num * 100 : num;
        const sign = percent > 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    };

    const formatVolatilityPercent = (val: number | string | null | undefined, fallback: string) => {
        if (val === null || val === undefined || val === '') return fallback;
        const num = Number(val);
        if (isNaN(num)) return String(val);
        const percent = num <= 1.0 && num > 0 ? num * 100 : num;
        return `${percent.toFixed(2)}%`;
    };

    const formatSharpeValue = (val: number | string | null | undefined, fallback: string) => {
        if (val === null || val === undefined || val === '') return fallback;
        const num = Number(val);
        if (isNaN(num)) return String(val);
        return num.toFixed(2);
    };

    const formattedReturn = formatMetricPercent(expectedReturn, '+15.80%');
    const formattedVolatility = formatVolatilityPercent(volatility, '8.20%');
    const formattedSharpe = formatSharpeValue(sharpeRatio, '1.85');

    return (
        <section
            aria-label="Kartu Modal Portofolio"
            className="relative mx-3 h-[235px] rounded-[28px] bg-emerald-900 shadow-xl shadow-emerald-950/20 overflow-hidden select-none"
        >
            {/* ==============================================================
                LAPISAN 1: KARTU METALIK MENGINTIP DARI ATAS
                ============================================================== */}
            <div
                className="absolute top-3 inset-x-4 h-[95px] rounded-2xl p-3 flex flex-col justify-between text-emerald-950 shadow-sm z-0 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-300"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="size-5 rounded-full bg-emerald-900 flex items-center justify-center">
                            <Sparkles className="size-3 text-white" />
                        </div>
                        <span className="text-xs font-bold tracking-tight text-emerald-950 font-sans">
                            Portofolio
                        </span>
                    </div>

                    <span className="font-mono text-[11px] font-semibold text-emerald-900/80 tracking-wider">
                        {referenceCode}
                    </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-emerald-900/70 font-mono tracking-widest uppercase">
                    <span>{cardHolder}</span>
                    <span className="font-bold text-emerald-950">AI OPTIMIZED</span>
                </div>
            </div>

            {/* ==============================================================
                LAPISAN 2: KANTONG DEPAN DOMPET KULIT DENGAN LEKUKAN CEKUNG
                ============================================================== */}
            <div
                className="absolute inset-x-0 bottom-0 top-[72px] rounded-b-[24px] z-10 flex flex-col justify-between p-4 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900"
            >
                {/* Lekukan Cekung Atas (Notch Tengah) */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-emerald-600 rounded-b-2xl border-b border-emerald-300/30" />

                {/* Jahitan Benang Putus-Putus (Stitch Inset 6pt) */}
                <div className="absolute inset-1.5 rounded-[20px] pointer-events-none border-[1.5px] border-dashed border-emerald-200/40" />

                {/* Rivet / Paku Logam di Sudut Kiri & Kanan Atas Kantong */}
                <div className="absolute top-2.5 left-3 size-3.5 rounded-full bg-emerald-950 shadow-xs flex items-center justify-center">
                    <div className="size-1 rounded-full bg-emerald-200/60" />
                </div>
                <div className="absolute top-2.5 right-3 size-3.5 rounded-full bg-emerald-950 shadow-xs flex items-center justify-center">
                    <div className="size-1 rounded-full bg-emerald-200/60" />
                </div>

                {/* ==============================================================
                    LAPISAN 3: KONTEN TEKS & NOMINAL SALDO MODAL
                    ============================================================== */}
                <div className="relative z-20 pt-2 flex flex-col gap-1.5 text-white/90">
                    <span className="text-sm font-medium tracking-wide truncate max-w-[340px]">
                        {label}
                    </span>

                    {/* 3 Metrik: Return | Volatilitas | Sharpe Ratio */}
                    <div className="grid grid-cols-3 divide-x divide-emerald-400/20 py-1.5 px-1 rounded-xl bg-emerald-950/40 border border-emerald-400/20 backdrop-blur-xs text-center">
                        <div className="px-1">
                            <span className="text-[10px] text-emerald-200/90 font-medium block">
                                Return
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-100 tabular-nums block mt-0.5">
                                {formattedReturn}
                            </span>
                        </div>
                        <div className="px-1">
                            <span className="text-[10px] text-emerald-200/90 font-medium block">
                                Volatilitas
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-100 tabular-nums block mt-0.5">
                                {formattedVolatility}
                            </span>
                        </div>
                        <div className="px-1">
                            <span className="text-[10px] text-emerald-200/90 font-medium block">
                                Sharpe Ratio
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-100 tabular-nums block mt-0.5">
                                {formattedSharpe}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 flex items-end justify-between pb-1">
                    <div>
                        <div className="flex items-baseline text-white">
                            {/* Simbol Mata Uang Kecil Terangkat (Superscript) */}
                            <span className="text-sm font-semibold text-emerald-200 mr-1.5 -translate-y-0.5">
                                Rp
                            </span>
                            <span className="text-[24px] font-bold tracking-tight font-sans tabular-nums text-white leading-none">
                                {hideAmount ? '••••••••' : formattedAmount}
                            </span>
                        </div>
                    </div>

                    {/* Tombol Toggle Mata (Sembunyikan Saldo) */}
                    <button
                        type="button"
                        onClick={toggleHide}
                        className="p-1.5 rounded-full text-emerald-100/75 hover:text-white active:scale-95 transition-all cursor-pointer"
                        aria-label={hideAmount ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                    >
                        {hideAmount ? (
                            <EyeOff className="size-5 stroke-[1.75]" />
                        ) : (
                            <Eye className="size-5 stroke-[1.75]" />
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default WalletLeatherHero;
