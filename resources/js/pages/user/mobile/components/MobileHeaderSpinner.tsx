import { useInertiaLoading } from '@/hooks/useInertiaLoading';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface MobileHeaderSpinnerProps {
    className?: string;
}

/**
 * Komponen spinner loading melayang di bagian atas untuk mode mobile apps.
 * Posisi fixed melayang (seperti FloatingBottomNav di bagian bawah).
 */
export function MobileHeaderSpinner({ className = '' }: MobileHeaderSpinnerProps) {
    const isLoading = useInertiaLoading();

    if (!isLoading) return null;

    return (
        <aside
            aria-label="Loading indicator"
            className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
            style={{
                top: 'calc(10px + env(safe-area-inset-top, 0px))',
            }}
        >
            <div
                className={`flex items-center justify-center size-11 rounded-full pointer-events-auto animate-in fade-in zoom-in-90 slide-in-from-top-2 duration-200 ${className}`}
                role="status"
                aria-label="Memuat..."
            >
                <Loader2 className="size-6 text-emerald-600 dark:text-emerald-400 animate-spin stroke-[2.2]" />
            </div>
        </aside>
    );
}

export default MobileHeaderSpinner;
