import { Toaster } from '@/components/ui/sonner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileHeaderSpinner } from '@/pages/user/mobile/components/MobileHeaderSpinner';
import { Head } from '@inertiajs/react';
import React, { ReactNode } from 'react';

interface MobileAppLayoutProps {
    children: ReactNode;
    title?: string;
    hideBottomNav?: boolean;
}

export function MobileAppLayout({
    children,
    title,
    hideBottomNav = false,
}: MobileAppLayoutProps) {
    const { pullDistance, isRefreshing, isTracking } = usePullToRefresh();

    React.useEffect(() => {
        document.body.classList.add('mobile-app-mode');
        return () => {
            document.body.classList.remove('mobile-app-mode');
        };
    }, []);

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-emerald-600 selection:text-white flex flex-col items-center">
            {title && <Head title={title} />}

            {/* Mobile Device Frame Container (Maks 430pt, Responsif di HP & Desktop) */}
            <div
                data-mobile-app="true"
                className="w-full max-w-[430px] min-h-screen bg-zinc-100 flex flex-col relative"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                }}
            >
                {/* Floating Top Loading Spinner (Melayang di Atas seperti FloatingBottomNav) */}
                <MobileHeaderSpinner pullDistance={pullDistance} isRefreshing={isRefreshing} />

                {/* Konten Halaman (Scrollable di bawah Nav Melayang, bergeser saat ditarik ke bawah) */}
                <main
                    className={`flex-1 w-full flex flex-col ${
                        hideBottomNav ? 'pb-8' : 'pb-28'
                    }`}
                    style={{
                        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.65}px)` : undefined,
                        transition: isTracking ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {children}
                </main>

                {/* Floating Bottom Navigation Bar (Pil Hijau Melayang) */}
                {!hideBottomNav && <FloatingBottomNav />}
            </div>

            <Toaster position="top-center" richColors />
        </div>
    );
}

export default MobileAppLayout;
