import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useState } from 'react';
import { toast } from 'sonner';

export interface ExportResult {
    dataUrl: string;
    blob: Blob;
    file: File;
}

export function useExportShare() {
    const [isExporting, setIsExporting] = useState<boolean>(false);

    /**
     * Capture an HTML element node to a high-resolution PNG data URL
     */
    const captureNode = async (node: HTMLElement): Promise<string> => {
        return await toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            skipAutoScale: true,
        });
    };

    /**
     * Export an element as a PNG image and download / return file
     */
    const exportAsImage = async (
        node: HTMLElement,
        filename: string,
        autoDownload = true
    ): Promise<ExportResult> => {
        setIsExporting(true);
        try {
            const dataUrl = await captureNode(node);
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], filename, { type: 'image/png' });

            if (autoDownload) {
                saveAs(blob, filename);
                toast.success(`Gambar berhasil diunduh (${filename})`);
            }

            return { dataUrl, blob, file };
        } catch (error) {
            console.error('Failed to export as image:', error);
            toast.error('Gagal mengunduh gambar. Silakan coba lagi.');
            throw error;
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Export an element as a PDF document
     */
    const exportAsPDF = async (
        node: HTMLElement,
        filename: string,
        title = 'Laporan Rekomendasi Portofolio'
    ): Promise<void> => {
        setIsExporting(true);
        try {
            const dataUrl = await captureNode(node);
            const width = node.offsetWidth || 800;
            const height = node.offsetHeight || 1000;
            const isLandscape = width > height;

            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height],
            });

            pdf.setProperties({
                title,
                subject: 'Rekomendasi Portofolio Saham Kuantitatif',
                author: 'Dinalar Quantitative AI',
                keywords: 'portfolio, stock, optimization, nsga-ii, sharpe',
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');
            pdf.save(filename);
            toast.success(`Laporan PDF berhasil diunduh (${filename})`);
        } catch (error) {
            console.error('Failed to export as PDF:', error);
            toast.error('Gagal membuat dokumen PDF. Silakan coba lagi.');
            throw error;
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Share a generated file using Web Share API (native sheet for mobile / supported desktop)
     * Fallback to manual download + WhatsApp link if Web Share API is unsupported.
     */
    const sharePortfolio = async (
        node: HTMLElement,
        filename: string,
        title: string,
        shareText: string
    ): Promise<boolean> => {
        setIsExporting(true);
        try {
            const dataUrl = await captureNode(node);
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], filename, { type: 'image/png' });

            // Check if Web Share API supports file sharing
            if (
                typeof navigator !== 'undefined' &&
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {
                try {
                    await navigator.share({
                        files: [file],
                        title,
                        text: shareText,
                    });
                    toast.success('Berhasil membagikan portofolio!');
                    return true;
                } catch (shareErr: any) {
                    if (shareErr.name === 'AbortError') {
                        // User cancelled the share dialog
                        return false;
                    }
                    console.warn('Navigator share error, falling back to download:', shareErr);
                }
            }

            // Fallback for Desktop / browsers without file Web Share: download file + notify
            saveAs(blob, filename);
            toast.success(
                'Gambar portofolio telah diunduh. Anda dapat melampirkannya langsung ke WhatsApp / Instagram.'
            );
            return false;
        } catch (error) {
            console.error('Failed to share portfolio:', error);
            toast.error('Gagal menyiapkan gambar untuk dibagikan.');
            return false;
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Quick WhatsApp text shortcut fallback
     */
    const shareToWhatsAppText = (text: string) => {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return {
        isExporting,
        exportAsImage,
        exportAsPDF,
        sharePortfolio,
        shareToWhatsAppText,
    };
}

/**
 * Safely copy text to clipboard with legacy fallback for non-HTTPS / Laragon dev environments
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Try modern navigator.clipboard (available in secure contexts / localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('navigator.clipboard.writeText failed, attempting legacy fallback:', err);
        }
    }

    // 2. Fallback using temporary textarea + document.execCommand('copy')
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        const container = document.querySelector('[role="dialog"]') || document.body;
        container.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, 99999);

        const successful = document.execCommand('copy');
        container.removeChild(textarea);

        if (successful) {
            return true;
        }
    } catch (fallbackErr) {
        console.error('Fallback execCommand copy failed:', fallbackErr);
    }

    // 3. Fallback prompt if all else fails
    try {
        window.prompt('Salin link berikut secara manual (Ctrl+C / Cmd+C):', text);
        return true;
    } catch {
        return false;
    }
}

