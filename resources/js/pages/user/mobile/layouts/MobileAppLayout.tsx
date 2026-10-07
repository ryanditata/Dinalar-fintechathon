import { Toaster } from '@/components/ui/sonner';
import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
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
    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-emerald-600 selection:text-white flex flex-col items-center">
            {title && <Head title={title} />}

            {/* Mobile Device Frame Container (Maks 430pt, Responsif di HP & Desktop) */}
            <div
                className="w-full max-w-[430px] min-h-screen bg-zinc-100 flex flex-col relative"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                }}
            >
                {/* Konten Halaman (Scrollable di bawah Nav Melayang) */}
                <main
                    className={`flex-1 w-full flex flex-col ${
                        hideBottomNav ? 'pb-8' : 'pb-28'
                    }`}
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
