import React from 'react';

export interface StatItem {
    label: string;
    value: string | number;
    subtext?: string;
    isHighlight?: boolean;
    color?: string;
}

export interface StatCardsTrioProps {
    stats: [StatItem, StatItem, StatItem];
}

export function StatCardsTrio({ stats }: StatCardsTrioProps) {
    return (
        <div className="grid grid-cols-3 gap-2 w-full">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-xl bg-white border border-zinc-200 py-2.5 px-2 text-center shadow-xs"
                >
                    <span className="text-[11px] font-medium text-zinc-500 leading-tight truncate w-full">
                        {stat.label}
                    </span>
                    <div
                        className={`text-[15px] font-bold tracking-tight font-sans tabular-nums mt-1 leading-tight ${
                            stat.color ? stat.color : stat.isHighlight ? 'text-emerald-600' : 'text-zinc-900'
                        }`}
                    >
                        {stat.value}
                    </div>
                    {stat.subtext && (
                        <span className="text-[10px] text-zinc-400 mt-0.5 leading-none">
                            {stat.subtext}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

export default StatCardsTrio;
