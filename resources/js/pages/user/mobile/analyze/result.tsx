import { PortfolioCompareShareCard, PortfolioShareCard } from '@/components/PortfolioShareCard';
import { copyTextToClipboard, useExportShare } from '@/hooks/useExportShare';
import { useTranslation } from '@/i18n/LanguageContext';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type Stock } from '@/types';
import { generatePortfolioPDFReport } from '@/utils/pdfReportGenerator';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Download,
    FileText,
    Image as ImageIcon,
    Layers,
    LineChart,
    Loader2,
    MessageCircle,
    PieChart as PieIcon,
    RefreshCw,
    Share2,
    Shield,
    ShieldCheck,
    Sparkles,
    X,
    Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Cell,
    Pie,
    PieChart,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from 'recharts';
import { toast } from 'sonner';

interface AssetAllocation {
    ticker: string;
    companyName: string;
    category: 'IDX' | 'NASDAQ' | string;
    weightPercent: number;
    nominalAmount: number;
    lastPrice: number;
    estimatedLot: number | null;
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
    reference_code?: string;
    share_token?: string;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    start_date: string | null;
    end_date: string | null;
    tickers: string[];
    nsga_params?: {
        population_size: number;
        generations: number;
        crossover_rate: number;
        mutation_rate: number;
    };
    best_portfolios: {
        sharpe: BestPortfolioItem;
        min_variance: BestPortfolioItem;
        sortino?: BestPortfolioItem;
        omega?: BestPortfolioItem;
        max_return?: BestPortfolioItem;
    };
    efficient_frontier?: Array<{ return: number; risk: number; sharpe: number; weights?: Record<string, number> }>;
    nsga_samples?: Array<{ return: number; risk: number; sharpe: number; weights?: Record<string, number> }>;
    quantile_analysis?: {
        sharpe?: QuantilePoint[];
        sortino?: QuantilePoint[];
        omega?: QuantilePoint[];
    };
    individual_assets?: Array<{ ticker: string; return: number; risk: number }>;
    created_at: string;
}

interface ResultProps {
    optimization: PortfolioOptimizationRecord;
    stocks: Record<string, Stock>;
    history?: Array<{
        id: number;
        user_id?: number;
        reference_code?: string;
        title: string;
        initial_capital: number;
        created_at: string;
    }>;
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

export default function MobileResultPage({
    optimization,
    stocks = {},
    history = [],
    isPublic = false,
}: ResultProps) {
    const { t, language } = useTranslation();
    const [selectedProfile, setSelectedProfile] = useState<'sharpe' | 'min_variance' | 'max_return' | 'sortino'>('sharpe');
    const [clickedPoint, setClickedPoint] = useState<any>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
    const [isGeneratingShare, setIsGeneratingShare] = useState<boolean>(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
    const [activeChartTab, setActiveChartTab] = useState<'frontier' | 'donut'>('donut');

    // Clear clicked point when user switches profile
    React.useEffect(() => {
        setClickedPoint(null);
    }, [selectedProfile]);

    const initialCapital = Number(optimization.initial_capital || 10000000);
    const bestPortfolios = optimization.best_portfolios || {};

    // Active portfolio derived strictly from clicked point or selected profile
    const activePortfolio = useMemo(() => {
        if (clickedPoint) {
            const capital_allocation: Record<string, any> = {};
            if (clickedPoint.weights) {
                Object.entries(clickedPoint.weights).forEach(([ticker, w]) => {
                    const weightPercent = Number(w) * 100;
                    capital_allocation[ticker] = {
                        weight_percent: weightPercent,
                        nominal_idr: Number(w) * initialCapital,
                    };
                });
            }
            return {
                return: clickedPoint.y,
                risk: clickedPoint.x,
                sharpe: clickedPoint.sharpe,
                capital_allocation,
                isCustom: true,
                name: clickedPoint.name || t('result.custom_simulation', 'Simulasi Kustom'),
            } as BestPortfolioItem & { isCustom?: boolean; name?: string };
        }

        return selectedProfile === 'max_return' && bestPortfolios.max_return
            ? bestPortfolios.max_return
            : selectedProfile === 'min_variance' && bestPortfolios.min_variance
                ? bestPortfolios.min_variance
                : selectedProfile === 'sortino' && bestPortfolios.sortino
                    ? bestPortfolios.sortino
                    : bestPortfolios.sharpe || bestPortfolios.min_variance;
    }, [clickedPoint, selectedProfile, bestPortfolios, initialCapital, t]);

    // Formatters
    const formatRupiah = (val: number | string | null | undefined) => {
        const currencyPrefix = language === 'en' ? 'IDR' : 'Rp';
        if (val === null || val === undefined || isNaN(Number(val))) return `${currencyPrefix} -`;
        const locale = language === 'en' ? 'en-US' : 'id-ID';
        return `${currencyPrefix} ${Number(val).toLocaleString(locale)}`;
    };

    const formatPercent = (val: number | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return '0.00%';
        const num = Number(val);
        const displayVal = Math.abs(num) <= 1.0 ? num * 100 : num;
        return `${displayVal.toFixed(2)}%`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            const locale = language === 'en' ? 'en-US' : 'id-ID';
            return new Date(dateStr).toLocaleDateString(locale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const getProfileLabel = (p: string) => {
        switch (p) {
            case 'min_variance':
                return t('result.profile_label_min_variance', 'Konservatif (Risiko Rendah)');
            case 'max_return':
                return t('result.profile_label_max_return', 'Agresif (Return Maksimal)');
            case 'sortino':
                return t('result.profile_label_sortino', 'Downside Optimal (Sortino)');
            case 'sharpe':
            default:
                return t('result.profile_label_sharpe', 'Seimbang (Optimal Sharpe)');
        }
    };

    // Export & Share Hooks
    const singleCardRef = useRef<HTMLDivElement>(null);
    const compareCardRef = useRef<HTMLDivElement>(null);
    const { isExporting, exportAsImage, sharePortfolio, shareToWhatsAppText } = useExportShare();

    // Drag-to-close Bottom Sheet state and refs (like StockAnalysisSheet)
    const shareSheetRef = useRef<HTMLDivElement | null>(null);
    const shareOverlayRef = useRef<HTMLDivElement | null>(null);
    const shareScrollBodyRef = useRef<HTMLDivElement | null>(null);
    const shareDragStartY = useRef(0);
    const shareDragStartX = useRef(0);
    const shareDragStartTime = useRef(0);
    const shareCurrentDragY = useRef(0);
    const shareIsDragging = useRef(false);
    const shareCanDrag = useRef(false);
    const shareCanDragFromBody = useRef(false);

    const finishShareDrag = useCallback((deltaY: number) => {
        shareIsDragging.current = false;
        shareCanDrag.current = false;
        shareCanDragFromBody.current = false;

        const sheetEl = shareSheetRef.current;
        const overlay = shareOverlayRef.current;
        const timeElapsed = Date.now() - shareDragStartTime.current;
        const velocity = deltaY / Math.max(1, timeElapsed);
        const shouldDismiss = deltaY > 80 || (deltaY > 30 && velocity > 0.4);

        if (shouldDismiss && sheetEl) {
            sheetEl.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
            sheetEl.style.transform = 'translate3d(0, 100%, 0)';
            if (overlay) {
                overlay.style.transition = 'opacity 200ms ease-out';
                overlay.style.opacity = '0';
            }
            setTimeout(() => {
                setIsShareModalOpen(false);
                if (sheetEl) {
                    sheetEl.style.transition = '';
                    sheetEl.style.transform = '';
                }
                if (overlay) {
                    overlay.style.transition = '';
                    overlay.style.opacity = '';
                }
            }, 200);
        } else if (sheetEl) {
            sheetEl.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
            sheetEl.style.transform = 'translate3d(0, 0, 0)';
            if (overlay) {
                overlay.style.transition = 'opacity 220ms ease-out';
                overlay.style.opacity = '';
            }
            setTimeout(() => {
                if (sheetEl) {
                    sheetEl.style.transition = '';
                    sheetEl.style.transform = '';
                }
                if (overlay) {
                    overlay.style.transition = '';
                }
            }, 220);
        }
    }, []);

    const handleShareMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, input, select, textarea, a, [role="button"]')) {
            if (!target.closest('[data-drag-handle="true"]')) return;
        }

        shareDragStartY.current = e.clientY;
        shareDragStartX.current = e.clientX;
        shareDragStartTime.current = Date.now();
        shareCurrentDragY.current = 0;
        shareIsDragging.current = true;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!shareIsDragging.current) return;
            const deltaY = Math.max(0, moveEvent.clientY - shareDragStartY.current);
            shareCurrentDragY.current = deltaY;
            const sheetEl = shareSheetRef.current;
            if (sheetEl) {
                sheetEl.style.transition = 'none';
                sheetEl.style.transform = `translate3d(0, ${deltaY}px, 0)`;
            }
            const overlay = shareOverlayRef.current;
            if (overlay && sheetEl) {
                const sheetHeight = sheetEl.offsetHeight || 500;
                const progress = Math.min(1, deltaY / sheetHeight);
                overlay.style.opacity = `${Math.max(0, 1 - progress * 0.8)}`;
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            finishShareDrag(shareCurrentDragY.current);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [finishShareDrag]);

    useEffect(() => {
        if (!isShareModalOpen) return;

        let cleanupListeners: (() => void) | null = null;

        const attach = () => {
            const sheetEl = shareSheetRef.current;
            if (!sheetEl) return;

            sheetEl.style.transition = '';
            sheetEl.style.transform = '';

            const onTouchStart = (e: TouchEvent) => {
                if (e.touches.length !== 1) return;
                const touch = e.touches[0];
                shareDragStartY.current = touch.clientY;
                shareDragStartX.current = touch.clientX;
                shareCurrentDragY.current = 0;
                shareDragStartTime.current = Date.now();
                shareIsDragging.current = false;

                const target = e.target as HTMLElement | null;
                const isHandle = !!target?.closest('[data-drag-handle="true"]');
                const isHeader = !!target?.closest('[data-drag-header="true"]');

                if (isHandle || isHeader) {
                    shareCanDrag.current = true;
                    shareCanDragFromBody.current = false;
                } else {
                    const isScrollBody = !!target?.closest('[data-scroll-body="true"]');
                    if (isScrollBody) {
                        const scrollTop = shareScrollBodyRef.current?.scrollTop ?? 0;
                        shareCanDrag.current = scrollTop <= 2;
                        shareCanDragFromBody.current = scrollTop <= 2;
                    } else {
                        shareCanDrag.current = false;
                        shareCanDragFromBody.current = false;
                    }
                }
            };

            const onTouchMove = (e: TouchEvent) => {
                if (!shareCanDrag.current || e.touches.length !== 1) return;
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - shareDragStartX.current);
                const deltaY = touch.clientY - shareDragStartY.current;

                if (!shareIsDragging.current && deltaX > Math.abs(deltaY) && deltaX > 6) {
                    shareCanDrag.current = false;
                    return;
                }

                if (shareCanDragFromBody.current) {
                    const scrollTop = shareScrollBodyRef.current?.scrollTop ?? 0;
                    if (scrollTop > 2) {
                        shareCanDrag.current = false;
                        shareIsDragging.current = false;
                        return;
                    }
                }

                if (!shareIsDragging.current && deltaY > 8) {
                    shareIsDragging.current = true;
                }

                if (shareIsDragging.current) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    const clampedDeltaY = Math.max(0, deltaY);
                    shareCurrentDragY.current = clampedDeltaY;
                    sheetEl.style.transition = 'none';
                    sheetEl.style.transform = `translate3d(0, ${clampedDeltaY}px, 0)`;

                    const overlay = shareOverlayRef.current;
                    if (overlay) {
                        const sheetHeight = sheetEl.offsetHeight || 500;
                        const progress = Math.min(1, clampedDeltaY / sheetHeight);
                        overlay.style.opacity = `${Math.max(0, 1 - progress * 0.8)}`;
                    }
                }
            };

            const onTouchEnd = () => {
                if (!shareIsDragging.current) {
                    shareCanDrag.current = false;
                    shareCanDragFromBody.current = false;
                    return;
                }
                finishShareDrag(shareCurrentDragY.current);
            };

            sheetEl.addEventListener('touchstart', onTouchStart, { passive: true });
            sheetEl.addEventListener('touchmove', onTouchMove, { passive: false });
            sheetEl.addEventListener('touchend', onTouchEnd, { passive: true });
            sheetEl.addEventListener('touchcancel', onTouchEnd, { passive: true });

            cleanupListeners = () => {
                sheetEl.removeEventListener('touchstart', onTouchStart);
                sheetEl.removeEventListener('touchmove', onTouchMove);
                sheetEl.removeEventListener('touchend', onTouchEnd);
                sheetEl.removeEventListener('touchcancel', onTouchEnd);
            };
        };

        const frameId = requestAnimationFrame(attach);

        return () => {
            cancelAnimationFrame(frameId);
            cleanupListeners?.();
            const sheetEl = shareSheetRef.current;
            if (sheetEl) {
                sheetEl.style.transition = '';
                sheetEl.style.transform = '';
            }
            const overlay = shareOverlayRef.current;
            if (overlay) {
                overlay.style.transition = '';
                overlay.style.opacity = '';
            }
        };
    }, [isShareModalOpen, finishShareDrag]);

    const handleExportPNG = async (profileOverride?: 'min_variance' | 'sharpe' | 'max_return' | 'sortino') => {
        const targetProf = profileOverride || selectedProfile;
        if (profileOverride && profileOverride !== selectedProfile) {
            setSelectedProfile(profileOverride);
        }
        await new Promise((r) => setTimeout(r, 100));
        if (!singleCardRef.current) return;

        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filePrefix = language === 'en' ? 'Portfolio' : 'Portofolio';
        const filename = `${filePrefix}-${targetProf}-${refCode}.png`;
        setIsShareModalOpen(false);
        await exportAsImage(singleCardRef.current, filename, true);
    };

    const handleExportPDF = async () => {
        try {
            setIsShareModalOpen(false);
            const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
            const filePrefix = language === 'en' ? 'Portfolio-Report' : 'Laporan-Portofolio';
            const filename = `${filePrefix}-${selectedProfile}-${refCode}.pdf`;
            await generatePortfolioPDFReport({
                optimization: optimization as any,
                activePortfolio: activePortfolio as any,
                selectedProfile,
                profileLabel: getProfileLabel(selectedProfile),
                stocks,
                language,
            });
            toast.success(t('result.pdf_download_success', { file: filename }));
        } catch (error) {
            console.error('Failed to generate PDF report:', error);
            toast.error(t('result.pdf_download_error', 'Gagal membuat dokumen PDF laporan. Silakan coba lagi.'));
        }
    };

    const handleExportCompare = async () => {
        if (!compareCardRef.current) return;
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filePrefix = language === 'en' ? 'Portfolio-3-Profiles-Comparison' : 'Komparasi-Portofolio-3-Profil';
        const filename = `${filePrefix}-${refCode}.png`;
        setIsShareModalOpen(false);
        await exportAsImage(compareCardRef.current, filename, true);
    };

    const handleShareNative = async (profileOverride?: 'min_variance' | 'sharpe' | 'max_return' | 'sortino') => {
        const targetProf = profileOverride || selectedProfile;
        if (profileOverride && profileOverride !== selectedProfile) {
            setSelectedProfile(profileOverride);
        }
        await new Promise((r) => setTimeout(r, 100));
        if (!singleCardRef.current) return;

        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const filePrefix = language === 'en' ? 'Portfolio' : 'Portofolio';
        const filename = `${filePrefix}-${targetProf}-${refCode}.png`;
        const shareText = t('result.share_native_text', { profile: getProfileLabel(targetProf), refCode });
        setIsShareModalOpen(false);
        await sharePortfolio(singleCardRef.current, filename, t('result.share_title', 'Rekomendasi Portofolio Saham'), shareText);
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
                throw new Error(t('result.link_copy_error', 'Gagal membuat tautan publik'));
            }

            const data = await response.json();
            if (data.url) {
                const copied = await copyTextToClipboard(data.url);
                if (copied) {
                    setIsShareModalOpen(false);
                    toast.success(t('result.link_copied_clipboard', 'Tautan publik berhasil disalin ke clipboard!'));
                }
            } else {
                throw new Error('URL not found');
            }
        } catch (error) {
            console.error('Failed to generate share link:', error);
            const fallbackUrl = `${window.location.origin}/shared/portfolio/${optimization.share_token || `DNL${optimization.user_id}-${optimization.id}`}`;
            const copied = await copyTextToClipboard(fallbackUrl);
            if (copied) {
                setIsShareModalOpen(false);
                toast.success(t('result.link_copied_clipboard', 'Tautan berhasil disalin ke clipboard!'));
            } else {
                toast.error(t('result.link_copy_error', 'Gagal menyalin tautan ke clipboard. Silakan coba lagi.'));
            }
        } finally {
            setIsGeneratingShare(false);
        }
    };

    const handleShareWhatsAppText = () => {
        setIsShareModalOpen(false);
        const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;
        const activeProfData = activePortfolio;
        const returnVal = activeProfData?.return !== undefined ? Number(activeProfData.return).toFixed(2) : '0';
        const riskVal = activeProfData?.risk !== undefined ? Number(activeProfData.risk).toFixed(2) : '0';
        const sharpeVal = activeProfData?.sharpe !== undefined ? Number(activeProfData.sharpe).toFixed(2) : '0';

        let rawAllocMap: Record<string, { weight_percent: number; nominal_idr: number }> = {};
        if (activeProfData?.capital_allocation && Object.keys(activeProfData.capital_allocation).length > 0) {
            rawAllocMap = activeProfData.capital_allocation;
        } else if (activeProfData?.weights) {
            Object.entries(activeProfData.weights).forEach(([tickerKey, rawWeight]) => {
                const clean = tickerKey.replace('.JK', '');
                const weightVal = Number(rawWeight);
                const weightPercent = weightVal <= 1.0 ? weightVal * 100 : weightVal;
                const nominal =
                    activeProfData.allocation_idr?.[tickerKey] ??
                    activeProfData.allocation_idr?.[clean] ??
                    (weightPercent / 100) * initialCapital;
                rawAllocMap[tickerKey] = {
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
        const numLocale = language === 'en' ? 'en-US' : 'id-ID';
        const lotUnit = t('result.lot_unit', 'Lot');

        allocationsList.forEach((item, idx) => {
            const currencyPrefix = language === 'en' ? 'IDR' : 'Rp';
            stockLines += `${idx + 1}. *${item.ticker}* (${item.category})\n` +
                `   ↳ ${t('result.wa_weight', 'Bobot:')} *${item.weight.toFixed(2)}%* | ${t('result.wa_nominal', 'Nominal:')} *${formatRupiah(item.nominal)}*\n` +
                `   ↳ ${t('result.wa_price', 'Harga:')} *${item.lastClose > 0 ? `${currencyPrefix} ${item.lastClose.toLocaleString(numLocale)}` : '-'}* | ${t('result.wa_estimate', 'Estimasi:')} *${item.lot > 0 ? `${item.lot.toLocaleString(numLocale)} ${lotUnit}` : '-'}*\n`;
        });

        const dateRangeStr = optimization.start_date && optimization.end_date
            ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}`
            : formatDate(optimization.created_at);

        const totalLotsText = `${totalLots.toLocaleString(numLocale)} ${lotUnit}`;

        const text = `📊 *${t('result.wa_header', 'HASIL ANALISIS PORTOFOLIO SAHAM DINALAR')}*\n\n` +
            `• *${t('result.wa_title', 'Judul:')}* ${optimization.title || t('result.default_title', 'Portofolio Multi-Aset')}\n` +
            `• *${t('result.wa_profile', 'Profil:')}* ${getProfileLabel(selectedProfile)}\n` +
            `• *${t('result.wa_ref_code', 'Kode Ref:')}* ${refCode}\n` +
            `• *${t('result.wa_analysis_date', 'Tanggal Analisis:')}* ${formatDate(optimization.created_at)}\n` +
            `• *${t('result.wa_time_range', 'Rentang Waktu:')}* ${dateRangeStr}\n` +
            `• *${t('result.wa_investment_capital', 'Modal Investasi:')}* ${formatRupiah(initialCapital)}\n` +
            `• *${t('result.wa_risk_free_rate', 'Risk-Free Rate:')}* ${optimization.risk_free_rate}%\n\n` +
            `📈 *${t('result.wa_metrics_title', 'METRIK PERFORMA:')}*\n` +
            `• ${t('result.wa_expected_return', 'Expected Return:')} *+${returnVal}%* (${t('result.wa_annual', 'Tahunan')})\n` +
            `• ${t('result.wa_risk_volatility', 'Volatilitas Risiko (σ):')} *${riskVal}%*\n` +
            `• ${t('result.wa_sharpe_ratio', 'Sharpe Ratio:')} *${sharpeVal}*\n\n` +
            `💼 *${t('result.wa_allocation_title', 'RINCIAN ALOKASI SAHAM:')}*\n` +
            `${stockLines}\n` +
            `📌 *${t('result.wa_total_purchase', 'TOTAL PEMBELIAN:')}*\n` +
            `• ${t('result.wa_total_capital', 'Total Modal:')} *${formatRupiah(totalNominal)}* (100.00%)\n` +
            `• ${t('result.wa_total_estimate', 'Total Estimasi:')} *${totalLotsText}*\n\n` +
            `${t('result.wa_footer', 'Analisis otomatis dengan Algoritma NSGA-II & Markowitz Frontier.\n🌐 Kunjungi: https://dinalar.my.id')}`;

        shareToWhatsAppText(text);
    };

    // Chart Data Preparation
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

    const keyMarkers = useMemo(() => {
        const markers = [];
        if (bestPortfolios.sharpe) {
            markers.push({
                x: Number(bestPortfolios.sharpe.risk),
                y: Number(bestPortfolios.sharpe.return),
                name: `⚖️ ${t('result.marker_sharpe', 'Seimbang (Sharpe)')}`,
                color: '#10b981',
            });
        }
        if (bestPortfolios.min_variance) {
            markers.push({
                x: Number(bestPortfolios.min_variance.risk),
                y: Number(bestPortfolios.min_variance.return),
                name: `🛡️ ${t('result.marker_min_variance', 'Risiko Rendah (MVP)')}`,
                color: '#06b6d4',
            });
        }
        if (bestPortfolios.max_return) {
            markers.push({
                x: Number(bestPortfolios.max_return.risk),
                y: Number(bestPortfolios.max_return.return),
                name: `🚀 ${t('result.marker_max_return', 'Return Maksimal')}`,
                color: '#f59e0b',
            });
        }
        return markers;
    }, [bestPortfolios, t]);

    // Donut Chart Data
    const donutData = useMemo(() => {
        if (!activePortfolio?.capital_allocation) {
            if (activePortfolio?.weights) {
                return Object.entries(activePortfolio.weights)
                    .map(([ticker, w]) => {
                        const clean = ticker.replace('.JK', '');
                        const weightPct = Number(w) <= 1.0 ? Number(w) * 100 : Number(w);
                        return {
                            ticker: clean,
                            weightPercent: weightPct,
                            nominalAmount: (weightPct / 100) * initialCapital,
                        };
                    })
                    .filter((item) => item.weightPercent > 0.05)
                    .sort((a, b) => b.weightPercent - a.weightPercent);
            }
            return [];
        }

        return Object.entries(activePortfolio.capital_allocation)
            .map(([ticker, alloc]) => ({
                ticker: ticker.replace('.JK', ''),
                weightPercent: alloc.weight_percent,
                nominalAmount: alloc.nominal_idr,
            }))
            .filter((item) => item.weightPercent > 0.05)
            .sort((a, b) => b.weightPercent - a.weightPercent);
    }, [activePortfolio, initialCapital]);

    // Allocation List for Detail Cards
    const allocationList = useMemo(() => {
        let rawAllocMap: Record<string, { weight_percent: number; nominal_idr: number }> = {};
        if (activePortfolio?.capital_allocation && Object.keys(activePortfolio.capital_allocation).length > 0) {
            rawAllocMap = activePortfolio.capital_allocation;
        } else if (activePortfolio?.weights) {
            Object.entries(activePortfolio.weights).forEach(([ticker, rawWeight]) => {
                const clean = ticker.replace('.JK', '');
                const weightVal = Number(rawWeight);
                const weightPercent = weightVal <= 1.0 ? weightVal * 100 : weightVal;
                const nominal =
                    activePortfolio.allocation_idr?.[ticker] ??
                    activePortfolio.allocation_idr?.[clean] ??
                    (weightPercent / 100) * initialCapital;
                rawAllocMap[ticker] = {
                    weight_percent: weightPercent,
                    nominal_idr: nominal,
                };
            });
        }

        return Object.entries(rawAllocMap)
            .map(([rawTicker, alloc], idx) => {
                const cleanTicker = rawTicker.replace('.JK', '');
                const stk = stocks[rawTicker] || stocks[cleanTicker];
                const lastClose = stk?.latest_price ? Number(stk.latest_price.close_price) : 0;
                const lotEstimate =
                    activePortfolio?.lot_estimation?.[rawTicker] ??
                    activePortfolio?.lot_estimation?.[cleanTicker] ??
                    (lastClose > 0 ? Math.floor(alloc.nominal_idr / (lastClose * 100)) : 0);

                return {
                    ticker: cleanTicker,
                    name: stk?.name || cleanTicker,
                    category: stk?.bursa || 'IDX',
                    weight: alloc.weight_percent,
                    nominal: alloc.nominal_idr,
                    lastClose,
                    lot: lotEstimate,
                    color: COLORS[idx % COLORS.length],
                };
            })
            .filter((item) => item.weight > 0.05)
            .sort((a, b) => b.weight - a.weight);
    }, [activePortfolio, stocks, initialCapital]);

    const totalWeight = allocationList.reduce((sum, item) => sum + item.weight, 0);
    const totalNominal = allocationList.reduce((sum, item) => sum + item.nominal, 0);
    const totalLots = allocationList.reduce((sum, item) => sum + item.lot, 0);

    const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;

    return (
        <MobileAppLayout hideBottomNav={isPublic || isShareModalOpen}>
            <Head title={t('result.portfolio_ref', { refCode })} />

            {/* Top Bar Header */}
            <header className="px-4 pt-3 pb-2 flex items-center justify-between select-none">
                <button
                    type="button"
                    onClick={() => {
                        if (typeof window !== 'undefined' && window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = isPublic ? '/' : '/user/analyze/history';
                        }
                    }}
                    className="size-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs active:scale-95 transition-transform cursor-pointer"
                    aria-label={t('common.back', 'Kembali ke halaman sebelumnya')}
                >
                    <ArrowLeft className="size-5 stroke-[2]" />
                </button>

                <div className="text-center flex-1 min-w-0 px-2">
                    <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight text-center flex-1">
                        {t('result.header_title', 'Portofolio')}
                    </h1>
                </div>

                {!isPublic ? (
                    <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        className="size-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label={t('result.share_export', 'Bagikan & Export')}
                        title={t('result.share_export', 'Bagikan & Export')}
                    >
                        <Share2 className="size-4 stroke-[2]" />
                    </button>
                ) : (
                    <Link
                        href="/register"
                        className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs active:scale-95 transition-transform"
                    >
                        {t('nav.register', 'Daftar')}
                    </Link>
                )}
            </header>

            {/* Public View Top Notice Banner */}
            {isPublic && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-2 text-center text-[11px] text-emerald-800 flex items-center justify-center gap-1.5">
                    <Sparkles className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{t('result.public_notice', 'Hasil optimasi portofolio Dinalar AI.')}</span>
                    <Link href="/register" className="font-bold underline text-emerald-700">
                        {t('result.create_your_portfolio', 'Buat Portofolio Anda')}
                    </Link>
                </div>
            )}

            {/* Main Content Body */}
            <div className="space-y-3 pt-1 pb-2">

                {/* 1. Hero Overview Section */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/10 px-3 py-1 text-xs font-semibold text-black ring-1 ring-inset ring-gray-900/20 backdrop-blur-xs">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                            {t('result.badge_title', 'Hasil Optimasi Portofolio')}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight leading-snug">
                            {optimization.title || t('result.default_title', 'Rekomendasi Portofolio Multi-Aset')}
                        </h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            {t('result.hero_desc', { count: optimization.tickers?.length || 0 })}
                        </p>
                    </div>

                    {/* Metadata Grid (2x2 Chips) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 text-xs font-sans">
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                            <span className="text-[10px] text-zinc-400 block font-medium">{t('result.investment_capital', 'Modal Investasi')}</span>
                            <span className="text-[13px] font-bold text-zinc-900 font-mono block mt-0.5">
                                {formatRupiah(initialCapital)}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                            <span className="text-[10px] text-zinc-400 block font-medium">{t('result.risk_free_rate', 'Risk-Free Rate (Rf)')}</span>
                            <span className="text-[13px] font-bold text-emerald-600 font-mono block mt-0.5">
                                {optimization.risk_free_rate}%
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                            <span className="text-[10px] text-zinc-400 block font-medium">{t('result.tickers_label', 'Emiten')}</span>
                            <span className="text-[11px] font-bold text-zinc-900 font-mono block mt-0.5 truncate" title={optimization.tickers?.map((tick) => tick.replace('.JK', '')).join(', ')}>
                                {optimization.tickers?.map((tick) => tick.replace('.JK', '')).join(', ') || '-'}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                            <span className="text-[10px] text-zinc-400 block font-medium">{t('result.data_range', 'Rentang Data')}</span>
                            <span className="text-[11px] font-bold text-zinc-900 font-mono block mt-0.5 truncate" title={optimization.start_date && optimization.end_date ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}` : '-'}>
                                {optimization.start_date && optimization.end_date
                                    ? `${formatDate(optimization.start_date)} - ${formatDate(optimization.end_date)}`
                                    : optimization.start_date
                                        ? t('result.since', { date: formatDate(optimization.start_date) })
                                        : t('result.historical', 'Historis')}
                            </span>
                        </div>
                    </div>
                </section>

                {/* 2. Pilihan 3 Profil Portofolio */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                {t('result.profiles_title', '3 Profil Portofolio')}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {/* 1. Konservatif (Minimum Variance / MVP) */}
                        {bestPortfolios.min_variance && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedProfile('min_variance')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedProfile('min_variance');
                                    }
                                }}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                    selectedProfile === 'min_variance'
                                        ? 'border-cyan-500 bg-cyan-500/5 shadow-xs ring-1 ring-cyan-500/40'
                                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                                        <Shield className="size-3" />
                                        <span>{t('result.profile_min_variance_tag', 'Risiko Rendah (MVP)')}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportPNG('min_variance');
                                            }}
                                            className="size-7 rounded-full bg-zinc-100 hover:bg-cyan-100 text-zinc-500 hover:text-cyan-700 flex items-center justify-center transition-colors"
                                            title={t('result.download_min_variance_img', 'Unduh Gambar Profil Konservatif')}
                                            aria-label={t('result.download_min_variance_img', 'Unduh Gambar Profil Konservatif')}
                                        >
                                            <Download className="size-3" />
                                        </button>
                                        {selectedProfile === 'min_variance' && (
                                            <CheckCircle2 className="size-4 text-cyan-600 shrink-0" />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-1.5">
                                    <h4 className="text-[14px] font-bold text-zinc-900">
                                        {t('result.profile_min_variance_name', 'Konservatif (Minimum Variance)')}
                                    </h4>
                                    <p className="text-[11px] text-zinc-500">
                                        {t('result.profile_min_variance_desc', 'Fokus meminimalkan volatilitas risiko pasar.')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-100 text-center font-mono">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_return', 'Return')}</span>
                                        <span className="text-[13px] font-bold text-emerald-600">
                                            {formatPercent(bestPortfolios.min_variance.return)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_risk', 'Risiko (σ)')}</span>
                                        <span className="text-[13px] font-bold text-cyan-600">
                                            {formatPercent(bestPortfolios.min_variance.risk)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_sharpe', 'Sharpe')}</span>
                                        <span className="text-[13px] font-bold text-zinc-900">
                                            {bestPortfolios.min_variance.sharpe?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Seimbang (Optimal Sharpe) */}
                        {bestPortfolios.sharpe && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedProfile('sharpe')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedProfile('sharpe');
                                    }
                                }}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                    selectedProfile === 'sharpe'
                                        ? 'border-emerald-500 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/40'
                                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <Sparkles className="size-3" />
                                        <span>{t('result.profile_sharpe_tag', 'Seimbang (Rekomendasi Utama)')}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportPNG('sharpe');
                                            }}
                                            className="size-7 rounded-full bg-zinc-100 hover:bg-emerald-100 text-zinc-500 hover:text-emerald-700 flex items-center justify-center transition-colors"
                                            title={t('result.download_sharpe_img', 'Unduh Gambar Profil Seimbang')}
                                            aria-label={t('result.download_sharpe_img', 'Unduh Gambar Profil Seimbang')}
                                        >
                                            <Download className="size-3" />
                                        </button>
                                        {selectedProfile === 'sharpe' && (
                                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-1.5">
                                    <h4 className="text-[14px] font-bold text-zinc-900">
                                        {t('result.profile_sharpe_name', 'Moderat (Optimal Sharpe Ratio)')}
                                    </h4>
                                    <p className="text-[11px] text-zinc-500">
                                        {t('result.profile_sharpe_desc', 'Rasio return-to-risk optimal paling efisien.')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-100 text-center font-mono">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_return', 'Return')}</span>
                                        <span className="text-[13px] font-bold text-emerald-600">
                                            {formatPercent(bestPortfolios.sharpe.return)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_risk', 'Risiko (σ)')}</span>
                                        <span className="text-[13px] font-bold text-zinc-900">
                                            {formatPercent(bestPortfolios.sharpe.risk)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_sharpe', 'Sharpe')}</span>
                                        <span className="text-[13px] font-bold text-emerald-600">
                                            {bestPortfolios.sharpe.sharpe?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Agresif (Max Return) */}
                        {(bestPortfolios.max_return || bestPortfolios.omega) && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedProfile('max_return')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedProfile('max_return');
                                    }
                                }}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                                    selectedProfile === 'max_return'
                                        ? 'border-amber-500 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/40'
                                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                        <Zap className="size-3" />
                                        <span>{t('result.profile_max_return_tag', 'Return Maksimal')}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportPNG('max_return');
                                            }}
                                            className="size-7 rounded-full bg-zinc-100 hover:bg-amber-100 text-zinc-500 hover:text-amber-700 flex items-center justify-center transition-colors"
                                            title={t('result.download_max_return_img', 'Unduh Gambar Profil Agresif')}
                                            aria-label={t('result.download_max_return_img', 'Unduh Gambar Profil Agresif')}
                                        >
                                            <Download className="size-3" />
                                        </button>
                                        {selectedProfile === 'max_return' && (
                                            <CheckCircle2 className="size-4 text-amber-600 shrink-0" />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-1.5">
                                    <h4 className="text-[14px] font-bold text-zinc-900">
                                        {t('result.profile_max_return_name', 'Agresif (Max Expected Return)')}
                                    </h4>
                                    <p className="text-[11px] text-zinc-500">
                                        {t('result.profile_max_return_desc', 'Memaksimalkan proyeksi imbal hasil frontier.')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-100 text-center font-mono">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_return', 'Return')}</span>
                                        <span className="text-[13px] font-bold text-amber-600">
                                            {formatPercent(bestPortfolios.max_return?.return || bestPortfolios.omega?.return)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_risk', 'Risiko (σ)')}</span>
                                        <span className="text-[13px] font-bold text-rose-600">
                                            {formatPercent(bestPortfolios.max_return?.risk || bestPortfolios.omega?.risk)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.metric_sharpe', 'Sharpe')}</span>
                                        <span className="text-[13px] font-bold text-zinc-900">
                                            {(bestPortfolios.max_return?.sharpe || bestPortfolios.omega?.sharpe)?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Visualisasi Grafik Interaktif (Frontier & Donut) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                    {/* Header with Segment Switcher */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2">
                            {activeChartTab === 'donut' ? (
                                <PieIcon className="size-4 text-emerald-600" />
                            ) : (
                                <LineChart className="size-4 text-emerald-600" />
                            )}
                            <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                {t('result.visualization_title', 'Visualisasi')}
                            </h3>
                        </div>

                        {/* Switcher Pills */}
                        <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/80">
                            <button
                                type="button"
                                onClick={() => setActiveChartTab('donut')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    activeChartTab === 'donut'
                                        ? 'bg-white text-emerald-600 shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                {t('result.tab_allocation', 'Alokasi')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveChartTab('frontier')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    activeChartTab === 'frontier'
                                        ? 'bg-white text-emerald-600 shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                {t('result.tab_frontier', 'Frontier')}
                            </button>
                        </div>
                    </div>

                    {/* Notice if custom simulation point is selected */}
                    {clickedPoint && (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs text-purple-900 animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-purple-600 animate-pulse" />
                                <span className="text-[11px] font-medium">
                                    {t('result.custom_simulation_point', {
                                        ret: clickedPoint.y?.toFixed(2),
                                        risk: clickedPoint.x?.toFixed(2),
                                    })}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setClickedPoint(null)}
                                className="text-[11px] font-bold text-purple-700 underline hover:text-purple-900 ml-2"
                            >
                                {t('common.reset', 'Reset')}
                            </button>
                        </div>
                    )}

                    {/* TAB 1: EFFICIENT FRONTIER SCATTER */}
                    {activeChartTab === 'frontier' && (
                        <div className="space-y-2">
                            <p className="text-[11px] text-zinc-500">
                                {t('result.frontier_curve_desc', 'Kurva Pareto Efficient Frontier')}
                            </p>

                            <div className="h-64 w-full select-none -ml-2 min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <ScatterChart
                                        margin={{ top: 15, right: 15, bottom: 20, left: 0 }}
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
                                            name={t('result.risk_axis', 'Risiko (σ)')}
                                            unit="%"
                                            tick={{ fontSize: 9, fill: '#71717a' }}
                                            label={{
                                                value: t('result.risk_axis_label', 'Risiko Volatilitas (σ %)'),
                                                position: 'insideBottom',
                                                offset: -12,
                                                fontSize: 10,
                                                fill: '#a1a1aa',
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            name={t('result.return_axis', 'Return E(R)')}
                                            unit="%"
                                            tick={{ fontSize: 9, fill: '#71717a' }}
                                            label={{
                                                value: t('result.return_axis_label', 'Return E(R) %'),
                                                angle: -90,
                                                position: 'insideLeft',
                                                fontSize: 10,
                                                fill: '#a1a1aa',
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <ZAxis range={[30, 90]} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length > 0) {
                                                    const data = payload[0].payload;
                                                    let top3: { ticker: string; weight: number }[] = [];
                                                    if (data.weights) {
                                                        top3 = Object.entries(data.weights)
                                                            .map(([tk, w]) => ({
                                                                ticker: tk.replace('.JK', ''),
                                                                weight: Number(w as number) <= 1.0 ? Number(w as number) * 100 : Number(w as number),
                                                            }))
                                                            .sort((a, b) => b.weight - a.weight)
                                                            .slice(0, 3);
                                                    }

                                                    return (
                                                        <div className="rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1 font-sans min-w-[160px] z-50">
                                                            <div className="font-bold text-zinc-900 flex items-center gap-1.5 pb-0.5 border-b border-zinc-100 text-[11px]">
                                                                <span className="size-2 rounded-full bg-emerald-600" />
                                                                <span>{data.name || t('result.simulation_label', 'Simulasi')}</span>
                                                            </div>
                                                            <div className="font-mono text-[10px] text-zinc-600 pt-0.5">
                                                                {t('result.metric_return', 'Return')}: <strong className="text-emerald-600">+{data.y?.toFixed(2)}%</strong>
                                                            </div>
                                                            <div className="font-mono text-[10px] text-zinc-600">
                                                                {t('result.metric_risk', 'Risiko')}: <strong>{data.x?.toFixed(2)}%</strong>
                                                            </div>
                                                            {data.sharpe !== undefined && (
                                                                <div className="font-mono text-[10px] text-zinc-600">
                                                                    {t('result.metric_sharpe', 'Sharpe')}: <strong>{data.sharpe?.toFixed(2)}</strong>
                                                                </div>
                                                            )}
                                                            {top3.length > 0 && (
                                                                <div className="pt-1 border-t border-zinc-100">
                                                                    <div className="text-[9px] text-zinc-400 font-semibold">{t('result.top_3_weights', 'Top 3 Bobot:')}</div>
                                                                    {top3.map((topItem, i) => (
                                                                        <div key={i} className="flex justify-between font-mono text-[9px]">
                                                                            <span className="text-zinc-800 font-bold">{topItem.ticker}</span>
                                                                            <span className="text-emerald-600 font-semibold">{topItem.weight.toFixed(1)}%</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
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
                                                    stroke="#a1a1aa"
                                                    strokeDasharray="3 3"
                                                />
                                                <ReferenceLine
                                                    y={hoveredPoint.y}
                                                    stroke="#a1a1aa"
                                                    strokeDasharray="3 3"
                                                />
                                            </>
                                        )}

                                        {/* NSGA-II Samples */}
                                        <Scatter
                                            name="NSGA-II"
                                            data={nsgaPoints}
                                            fill="#a855f7"
                                            shape={(props: any) => {
                                                const { cx, cy, fill, payload } = props;
                                                const isActive = clickedPoint && clickedPoint.x === payload.x && clickedPoint.y === payload.y;
                                                return isActive ? (
                                                    <circle cx={cx} cy={cy} r={6} fill="#a855f7" stroke="#fff" strokeWidth={2} />
                                                ) : (
                                                    <circle cx={cx} cy={cy} r={2.5} fill={fill} opacity={0.45} />
                                                );
                                            }}
                                        />

                                        {/* Markowitz Frontier */}
                                        <Scatter
                                            name="Markowitz"
                                            data={frontierPoints}
                                            fill="#10b981"
                                            line={{ stroke: '#10b981', strokeWidth: 2 }}
                                            shape={(props: any) => {
                                                const { cx, cy, fill, payload } = props;
                                                const isActive = clickedPoint && clickedPoint.x === payload.x && clickedPoint.y === payload.y;
                                                return isActive ? (
                                                    <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
                                                ) : (
                                                    <circle cx={cx} cy={cy} r={3} fill={fill} />
                                                );
                                            }}
                                        />

                                        {/* Individual Stocks */}
                                        <Scatter
                                            name={t('result.single_stock', 'Saham Tunggal')}
                                            data={assetPoints}
                                            fill="#94a3b8"
                                            shape="triangle"
                                        />

                                        {/* Best Key Recommendation Markers */}
                                        <Scatter
                                            name={t('result.recommended_profile', 'Profil Rekomendasi')}
                                            data={keyMarkers}
                                            fill="#e11d48"
                                            shape="cross"
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-3 flex-wrap text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-100">
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    <span>{t('result.frontier_markowitz', 'Frontier (Markowitz)')}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-purple-500 opacity-60" />
                                    <span>{t('result.nsga_pareto', 'NSGA-II Pareto')}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DONUT ALLOCATION CHART */}
                    {activeChartTab === 'donut' && (
                        <div className="space-y-3">
                            <p className="text-[11px] text-zinc-500">
                                {t('result.donut_desc', { profile: getProfileLabel(selectedProfile) })}
                            </p>

                            <div className="h-44 w-full select-none min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={68}
                                            paddingAngle={3}
                                            dataKey="weightPercent"
                                        >
                                            {donutData.map((entry, index) => (
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
                                                        <div className="rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg text-xs font-sans space-y-0.5">
                                                            <div className="font-bold text-zinc-900 font-mono text-[12px]">
                                                                {d.ticker}
                                                            </div>
                                                            <div className="font-mono text-emerald-600 font-bold text-[11px]">
                                                                {t('result.weight_label', 'Bobot:')} {d.weightPercent?.toFixed(2)}%
                                                            </div>
                                                            <div className="font-mono text-zinc-500 text-[10px]">
                                                                {t('result.nominal_label', 'Nominal:')} {formatRupiah(d.nominalAmount)}
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

                            {/* Top 3 Legend Row */}
                            <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                                {donutData.slice(0, 4).map((item, idx) => (
                                    <div
                                        key={item.ticker}
                                        className="flex items-center justify-between text-xs font-mono"
                                    >
                                        <span className="flex items-center gap-1.5 min-w-0">
                                            <span
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                            <span className="font-bold text-zinc-900 truncate">{item.ticker}</span>
                                        </span>
                                        <span className="font-bold text-emerald-600 shrink-0 ml-2">
                                            {item.weightPercent?.toFixed(2)}% ({formatRupiah(item.nominalAmount)})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* 4. Detail Alokasi Saham & Estimasi Lot */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2">
                            <Layers className="size-4 text-emerald-600" />
                            <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                {t('result.allocation_details_title', 'Detail Alokasi Portofolio')}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {allocationList.map((alloc) => (
                            <div
                                key={alloc.ticker}
                                className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2 select-none"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="size-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: alloc.color }}
                                        />
                                        <span className="font-mono font-bold text-sm text-zinc-900">
                                            {alloc.ticker}
                                        </span>
                                        <span
                                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${
                                                alloc.category === 'NASDAQ'
                                                    ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                    : 'border-blue-200 bg-blue-50 text-blue-700'
                                            }`}
                                        >
                                            {alloc.category}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-600 text-sm">
                                        {alloc.weight.toFixed(2)}%
                                    </span>
                                </div>

                                <p className="text-[11px] text-zinc-500 truncate -mt-1.5">
                                    {alloc.name}
                                </p>

                                {/* Nominal and Lot Row */}
                                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-zinc-200/60 font-mono text-xs">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.nominal_funds', 'Nominal Dana')}</span>
                                        <span className="font-bold text-zinc-900">
                                            {formatRupiah(alloc.nominal)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-zinc-400 block font-sans">{t('result.estimated_purchase', 'Estimasi Pembelian')}</span>
                                        <span className="font-bold text-emerald-600 font-mono">
                                            {alloc.lot > 0 ? `${alloc.lot.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} ${t('result.lot_unit', 'Lot')}` : '-'}
                                        </span>
                                        {alloc.lastClose > 0 && (
                                            <span className="text-[9px] text-zinc-400 block">
                                                (@ {language === 'en' ? 'IDR' : 'Rp'} {alloc.lastClose.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Summary Footer Card */}
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono space-y-1 mt-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-sans font-semibold text-emerald-800">{t('result.total_capital_allocation', 'Total Alokasi Modal:')}</span>
                            <span className="font-bold text-emerald-900">
                                {formatRupiah(totalNominal)} ({totalWeight.toFixed(2)}%)
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                            <span className="font-sans font-semibold text-emerald-800">{t('result.total_estimated_lots', 'Total Estimasi Lot:')}</span>
                            <span className="font-bold text-emerald-900">
                                {totalLots > 0 ? `${totalLots.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} ${t('result.lot_unit', 'Lot')}` : '-'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* 5. Distribusi 5-Points Quantile Model (jika ada) */}
                {optimization.quantile_analysis && (
                    <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="size-4 text-emerald-600" />
                                <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                                    {t('result.quantile_title', '5-Points Quantile Model')}
                                </h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-1 px-1">
                            <table className="w-full text-left text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-zinc-200 text-[10px] text-zinc-400 font-sans">
                                        <th className="py-2 text-left">{t('result.metric_col', 'Metrik')}</th>
                                        <th className="py-2 text-right">Min</th>
                                        <th className="py-2 text-right">Q1</th>
                                        <th className="py-2 text-right font-bold text-emerald-600">Med</th>
                                        <th className="py-2 text-right">Q3</th>
                                        <th className="py-2 text-right font-bold text-emerald-600">Max</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 text-[11px]">
                                    {optimization.quantile_analysis.sharpe && (
                                        <tr>
                                            <td className="py-2 font-sans font-semibold text-zinc-900">Sharpe</td>
                                            {['Min', 'Q1', 'Median', 'Q3', 'Max'].map((lbl) => (
                                                <td
                                                    key={lbl}
                                                    className={`py-2 text-right ${
                                                        lbl === 'Median' || lbl === 'Max' ? 'font-bold text-emerald-600' : 'text-zinc-600'
                                                    }`}
                                                >
                                                    {optimization.quantile_analysis!.sharpe!.find((q) => q.label === lbl)?.target_value?.toFixed(2) || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                    {optimization.quantile_analysis.sortino && (
                                        <tr>
                                            <td className="py-2 font-sans font-semibold text-zinc-900">Sortino</td>
                                            {['Min', 'Q1', 'Median', 'Q3', 'Max'].map((lbl) => (
                                                <td
                                                    key={lbl}
                                                    className={`py-2 text-right ${
                                                        lbl === 'Median' || lbl === 'Max' ? 'font-bold text-emerald-600' : 'text-zinc-600'
                                                    }`}
                                                >
                                                    {optimization.quantile_analysis!.sortino!.find((q) => q.label === lbl)?.target_value?.toFixed(2) || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                    {optimization.quantile_analysis.omega && (
                                        <tr>
                                            <td className="py-2 font-sans font-semibold text-zinc-900">Omega</td>
                                            {['Min', 'Q1', 'Median', 'Q3', 'Max'].map((lbl) => (
                                                <td
                                                    key={lbl}
                                                    className={`py-2 text-right ${
                                                        lbl === 'Median' || lbl === 'Max' ? 'font-bold text-emerald-600' : 'text-zinc-600'
                                                    }`}
                                                >
                                                    {optimization.quantile_analysis!.omega!.find((q) => q.label === lbl)?.target_value?.toFixed(2) || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* 6. Riwayat Switcher (jika ada history > 1) */}
                {!isPublic && history.length > 1 && (
                    <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-zinc-900">
                                {t('result.recent_history_title', 'Riwayat Analisis Terbaru')}
                            </span>
                            <Link
                                href="/user/analyze/history"
                                className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5"
                            >
                                <ChevronRight className="size-3" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                            {history.slice(0, 5).map((h) => (
                                <Link
                                    key={h.id}
                                    href={`/user/analyze/result/${h.id}`}
                                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all border active:scale-95 ${
                                        h.id === optimization.id
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                                    }`}
                                >
                                    {h.reference_code || `DNL-${h.id}`}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Bottom Export & Share Action Sheet Modal */}
            {isShareModalOpen && (
                <div
                    ref={shareOverlayRef}
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200 select-none"
                    onClick={() => !isExporting && !isGeneratingShare && setIsShareModalOpen(false)}
                >
                    <div
                        ref={shareSheetRef}
                        className="w-full max-w-[430px] rounded-t-[32px] bg-white p-5 pt-3 border-t border-zinc-200 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-5 duration-200 max-h-[88vh] flex flex-col will-change-transform"
                        style={{
                            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle Indicator */}
                        <div
                            data-drag-handle="true"
                            onMouseDown={handleShareMouseDown}
                            className="w-full pt-1 pb-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
                            title={t('analysis.drag_to_close', 'Geser ke bawah untuk menutup')}
                        >
                            <div className="w-10 h-1.5 bg-zinc-300 rounded-full transition-transform active:scale-105" />
                        </div>

                        {/* Header Modal */}
                        <div
                            data-drag-header="true"
                            onMouseDown={handleShareMouseDown}
                            className="flex items-center justify-between border-b border-zinc-100 py-2.5 shrink-0 cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="flex items-center gap-2">
                                <Share2 className="size-4 text-emerald-600" />
                                <h3 className="text-sm font-bold text-zinc-900">
                                    {t('result.share_modal_title', 'Export & Bagikan Portofolio')}
                                </h3>
                            </div>
                        </div>

                        {/* List Opsi Export (Scrollable & Fully Clear of Bottom Nav & Pull-to-Close) */}
                        <div
                            data-scroll-body="true"
                            ref={shareScrollBodyRef}
                            className="space-y-2 overflow-y-auto pr-0.5 no-scrollbar flex-1 pb-1"
                        >
                            {/* 1. Simpan Gambar PNG */}
                            <button
                                type="button"
                                disabled={isExporting || isGeneratingShare}
                                onClick={() => handleExportPNG()}
                                className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200 hover:border-emerald-300 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                                <div className="size-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <ImageIcon className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-zinc-900 block">
                                        {t('result.opt_save_image', 'Simpan Gambar (PNG)')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block truncate">
                                        {t('result.opt_save_image_desc', 'Kartu profil terpilih dengan visual HD')}
                                    </span>
                                </div>
                            </button>

                            {/* 3. Unduh Laporan PDF */}
                            <button
                                type="button"
                                disabled={isExporting || isGeneratingShare}
                                onClick={() => handleExportPDF()}
                                className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200 hover:border-emerald-300 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                                <div className="size-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-zinc-900 block">
                                        {t('result.opt_download_pdf', 'Unduh Laporan (PDF)')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block truncate">
                                        {t('result.opt_download_pdf_desc', 'Laporan komprehensif Markowitz & NSGA-II')}
                                    </span>
                                </div>
                            </button>

                            {/* 4. Bandingkan 3 Profil Sekaligus */}
                            <button
                                type="button"
                                disabled={isExporting || isGeneratingShare}
                                onClick={() => handleExportCompare()}
                                className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200 hover:border-emerald-300 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                                <div className="size-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Layers className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-zinc-900 block">
                                        {t('result.opt_compare_profiles', 'Bandingkan 3 Profil (PNG)')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block truncate">
                                        {t('result.opt_compare_profiles_desc', 'Komparasi Konservatif, Moderat & Agresif')}
                                    </span>
                                </div>
                            </button>

                            {/* 5. Bagikan Link Publik */}
                            <button
                                type="button"
                                disabled={isExporting || isGeneratingShare}
                                onClick={() => handleGeneratePublicLink()}
                                className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200 hover:border-emerald-300 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                                <div className="size-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    {isGeneratingShare ? (
                                        <Loader2 className="size-4.5 animate-spin" />
                                    ) : (
                                        <Share2 className="size-4.5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-emerald-600 block">
                                        {t('result.opt_copy_public_link', 'Salin Tautan Publik')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block truncate">
                                        {t('result.opt_copy_public_link_desc', 'Bisa dilihat siapa saja tanpa login')}
                                    </span>
                                </div>
                            </button>

                            {/* 6. Kirim Ringkasan WhatsApp */}
                            <button
                                type="button"
                                disabled={isExporting || isGeneratingShare}
                                onClick={() => handleShareWhatsAppText()}
                                className="w-full p-3 rounded-2xl bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200 hover:border-emerald-300 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98]"
                            >
                                <div className="size-9.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <MessageCircle className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-zinc-900 block">
                                        {t('result.opt_share_whatsapp', 'Kirim Ringkasan ke WhatsApp')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block truncate">
                                        {t('result.opt_share_whatsapp_desc', 'Pesan terformat lengkap dengan estimasi lot')}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Off-Screen Hidden Elements for html-to-image capture */}
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
                    profile={activePortfolio as any}
                    profileType={selectedProfile}
                    optimization={optimization as any}
                    stocks={stocks}
                    language={language}
                />

                {/* Kartu Komparasi 3 Profil Sekaligus */}
                <div style={{ marginTop: '40px' }}>
                    <PortfolioCompareShareCard
                        ref={compareCardRef}
                        optimization={optimization as any}
                        stocks={stocks}
                        language={language}
                    />
                </div>
            </div>
        </MobileAppLayout>
    );
}
