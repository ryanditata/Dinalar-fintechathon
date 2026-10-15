import React, { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import Lenis from '@studio-freight/lenis';
import { motion, type Variants } from 'framer-motion';
import SparklineChart from '@/components/SparklineChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/i18n/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useAppearance } from '@/hooks/use-appearance';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Activity,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Coins,
    Compass,
    Cpu,
    Gauge,
    History,
    Layers,
    Menu,
    MessageCircle,
    Minus,
    Monitor,
    Moon,
    MoreHorizontal,
    PieChart as PieIcon,
    Plus,
    Share2,
    ShieldCheck,
    Sparkles,
    Sun,
    Tag,
    TrendingUp,
    X,
    Zap,
} from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.05,
        },
    },
};

const scaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 24 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
};

export default function LandingPage() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const dashboardUrl = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

    const { language, t } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();
    const currency = language === 'en' ? 'IDR' : 'Rp';
    const formatNumber = (num: number) => num.toLocaleString(language === 'en' ? 'en-US' : 'id-ID');

    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [activeTabProfile, setActiveTabProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
    const [activeSection, setActiveSection] = useState<string>('hero');

    const mockHistoryList = [
        {
            id: 1,
            refCode: 'DNL1-084',
            title: t('landing.mock_history.item_1_title', 'Portofolio Bluechip LQ45 Optimal Sharpe'),
            tickers: ['BBCA', 'BBRI', 'TLKM', 'ASII', 'ICBP'],
            initialCapital: 50000000,
            riskFreeRate: 6.25,
            createdAt: t('landing.mock_history.item_1_date', '22 Agu 2026, 10:30'),
            expectedReturn: '+24.85%',
            risk: '11.40%',
        },
        {
            id: 2,
            refCode: 'DNL1-083',
            title: t('landing.mock_history.item_2_title', 'Kombinasi Sektor Finansial & Konsumer'),
            tickers: ['BMRI', 'BBNI', 'UNVR', 'INDF'],
            initialCapital: 35000000,
            riskFreeRate: 6.25,
            createdAt: t('landing.mock_history.item_2_date', '21 Agu 2026, 16:15'),
            expectedReturn: '+19.60%',
            risk: '9.80%',
        },
        {
            id: 3,
            refCode: 'DNL1-082',
            title: t('landing.mock_history.item_3_title', 'Portofolio Saham Unggulan Global (NASDAQ)'),
            tickers: ['NVDA', 'AAPL', 'GOOGL', 'META', 'MSFT'],
            initialCapital: 25000000,
            riskFreeRate: 4.5,
            createdAt: t('landing.mock_history.item_3_date', '20 Agu 2026, 14:00'),
            expectedReturn: '+14.80%',
            risk: '11.50%',
        },
        {
            id: 4,
            refCode: 'DNL1-081',
            title: t('landing.mock_history.item_4_title', 'Strategi Defensif Dividen Tinggi (Minimum Variance)'),
            tickers: ['BBCA', 'ASII', 'PGAS', 'PTBA'],
            initialCapital: 75000000,
            riskFreeRate: 6.25,
            createdAt: t('landing.mock_history.item_4_date', '19 Agu 2026, 09:45'),
            expectedReturn: '+16.50%',
            risk: '8.20%',
        },
    ];

    const faqList: FAQItem[] = [
        {
            question: t('landing.faq.q1', 'Apa itu Dinalar dan bagaimana cara kerjanya?'),
            answer: t(
                'landing.faq.a1',
                'Dinalar adalah platform optimasi portofolio saham kuantitatif berbasis Artificial Intelligence. Dinalar menggunakan kombinasi Teori Portofolio Modern Markowitz dan algoritma genetika NSGA-II (Non-dominated Sorting Genetic Algorithm II) untuk menghitung alokasi bobot saham optimal yang memaksimalkan proyeksi imbal hasil (Expected Return) sekaligus meminimalkan risiko volatilitas pasar.'
            ),
        },
        {
            question: t('landing.faq.q2', 'Apakah hasil analisis menyertakan rekomendasi nominal dan jumlah lot saham?'),
            answer: t(
                'landing.faq.a2',
                'Ya, Dinalar secara otomatis mengonversi bobot persentase optimal menjadi estimasi nominal Rupiah (IDR) dan jumlah lot pembelian nyata berdasarkan harga penutupan pasar bursa saham (IDX) terkini serta modal awal yang Anda masukkan.'
            ),
        },
        {
            question: t('landing.faq.q3', 'Apa perbedaan antara profil Konservatif, Moderat, dan Agresif?'),
            answer: t(
                'landing.faq.a3',
                'Profil Konservatif (Minimum Variance) memprioritaskan volatilitas risiko terendah. Profil Moderat (Optimal Sharpe Ratio) memberikan rasio imbal hasil per unit risiko paling efisien. Sedangkan profil Agresif (Max Return) berfokus mengejar potensi keuntungan tertinggi pada frontier efisien.'
            ),
        },
        {
            question: t('landing.faq.q4', 'Apakah laporan hasil optimasi bisa diunduh atau dibagikan?'),
            answer: t(
                'landing.faq.a4',
                'Ya, Anda dapat mengunduh Laporan Resmi berformat PDF vektor beresolusi tinggi, mengekspor infografis kartu portofolio berformat PNG, menyalin ringkasan teks WhatsApp, maupun membagikan tautan publik aman yang dapat diakses siapa saja tanpa perlu login.'
            ),
        },
        {
            question: t('landing.faq.q5', 'Berapa modal minimal untuk melakukan analisis portofolio di Dinalar?'),
            answer: t(
                'landing.faq.a5',
                'Tidak ada batasan modal minimal. Anda bebas memasukkan modal investasi simulasi mulai dari Rp 1.000.000 hingga miliaran rupiah sesuai dengan rencana alokasi dana investasi Anda.'
            ),
        },
        {
            question: t('landing.faq.q6', 'Apakah platform Dinalar memungut biaya atau komisi transaksi?'),
            answer: t(
                'landing.faq.a6',
                'Dinalar adalah platform analisis kuantitatif independen dan tidak memungut komisi transaksi broker apa pun. Anda dapat mendaftar dan menggunakan seluruh fitur optimasi portofolio secara gratis.'
            ),
        },
    ];

    const statsData = [
        {
            value: '100%',
            label: t('landing.features.stat_1_title', 'Matematika Tanpa Bias Emosi'),
            desc: t('landing.features.stat_1_desc', 'Keputusan alokasi aset murni berbasis kalkulasi kovariansi dan frontier efisien.'),
        },
        {
            value: '3.33s',
            label: t('landing.features.stat_2_title', 'Kecepatan Solusi Pareto'),
            desc: t('landing.features.stat_2_desc', 'Menghasilkan puluhan kombinasi portofolio optimal dalam hitungan detik.'),
        },
        {
            value: t('landing.features.stat_3_val', '3 Pilihan'),
            label: t('landing.features.stat_3_title', 'Profil Risiko Terukur'),
            desc: t('landing.features.stat_3_desc', 'Pilihan strategi terarah: Minimum Variance, Optimal Sharpe Ratio, dan Max Expected Return.'),
        },
    ];

    // Smooth scroll using Lenis
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    // Active section scrollspy
    useEffect(() => {
        const sections = ['hero', 'features', 'how-it-works', 'showcase', 'faq'];

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200; // offset threshold

            for (let i = sections.length - 1; i >= 0; i--) {
                const sectionId = sections[i];
                const el = document.getElementById(sectionId);
                if (el) {
                    const top = el.offsetTop;
                    if (scrollPosition >= top) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const NAV_ITEMS = [
        { id: 'hero', label: t('landing.nav.home', 'Home') },
        { id: 'features', label: t('landing.nav.features', 'Fitur Utama') },
        { id: 'how-it-works', label: t('landing.nav.how_it_works', 'Cara Kerja') },
        { id: 'showcase', label: t('landing.nav.showcase', 'Simulasi') },
        { id: 'faq', label: t('landing.nav.faq', 'FAQ') },
    ];

    return (
        <div className="min-h-screen bg-[#0A0B0A] text-white selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-hidden">
            <Head>
                <title>{t('landing.meta_title', 'Dinalar - AI Stock Portfolio Optimization Platform')}</title>
                <meta
                    name="description"
                    content={t('landing.meta_description', 'Platform optimasi portofolio saham berbasis Artificial Intelligence. Maksimalkan return dan kendalikan risiko saham pilihan Anda.')}
                />
            </Head>

            {/* ==========================================
                1. STICKY NAVBAR (Dark Glassmorphism)
            ========================================== */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#0A0B0A]/85 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">
                    {/* Brand Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/images/newLogo.png?v=5"
                                alt="Dinalar Logo"
                                className="h-9 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    {/* Navigation Links (Desktop - Perfectly Centered) */}
                    <nav className="hidden md:flex items-center gap-8 text-sm absolute left-1/2 -translate-x-1/2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`relative py-1 transition-colors cursor-pointer ${isActive
                                            ? 'text-emerald-400 font-semibold'
                                            : 'text-white/70 hover:text-white font-medium'
                                        }`}
                                >
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Action CTAs (Desktop & Mobile) */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Link
                            href={user ? dashboardUrl : '/login'}
                            className="px-4 py-2 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                            <span>{user ? t('landing.nav.dashboard', 'Dashboard') : t('landing.nav.login', 'Login')}</span>
                        </Link>

                        {/* Hamburger Button for Mobile */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={t('landing.nav.toggle_menu', 'Toggle Menu')}
                            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu (Glassmorphism) */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#0A0B0A]/95 backdrop-blur-2xl border-t border-white/10 px-4 pt-3 pb-6 space-y-4">
                        <nav className="flex flex-col space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            scrollToSection(item.id);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${isActive
                                                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                                                : 'text-white/80 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span>{item.label}</span>
                                        <ChevronRight
                                            className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-white/40'
                                                }`}
                                        />
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between px-1 py-1">
                                <span className="text-xs text-white/60">Bahasa / Language</span>
                                <LanguageToggle theme="dark" />
                            </div>
                            <Link
                                href={user ? dashboardUrl : '/login'}
                                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {user ? t('landing.nav.dashboard', 'Dashboard') : t('landing.nav.login', 'Login')}
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ==========================================
                2. HERO SECTION (Dark Premium with Glow & Floating Cards)
            ========================================== */}
            <section id="hero" className="relative pt-36 sm:pt-44 pb-20 sm:pb-32 overflow-hidden">
                {/* 1. Concentric Planetary Orbit Rings (Matching Reference Image) */}
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[700px] sm:h-[1000px] rounded-full border border-emerald-500/15 pointer-events-none -z-10 [mask-image:radial-gradient(circle_at_center,black_45%,transparent_75%)]" />
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1050px] sm:w-[1450px] h-[1050px] sm:h-[1450px] rounded-full border border-emerald-500/10 pointer-events-none -z-10 [mask-image:radial-gradient(circle_at_center,black_35%,transparent_70%)]" />
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] sm:w-[1900px] h-[1400px] sm:h-[1900px] rounded-full border border-emerald-500/[0.04] pointer-events-none -z-10 [mask-image:radial-gradient(circle_at_center,black_25%,transparent_65%)]" />

                {/* 2. Deep Atmospheric Glow Aura (Centered behind Headline & CTA) */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] sm:w-[1100px] h-[480px] sm:h-[620px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.35)_0%,rgba(16,185,129,0.12)_45%,transparent_75%)] blur-[100px] rounded-full pointer-events-none -z-10" />
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[700px] h-[260px] bg-emerald-400/25 blur-[70px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="text-center max-w-4xl mx-auto space-y-6"
                    >
                        {/* Main Hero Headline (Matching Reference Image Glowing Gradient & Shadow) */}
                        <motion.div variants={fadeInUp} className="relative">
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
                                <span className="bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent block">
                                    {t('landing.hero.title_1', 'Optimasi Portofolio Saham')}
                                </span>
                                <span className="mt-1 sm:mt-2 block bg-gradient-to-b from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(16,185,129,0.45)]">
                                    {t('landing.hero.title_2', 'dengan Kecerdasan Buatan')}
                                </span>
                            </h1>
                        </motion.div>

                        {/* Subtitle (Matching Reference Image Clean Typography) */}
                        <motion.p variants={fadeInUp} className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                            {t('landing.hero.subtitle', 'Alokasikan modal investasi saham secara matematis. Maksimalkan proyeksi imbal hasil dan kendalikan risiko volatilitas secara presisi tanpa bias emosional.')}
                        </motion.p>

                        {/* CTA Buttons (Matching Reference Image Glowing Pill CTA) */}
                        <motion.div variants={fadeInUp} className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                            <Link
                                href={user ? dashboardUrl : '/register'}
                                className="w-full sm:w-auto px-7 py-2.5 rounded-full font-semibold text-sm sm:text-base bg-white hover:bg-white/90 text-[#0A0B0A] shadow-[0_0_25px_rgba(255,255,255,0.4),0_0_60px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <span>{user ? t('landing.hero.cta_dashboard', 'Buka Dashboard') : t('landing.hero.cta_register', 'Optimasi Portofolio Sekarang')}</span>
                                <ArrowRight className="w-4 h-4 text-[#0A0B0A]" />
                            </Link>
                            <button
                                onClick={() => scrollToSection('features')}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full font-medium text-sm sm:text-base hover:bg-white/10 text-white/90 border border-white/20 hover:border-emerald-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Compass className="w-4 h-4 text-emerald-400" />
                                <span>{t('landing.hero.cta_features', 'Pelajari Fitur')}</span>
                            </button>
                        </motion.div>

                        {/* Trust & Community Ratings */}
                        <motion.div variants={fadeInUp} className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-white/60">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>{t('landing.hero.trust_idx', 'Data Resmi Bursa Efek Indonesia')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <PieIcon className="w-4 h-4 text-emerald-400" />
                                <span>{t('landing.hero.trust_allocation', 'Alokasi Portofolio & Estimasi Lot')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Share2 className="w-4 h-4 text-emerald-400" />
                                <span>{t('landing.hero.trust_export', 'Export & Bagikan Laporan')}</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* ==========================================
                        Hero Dashboard Mockup (Matching reference glowing aura)
                    ========================================== */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-14 sm:mt-20 relative max-w-5xl mx-auto text-left"
                    >
                        {/* High-intensity Ambient Backlight & Horizon Glow */}
                        <div className="absolute -top-36 sm:-top-44 left-1/2 -translate-x-1/2 w-[120%] sm:w-[950px] h-[280px] sm:h-[360px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.45)_0%,rgba(16,185,129,0.2)_40%,transparent_75%)] blur-[80px] sm:blur-[110px] rounded-full pointer-events-none -z-10" />
                        <div className="absolute -top-20 sm:-top-24 left-1/2 -translate-x-1/2 w-[90%] sm:w-[750px] h-[140px] bg-gradient-to-t from-emerald-400/50 via-emerald-500/25 to-transparent blur-[50px] rounded-full pointer-events-none -z-10" />
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[70%] sm:w-[550px] h-[80px] bg-emerald-400/40 blur-[30px] rounded-full pointer-events-none -z-10" />

                        {/* Top Laser Border Highlight Lines */}
                        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-[85%] sm:w-[700px] h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-30" />
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-[60%] sm:w-[480px] h-[4px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent blur-[3px] z-30" />

                        {/* Main Container Card (Adapts to Theme with Green Glowing Shadow) */}
                        <div className="relative rounded-2xl bg-card dark:bg-[#0A0B0A] border border-border/80 dark:border-white/15 p-4 sm:p-6 shadow-[0_-25px_80px_-15px_rgba(16,185,129,0.45),0_0_120px_-20px_rgba(16,185,129,0.25),0_35px_100px_rgba(0,0,0,0.95)] space-y-6 transition-colors">

                            {/* 1. HERO HEADER SECTION (Exact history.tsx) */}
                            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                                <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-500/15 blur-xl" />

                                <div className="relative z-10 flex items-center gap-4 w-full justify-between overflow-hidden">
                                    <div className="shrink-0">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                            <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            {t('landing.hero.preview_history_badge', 'Riwayat Portofolio')}
                                        </span>
                                    </div>

                                    {/* Button tambah saham */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                                        <Button asChild size="sm" className="gap-2 shadow-xs cursor-pointer h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <div>
                                                <Plus className="h-4 w-4" />
                                                {t('landing.hero.preview_analyze_btn', 'Analisis')}
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 2. MINI STATS BAR (Stockbit & TradingView Style) (Exact history.tsx) */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                                <Card className="border border-border/70 shadow-2xs bg-card/50 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
                                    <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">
                                                {t('landing.hero.stat_total_portfolio', 'Total Portofolio')}
                                            </span>
                                            <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                                4 <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">{t('landing.hero.stat_total_portfolio_unit', 'Portofolio')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border border-border/70 shadow-2xs bg-card/50 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
                                    <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">
                                                {t('landing.hero.stat_accumulated_capital', 'Akumulasi Modal')}
                                            </span>
                                            <span className="text-xs sm:text-base font-extrabold font-mono text-foreground block truncate">
                                                {currency} {formatNumber(185000000)}
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border border-border/70 shadow-2xs bg-card/50 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
                                    <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">
                                                {t('landing.hero.stat_avg_tickers', 'Rata-rata Emiten')}
                                            </span>
                                            <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                                4.5 <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">{t('landing.hero.stat_avg_tickers_unit', 'Saham')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border border-border/70 shadow-2xs bg-card/50 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
                                    <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">
                                                {t('landing.hero.stat_risk_free', 'Risk-Free Rate (Rf)')}
                                            </span>
                                            <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                                6.25% <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">{t('landing.hero.stat_risk_free_unit', 'SBN/BI')}</span>
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* 3. TRANSACTION LIST TABLE CARD (Exact history.tsx) */}
                            <Card className="border border-border/70 shadow-xs overflow-hidden">
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <History className="h-4 w-4 text-primary" />
                                            <span>{t('landing.hero.table_title', 'Daftar Portofolio')}</span>
                                        </CardTitle>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto w-full">
                                        <Table className="min-w-[680px]">
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-b border-border/50">
                                                    <TableHead className="text-xs font-bold w-44 py-3.5 px-4">{t('landing.hero.col_ref_code', 'Kode Referensi')}</TableHead>
                                                    <TableHead className="text-xs font-bold py-3.5 px-4">{t('landing.hero.col_title_tickers', 'Judul & Emiten Saham')}</TableHead>
                                                    <TableHead className="text-xs font-bold text-right py-3.5 px-4">{t('landing.hero.col_capital', 'Modal Investasi')}</TableHead>
                                                    <TableHead className="text-xs font-bold text-right w-16 py-3.5 px-4">{t('landing.hero.col_action', 'Aksi')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mockHistoryList.map((item) => (
                                                    <TableRow
                                                        key={item.id}
                                                        className="group cursor-pointer hover:bg-muted/40 active:scale-[0.999] transition-all border-b border-border/40"
                                                    >
                                                        {/* Kolom 1: Kode Referensi (TradingView Badge Tag) */}
                                                        <TableCell className="py-4 px-4 align-top">
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                                                                    <Tag className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                    {item.refCode}
                                                                </span>
                                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                                                                    <Clock className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                                                    <span>{item.createdAt}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Kolom 2: Judul & Stock Pill Badges (Yahoo Finance / Stockbit Style) */}
                                                        <TableCell className="py-4 px-4 align-top space-y-2">
                                                            <div className="flex items-center gap-1.5 group/title">
                                                                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                {item.tickers.map((tTicker, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted/60 text-foreground hover:text-emerald-700 border border-border/50 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-colors"
                                                                    >
                                                                        {tTicker}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </TableCell>

                                                        {/* Kolom 3: Modal Investasi */}
                                                        <TableCell className="py-4 px-4 align-top text-right whitespace-nowrap">
                                                            <span className="font-mono font-extrabold text-sm text-foreground block">
                                                                {currency} {formatNumber(item.initialCapital)}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground block font-sans">
                                                                Rf: {item.riskFreeRate}%
                                                            </span>
                                                        </TableCell>

                                                        {/* Kolom 4: Action Dropdown Menu (Style Admin Saham) */}
                                                        <TableCell className="py-4 px-4 align-middle text-right">
                                                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                                <span className="sr-only">{t('landing.hero.action_menu', 'Menu aksi')}</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Floating Glass Badges on Left/Right for Desktop */}
                        <div className="hidden xl:flex absolute -left-14 top-1/4 p-4 rounded-xl bg-card/90 dark:bg-[#1C1E1C]/90 backdrop-blur-xl border border-border/70 dark:border-white/20 shadow-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] items-center gap-3 animate-bounce-slow z-20">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-muted-foreground dark:text-white/60 block uppercase tracking-wider">{t('landing.hero.engine_nsga_badge', 'NSGA-II Engine')}</span>
                                <span className="text-xs font-bold text-foreground dark:text-white font-mono">{t('landing.hero.engine_nsga_desc', '100 Generations Evaluated')}</span>
                            </div>
                        </div>

                        <div className="hidden xl:flex absolute -right-14 bottom-20 p-4 rounded-xl bg-card/90 dark:bg-[#1C1E1C]/90 backdrop-blur-xl border border-border/70 dark:border-white/20 shadow-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] items-center gap-3 animate-bounce-slow z-20" style={{ animationDelay: '1.5s' }}>
                            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-muted-foreground dark:text-white/60 block uppercase tracking-wider">{t('landing.hero.frontier_markowitz_badge', 'Markowitz Frontier')}</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{t('landing.hero.frontier_markowitz_desc', 'Maximized Efficiency')}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                3. STATS & WHY CHOOSE US (White Section with Card-in-Card)
            ========================================== */}
            <section id="features" className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0B0C0B] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-3"
                    >
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B0C0B] tracking-tight">
                            {t('landing.features.title_prefix', 'Mengapa Menggunakan')} <span className="text-emerald-600">{t('landing.features.title_highlight', 'Dinalar AI')}</span>?
                        </h2>
                        <p className="text-base text-[#6B706C]">
                            {t('landing.features.subtitle', 'Tinggalkan tebakan dan intuisi semata. Berinvestasi secara terstruktur dengan kekuatan algoritma optimasi multiobjektif institusional.')}
                        </p>
                    </motion.div>

                    {/* 3 Stat Cards (Card Style from desain.md) */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                    >
                        {statsData.map((stat, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                className="p-8 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-[0_4px_14px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-emerald-500/30 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#EEF1EE] group-hover:bg-emerald-500/20 transition-colors flex items-center justify-center text-emerald-600 mb-6">
                                    {i === 0 ? <Cpu className="w-5 h-5" /> : i === 1 ? <Gauge className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                </div>
                                <div className="text-4xl sm:text-5xl font-black text-[#0B0C0B] tracking-tight mb-2 font-mono">
                                    {stat.value}
                                </div>
                                <h4 className="text-lg font-bold text-[#0B0C0B] mb-2">{stat.label}</h4>
                                <p className="text-sm text-[#6B706C] leading-relaxed">{stat.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* 2 Big Feature Cards (Card-in-Card Pattern from desain.md) */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Card 1: Multi-Objective Pareto Optimization */}
                        <motion.div
                            variants={scaleUp}
                            className="p-8 sm:p-10 rounded-2xl bg-[#EEF1EE] border border-[#E7E9E6] flex flex-col justify-between space-y-6"
                        >
                            <div className="space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-[#0B0C0B]">{t('landing.features.card_1_title', 'Efisien Frontier & Kurva Pareto')}</h3>
                                <p className="text-sm text-[#6B706C] leading-relaxed">
                                    {t('landing.features.card_1_desc', 'Dinalar mengevaluasi ratusan simulasi alokasi saham untuk menemukan titik-titik optimal. Anda mendapatkan trade-off imbal hasil dan risiko terbaik.')}
                                </p>
                            </div>

                            {/* Inset White Sub-Card */}
                            <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-xs space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-[#0B0C0B]">
                                    <span>{t('landing.features.card_1_sub_title', 'Kurva Pareto Efficient Frontier')}</span>
                                    <span className="text-emerald-600 font-mono font-bold">+24.85% E(R)</span>
                                </div>
                                <div className="h-32 w-full bg-[#F8FAF8] rounded-lg border border-[#E7E9E6] p-3 flex flex-col justify-between">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-[#6B706C]">
                                        <span>{t('landing.features.card_1_high_return', 'Return Tinggi')}</span>
                                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {t('landing.features.card_1_optimal_curve', 'Kurva Optimal')}
                                        </span>
                                    </div>
                                    {/* Sparkline Chart matching Dashboard */}
                                    <div className="w-full h-14 my-1">
                                        <SparklineChart
                                            prices={[10.0, 11.2, 11.0, 13.5, 12.8, 15.4, 16.0, 18.2, 19.5, 21.0, 24.85]}
                                            className="w-full h-14"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-[#6B706C]">
                                        <span>{t('landing.features.card_1_min_risk', 'Min Risiko (8.4%)')}</span>
                                        <span>{t('landing.features.card_1_max_return', 'Maks Return (32.4%)')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2: Risk-Adjusted Allocation & Order Estimation */}
                        <motion.div
                            variants={scaleUp}
                            className="p-8 sm:p-10 rounded-2xl bg-[#EEF1EE] border border-[#E7E9E6] flex flex-col justify-between space-y-6"
                        >
                            <div className="space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                    <PieIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-[#0B0C0B]">{t('landing.features.card_2_title', 'Alokasi Portofolio & Estimasi Lot')}</h3>
                                <p className="text-sm text-[#6B706C] leading-relaxed">
                                    {t('landing.features.card_2_desc', 'Dinalar membagi alokasi bobot modal investasi secara proporsional dan mengonversinya langsung ke dalam estimasi jumlah lot saham riil untuk kemudahan eksekusi di aplikasi sekuritas Anda.')}
                                </p>
                            </div>

                            {/* Inset White Sub-Card (Matching result.tsx allocation table & lot estimation) */}
                            <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-xs space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-[#0B0C0B]">
                                    <div className="flex items-center gap-1.5">
                                        <span>{t('landing.features.card_2_sub_title', 'Alokasi Modal & Estimasi Lot')}</span>
                                    </div>
                                    <span className="text-emerald-600 font-mono font-bold">
                                        {t('landing.features.card_2_capital_badge', `Modal ${currency} ${formatNumber(100000000)}`, { capital: `${currency} ${formatNumber(100000000)}` })}
                                    </span>
                                </div>

                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-xs text-left">
                                        <thead className="border-b border-[#E7E9E6] text-[#6B706C] font-semibold">
                                            <tr>
                                                <th className="py-2 px-2.5 font-bold">{t('landing.features.table_ticker', 'Emiten')}</th>
                                                <th className="py-2 px-2 text-right font-bold">{t('landing.features.table_weight', 'Bobot')}</th>
                                                <th className="py-2 px-2.5 text-right font-bold">{t('landing.features.table_nominal', 'Nominal')}</th>
                                                <th className="py-2 px-2.5 text-right font-bold">{t('landing.features.table_estimate', 'Estimasi')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F0F2F0] font-mono">
                                            <tr className="hover:bg-[#F8FAF8] transition-colors">
                                                <td className="py-2.5 px-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="font-bold text-[#0B0C0B]">BBCA</span>
                                                        <span className="text-[9px] font-sans font-semibold px-1 py-0 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
                                                            IDX
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-bold text-emerald-600">40.00%</td>
                                                <td className="py-2.5 px-2.5 text-right font-bold text-[#0B0C0B]">{currency} {formatNumber(40000000)}</td>
                                                <td className="py-2.5 px-2.5 text-right font-extrabold text-emerald-600">40 {t('landing.features.unit_lots', 'Lot')}</td>
                                            </tr>
                                            <tr className="hover:bg-[#F8FAF8] transition-colors">
                                                <td className="py-2.5 px-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                        <span className="font-bold text-[#0B0C0B]">BBRI</span>
                                                        <span className="text-[9px] font-sans font-semibold px-1 py-0 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
                                                            IDX
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-bold text-emerald-600">35.00%</td>
                                                <td className="py-2.5 px-2.5 text-right font-bold text-[#0B0C0B]">{currency} {formatNumber(35000000)}</td>
                                                <td className="py-2.5 px-2.5 text-right font-extrabold text-emerald-600">74 {t('landing.features.unit_lots', 'Lot')}</td>
                                            </tr>
                                            <tr className="hover:bg-[#F8FAF8] transition-colors">
                                                <td className="py-2.5 px-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                                                        <span className="font-bold text-[#0B0C0B]">JPM</span>
                                                        <span className="text-[9px] font-sans font-semibold px-1 py-0 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20">
                                                            NASDAQ
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-bold text-emerald-600">25.00%</td>
                                                <td className="py-2.5 px-2.5 text-right font-bold text-[#0B0C0B]">$ 6,250.00</td>
                                                <td className="py-2.5 px-2.5 text-right font-extrabold text-emerald-600">25 {t('landing.features.unit_shares', 'Lembar')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                4. HOW IT WORKS (3 Simple Steps)
            ========================================== */}
            <section id="how-it-works" className="py-24 sm:py-32 bg-[#F8FAF8] border-y border-[#E7E9E6] text-[#0B0C0B]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-3"
                    >
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B0C0B] tracking-tight">
                            {t('landing.how_it_works.title', '3 Langkah Menuju Portofolio Optimal')}
                        </h2>
                        <p className="text-base text-[#6B706C]">
                            {t('landing.how_it_works.subtitle', 'Proses sederhana dan intuitif dari pemilihan emiten hingga eksekusi alokasi portofolio.')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
                    >
                        {/* Step 1 */}
                        <motion.div
                            variants={fadeInUp}
                            className="p-8 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-xs relative space-y-4 hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-[#0B0C0B] text-white flex items-center justify-center font-bold text-lg font-mono">
                                01
                            </div>
                            <h3 className="text-xl font-bold text-[#0B0C0B]">{t('landing.how_it_works.step_1_title', 'Pilih Saham Pilihan Anda')}</h3>
                            <p className="text-sm text-[#6B706C] leading-relaxed">
                                {t('landing.how_it_works.step_1_desc', 'Telusuri katalog saham aktif pada menu Eksplorasi Saham dan masukkan emiten yang ingin Anda analisis ke dalam Keranjang Saham.')}
                            </p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            variants={fadeInUp}
                            className="p-8 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-xs relative space-y-4 hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg font-mono">
                                02
                            </div>
                            <h3 className="text-xl font-bold text-[#0B0C0B]">{t('landing.how_it_works.step_2_title', 'Tentukan Modal & Parameter')}</h3>
                            <p className="text-sm text-[#6B706C] leading-relaxed">
                                {t('landing.how_it_works.step_2_desc', 'Atur nominal modal investasi yang ingin dialokasikan, suku bunga bebas risiko (Risk-Free Rate), serta rentang waktu historis analisis.')}
                            </p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            variants={fadeInUp}
                            className="p-8 rounded-xl bg-[#FFFFFF] border border-[#E7E9E6] shadow-xs relative space-y-4 hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-[#0B0C0B] text-white flex items-center justify-center font-bold text-lg font-mono">
                                03
                            </div>
                            <h3 className="text-xl font-bold text-[#0B0C0B]">{t('landing.how_it_works.step_3_title', 'Eksekusi Rekomendasi AI')}</h3>
                            <p className="text-sm text-[#6B706C] leading-relaxed">
                                {t('landing.how_it_works.step_3_desc', 'Dapatkan hasil optimasi dengan 3 opsi profil risiko, simpan laporan berformat PDF/PNG, atau bagikan tautan portofolio secara publik.')}
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                5. INTERACTIVE 3-PROFILE SIMULATION SHOWCASE
            ========================================== */}
            <section id="showcase" className="py-24 sm:py-32 bg-[#0A0B0A] text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16 space-y-3"
                    >
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                            {t('landing.showcase.title', 'Pilih Karakteristik Strategi Anda')}
                        </h2>
                        <p className="text-base text-white/70">
                            {t('landing.showcase.subtitle', 'Algoritma Dinalar secara otomatis menyajikan 3 titik profil pada Frontier Efisien sesuai toleransi risiko Anda.')}
                        </p>

                        {/* Profile Tabs (Segmented Control style like admin) */}
                        <div className="pt-6 flex items-center justify-center">
                            <div className="inline-flex items-center gap-1 bg-[#1C1E1C] p-1.5 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setActiveTabProfile('conservative')}
                                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${activeTabProfile === 'conservative'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t('landing.showcase.tab_conservative', 'Konservatif')}
                                </button>
                                <button
                                    onClick={() => setActiveTabProfile('moderate')}
                                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${activeTabProfile === 'moderate'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t('landing.showcase.tab_moderate', 'Moderat')}
                                </button>
                                <button
                                    onClick={() => setActiveTabProfile('aggressive')}
                                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${activeTabProfile === 'aggressive'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {t('landing.showcase.tab_aggressive', 'Agresif')}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Dynamic Profile Card Display */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={scaleUp}
                        className="max-w-4xl mx-auto rounded-2xl bg-[#141614] border border-white/15 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center border-b border-white/10 pb-8">
                            <div className="p-4 rounded-xl bg-[#1A1D1A] border border-white/5">
                                <span className="text-xs text-white/50 block mb-1">{t('landing.showcase.expected_return', 'Expected Return')}</span>
                                <span className="text-3xl font-extrabold font-mono text-emerald-400">
                                    {activeTabProfile === 'conservative' ? '+16.20%' : activeTabProfile === 'moderate' ? '+24.85%' : '+32.40%'}
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-[#1A1D1A] border border-white/5">
                                <span className="text-xs text-white/50 block mb-1">{t('landing.showcase.risk_volatility', 'Volatilitas Risiko')}</span>
                                <span className="text-3xl font-extrabold font-mono text-white">
                                    {activeTabProfile === 'conservative' ? '8.40%' : activeTabProfile === 'moderate' ? '11.40%' : '18.90%'}
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-[#1A1D1A] border border-white/5">
                                <span className="text-xs text-white/50 block mb-1">{t('landing.showcase.sharpe_ratio', 'Sharpe Ratio')}</span>
                                <span className="text-3xl font-extrabold font-mono text-emerald-400">
                                    {activeTabProfile === 'conservative' ? '1.18' : activeTabProfile === 'moderate' ? '1.63' : '1.38'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-left">
                                <h4 className="font-bold text-white text-base">
                                    {activeTabProfile === 'conservative'
                                        ? t('landing.showcase.desc_conservative_title', 'Meminimalisir Volatilitas')
                                        : activeTabProfile === 'moderate'
                                            ? t('landing.showcase.desc_moderate_title', 'Efisiensi Return per Unit Risiko')
                                            : t('landing.showcase.desc_aggressive_title', 'Maksimalisasi Imbal Hasil')}
                                </h4>
                                <p className="text-xs text-white/60">
                                    {activeTabProfile === 'conservative'
                                        ? t('landing.showcase.desc_conservative_text', 'Cocok untuk investor berprofil defensif yang mengutamakan stabilitas modal.')
                                        : activeTabProfile === 'moderate'
                                            ? t('landing.showcase.desc_moderate_text', 'Pilihan utama paling direkomendasikan untuk portofolio seimbang dan optimal.')
                                            : t('landing.showcase.desc_aggressive_text', 'Cocok untuk investor agresif dengan toleransi risiko pasar yang tinggi.')}
                                </p>
                            </div>

                            <Link
                                href={user ? (user.role === 'admin' ? '/admin/dashboard' : '/user/analyze/keranjang') : '/register'}
                                className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <span>{user ? t('landing.showcase.cta_analyze', 'Mulai Analisis') : t('landing.showcase.cta_try', 'Coba Sekarang')}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                6. FAQ ACCORDION (Styled to match desain.md)
            ========================================== */}
            <section id="faq" className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0B0C0B]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeInUp}
                        className="text-center max-w-2xl mx-auto mb-16 space-y-3"
                    >
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B0C0B] tracking-tight">
                            {t('landing.faq.title', 'FAQ')}
                        </h2>
                        <p className="text-base text-[#6B706C]">
                            {t('landing.faq.subtitle', 'Pertanyaan yang paling sering diajukan mengenai algoritma dan penggunaan Dinalar.')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={staggerContainer}
                        className="space-y-4"
                    >
                        {faqList.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${isOpen
                                        ? 'bg-gradient-to-b from-[#EAF9EE] to-white border-emerald-500/40 shadow-sm'
                                        : 'bg-white border-[#E7E9E6] hover:border-gray-300'
                                        }`}
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                                    >
                                        <span className="font-bold text-base sm:text-lg text-[#0B0C0B]">{faq.question}</span>
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-emerald-600 text-white' : 'bg-[#EEF1EE] text-[#0B0C0B]'
                                                }`}
                                        >
                                            {isOpen ? <Minus className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 pb-6 text-sm text-[#6B706C] leading-relaxed border-t border-emerald-500/10 pt-4 animate-fade-in">
                                            {faq.answer}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                7. FINAL CTA SECTION (Glassmorphism Banner matching Dashboard)
            ========================================== */}
            <section className="py-20 bg-background relative border-t border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-emerald-500/10 p-8 sm:p-14 lg:p-16 text-center text-foreground shadow-xs"
                    >
                        {/* Ambient decorative glow spheres matching Dashboard Hero */}
                        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t('landing.cta.badge', 'Mulai Hari Ini')}</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
                                {t('landing.cta.title', 'Siap Mengoptimalkan Portofolio Saham Anda?')}
                            </h2>

                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {t('landing.cta.subtitle', 'Bergabunglah sekarang dan rasakan keunggulan analisis modern untuk investasi yang terukur, terarah, dan presisi.')}
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href={user ? dashboardUrl : '/register'}
                                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg font-semibold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <span>{user ? t('landing.cta.btn_dashboard', 'Buka Dashboard') : t('landing.cta.btn_register', 'Daftar Gratis Sekarang')}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={user ? (user.role === 'admin' ? '/admin/dashboard' : '/user/analyze/keranjang') : '/login'}
                                    className="w-full sm:w-auto px-7 py-2.5 rounded-lg font-medium text-sm sm:text-base dark:text-white border border-emerald-600 hover:text-white hover:bg-emerald-600 transition-all shadow-2xs backdrop-blur-xs"
                                >
                                    {user ? t('landing.cta.btn_analyze', 'Mulai Analisis') : t('landing.cta.btn_login', 'Masuk Akun')}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ==========================================
                8. FOOTER (Dark with Legal & Disclaimer)
            ========================================== */}
            <footer className="bg-[#0A0B0A] text-white/70 pt-16 pb-12 border-t border-white/10 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Col 1: Brand info */}
                        <div className="space-y-4 md:col-span-1">
                            <img src="/images/newLogo.png?v=5" alt="Dinalar Logo" className="h-9 w-auto object-contain" />
                            <p className="text-white/50 text-xs leading-relaxed">
                                {t('landing.footer.brand_desc', 'Platform optimasi portofolio saham berbasis Artificial Intelligence. Maksimalkan return dan kendalikan risiko saham pilihan Anda.')}
                            </p>
                            <div className="font-mono text-[11px] text-emerald-400">dinalar.my.id</div>
                        </div>

                        {/* Col 2: Fitur Utama */}
                        <div className="space-y-3">
                            <h5 className="font-bold text-white text-sm">{t('landing.footer.col_features_title', 'Fitur Utama')}</h5>
                            <ul className="space-y-2 text-white/60">
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                                        {t('landing.footer.link_explore', 'Eksplorasi Saham')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                                        {t('landing.footer.link_optimization', 'Optimasi Portofolio')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                                        {t('landing.footer.link_pareto', 'Kurva Pareto Efficient Frontier')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                                        {t('landing.footer.link_allocation', 'Alokasi Bobot Portofolio')}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                                        {t('landing.footer.link_quantile', 'Distribusi 5-Points Quantile')}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3: Navigasi */}
                        <div className="space-y-3">
                            <h5 className="font-bold text-white text-sm">{t('landing.footer.col_access_title', 'Akses Cepat')}</h5>
                            <ul className="space-y-2 text-white/60">
                                <li>
                                    <Link href={user ? dashboardUrl : '/login'} className="hover:text-white transition-colors">
                                        {t('landing.footer.link_dashboard', 'Dashboard')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={user ? '/user/saham' : '/login'} className="hover:text-white transition-colors">
                                        {t('landing.footer.link_explore', 'Eksplorasi Saham')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={user ? '/user/analyze/keranjang' : '/login'} className="hover:text-white transition-colors">
                                        {t('landing.footer.link_basket', 'Keranjang Saham')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={user ? '/user/analyze/history' : '/login'} className="hover:text-white transition-colors">
                                        {t('landing.footer.link_history', 'Riwayat Portofolio')}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4: Kontak WhatsApp */}
                        <div className="space-y-3">
                            <h5 className="font-bold text-white text-sm">{t('landing.footer.col_contact_title', 'Hubungi Kami')}</h5>
                            <p className="text-white/50 leading-relaxed text-[11px]">
                                {t('landing.footer.contact_desc', 'Punya pertanyaan, kendala, atau membutuhkan bantuan teknis? Hubungi kami langsung melalui WhatsApp.')}
                            </p>
                            <a
                                href="https://wa.me/62895361206884"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span>+62 895-3612-06884</span>
                            </a>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
                        <p>© {new Date().getFullYear()} Dinalar - AI Stock Portfolio Optimization Platform. {t('landing.footer.all_rights_reserved', 'All Rights Reserved.')}</p>
                        <div className="flex items-center gap-2.5">
                            {/* Appearance Settings Button & Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs select-none"
                                        aria-label={t('landing.footer.appearance_settings', 'Appearance Settings')}
                                        title={t('landing.footer.appearance_settings', 'Appearance Settings')}
                                    >
                                        {appearance === 'light' ? (
                                            <Sun className="size-3.5 text-emerald-400" />
                                        ) : appearance === 'dark' ? (
                                            <Moon className="size-3.5 text-emerald-400" />
                                        ) : (
                                            <Monitor className="size-3.5 text-emerald-400" />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="bg-[#141614] border border-white/15 text-white min-w-[175px] p-1.5 shadow-2xl rounded-xl z-50 backdrop-blur-md"
                                >
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                        {t('landing.footer.appearance_settings', 'Appearance Settings')}
                                    </div>
                                    <DropdownMenuItem
                                        onClick={() => updateAppearance('light')}
                                        className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                            appearance === 'light'
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Sun className="size-3.5 text-emerald-400" />
                                            <span>{t('landing.footer.theme_light', 'Light')}</span>
                                        </span>
                                        {appearance === 'light' && <Check className="size-3.5 stroke-[2.5]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => updateAppearance('dark')}
                                        className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                            appearance === 'dark'
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Moon className="size-3.5 text-emerald-400" />
                                            <span>{t('landing.footer.theme_dark', 'Dark')}</span>
                                        </span>
                                        {appearance === 'dark' && <Check className="size-3.5 stroke-[2.5]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => updateAppearance('system')}
                                        className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                            appearance === 'system'
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Monitor className="size-3.5 text-emerald-400" />
                                            <span>{t('landing.footer.theme_system', 'System')}</span>
                                        </span>
                                        {appearance === 'system' && <Check className="size-3.5 stroke-[2.5]" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <LanguageToggle theme="dark" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
