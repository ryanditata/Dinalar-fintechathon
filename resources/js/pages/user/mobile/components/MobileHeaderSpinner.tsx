import { Loader2 } from 'lucide-react';
import React from 'react';

interface MobileHeaderSpinnerProps {
    className?: string;
    pullDistance?: number;
    isRefreshing?: boolean;
}

/**
 * Komponen spinner loading melayang di bagian atas untuk mode mobile apps.
 * Posisi fixed melayang (seperti FloatingBottomNav di bagian bawah).
 * Hanya aktif saat gesture Pull-to-Refresh (reload halaman), bukan saat navigasi/pindah halaman.
 */
export function MobileHeaderSpinner({
    className = '',
    pullDistance = 0,
    isRefreshing = false,
}: MobileHeaderSpinnerProps) {
    const isVisible = isRefreshing || pullDistance > 8;

    if (!isVisible) return null;

    // Pergeseran posisi vertikal saat ditarik ke bawah
    const translateY = pullDistance > 0 ? pullDistance * 0.55 : 0;
    const progress = Math.min(pullDistance / 60, 1);
    const rotation = progress * 360;

    return (
        <aside
            aria-label="Loading indicator"
            className="fixed inset-x-0 z-50 flex justify-center pointer-events-none select-none"
            style={{
                top: 'calc(10px + env(safe-area-inset-top, 0px))',
            }}
        >
            <div
                className={`flex items-center justify-center size-11 rounded-full pointer-events-auto transition-all ${
                    isRefreshing
                        ? 'animate-in fade-in zoom-in-90 slide-in-from-top-2 duration-200'
                        : ''
                } ${className}`}
                style={{
                    transform: `translateY(${translateY}px) scale(${isRefreshing ? 1 : 0.7 + progress * 0.3})`,
                    opacity: isRefreshing ? 1 : Math.max(progress, 0.4),
                }}
                role="status"
                aria-label="Memuat..."
            >
                <Loader2
                    className={`size-6 text-emerald-600 dark:text-emerald-400 stroke-[2.2] ${
                        isRefreshing ? 'animate-spin' : ''
                    }`}
                    style={{
                        transform: !isRefreshing ? `rotate(${rotation}deg)` : undefined,
                    }}
                />
            </div>
        </aside>
    );
}

export default MobileHeaderSpinner;
