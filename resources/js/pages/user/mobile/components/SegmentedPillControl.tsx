import React from 'react';

export interface SegmentOption<T extends string = string> {
    id: T;
    label: string;
    badge?: string | number;
}

export interface SegmentedPillControlProps<T extends string = string> {
    options: SegmentOption<T>[];
    selectedId: T;
    onChange: (id: T) => void;
    className?: string;
}

export function SegmentedPillControl<T extends string = string>({
    options,
    selectedId,
    onChange,
    className = '',
}: SegmentedPillControlProps<T>) {
    return (
        <div
            className={`h-11 bg-zinc-200/70 p-1 rounded-full flex items-center w-full select-none ${className}`}
        >
            {options.map((opt) => {
                const isActive = opt.id === selectedId;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={`flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                                ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                    >
                        <span>{opt.label}</span>
                        {opt.badge !== undefined && (
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-zinc-300/60 text-zinc-600'
                                }`}
                            >
                                {opt.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedPillControl;
