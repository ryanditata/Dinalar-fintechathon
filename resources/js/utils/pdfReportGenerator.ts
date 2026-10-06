import { type Stock } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type BestPortfolioItem, type PortfolioOptimizationRecord } from '@/components/PortfolioShareCard';

export interface PDFReportOptions {
    optimization: PortfolioOptimizationRecord;
    activePortfolio: BestPortfolioItem;
    selectedProfile: 'min_variance' | 'sharpe' | 'max_return' | 'sortino';
    profileLabel: string;
    stocks?: Record<string, Stock>;
}

const PALETTE_HEX = [
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

// Helper Convert Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

// Helper Format Rupiah
const formatIdr = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return 'Rp 0';
    return `Rp ${Math.round(Number(val)).toLocaleString('id-ID')}`;
};

// Helper Format Date
const formatDateStr = (dateStr?: string | null): string => {
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

// Helper Load Image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
};

// Helper Generate High-Res Vector Pie/Donut Chart Data URL
function generatePieChartDataUrl(
    items: Array<{ ticker: string; weight: number; color: string }>,
    size = 400
): string {
    if (typeof document === 'undefined') return '';
    try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.44;
        const innerRadius = size * 0.26;

        const total = items.reduce((sum, i) => sum + i.weight, 0) || 100;
        let startAngle = -Math.PI / 2;

        items.forEach((item) => {
            const sliceAngle = (item.weight / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // White Divider line between slices
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            startAngle = endAngle;
        });

        // Center text in donut
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('100%', cx, cy - 8);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
        ctx.fillText('ALOKASI', cx, cy + 18);

        return canvas.toDataURL('image/png');
    } catch {
        return '';
    }
}

/**
 * Generate a professional, vector-text informative PDF Report for Portfolio Optimization
 */
export async function generatePortfolioPDFReport({
    optimization,
    activePortfolio,
    selectedProfile,
    profileLabel,
    stocks = {},
}: PDFReportOptions): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
    const margin = 40;
    const contentWidth = pageWidth - margin * 2; // 515.28 pt
    let currentY = 36;

    const initialCapital = Number(optimization.initial_capital || 0);
    const refCode = optimization.reference_code || `DNL${optimization.user_id}-${optimization.id}`;

    // ==========================================
    // 1. TOP HEADER & BRANDING BAR
    // ==========================================
    try {
        const logoImg = await loadImage('/images/newLogo.png?v=3');
        const logoHeight = 36;
        const logoWidth = logoImg.height > 0 ? (logoImg.width / logoImg.height) * logoHeight : 36;
        doc.addImage(logoImg, 'PNG', margin, currentY - 2, logoWidth, logoHeight);
    } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(5, 150, 105);
        doc.text('DINALAR', margin, currentY + 18);
    }

    // Document Type Label (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // #059669
    doc.text('LAPORAN HASIL OPTIMASI PORTOFOLIO', pageWidth - margin, currentY + 12, { align: 'right' });

    // Reference & Date (Right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ref: ${refCode} | Tanggal: ${formatDateStr(optimization.created_at)}`, pageWidth - margin, currentY + 26, { align: 'right' });

    currentY += 44;

    // Divider Line
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 16;

    // ==========================================
    // 2. RINGKASAN INFORMASI & PARAMETER (BOX)
    // ==========================================
    const boxHeight = 72;
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 6, 6, 'FD');

    // Kolom Kiri
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text('JUDUL PORTOFOLIO', margin + 14, currentY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const titleText = (optimization.title || 'Portofolio Multi-Aset').length > 34
        ? `${(optimization.title || 'Portofolio Multi-Aset').substring(0, 34)}...`
        : (optimization.title || 'Portofolio Multi-Aset');
    doc.text(titleText, margin + 14, currentY + 33);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Profil:', margin + 14, currentY + 52);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(profileLabel, margin + 42, currentY + 52);

    // Kolom Kanan (Parameter Finansial dengan Right Alignment rapi di dalam card)
    const col2X = margin + 250;
    const rightMarginX = margin + contentWidth - 14;

    // Row 1: Modal Investasi
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Modal Investasi:', col2X, currentY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIdr(initialCapital), rightMarginX, currentY + 18, { align: 'right' });

    // Row 2: Risk-Free Rate
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Risk-Free Rate:', col2X, currentY + 34);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${optimization.risk_free_rate}%`, rightMarginX, currentY + 34, { align: 'right' });

    // Row 3: Rentang Waktu
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Rentang Waktu:', col2X, currentY + 50);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const dateRange = optimization.start_date && optimization.end_date
        ? `${formatDateStr(optimization.start_date)} - ${formatDateStr(optimization.end_date)}`
        : formatDateStr(optimization.created_at);
    doc.text(dateRange, rightMarginX, currentY + 50, { align: 'right' });

    currentY += boxHeight + 14;

    // ==========================================
    // 3. KEY PERFORMANCE METRICS (3 CARDS)
    // ==========================================
    const cardGap = 10;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const cardHeight = 52;

    const returnPercent = activePortfolio?.return !== undefined ? Number(activePortfolio.return).toFixed(2) : '0.00';
    const riskPercent = activePortfolio?.risk !== undefined ? Number(activePortfolio.risk).toFixed(2) : '0.00';
    const sharpeRatio = activePortfolio?.sharpe !== undefined ? Number(activePortfolio.sharpe).toFixed(2) : '0.00';

    // Card 1: Expected Return
    doc.setFillColor(240, 253, 244); // light emerald #f0fdf4
    doc.setDrawColor(187, 247, 208); // #bbf7d0
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('EXPECTED RETURN (TAHUNAN)', margin + 10, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(5, 150, 105);
    doc.text(`+${returnPercent}%`, margin + 10, currentY + 38);

    // Card 2: Risk Volatility
    const card2X = margin + cardWidth + cardGap;
    doc.setFillColor(240, 249, 255); // light cyan #f0f9ff
    doc.setDrawColor(186, 230, 253); // #bae6fd
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(7, 89, 133);
    doc.text('VOLATILITAS RISIKO', card2X + 10, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(2, 132, 199);
    doc.text(`${riskPercent}%`, card2X + 10, currentY + 38);

    // Card 3: Sharpe Ratio
    const card3X = margin + (cardWidth + cardGap) * 2;
    doc.setFillColor(248, 250, 252); // light slate #f8fafc
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SHARPE RATIO', card3X + 10, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(sharpeRatio, card3X + 10, currentY + 38);

    currentY += cardHeight + 14;

    // ==========================================
    // EKSTRAKSI DATA ALOKASI PORTOFOLIO
    // ==========================================
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

    const allocationsList = Object.entries(rawAllocMap)
        .map(([rawTicker, alloc]) => {
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
                weight: Number(alloc.weight_percent.toFixed(2)),
                nominal: Math.round(alloc.nominal_idr),
                lastClose,
                lot: lotEstimate,
            };
        })
        .filter((item) => item.weight > 0.05)
        .sort((a, b) => b.weight - a.weight);

    const totalWeight = allocationsList.reduce((sum, item) => sum + item.weight, 0);
    const totalNominal = allocationsList.reduce((sum, item) => sum + item.nominal, 0);
    const totalLots = allocationsList.reduce((sum, item) => sum + item.lot, 0);

    // ==========================================
    // 4. DIAGRAM KOMPOSISI ALOKASI (PIE / DONUT CARD)
    // ==========================================
    const pieCardHeight = 84;
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, pieCardHeight, 6, 6, 'FD');

    // Generate Pie Chart Image Data
    const pieItems = allocationsList.map((a, idx) => ({
        ticker: a.ticker,
        weight: a.weight,
        color: PALETTE_HEX[idx % PALETTE_HEX.length],
    }));
    const pieDataUrl = generatePieChartDataUrl(pieItems, 400);

    if (pieDataUrl) {
        const pieSize = 72;
        doc.addImage(pieDataUrl, 'PNG', margin + 12, currentY + 6, pieSize, pieSize);
    }

    // Header teks di sisi kanan chart
    const legendStartX = margin + 96;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Komposisi Bobot Aset Portofolio', legendStartX, currentY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Distribusi persentase modal yang dialokasikan ke masing-masing emiten saham terpilih:', legendStartX, currentY + 30);

    // Badges / Legend Grid
    let badgeX = legendStartX;
    let badgeY = currentY + 46;
    const maxBadges = Math.min(allocationsList.length, 6);

    for (let i = 0; i < maxBadges; i++) {
        const item = allocationsList[i];
        const itemColor = PALETTE_HEX[i % PALETTE_HEX.length];

        if (i === 3) {
            badgeX = legendStartX;
            badgeY += 16;
        }

        const rgb = hexToRgb(itemColor);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.circle(badgeX + 3, badgeY - 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(item.ticker, badgeX + 9, badgeY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text(`(${item.weight.toFixed(1)}%)`, badgeX + 9 + doc.getTextWidth(item.ticker) + 3, badgeY);

        badgeX += doc.getTextWidth(item.ticker) + doc.getTextWidth(`(${item.weight.toFixed(1)}%)`) + 18;
    }

    currentY += pieCardHeight + 14;

    // ==========================================
    // 5. TABEL RINCIAN ALOKASI ASET & ESTIMASI ORDER
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Rincian Alokasi Dana & Estimasi Pembelian Saham', margin, currentY);
    currentY += 8;

    const tableBody = allocationsList.map((item, idx) => [
        String(idx + 1),
        item.ticker,
        item.name,
        item.category,
        `${item.weight.toFixed(2)}%`,
        formatIdr(item.nominal),
        item.lastClose > 0 ? formatIdr(item.lastClose) : '-',
        item.lot > 0 ? `${item.lot.toLocaleString('id-ID')} Lot` : '-',
    ]);

    // Tambahkan baris total
    const tableFoot = [
        [
            '',
            'Total',
            'Portofolio Optimal',
            '-',
            `${totalWeight.toFixed(2)}%`,
            formatIdr(totalNominal),
            '-',
            totalLots > 0 ? `${totalLots.toLocaleString('id-ID')} Lot` : '-',
        ],
    ];

    autoTable(doc, {
        startY: currentY,
        head: [['No', 'Kode', 'Nama Emiten', 'Bursa', 'Bobot (%)', 'Nominal (IDR)', 'Harga Terakhir', 'Estimasi']],
        body: tableBody,
        foot: tableFoot,
        theme: 'grid',
        margin: { left: margin, right: margin },
        headStyles: {
            fillColor: [15, 23, 42], // #0f172a
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'left',
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [51, 65, 85],
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontSize: 8.5,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 24 },
            1: { fontStyle: 'bold', cellWidth: 46 },
            2: { cellWidth: 150 },
            3: { halign: 'center', cellWidth: 40 },
            4: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 55 },
            5: { halign: 'right', fontStyle: 'bold', cellWidth: 70 },
            6: { halign: 'right', cellWidth: 65 },
            7: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 65 },
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 120;
    currentY = finalY + 14;

    // ==========================================
    // 6. TABEL KOMPARASI 3 PROFIL RISIKO
    // ==========================================
    if (currentY + 100 < doc.internal.pageSize.getHeight() - 50) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('Perbandingan Opsi Profil Frontier Lainnya', margin, currentY);
        currentY += 8;

        const best = optimization.best_portfolios || {};
        const compareProfiles = [
            {
                name: 'Konservatif (Minimum Variance)',
                data: best.min_variance,
                note: 'Minimalkan volatilitas risiko pasar',
            },
            {
                name: 'Moderat (Optimal Sharpe Ratio)',
                data: best.sharpe,
                note: 'Rasio return-to-risk paling efisien (Utama)',
            },
            {
                name: 'Agresif (Max Return)',
                data: best.max_return || best.omega,
                note: 'Maksimalkan proyeksi imbal hasil frontier',
            },
        ];

        const compareBody = compareProfiles.map((p) => [
            p.name,
            p.data?.return !== undefined ? `+${Number(p.data.return).toFixed(2)}%` : '-',
            p.data?.risk !== undefined ? `${Number(p.data.risk).toFixed(2)}%` : '-',
            p.data?.sharpe !== undefined ? Number(p.data.sharpe).toFixed(2) : '-',
            p.note,
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Profil Portofolio', 'Expected Return', 'Risiko (%)', 'Sharpe', 'Karakteristik Strategi']],
            body: compareBody,
            theme: 'striped',
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [51, 65, 85], // #334155
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [51, 65, 85],
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 140 },
                1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 70 },
                2: { halign: 'right', cellWidth: 60 },
                3: { halign: 'right', fontStyle: 'bold', cellWidth: 50 },
                4: { cellWidth: 195 },
            },
        });
    }

    // ==========================================
    // 7. FOOTER
    // ==========================================
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 38;

    // Divider Line
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(1);
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('dinalar.my.id', pageWidth - margin, footerY + 8, { align: 'right' });

    // Save File
    const filename = `Laporan-Portofolio-${selectedProfile}-${refCode}.pdf`;
    doc.save(filename);
}
