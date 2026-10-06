import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import masterStockList from '@/data/tickerSaham.json';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownAZ,
    ArrowRight,
    ArrowUpAZ,
    Check,
    CheckCircle2,
    CloudDownload,
    DownloadCloud,
    Loader2,
    Search,
    ShieldAlert,
    Trash,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Data Saham', href: '/admin/saham' },
    { title: 'Scraping Data', href: '/admin/scraper' },
];

const SECTORS = [
    'Technology',
    'Financial Services',
    'Industrials',
    'Consumer Cyclical',
    'Communication Services',
    'Healthcare',
    'Energy',
    'Consumer Defensive',
    'Basic Materials',
    'Real Estate',
    'Utilities',
];

interface Props {
    defaultStartDate: string;
    defaultEndDate: string;
}

export default function StockScraperPage({ defaultStartDate, defaultEndDate }: Props) {
    const [selectedBursa, setSelectedBursa] = useState<string>('all');
    const [selectedSector, setSelectedSector] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>(defaultStartDate || '');
    const [endDate, setEndDate] = useState<string>(defaultEndDate || '');
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isScraping, setIsScraping] = useState<boolean>(false);

    // Filter & sort available stocks directly from tickerSaham.json
    const filteredAvailableStocks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        const filtered = masterStockList.filter((item) => {
            if (!query) return true;
            return (
                item.ticker.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query)
            );
        });

        return [...filtered].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.ticker.localeCompare(b.ticker);
            } else {
                return b.ticker.localeCompare(a.ticker);
            }
        });
    }, [searchQuery, sortOrder]);

    const handleToggleTicker = (ticker: string) => {
        setSelectedTickers((prev) =>
            prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
        );
    };

    const handleSelectAllFiltered = () => {
        const tickersToAdd = filteredAvailableStocks.slice(0, 50).map((s) => s.ticker);
        setSelectedTickers((prev) => Array.from(new Set([...prev, ...tickersToAdd])));
        toast.info(`Menambahkan ${tickersToAdd.length} saham ke daftar pilihan.`);
    };

    const handleClearAllSelected = () => {
        setSelectedTickers([]);
    };

    const handleDownloadExcel = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedTickers.length === 0) {
            toast.error('Pilih minimal satu kode saham untuk di-scrape.');
            return;
        }

        if (!startDate || !endDate) {
            toast.error('Rentang tanggal mulai dan selesai wajib diisi.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Tanggal mulai tidak boleh lebih baru dari tanggal selesai.');
            return;
        }

        setIsScraping(true);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                '';

            const response = await fetch('/admin/scraper/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                body: JSON.stringify({
                    tickers: selectedTickers,
                    start_date: startDate,
                    end_date: endDate,
                    bursa: selectedBursa,
                    sector: selectedSector,
                }),
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                const errorMsg =
                    errorJson?.errors?.tickers?.[0] ||
                    errorJson?.errors?.start_date?.[0] ||
                    errorJson?.errors?.end_date?.[0] ||
                    errorJson?.message ||
                    'Gagal mengambil data dari Yahoo Finance.';
                toast.error(errorMsg);
                setIsScraping(false);
                return;
            }

            // Extract filename from header
            const disposition = response.headers.get('Content-Disposition');
            let filename = `Data_Saham_${startDate}_sd_${endDate}.xlsx`;
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            toast.success(`Berhasil mengunduh ${filename}`);
        } catch (err: any) {
            toast.error('Terjadi kesalahan koneksi saat mengunduh data.');
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scraping Data" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header Title & Navigation Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <CloudDownload className="h-7 w-7 text-primary" />
                            Scraping Data
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Scrape data harga saham penutupan harian dari Yahoo Finance.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="gap-1.5">
                            <Link href="/admin/saham">
                                Data Saham
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleDownloadExcel} className="space-y-4">
                    {/* 1. Search & Pilih Semua */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Cari kode atau nama saham..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs sm:text-sm bg-background border-border/80"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Urutan Abjad A-Z / Z-A */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="h-9 text-xs gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                        >
                            {sortOrder === 'asc' ? (
                                <>
                                    <ArrowDownAZ className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">A-Z</span>
                                </>
                            ) : (
                                <>
                                    <ArrowUpAZ className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Z-A</span>
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllFiltered}
                            className="h-9 text-xs gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Pilih Semua</span>
                        </Button>
                    </div>

                    {/* 2. Stock Ticker Tags Grid */}
                    <div className="border border-border/70 rounded-xl p-2.5 max-h-80 overflow-y-auto bg-background/50 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                        {filteredAvailableStocks.length > 0 ? (
                            filteredAvailableStocks.slice(0, 48).map((stock) => {
                                const isSelected = selectedTickers.includes(stock.ticker);
                                return (
                                    <button
                                        key={stock.ticker}
                                        type="button"
                                        onClick={() => handleToggleTicker(stock.ticker)}
                                        className={`flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs border cursor-pointer ${isSelected
                                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-semibold'
                                                : 'bg-background hover:bg-muted/70 border-border/60 text-foreground'
                                            }`}
                                    >
                                        <div className="truncate">
                                            <div className="font-mono text-xs">{stock.ticker}</div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                                                {stock.name}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-4 text-xs text-muted-foreground">
                                Tidak ada saham yang cocok dengan pencarian "{searchQuery}".
                            </div>
                        )}
                    </div>

                    {/* 3. Selected Tickers Badges Box & Kosongkan Pilihan */}
                    <div className={`p-3.5 rounded-xl bg-muted/40 border border-border/70 ${selectedTickers.length === 0 ? 'flex items-center justify-center min-h-[96px]' : 'min-h-[76px]'}`}>
                        {selectedTickers.length > 0 ? (
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="font-mono text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                        Total: {selectedTickers.length}
                                    </Badge>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleClearAllSelected}
                                        className="h-7 w-7 rounded-lg text-rose-600 bg-rose-500/10 hover:bg-rose-500/15 cursor-pointer transition-colors p-0 flex items-center justify-center"
                                        title="Kosongkan pilihan"
                                    >
                                        <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Daftar Badge Saham Terpilih */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    {selectedTickers.map((ticker) => (
                                        <span
                                            key={ticker}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-background border border-border/80 shadow-2xs text-foreground group"
                                        >
                                            <span className="text-emerald-600 dark:text-emerald-400">{ticker}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleTicker(ticker)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                                title="Hapus saham"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-center py-2 text-muted-foreground w-full">
                                <ShieldAlert className="h-6 w-6 text-muted-foreground/60" />
                                <p className="font-medium text-sm">Tidak ada saham yang dipilih.</p>
                                <p className="text-xs">Silakan cari atau pilih dari daftar di atas.</p>
                            </div>
                        )}
                    </div>

                    {/* 4. Tanggal Mulai, Tanggal Selesai, Bursa, Sektor */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date" className="text-xs font-semibold">
                                Tanggal Mulai <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 text-xs sm:text-sm bg-background border-border/80 font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="end_date" className="text-xs font-semibold">
                                Tanggal Selesai <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 text-xs sm:text-sm bg-background border-border/80 font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="bursa" className="text-xs font-semibold">
                                Bursa
                            </Label>
                            <Select value={selectedBursa} onValueChange={setSelectedBursa}>
                                <SelectTrigger id="bursa" className="h-9 text-xs bg-background border-border/80">
                                    <SelectValue placeholder="Pilih Bursa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bursa</SelectItem>
                                    <SelectItem value="IDX">IDX</SelectItem>
                                    <SelectItem value="NYSE">NYSE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sector" className="text-xs font-semibold">
                                Sektor
                            </Label>
                            <Select value={selectedSector} onValueChange={setSelectedSector}>
                                <SelectTrigger id="sector" className="h-9 text-xs bg-background border-border/80">
                                    <SelectValue placeholder="Pilih Sektor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Sektor</SelectItem>
                                    {SECTORS.map((sec) => (
                                        <SelectItem key={sec} value={sec}>
                                            {sec}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 5. Submit & Download Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isScraping || selectedTickers.length === 0}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-xs rounded-lg transition-all cursor-pointer gap-2"
                        >
                            {isScraping ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses Scrape</span>
                                </>
                            ) : (
                                <>
                                    <DownloadCloud className="h-4 w-4" />
                                    <span>Scrape</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
