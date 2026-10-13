import { Toaster } from '@/components/ui/sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Globe } from 'lucide-react';
import React, { ReactNode } from 'react';

interface MobileAuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    backHref?: string;
    status?: string;
}

export function MobileAuthLayout({
    children,
    title,
    subtitle,
    backHref,
    status,
}: MobileAuthLayoutProps) {
    const { language, toggleLanguage, t } = useTranslation();

    React.useEffect(() => {
        document.body.classList.add('mobile-app-mode');
        return () => {
            document.body.classList.remove('mobile-app-mode');
        };
    }, []);

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-emerald-600 selection:text-white flex flex-col items-center">
            <Head title={title} />

            {/* Mobile Device Frame Container (Maks 430pt) */}
            <div
                data-mobile-app="true"
                className="w-full max-w-[430px] min-h-screen bg-zinc-100 flex flex-col justify-between relative px-4 py-6"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                }}
            >
                {/* Bagian Atas: Navigasi Back & Branding */}
                <div className="w-full space-y-4">
                    {/* Top Header Bar */}
                    <header className="flex items-center justify-between select-none">
                        {backHref ? (
                            <Link
                                href={backHref}
                                className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs active:scale-95 transition-transform"
                                aria-label={t('common.back', 'Kembali')}
                            >
                                <ArrowLeft className="size-5 stroke-[2]" />
                            </Link>
                        ) : (
                            <div className="size-10" />
                        )}

                        {/* Logo & Brand Name */}
                        <Link href="/" className="flex items-center gap-2 group active:scale-98 transition-transform">
                            <div className="size-8 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-center p-1 overflow-hidden">
                                <img
                                    src="/images/newLogo.png?v=4"
                                    alt="Dinalar Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="font-bold text-sm tracking-tight text-zinc-900">
                                DINA<span className="text-emerald-600">LAR</span>
                            </span>
                        </Link>

                        <div className="size-10" />
                    </header>

                    {/* Judul & Subtitle Halaman */}
                    <div className="text-center pt-1 pb-1 px-2 space-y-1">
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Status Alert Banner */}
                    {status && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-center text-xs font-medium text-emerald-800 animate-in fade-in duration-200 shadow-2xs">
                            {status}
                        </div>
                    )}

                    {/* Card Konten Utama */}
                    <main className="rounded-[28px] bg-white p-5 border border-zinc-200/90 shadow-2xs space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        {children}
                    </main>
                </div>

                {/* Footer Hak Cipta / Tagline */}
                <footer className="pt-6 pb-2 text-center select-none">
                    <p className="text-[11px] text-zinc-400 font-medium">
                        © {new Date().getFullYear()} Dinalar • {t('auth.app_tagline', 'Platform Optimasi Portofolio Saham AI')}.
                    </p>
                </footer>
            </div>

            <Toaster position="top-center" richColors />
        </div>
    );
}

export default MobileAuthLayout;
