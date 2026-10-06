import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData, type SharedData, type Stock, type StockStatistics } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Database,
    Edit,
    Eye,
    FileSpreadsheet,
    FileUp,
    Filter,
    Layers,
    Loader2,
    MoreHorizontal,
    Plus,
    Power,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash,
    TrendingUp,
    UploadCloud,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SparklineChart from '@/components/SparklineChart';
import StockDetailModal from './StockDetailModal';
import StockFormModal, { SECTORS } from './StockFormModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Data Saham', href: '/admin/saham' },
];

interface Props {
    stocks: PaginatedData<Stock>;
    filters: {
        search?: string;
        bursa?: string;
        sector?: string;
        status?: string;
    };
    statistics: StockStatistics;
    availableSectors?: string[];
}

export default function StockIndex({ stocks, filters, statistics, availableSectors }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBursa, setSelectedBursa] = useState(filters.bursa || 'all');
    const [selectedSector, setSelectedSector] = useState(filters.sector || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isToggling, setIsToggling] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form for Excel Import
    const { data: importData, setData: setImportData, post: postImport, processing: isImporting, errors: importErrors, reset: resetImport, progress: importProgress } = useForm<{
        file: File | null;
    }>({
        file: null,
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [detailStock, setDetailStock] = useState<Stock | null>(null);

    const handleOpenCreate = () => {
        setSelectedStock(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (stock: Stock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleOpenDetail = (stock: Stock) => {
        setDetailStock(stock);
        setIsDetailModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportData('file', e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setImportData('file', droppedFile);
            } else {
                toast.error('File harus berformat Excel (.xlsx atau .xls)');
            }
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importData.file) {
            toast.error('Silakan pilih file Excel terlebih dahulu');
            return;
        }

        postImport('/admin/saham/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetImport();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setIsImportModalOpen(false);
            },
            onError: (err) => {
                if (err.file) {
                    toast.error(err.file);
                } else {
                    toast.error('Gagal mengimpor file.');
                }
            },
        });
    };

    // Watch flash messages from Inertia
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Debounced search & filter handler
    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentSearch = filters.search || '';
            const currentBursa = filters.bursa || 'all';
            const currentSec = filters.sector || 'all';
            const currentStat = filters.status || 'all';

            if (
                searchQuery !== currentSearch ||
                selectedBursa !== currentBursa ||
                selectedSector !== currentSec ||
                selectedStatus !== currentStat
            ) {
                router.get(
                    '/admin/saham',
                    {
                        search: searchQuery || undefined,
                        bursa: selectedBursa !== 'all' ? selectedBursa : undefined,
                        sector: selectedSector !== 'all' ? selectedSector : undefined,
                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
                    },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery, selectedBursa, selectedSector, selectedStatus]);



    // Keep detail stock in sync with fresh data
    useEffect(() => {
        if (detailStock) {
            const updated = stocks.data.find((s) => s.id === detailStock.id);
            if (updated) {
                setDetailStock(updated);
            }
        }
    }, [stocks.data]);

    const handleToggleActive = (stock: Stock) => {
        setIsToggling(stock.id);
        router.patch(
            `/admin/saham/${stock.id}/toggle-active`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (detailStock && detailStock.id === stock.id) {
                        setDetailStock((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
                    }
                },
                onFinish: () => setIsToggling(null),
            }
        );
    };

    const handleDeleteStock = (stockId: number) => {
        setIsDeleting(stockId);
        router.delete(`/admin/saham/${stockId}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(null),
        });
    };

    const formatPrice = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Saham" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-7 w-7 text-primary" />
                            Data Saham
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola data saham, riwayat harga harian, dan data bursa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ['stocks', 'statistics'] })}
                            className="gap-1.5"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Saham</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_stocks.toLocaleString('id-ID')}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-600 font-medium">{statistics.active_stocks_count} aktif</span> scraping
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Data Harga Historis</CardTitle>
                            <Database className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_prices.toLocaleString('id-ID')}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rekor penutupan harga harian
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Kategori Bursa</CardTitle>
                            <Activity className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span className="text-blue-600">IDX: {statistics.idx_conventional_count}</span>
                                <span>•</span>
                                <span className="text-purple-600">NYSE: {statistics.nyse_count ?? statistics.jii_count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Bursa Terdaftar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Harga Terkini</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg sm:text-xl font-bold truncate">
                                {formatDate(statistics.last_price_date)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tanggal penutupan terbaru
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock List Section */}
                <div className="space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Daftar Emiten Saham</h2>
                            <p className="text-xs text-muted-foreground">
                                Total {stocks.total} saham terdaftar di sistem.
                            </p>
                        </div>

                        {/* Filters & Search */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                            {/* Baris 1 di Mobile / Inline di Selain Mobile */}
                            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:contents">
                                {/* Search */}
                                <div className="relative flex-1 sm:flex-none sm:w-40 md:w-44 lg:w-48">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="text"
                                        placeholder="Cari kode atau nama saham..."
                                        className="pl-8 pr-8 text-xs sm:text-sm h-9 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                            title="Reset pencarian"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Bursa Filter */}
                                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs h-9 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBursa('all')}
                                        className={`px-2 sm:px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedBursa === 'all'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBursa('IDX')}
                                        className={`px-2 sm:px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedBursa === 'IDX'
                                            ? 'bg-background text-blue-600 shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        IDX
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBursa('NYSE')}
                                        className={`px-2 sm:px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedBursa === 'NYSE'
                                            ? 'bg-background text-purple-600 shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        NYSE
                                    </button>
                                </div>
                            </div>

                            {/* Baris 2 di Mobile / Inline di Selain Mobile */}
                            <div className="flex items-center gap-2 w-full sm:w-auto sm:contents">
                                {/* Sector Filter */}
                                <Select value={selectedSector} onValueChange={setSelectedSector}>
                                    <SelectTrigger className="flex-1 min-w-0 sm:w-[140px] md:w-[145px] sm:flex-none shrink-0 h-9 text-xs bg-background border-border/70 rounded-md focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer">
                                        <SelectValue placeholder="Semua Sektor" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        <SelectItem value="all">Semua Sektor</SelectItem>
                                        {(availableSectors || SECTORS).map((sector) => (
                                            <SelectItem key={sector} value={sector}>
                                                {sector}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger className="flex-1 min-w-0 sm:w-[120px] md:w-[125px] sm:flex-none shrink-0 h-9 text-xs bg-background border-border/70 rounded-md focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer">
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="active">Aktif Scraper</SelectItem>
                                        <SelectItem value="inactive">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="gap-1.5 shadow-xs h-9 cursor-pointer shrink-0"
                                    title="Import Data Saham"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="hidden sm:inline">Import</span>
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={handleOpenCreate}
                                    className="gap-1.5 shadow-xs h-9 cursor-pointer shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    title="Tambah Saham"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-center font-semibold">ID</TableHead>
                                    <TableHead className="font-semibold">Ticker</TableHead>
                                    <TableHead className="font-semibold">Nama Emiten</TableHead>
                                    <TableHead className="font-semibold">Bursa</TableHead>
                                    <TableHead className="text-center font-semibold w-[130px]">Tren 7 Hari</TableHead>
                                    <TableHead className="text-center font-semibold">Penutupan (Rp)</TableHead>
                                    <TableHead className="text-center font-semibold">Tanggal Harga</TableHead>
                                    <TableHead className="text-center font-semibold">Total Rekor</TableHead>
                                    <TableHead className="text-center font-semibold">Auto Scrape</TableHead>
                                    <TableHead className="text-right font-semibold">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <ShieldAlert className="h-6 w-6 text-muted-foreground/60" />
                                                <p className="font-medium text-sm">Tidak ada data saham ditemukan.</p>
                                                <p className="text-xs">Klik tombol "Tambah Saham" di atas untuk mendaftarkan saham baru.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.data.map((stock) => (
                                        <TableRow
                                            key={stock.id}
                                            onClick={() => handleOpenDetail(stock)}
                                            className="hover:bg-muted/40 transition-colors cursor-pointer group"
                                            title="Klik untuk melihat detail saham"
                                        >
                                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                {stock.id}
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">
                                                <span className="font-mono tracking-tight">
                                                    {stock.ticker}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <span className="block truncate max-w-[200px] group-hover:text-primary transition-colors">
                                                    {stock.name || stock.ticker.replace('.JK', '')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {stock.bursa?.includes('IDX') ? (
                                                    <Badge variant="outline" className="rounded-full border-blue-300 text-blue-700 bg-blue-50/60 dark:bg-blue-950/50 dark:text-blue-300">
                                                        IDX
                                                    </Badge>
                                                ) : stock.bursa?.includes('NYSE') ? (
                                                    <Badge variant="outline" className="rounded-full border-purple-300 text-purple-700 bg-purple-50/60 dark:bg-purple-950/50 dark:text-purple-300">
                                                        NYSE
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {stock.bursa || '-'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center py-2">
                                                <div className="flex justify-center items-center">
                                                    <SparklineChart prices={stock.recent_prices || []} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {stock.latest_price ? (
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="font-semibold text-foreground tracking-tight">
                                                            {formatPrice(stock.latest_price.close_price)}
                                                        </span>
                                                        {stock.change_percent !== null && stock.change_percent !== undefined ? (
                                                            <div
                                                                className={`inline-flex items-center text-[11px] font-medium ${stock.change_percent > 0
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : stock.change_percent < 0
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-muted-foreground'
                                                                    }`}
                                                            >
                                                                {stock.change_percent > 0 ? (
                                                                    <>
                                                                        <span className="mr-0.5 text-[9px]">▲</span>
                                                                        <span>+{stock.change_percent.toFixed(2)}%</span>
                                                                    </>
                                                                ) : stock.change_percent < 0 ? (
                                                                    <>
                                                                        <span className="mr-0.5 text-[9px]">▼</span>
                                                                        <span>{stock.change_percent.toFixed(2)}%</span>
                                                                    </>
                                                                ) : (
                                                                    <span>0.00%</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground">0.00%</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-muted-foreground">
                                                {stock.latest_price ? formatDate(stock.latest_price.date) : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {stock.prices_count || 0} hari
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleActive(stock);
                                                    }}
                                                    disabled={isToggling === stock.id}
                                                    className="inline-flex items-center gap-1 text-xs cursor-pointer group/btn"
                                                    title="Klik untuk mengubah status auto-scraper"
                                                >
                                                    {isToggling === stock.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : stock.is_active ? (
                                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 transition-all">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 hover:bg-muted">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span className="sr-only">Menu aksi</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDetail(stock)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>Detail Saham</span>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenEdit(stock)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit Saham</span>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleActive(stock)}
                                                            disabled={isToggling === stock.id}
                                                            className="cursor-pointer"
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            <span>{stock.is_active ? 'Nonaktifkan Scraper' : 'Aktifkan Scraper'}</span>
                                                        </DropdownMenuItem>

                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    <span>Hapus Saham</span>
                                                                </DropdownMenuItem>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Hapus Saham {stock.ticker}?</DialogTitle>
                                                                    <DialogDescription>
                                                                        Tindakan ini akan menghapus emiten <strong>{stock.ticker}</strong> beserta seluruh data riwayat harga ({stock.prices_count || 0} hari bursa) yang tersimpan. Tindakan ini tidak dapat dibatalkan.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() => handleDeleteStock(stock.id)}
                                                                        disabled={isDeleting === stock.id}
                                                                    >
                                                                        {isDeleting === stock.id && (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        )}
                                                                        Hapus Saham & Riwayat
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {stocks.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground pt-2">
                            <div>
                                Menampilkan {stocks.from} sampai {stocks.to} dari total {stocks.total} emiten.
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {stocks.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {
                                                    search: searchQuery || undefined,
                                                    bursa: selectedBursa !== 'all' ? selectedBursa : undefined,
                                                    sector: selectedSector !== 'all' ? selectedSector : undefined,
                                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                                },
                                                { preserveState: true }
                                            )
                                        }
                                        className={`h-8 min-w-[32px] px-2 text-xs ${link.active ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail Saham */}
            <StockDetailModal
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                stock={detailStock}
                onEdit={handleOpenEdit}
                onToggleActive={handleToggleActive}
                isToggling={detailStock ? isToggling === detailStock.id : false}
            />

            {/* Modal Tambah & Edit Saham */}
            <StockFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                stock={selectedStock}
            />

            {/* Modal Import Excel */}
            <Dialog
                open={isImportModalOpen}
                onOpenChange={(open) => {
                    setIsImportModalOpen(open);
                    if (!open) {
                        resetImport();
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                }}
            >
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                                <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">Import Data Saham Historis</DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    Unggah file Excel multi-sheet (.xlsx) untuk mendaftarkan emiten dan merekam data harga.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Format Guideline Note */}
                    <div className="rounded-lg border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-xs">
                            <AlertCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            Format File Excel yang Didukung:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground dark:text-blue-300">
                            <li>
                                <strong>Nama Sheet:</strong> <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-800 dark:text-blue-200">IDX</code> dan <code className="bg-purple-100 dark:bg-purple-900/60 px-1 py-0.5 rounded text-purple-800 dark:text-purple-200">NYSE</code>
                            </li>
                            <li>
                                <strong>Format Header:</strong> Baris 1 = <code>Date / Ticker</code>. Baris 2–4: <code>Name</code>, <code>Bursa</code>, dan <code>Sector</code> (kompatibel penuh dengan hasil export Scraper).
                            </li>
                            <li>
                                <strong>Otomasi:</strong> Saham baru akan dibuat, sektor dicatat, dan riwayat harga diperbarui secara otomatis.
                            </li>
                        </ul>
                    </div>

                    <form onSubmit={handleImportSubmit} className="space-y-4 pt-1">
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${isDragging
                                ? 'border-primary bg-primary/5 scale-[1.01]'
                                : importData.file
                                    ? 'border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />

                            {importData.file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                                            {importData.file.name}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                ({(importData.file.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">Klik atau drag file lain untuk mengganti</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <UploadCloud className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">
                                            Tarik & lepas file Excel di sini, atau <span className="text-primary underline">Pilih File</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">Mendukung format .xlsx dan .xls (Maks. 50MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {importErrors.file && (
                            <p className="text-xs font-medium text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {importErrors.file}
                            </p>
                        )}

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    resetImport();
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                    setIsImportModalOpen(false);
                                }}
                                disabled={isImporting}
                            >
                                Batal
                            </Button>

                            <Button
                                type="submit"
                                disabled={!importData.file || isImporting}
                                className="min-w-[100px] gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Memproses
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="h-4 w-4" />
                                        Import
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
