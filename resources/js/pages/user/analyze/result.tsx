import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PortfolioCompareShareCard, PortfolioShareCard } from '@/components/PortfolioShareCard';
import { useExportShare, copyTextToClipboard } from '@/hooks/useExportShare';
import { generatePortfolioPDFReport } from '@/utils/pdfReportGenerator';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Stock } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Download,
    FileText,
    Image as ImageIcon,
    Layers,
    LineChart,
    Loader2,
    MessageCircle,
    PieChart as PieIcon,
    Share2,
    Shield,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
    ReferenceLine,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/user/dashboard',
    },
    {
        title: 'Eksplorasi Saham',
        href: '/user/saham',
    },
    {
        title: 'Riwayat Portofolio',
        href: '/user/analyze/history',
    },
    {
        title: 'Detail Portofolio',
        href: '#',
    },
];

interface AssetAllocation {
    ticker: string;
    companyName: string;
    category: 'IDX' | 'NYSE' | string;
    weightPercent: number;
    nominalAmount: number;
    lastPrice: number;
    estimatedLot: number | null;
}

interface PortfolioProfile {
    id: 'min_variance' | 'sharpe' | 'max_return' | 'sortino';
    label: string;
    return: number;
    risk: number;
    sharpe: number;
    sortino?: number;
    omega?: number;
    allocations: AssetAllocation[];
    totalWeight: number;
}

interface QuantilePoint {
    label: string;
    target_value: number;
    index: number;
    portfolio: any;
}

interface BestPortfolioItem {
    return: number;
    risk: number;
    sharpe: number;
    sortino?: number;
    omega?: number;
    weights: Record<string, number>;
    allocation_idr: Record<string, number>;
    lot_estimation?: Record<string, number>;
    capital_allocation?: Record<string, { weight_percent: number; nominal_idr: number }>;
}

interface PortfolioOptimizationRecord {
    id: number;
    user_id: number;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    start_date: string | null;
    end_date: string | null;
    tickers: string[];
    nsga_params: {
        population_size: number;
        generations: number;
        crossover_rate: number;
        mutation_rate: number;
    };
    best_portfolios: {
        sharpe: BestPortfolioItem;
        min_variance: BestPortfolioItem;
        sortino: BestPortfolioItem;
        omega: BestPortfolioItem;
        max_return?: BestPortfolioItem;
    };
    efficient_frontier: Array<{ return: number; risk: number; sharpe: number; weights?: Record<string, number> }>;
    nsga_samples: Array<{ return: number; risk: number; sharpe: number; weights?: Record<string, number> }>;
    quantile_analysis?: {
        sharpe?: QuantilePoint[];
        sortino?: QuantilePoint[];
        omega?: QuantilePoint[];
    };
    individual_assets?: Array<{ ticker: string; return: number; risk: number }>;
    created_at: string;
}

interface ResultProps {
    optimization: PortfolioOptimizationRecord & { reference_code?: string; share_token?: string };
    stocks: Record<string, Stock>;
    history?: Array<{ id: number; user_id?: number; reference_code?: string; title: string; initial_capital: number; created_at: string }>;
    isPublic?: boolean;
    shareUrl?: string;
}

const COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
];

export default function OptimizationResultPage({
    optimization,
    stocks = {},
    history = [],
    isPublic = false,
    shareUrl,
}: ResultProps) {
    const [selectedProfile, setSelectedProfile] = useState<'sharpe' | 'min_variance' | 'max_return' | 'sortino'>('sharpe');
    const [clickedPoint, setClickedPoint] = useState<any>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
    const [isGeneratingShare, setIsGeneratingShare] = useState<boolean>(false);

    // Clear clicked point when user switches profile tabs
    React.useEffect(() => {
        setClickedPoint(null);
    }, [selectedProfile]);

    const initialCapital = Number(optimization.initial_capital || 10000000);
    const bestPortfolios = optimization.best_portfolios || {};

    // Get active portfolio strictly for donut chart
    const activePortfolio = useMemo(() => {
        if (clickedPoint) {
            const capital_allocation: Record<string, any> = {};
            if (clickedPoint.weights) {
                Object.entries(clickedPoint.weights).forEach(([ticker, w]) => {
                    const weightPercent = Number(w) * 100;
                    capital_allocation[ticker] = {
                        weight_percent: weightPercent,
                        nominal_idr: (Number(w) * initialCapital)
                    };
                });
            }
            return {
                return: clickedPoint.y,
                risk: clickedPoint.x,
                sharpe: clickedPoint.sharpe,
                capital_allocation,
                isCustom: true,
                name: clickedPoint.name || 'Custom Titik'
            } as BestPortfolioItem & { isCustom?: boolean, name?: string };
        }

        return selectedProfile === 'max_return' && bestPortfolios.max_return
            ? bestPortfolios.max_return
            : selectedProfile === 'min_variance' && bestPortfolios.min_variance
                ? bestPortfolios.min_variance
                : selectedProfile === 'sortino' && bestPortfolios.sortino
                    ? bestPortfolios.sortino
                    : bestPortfolios.sharpe || bestPortfolios.min_variance;
    }, [clickedPoint, selectedProfile, bestPortfolios, initialCapital]);

    // Format IDR
    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return 'Rp -';
        return `Rp ${Number(val).toLocaleString('id-ID')}`;
    };

    // Format Percentage
    const formatPercent = (val: number | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '0.00%';
        return `${Number(val).toFixed(2)}%`;
    };

    // Format Date
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Export & Share Refs & Hook
    const singleCardRef = useRef<HTMLDivElement>(null);
    const compareCardRef = useRef<HTMLDivElement>(null);
    const { isExporting, exportAsImage, exportAsPDF, sharePortfolio, shareToWhatsAppText } = useExportShare();

    const getProfileLabel = (p: string) => {
        switch (p) {
            case 'min_variance':
                return 'Konservatif (Risiko Rendah)';
            case 'max_return':
                return 'Agresif (Return Maksimal)';
            case 'sortino':
                return 'Downside Optimal (Sortino)';
            case 'sharpe':
            default:
                return 'Seimbang (Optimal Sharpe)';
        }
    };

    const handleExportPNG = async (profileOverride?: 'min_variance' | 'sharpe' | 'max_return' | 'sortino') => {
        const targetProf = profileOverride || selectedProfile;
        if (profileOverride && profileOverride !== selectedProfile) {
            setSelectedProfile(profileOverride);
        }
        await new Promise((r) => setTimeout(r, 80));
        if (!singleCardRef.current) return;

        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filename = `Portofolio-${targetProf}-${refCode}.png`;
        await exportAsImage(singleCardRef.current, filename, true);
    };

    const handleExportPDF = async () => {
        try {
            generatePortfolioPDFReport({
                optimization,
                activePortfolio,
                selectedProfile,
                profileLabel: getProfileLabel(selectedProfile),
                stocks,
            });
            const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
            toast.success(`Laporan PDF berhasil diunduh (Laporan-Portofolio-${selectedProfile}-${refCode}.pdf)`);
        } catch (error) {
            console.error('Failed to generate PDF report:', error);
            toast.error('Gagal membuat dokumen PDF laporan. Silakan coba lagi.');
        }
    };

    const handleExportCompare = async () => {
        if (!compareCardRef.current) return;
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filename = `Komparasi-Portofolio-3-Profil-${refCode}.png`;
        await exportAsImage(compareCardRef.current, filename, true);
    };

    const handleShareNative = async (profileOverride?: 'min_variance' | 'sharpe' | 'max_return' | 'sortino') => {
        const targetProf = profileOverride || selectedProfile;
        if (profileOverride && profileOverride !== selectedProfile) {
            setSelectedProfile(profileOverride);
        }
        await new Promise((r) => setTimeout(r, 80));
        if (!singleCardRef.current) return;

        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filename = `Portofolio-${targetProf}-${refCode}.png`;
        const shareText = `Halo! Cek rekomendasi portofolio saham kuantitatif saya (${getProfileLabel(targetProf)}) dengan kode referensi ${refCode} di Dinalar AI.`;
        await sharePortfolio(singleCardRef.current, filename, 'Rekomendasi Portofolio Saham', shareText);
    };

    const handleGeneratePublicLink = async () => {
        setIsGeneratingShare(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const response = await fetch(`/user/analyze/share/${optimization.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal membuat tautan publik');
            }

            const data = await response.json();
            if (data.url) {
                const copied = await copyTextToClipboard(data.url);
                if (copied) {
                    toast.success('Tautan publik berhasil disalin ke clipboard! Siapapun dapat melihat hasil portofolio ini tanpa perlu login.');
                }
            } else {
                throw new Error('URL tidak ditemukan');
            }
        } catch (error) {
            console.error('Failed to generate share link:', error);
            const fallbackUrl = `${window.location.origin}/shared/portfolio/${optimization.share_token || `DNL${optimization.user_id}-${optimization.id}`}`;
            const copied = await copyTextToClipboard(fallbackUrl);
            if (copied) {
                toast.success('Tautan berhasil disalin ke clipboard!');
            } else {
                toast.error('Gagal menyalin tautan ke clipboard. Silakan coba lagi.');
            }
        } finally {
            setIsGeneratingShare(false);
        }
    };

    const handleShareWhatsAppText = () => {
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const activeProfData = activePortfolio;
        const returnVal = activeProfData?.return !== undefined ? Number(activeProfData.return).toFixed(2) : '0';
        const riskVal = activeProfData?.risk !== undefined ? Number(activeProfData.risk).toFixed(2) : '0';
        const sharpeVal = activeProfData?.sharpe !== undefined ? Number(activeProfData.sharpe).toFixed(2) : '0';

        // Ekstraksi alokasi aset persis seperti pada tabel
        let rawAllocMap: Record<string, { weight_percent: number; nominal_idr: number }> = {};
        if (activeProfData?.capital_allocation && Object.keys(activeProfData.capital_allocation).length > 0) {
            rawAllocMap = activeProfData.capital_allocation;
        } else if (activeProfData?.weights) {
            Object.entries(activeProfData.weights).forEach(([ticker, rawWeight]) => {
                const clean = ticker.replace('.JK', '');
                const weightVal = Number(rawWeight);
                const weightPercent = weightVal <= 1.0 ? weightVal * 100 : weightVal;
                const nominal =
                    activeProfData.allocation_idr?.[ticker] ??
                    activeProfData.allocation_idr?.[clean] ??
                    (weightPercent / 100) * initialCapital;
                rawAllocMap[ticker] = {
                    weight_percent: weightPercent,
                    nominal_idr: nominal,
                };
            });
        }

        const allocationsList = Object.entries(rawAllocMap)
            .map(([rawTicker, alloc]) => {
                const cleanTicker = rawTicker.replace('.JK', '');
                const stk = stocks[rawTicker] || stocks[cleanTicker];
                const lastClose = stk?.latest_price ? Number(stk.latest_price.close_price) : 0;
                const lotEstimate =
                    activeProfData?.lot_estimation?.[rawTicker] ??
                    activeProfData?.lot_estimation?.[cleanTicker] ??
                    (lastClose > 0 ? Math.floor(alloc.nominal_idr / (lastClose * 100)) : 0);

                return {
                    ticker: cleanTicker,
                    name: stk?.name || cleanTicker,
                    category: stk?.bursa || 'IDX',
                    weight: alloc.weight_percent,
                    nominal: alloc.nominal_idr,
                    lastClose,
                    lot: lotEstimate,
                };
            })
            .filter((item) => item.weight > 0.05)
            .sort((a, b) => b.weight - a.weight);

        const totalLots = allocationsList.reduce((sum, item) => sum + item.lot, 0);
        const totalNominal = allocationsList.reduce((sum, item) => sum + item.nominal, 0);

        let stockLines = '';
        allocationsList.forEach((item, idx) => {
            stockLines += `${idx + 1}. *${item.ticker}* (${item.category})\n` +
                `   ↳ Bobot: *${item.weight.toFixed(2)}%* | Nominal: *${formatRupiah(item.nominal)}*\n` +
                `   ↳ Harga: *${item.lastClose > 0 ? `Rp ${item.lastClose.toLocaleString('id-ID')}` : '-'}* | Estimasi: *${item.lot > 0 ? `${item.lot.toLocaleString('id-ID')} Lot` : '-'}*\n`;
        });

        const dateRangeStr = optimization.start_date && optimization.end_date
            ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}`
            : formatDate(optimization.created_at);

        const text = `📊 *HASIL ANALISIS PORTOFOLIO SAHAM DINALAR*\n\n` +
            `• *Judul:* ${optimization.title || 'Portofolio Multi-Aset'}\n` +
            `• *Profil:* ${getProfileLabel(selectedProfile)}\n` +
            `• *Kode Ref:* ${refCode}\n` +
            `• *Tanggal Analisis:* ${formatDate(optimization.created_at)}\n` +
            `• *Rentang Waktu:* ${dateRangeStr}\n` +
            `• *Modal Investasi:* ${formatRupiah(initialCapital)}\n` +
            `• *Risk-Free Rate:* ${optimization.risk_free_rate}%\n\n` +
            `📈 *METRIK PERFORMA:*\n` +
            `• Expected Return: *+${returnVal}%* (Tahunan)\n` +
            `• Volatilitas Risiko (σ): *${riskVal}%*\n` +
            `• Sharpe Ratio: *${sharpeVal}*\n\n` +
            `💼 *RINCIAN ALOKASI SAHAM:*\n` +
            `${stockLines}\n` +
            `📌 *TOTAL PEMBELIAN:*\n` +
            `• Total Modal: *${formatRupiah(totalNominal)}* (100.00%)\n` +
            `• Total Estimasi: *${totalLots.toLocaleString('id-ID')} Lot*\n\n` +
            `Analisis otomatis dengan Algoritma NSGA-II & Markowitz Frontier.\n` +
            `🌐 Kunjungi: https://dinalar.my.id`;

        shareToWhatsAppText(text);
    };

    // Efficient Frontier scatter data
    const frontierPoints = useMemo(() => {
        return (optimization.efficient_frontier || []).map((p) => ({
            x: Number(p.risk),
            y: Number(p.return),
            sharpe: Number(p.sharpe || 0),
            name: 'Markowitz',
            type: 'frontier',
            weights: p.weights,
        }));
    }, [optimization.efficient_frontier]);

    const nsgaPoints = useMemo(() => {
        return (optimization.nsga_samples || []).map((p) => ({
            x: Number(p.risk),
            y: Number(p.return),
            sharpe: Number(p.sharpe || 0),
            name: 'NSGA-II',
            type: 'nsga',
            weights: p.weights,
        }));
    }, [optimization.nsga_samples]);

    const assetPoints = useMemo(() => {
        return (optimization.individual_assets || []).map((p) => ({
            x: Number(p.risk),
            y: Number(p.return),
            name: p.ticker.replace('.JK', ''),
            type: 'asset',
        }));
    }, [optimization.individual_assets]);

    // Key recommendation markers for chart
    const keyMarkers = useMemo(() => {
        const markers = [];
        if (bestPortfolios.sharpe) {
            markers.push({
                x: Number(bestPortfolios.sharpe.risk),
                y: Number(bestPortfolios.sharpe.return),
                name: '⚖️ Seimbang (Optimal Sharpe)',
                color: '#10b981',
            });
        }
        if (bestPortfolios.min_variance) {
            markers.push({
                x: Number(bestPortfolios.min_variance.risk),
                y: Number(bestPortfolios.min_variance.return),
                name: '🛡️ Risiko Rendah (MVP)',
                color: '#06b6d4',
            });
        }
        if (bestPortfolios.max_return) {
            markers.push({
                x: Number(bestPortfolios.max_return.risk),
                y: Number(bestPortfolios.max_return.return),
                name: '🚀 Return Maksimal',
                color: '#f59e0b',
            });
        }
        return markers;
    }, [bestPortfolios]);

    const mainContent = (
        <div className="flex flex-col gap-6 mx-auto w-full">
                {/* 1. HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-5 sm:p-6 shadow-xs">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-32 h-36 w-36 rounded-full bg-emerald-500/15 blur-xl" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    Hasil Optimasi Portofolio
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Rekomendasi Portofolio
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
                                Hasil rekomendasi algoritma AI berdasarkan deret waktu historis {optimization.tickers?.length || 0} emiten saham terpilih.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {!isPublic ? (
                                <Button
                                    asChild
                                    variant="default"
                                    size="sm"
                                    className="w-full sm:w-auto justify-center gap-2 shadow-xs cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Link href="/user/saham">
                                        <span>Eksplorasi Saham Lain</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    variant="default"
                                    size="sm"
                                    className="w-full sm:w-auto justify-center gap-2 shadow-xs cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Link href="/register">
                                        <span>Buat Portofolio Anda Sendiri</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="relative z-10 mt-5 pt-4 pb-1 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Modal Investasi:</span>
                            <span className="font-mono font-bold text-foreground">
                                {formatRupiah(initialCapital)}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Risk-Free Rate (Rf):</span>
                            <span className="font-mono font-bold text-foreground">
                                {optimization.risk_free_rate}%
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Daftar Saham:</span>
                            <span className="font-mono font-bold text-foreground truncate block">
                                {optimization.tickers?.map((t) => t.replace('.JK', '')).join(', ')}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Rentang Waktu:</span>
                            <span className="font-mono font-bold text-foreground truncate block" title={optimization.start_date && optimization.end_date ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}` : '-'}>
                                {optimization.start_date && optimization.end_date
                                    ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}`
                                    : optimization.start_date
                                        ? `Sejak ${formatDate(optimization.start_date)}`
                                        : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. REKOMENDASI 3 PROFIL PORTOFOLIO */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">
                                3 Profil Portofolio
                            </h2>
                        </div>

                        {/* Action Export & Bagikan Dropdown (Hanya untuk pengguna login / private view) */}
                        {!isPublic && (
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isExporting || isGeneratingShare}
                                            className="gap-2 h-8 text-xs font-semibold cursor-pointer border-border/80 hover:bg-muted shadow-2xs"
                                        >
                                            {isExporting || isGeneratingShare ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                    <span>Menyiapkan...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="h-3.5 w-3.5 text-primary" />
                                                    <span>Export & Bagikan</span>
                                                </>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuItem
                                            onClick={() => handleExportPNG()}
                                            className="cursor-pointer text-xs gap-2"
                                        >
                                            <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Simpan Gambar (PNG)</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleExportPDF()}
                                            className="cursor-pointer text-xs gap-2"
                                        >
                                            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Unduh Laporan (PDF)</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleExportCompare()}
                                            className="cursor-pointer text-xs gap-2"
                                        >
                                            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Bandingkan 3 Profil (PNG)</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={() => handleGeneratePublicLink()}
                                            disabled={isGeneratingShare}
                                            className="cursor-pointer text-xs gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950"
                                        >
                                            <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Bagikan Portofolio (Link)</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleShareWhatsAppText()}
                                            className="cursor-pointer text-xs gap-2"
                                        >
                                            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Kirim Ringkasan WhatsApp</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {/* 1. Profil Risiko Rendah (Minimum Variance / MVP) */}
                        {bestPortfolios.min_variance && (
                            <Card
                                onClick={() => setSelectedProfile('min_variance')}
                                className={`cursor-pointer transition-all duration-200 active:scale-[0.99] border relative overflow-hidden ${selectedProfile === 'min_variance'
                                    ? 'ring-2 ring-cyan-500 border-cyan-500/50 bg-cyan-500/5 shadow-md'
                                    : 'border-border/70 hover:border-cyan-500/40 hover:bg-muted/30'
                                    }`}
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 text-xs font-semibold gap-1 rounded-full">
                                            <Shield className="h-3 w-3" />
                                            Risiko Rendah (MVP)
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleExportPNG('min_variance');
                                                }}
                                                className="h-6 w-6 rounded-full text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/15 cursor-pointer transition-colors"
                                                title="Quick Export Gambar Profil Konservatif"
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            {selectedProfile === 'min_variance' && (
                                                <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Konservatif (Minimum Variance)
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Meminimalkan fluktuasi volatilitas risiko pasar.
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-2 text-center font-mono">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Return</span>
                                            <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                                {formatPercent(bestPortfolios.min_variance.return)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Risiko (σ)</span>
                                            <span className="font-bold text-xs sm:text-sm text-cyan-600 dark:text-cyan-400">
                                                {formatPercent(bestPortfolios.min_variance.risk)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Sharpe</span>
                                            <span className="font-bold text-xs sm:text-sm text-foreground">
                                                {bestPortfolios.min_variance.sharpe?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* 2. Profil Seimbang (Optimal Sharpe & Sortino) */}
                        {bestPortfolios.sharpe && (
                            <Card
                                onClick={() => setSelectedProfile('sharpe')}
                                className={`cursor-pointer transition-all duration-200 active:scale-[0.99] border relative overflow-hidden ${selectedProfile === 'sharpe'
                                    ? 'ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/5 shadow-md'
                                    : 'border-border/70 hover:border-emerald-500/40 hover:bg-muted/30'
                                    }`}
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold gap-1 rounded-full">
                                            <Sparkles className="h-3 w-3" />
                                            Seimbang (Pilihan Utama)
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleExportPNG('sharpe');
                                                }}
                                                className="h-6 w-6 rounded-full text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer transition-colors"
                                                title="Quick Export Gambar Profil Seimbang"
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            {selectedProfile === 'sharpe' && (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Moderat (Optimal Sharpe Ratio)
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Kombinasi rasio return-to-risk paling efisien.
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-2 text-center font-mono">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Return</span>
                                            <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                                {formatPercent(bestPortfolios.sharpe.return)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Risiko (σ)</span>
                                            <span className="font-bold text-xs sm:text-sm text-foreground">
                                                {formatPercent(bestPortfolios.sharpe.risk)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Sharpe</span>
                                            <span className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                                {bestPortfolios.sharpe.sharpe?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* 3. Profil Return Maksimal (Agresif / Max Return) */}
                        {(bestPortfolios.max_return || bestPortfolios.omega) && (
                            <Card
                                onClick={() => setSelectedProfile('max_return')}
                                className={`cursor-pointer transition-all duration-200 active:scale-[0.99] border relative overflow-hidden ${selectedProfile === 'max_return'
                                    ? 'ring-2 ring-amber-500 border-amber-500/50 bg-amber-500/5 shadow-md'
                                    : 'border-border/70 hover:border-amber-500/40 hover:bg-muted/30'
                                    }`}
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-semibold gap-1 rounded-full">
                                            <Zap className="h-3 w-3" />
                                            Return Maksimal
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleExportPNG('max_return');
                                                }}
                                                className="h-6 w-6 rounded-full text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/15 cursor-pointer transition-colors"
                                                title="Quick Export Gambar Profil Agresif"
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            {selectedProfile === 'max_return' && (
                                                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            Agresif (Max Expected Return)
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Memaksimalkan proyeksi imbal hasil frontier.
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-2 text-center font-mono">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Return</span>
                                            <span className="font-extrabold text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                                                {formatPercent(
                                                    bestPortfolios.max_return?.return ||
                                                    bestPortfolios.omega?.return
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Risiko (σ)</span>
                                            <span className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                                                {formatPercent(
                                                    bestPortfolios.max_return?.risk ||
                                                    bestPortfolios.omega?.risk
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-sans">Sharpe</span>
                                            <span className="font-bold text-xs sm:text-sm text-foreground">
                                                {(
                                                    bestPortfolios.max_return?.sharpe ||
                                                    bestPortfolios.omega?.sharpe
                                                )?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* 3. EFFICIENT FRONTIER PLOT & PIE ALLOCATION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Visualisasi Recharts Kurva Efficient Frontier (7 Cols) */}
                    <Card className="lg:col-span-7 border border-border/70 shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <LineChart className="h-4 w-4 text-primary" />
                                        <span>Kurva Pareto Efficient Frontier</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Plot Return Harapan (Y) vs Risiko Volatilitas (X)
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 flex-1">
                            <div className="h-64 sm:h-80 md:h-[380px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart
                                        margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                                        onMouseMove={(e: any) => {
                                            if (e && e.activePayload && e.activePayload.length > 0) {
                                                setHoveredPoint({ x: e.activePayload[0].payload.x, y: e.activePayload[0].payload.y });
                                            } else {
                                                setHoveredPoint(null);
                                            }
                                        }}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                        onClick={(e: any) => {
                                            if (e && e.activePayload && e.activePayload.length > 0) {
                                                setClickedPoint(e.activePayload[0].payload);
                                            }
                                        }}
                                    >
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            name="Risiko (σ)"
                                            unit="%"
                                            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.7 }}
                                            label={{
                                                value: 'Risiko Volatilitas (σ %)',
                                                position: 'insideBottom',
                                                offset: -10,
                                                fontSize: 11,
                                                fill: 'currentColor',
                                                opacity: 0.6,
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            name="Return E(R)"
                                            unit="%"
                                            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.7 }}
                                            label={{
                                                value: 'Expected Return (E(R) %)',
                                                angle: -90,
                                                position: 'insideLeft',
                                                fontSize: 11,
                                                format: 'currentColor',
                                                opacity: 0.6,
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <ZAxis range={[35, 120]} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length > 0) {
                                                    const data = payload[0].payload;

                                                    // Parse Top 3
                                                    let top3: { ticker: string, weight: number }[] = [];
                                                    if (data.weights) {
                                                        top3 = Object.entries(data.weights)
                                                            .map(([t, w]) => ({ ticker: t.replace('.JK', ''), weight: Number(w as number) * 100 }))
                                                            .sort((a, b) => b.weight - a.weight)
                                                            .slice(0, 3);
                                                    }

                                                    return (
                                                        <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg text-xs space-y-1 font-sans min-w-[180px]">
                                                            <div className="font-bold text-foreground flex items-center gap-1.5 pb-1">
                                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                                                Detail Simulasi Portofolio
                                                            </div>
                                                            <div className="font-mono text-[11px] text-muted-foreground">
                                                                Return E(R):{' '}
                                                                <strong className="text-emerald-600 dark:text-emerald-400">
                                                                    {data.y?.toFixed(2)}%
                                                                </strong>
                                                            </div>
                                                            <div className="font-mono text-[11px] text-muted-foreground">
                                                                Risiko (σ):{' '}
                                                                <strong className="text-foreground">
                                                                    {data.x?.toFixed(2)}%
                                                                </strong>
                                                            </div>
                                                            {data.sharpe !== undefined && (
                                                                <div className="font-mono text-[11px] text-muted-foreground">
                                                                    Sharpe Ratio:{' '}
                                                                    <strong className="text-primary">
                                                                        {data.sharpe?.toFixed(2)}
                                                                    </strong>
                                                                </div>
                                                            )}

                                                            {top3.length > 0 && (
                                                                <>
                                                                    <div className="my-1.5 border-t border-border/50" />
                                                                    <div className="text-[10px] text-muted-foreground font-semibold mb-1">Top 3 Saham:</div>
                                                                    {top3.map((t, i) => (
                                                                        <div key={i} className="flex justify-between font-mono text-[10px] py-0.5">
                                                                            <span className="text-foreground font-bold">{t.ticker}</span>
                                                                            <span className="text-primary">{t.weight.toFixed(2)}%</span>
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />

                                        {hoveredPoint && (
                                            <>
                                                <ReferenceLine
                                                    x={hoveredPoint.x}
                                                    stroke="currentColor"
                                                    strokeOpacity={0.5}
                                                    strokeDasharray="3 3"
                                                    label={{ position: 'bottom', value: `${hoveredPoint.x.toFixed(2)}%`, fill: 'currentColor', fontSize: 10 }}
                                                />
                                                <ReferenceLine
                                                    y={hoveredPoint.y}
                                                    stroke="currentColor"
                                                    strokeOpacity={0.5}
                                                    strokeDasharray="3 3"
                                                    label={{ position: 'insideLeft', value: `${hoveredPoint.y.toFixed(2)}%`, fill: 'currentColor', fontSize: 10 }}
                                                />
                                            </>
                                        )}

                                        {/* NSGA-II Scatter Points */}
                                        <Scatter
                                            name="NSGA-II"
                                            data={nsgaPoints}
                                            fill="#a855f7"
                                            className="cursor-pointer"
                                            shape={(props: any) => {
                                                const { cx, cy, fill, payload } = props;
                                                const isActive = clickedPoint && clickedPoint.x === payload.x && clickedPoint.y === payload.y;
                                                return isActive ? (
                                                    <g>
                                                        <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
                                                        <circle cx={cx} cy={cy} r={10} fill="none" stroke={fill} strokeWidth={2} className="animate-ping opacity-50" />
                                                    </g>
                                                ) : (
                                                    <circle cx={cx} cy={cy} r={3} fill={fill} opacity={0.4} />
                                                );
                                            }}
                                        />

                                        {/* Markowitz Efficient Frontier Points */}
                                        <Scatter
                                            name="Markowitz"
                                            data={frontierPoints}
                                            fill="#10b981"
                                            className="cursor-pointer"
                                            line={{ stroke: '#10b981', strokeWidth: 2 }}
                                            shape={(props: any) => {
                                                const { cx, cy, fill, payload } = props;
                                                const isActive = clickedPoint && clickedPoint.x === payload.x && clickedPoint.y === payload.y;
                                                return isActive ? (
                                                    <g>
                                                        <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
                                                        <circle cx={cx} cy={cy} r={10} fill="none" stroke={fill} strokeWidth={2} className="animate-ping opacity-50" />
                                                    </g>
                                                ) : (
                                                    <circle cx={cx} cy={cy} r={3} fill={fill} />
                                                );
                                            }}
                                        />

                                        {/* Individual Asset Points */}
                                        <Scatter
                                            name="Saham Tunggal"
                                            data={assetPoints}
                                            fill="#64748b"
                                            shape="triangle"
                                        />

                                        {/* Key Highlight Markers */}
                                        <Scatter
                                            name="Portofolio Pilihan"
                                            data={keyMarkers}
                                            fill="#e11d48"
                                            shape="cross"
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend Bar */}
                            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-[11px] text-muted-foreground pt-2.5 border-t border-border/40">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Efficient Frontier (Markowitz)</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 opacity-60 shrink-0" />
                                    <span>Populasi Pareto NSGA-II</span>
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Donut Chart Alokasi Bobot Profil Terpilih (5 Cols) */}
                    <Card className="lg:col-span-5 border border-border/70 shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <PieIcon className="h-4 w-4 text-primary" />
                                        <span> Alokasi Bobot Portofolio</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Proporsi kepemilikan saham untuk profil{' '}
                                        <strong className="text-foreground capitalize">{selectedProfile.replace('_', ' ')}</strong>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={
                                                activePortfolio?.capital_allocation
                                                    ? Object.entries(activePortfolio.capital_allocation)
                                                        .map(([ticker, alloc]) => ({
                                                            ticker: ticker.replace('.JK', ''),
                                                            weightPercent: alloc.weight_percent,
                                                            nominalAmount: alloc.nominal_idr
                                                        }))
                                                        .filter(item => item.weightPercent > 0.05)
                                                        .sort((a, b) => b.weightPercent - a.weightPercent)
                                                    : []
                                            }
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="weightPercent"
                                        >
                                            {(
                                                activePortfolio?.capital_allocation
                                                    ? Object.entries(activePortfolio.capital_allocation)
                                                        .map(([ticker, alloc]) => ({
                                                            ticker: ticker.replace('.JK', ''),
                                                            weightPercent: alloc.weight_percent,
                                                            nominalAmount: alloc.nominal_idr
                                                        }))
                                                        .filter(item => item.weightPercent > 0.05)
                                                        .sort((a, b) => b.weightPercent - a.weightPercent)
                                                    : []
                                            ).map((entry, index) => (
                                                <Cell
                                                    key={`cell-${entry.ticker}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border border-border/80 bg-background/95 p-2 shadow-md text-xs font-sans space-y-1">
                                                            <div className="font-bold text-foreground font-mono">
                                                                {d.ticker}
                                                            </div>
                                                            <div className="font-mono text-primary font-bold">
                                                                Bobot: {d.weightPercent?.toFixed(2)}%
                                                            </div>
                                                            <div className="font-mono text-muted-foreground text-[11px]">
                                                                Nominal: {formatRupiah(d.nominalAmount)}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top 3 summary / legend responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-2 border-t border-border/40">
                                {activePortfolio?.capital_allocation && Object.entries(activePortfolio.capital_allocation)
                                    .map(([ticker, alloc]) => ({
                                        ticker: ticker.replace('.JK', ''),
                                        weightPercent: alloc.weight_percent,
                                        nominalAmount: alloc.nominal_idr
                                    }))
                                    .filter(item => item.weightPercent > 0.05)
                                    .sort((a, b) => b.weightPercent - a.weightPercent)
                                    .slice(0, 3)
                                    .map((item, idx) => (
                                        <div
                                            key={item.ticker}
                                            className="flex items-center justify-between text-xs font-mono"
                                        >
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className="h-2 w-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                />
                                                <span className="font-bold text-foreground truncate">{item.ticker}</span>
                                            </span>
                                            <span className="font-bold text-primary shrink-0 ml-2">
                                                {item.weightPercent?.toFixed(2)}% ({formatRupiah(item.nominalAmount)})
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. TABEL DETAIL ALOKASI NOMINAL RUPIAH & ESTIMASI LOT */}
                <div className="space-y-6">
                    {[
                        { id: 'min_variance', label: 'Konservatif (Risiko Rendah)', data: bestPortfolios.min_variance },
                        { id: 'sharpe', label: 'Seimbang (Optimal Sharpe)', data: bestPortfolios.sharpe },
                        { id: 'max_return', label: 'Agresif (Return Maksimal)', data: bestPortfolios.max_return }
                    ].filter((profile) => profile.id === selectedProfile).map((profile) => profile.data && (
                        <Card key={profile.id} className="border border-border/70 shadow-xs">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-primary" />
                                            <span>Alokasi {profile.label}</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Return: <span className="font-bold text-foreground">{formatPercent(profile.data.return)}</span> |
                                            Risiko: <span className="font-bold text-foreground">{formatPercent(profile.data.risk)}</span> |
                                            Sharpe: <span className="font-bold text-foreground">{profile.data.sharpe?.toFixed(3)}</span>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto w-full border-t border-border/40">
                                    <Table className="min-w-[640px]">
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="text-xs font-bold py-3">Emiten Saham</TableHead>
                                                <TableHead className="text-xs font-bold text-center py-3">Bursa</TableHead>
                                                <TableHead className="text-xs font-bold text-right py-3">Bobot Alokasi (%)</TableHead>
                                                <TableHead className="text-xs font-bold text-right py-3">Nominal Dana (IDR)</TableHead>
                                                <TableHead className="text-xs font-bold text-right py-3">Harga Terakhir (IDR)</TableHead>
                                                <TableHead className="text-xs font-bold text-right py-3">Estimasi Lot</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(profile.data.capital_allocation || {})
                                                .sort((a, b) => b[1].weight_percent - a[1].weight_percent)
                                                .map(([rawTicker, alloc], idx) => {
                                                    const cleanTicker = rawTicker.replace('.JK', '');
                                                    const stk = stocks[rawTicker] || stocks[cleanTicker];
                                                    const lastClose = stk?.latest_price ? Number(stk.latest_price.close_price) : 0;
                                                    const lotEstimate = lastClose > 0 ? Math.floor(alloc.nominal_idr / (lastClose * 100)) : 0;

                                                    if (alloc.weight_percent <= 0.05) return null;

                                                    return (
                                                        <TableRow key={cleanTicker} className="hover:bg-muted/20">
                                                            <TableCell className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="h-3 w-3 rounded-full shrink-0"
                                                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                                    />
                                                                    <div>
                                                                        <span className="font-mono font-bold text-sm text-foreground">
                                                                            {cleanTicker}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground block truncate max-w-xs">
                                                                            {stk?.name || cleanTicker}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="py-3 text-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[9px] py-0 px-1 font-semibold ${
                                                                        stk?.bursa === 'NYSE'
                                                                            ? 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                                                                            : 'border-blue-500/30 text-blue-600 bg-blue-500/5'
                                                                        }`}
                                                                >
                                                                    {stk?.bursa || 'IDX'}
                                                                </Badge>
                                                            </TableCell>

                                                            <TableCell className="py-3 text-right font-mono font-bold text-xs text-primary">
                                                                {alloc.weight_percent.toFixed(2)}%
                                                            </TableCell>

                                                            <TableCell className="py-3 text-right font-mono font-bold text-xs text-foreground">
                                                                {formatRupiah(alloc.nominal_idr)}
                                                            </TableCell>

                                                            <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                                                                {lastClose > 0 ? `${lastClose.toLocaleString('id-ID')}` : '-'}
                                                            </TableCell>

                                                            <TableCell className="py-3 text-right font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                                                                {lotEstimate > 0 ? `${lotEstimate.toLocaleString('id-ID')} Lot` : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                        {(() => {
                                            const validAllocations = Object.entries(profile.data.capital_allocation || {})
                                                .filter(([_, a]) => a.weight_percent > 0.05);

                                            const totalWeight = validAllocations.reduce((sum, [_, a]) => sum + a.weight_percent, 0);
                                            const totalNominal = validAllocations.reduce((sum, [_, a]) => sum + a.nominal_idr, 0);
                                            const totalLots = validAllocations.reduce((sum, [rawTicker, a]) => {
                                                const cleanTicker = rawTicker.replace('.JK', '');
                                                const stk = stocks[rawTicker] || stocks[cleanTicker];
                                                const lastClose = stk?.latest_price ? Number(stk.latest_price.close_price) : 0;
                                                const lotEst = lastClose > 0 ? Math.floor(a.nominal_idr / (lastClose * 100)) : 0;
                                                return sum + lotEst;
                                            }, 0);

                                            return (
                                                <tfoot className="bg-muted/10 border-t border-border/50">
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="py-3 font-bold text-center text-xs">
                                                            Total
                                                        </TableCell>
                                                        <TableCell className="py-3 font-mono font-bold text-right text-xs text-primary">
                                                            {totalWeight.toFixed(2)}%
                                                        </TableCell>
                                                        <TableCell className="py-3 font-mono font-bold text-right text-xs text-foreground">
                                                            {formatRupiah(totalNominal)}
                                                        </TableCell>
                                                        <TableCell className="py-3 font-mono text-right text-xs text-muted-foreground">
                                                            -
                                                        </TableCell>
                                                        <TableCell className="py-3 font-mono font-extrabold text-right text-xs text-emerald-600 dark:text-emerald-400">
                                                            {totalLots > 0 ? `${totalLots.toLocaleString('id-ID')} Lot` : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                </tfoot>
                                            );
                                        })()}
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 5. TABEL ANALISIS KUANTIL 5-POINTS (SHARPE, SORTINO, OMEGA) */}
                {optimization.quantile_analysis && (
                    <Card className="border border-border/70 shadow-xs">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        <span>Distribusi 5-Points Quantile Model</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Sebaran kuantil metrik performa (Min, Q1, Median, Q3, Max) dari seluruh portofolio
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto w-full border-t border-border/40">
                                <Table className="min-w-[550px]">
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="text-xs font-bold py-3">Rasio Metrik</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3">Min (0%)</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3">Q1 (25%)</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3">Median (50%)</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3">Q3 (75%)</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3">Max (100%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {optimization.quantile_analysis.sharpe && (
                                            <TableRow>
                                                <TableCell className="font-bold text-xs text-foreground py-3">
                                                    Sharpe Ratio
                                                </TableCell>
                                                {['Min', 'Q1', 'Median', 'Q3', 'Max'].map(lbl => (
                                                    <TableCell key={lbl} className={`py-3 text-right font-mono text-xs ${lbl === 'Median' ? 'font-bold text-primary' : lbl === 'Max' ? 'font-bold text-emerald-600' : ''}`}>
                                                        {optimization.quantile_analysis!.sharpe!.find(q => q.label === lbl)?.target_value?.toFixed(3) || '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )}
                                        {optimization.quantile_analysis.sortino && (
                                            <TableRow>
                                                <TableCell className="font-bold text-xs text-foreground py-3">
                                                    Sortino Ratio
                                                </TableCell>
                                                {['Min', 'Q1', 'Median', 'Q3', 'Max'].map(lbl => (
                                                    <TableCell key={lbl} className={`py-3 text-right font-mono text-xs ${lbl === 'Median' ? 'font-bold text-primary' : lbl === 'Max' ? 'font-bold text-emerald-600' : ''}`}>
                                                        {optimization.quantile_analysis!.sortino!.find(q => q.label === lbl)?.target_value?.toFixed(3) || '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )}
                                        {optimization.quantile_analysis.omega && (
                                            <TableRow>
                                                <TableCell className="font-bold text-xs text-foreground py-3">
                                                    Omega Ratio
                                                </TableCell>
                                                {['Min', 'Q1', 'Median', 'Q3', 'Max'].map(lbl => (
                                                    <TableCell key={lbl} className={`py-3 text-right font-mono text-xs ${lbl === 'Median' ? 'font-bold text-primary' : lbl === 'Max' ? 'font-bold text-emerald-600' : ''}`}>
                                                        {optimization.quantile_analysis!.omega!.find(q => q.label === lbl)?.target_value?.toFixed(3) || '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 6. RIWAYAT SWITCHER BOTTOM BAR (Hanya untuk pengguna login) */}
                {!isPublic && history.length > 1 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-muted/20 text-xs">
                        <span className="text-muted-foreground">
                            Menampilkan <strong>{history.length}</strong> riwayat analisis portofolio terbaru Anda.
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full w-full sm:w-auto pb-1 sm:pb-0">
                            {history.slice(0, 5).map((h) => (
                                <Button
                                    key={h.id}
                                    asChild
                                    size="sm"
                                    variant={h.id === optimization.id ? 'default' : 'outline'}
                                    className={`h-7 text-[11px] font-mono shrink-0 cursor-pointer ${h.id === optimization.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                >
                                    <Link href={`/user/analyze/result/${h.id}`}>
                                        {h.reference_code || `DNL${h.user_id || optimization.user_id}-${h.id}`}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7. OFF-SCREEN EXPORT CARDS (RENDERED WITH EXPLICIT DIMENSIONS FOR HTML-TO-IMAGE) */}
                <div
                    style={{
                        position: 'fixed',
                        left: '-9999px',
                        top: '-9999px',
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                >
                    {/* Kartu Profil Aktif */}
                    <PortfolioShareCard
                        ref={singleCardRef}
                        profile={activePortfolio}
                        profileType={selectedProfile}
                        optimization={optimization}
                        stocks={stocks}
                    />

                    {/* Kartu Komparasi 3 Profil Sekaligus */}
                    <div style={{ marginTop: '40px' }}>
                        <PortfolioCompareShareCard
                            ref={compareCardRef}
                            optimization={optimization}
                            stocks={stocks}
                        />
                    </div>
                </div>
        </div>
    );

    if (isPublic) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
                <Head title="Portofolio Saham" />

                {/* Public Top Navbar */}
                <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/images/newLogo.png?v=4" alt="Dinalar Logo" className="h-9 w-auto" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <Button asChild variant="ghost" size="sm" className="text-xs cursor-pointer">
                                <Link href="/login">Masuk</Link>
                            </Button>
                            <Button asChild size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
                                <Link href="/register">Daftar Sekarang</Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Public Top Marketing Banner */}
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-2.5 px-4 text-center text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 flex-wrap">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Hasil optimasi portofolio <strong>Dinalar AI</strong>. Buat portofolio investasi Anda sendiri secara gratis!</span>
                    <Button asChild size="sm" variant="link" className="h-auto p-0 font-bold text-emerald-600 hover:text-emerald-700 text-xs cursor-pointer">
                        <Link href="/register">Mulai Gratis &rarr;</Link>
                    </Button>
                </div>

                <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                    {mainContent}
                </main>

                {/* Public Footer */}
                <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground bg-muted/20">
                    <p>© {new Date().getFullYear()} Dinalar - AI Stock Portfolio Optimization Platform. All Rights Reserved.</p>
                </footer>
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hasil Portofolio" />
            <div className="p-4 sm:p-6 mx-auto w-full">
                {mainContent}
            </div>
        </AppLayout>
    );
}
