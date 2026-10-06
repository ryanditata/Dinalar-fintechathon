import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type OptimizationHistoryStatistics,
    type PaginatedData,
    type PortfolioOptimizationRecord,
    type SharedData,
} from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    Calendar,
    CalendarSync,
    Check,
    Coins,
    Copy,
    ExternalLink,
    Eye,
    FileSpreadsheet,
    History,
    Layers,
    Loader2,
    MoreHorizontal,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash,
    TrendingUp,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'History Optimasi', href: '/admin/history' },
];

interface Props {
    optimizations: PaginatedData<PortfolioOptimizationRecord>;
    filters: {
        search?: string;
        sort?: string;
    };
    statistics: OptimizationHistoryStatistics;
}

export default function OptimizationHistoryIndex({
    optimizations,
    filters,
    statistics,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const getInitials = useInitials();

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Watch flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Debounced search & sort filter handler
    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentSearch = filters.search || '';
            const currentSort = filters.sort || 'latest';

            if (searchQuery !== currentSearch || selectedSort !== currentSort) {
                router.get(
                    '/admin/history',
                    {
                        search: searchQuery || undefined,
                        sort: selectedSort !== 'latest' ? selectedSort : undefined,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    }
                );
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery, selectedSort]);

    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedSort && selectedSort !== 'latest') params.append('sort', selectedSort);

        const url = `/admin/history/export${params.toString() ? `?${params.toString()}` : ''}`;
        window.location.href = url;
    };

    const handleDeleteOptimization = (id: number) => {
        setIsDeleting(id);
        router.delete(`/admin/history/${id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(null),
        });
    };

    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '-';
        return `Rp ${new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num)}`;
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

    const formatDateTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            const datePart = new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(d);
            const timePart = new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
                .format(d)
                .replace('.', ':');
            return `${datePart}, ${timePart}`;
        } catch {
            return dateStr;
        }
    };

    const getBestPortfolioMetrics = (item: PortfolioOptimizationRecord) => {
        const best = item.best_portfolios;
        if (!best) return null;

        let port: any = null;
        if (typeof best === 'object' && !Array.isArray(best)) {
            // In Dinalar optimization output, the profile key is 'sharpe' (or fallback to 'max_sharpe', 'sortino', or first entry)
            port = (best as any).sharpe || (best as any).max_sharpe || (best as any).sortino || Object.values(best)[0];
        } else if (Array.isArray(best) && best.length > 0) {
            port = best[0];
        }

        if (!port) return null;

        const retVal = port.return ?? port.expected_return;
        const riskVal = port.risk ?? port.volatility;
        const sharpeVal = port.sharpe ?? port.sharpe_ratio;

        const formatPercentValue = (val: any) => {
            if (val === undefined || val === null || isNaN(Number(val))) return '-';
            const num = Number(val);
            return `${num.toFixed(2)}%`;
        };

        const formatSharpeValue = (val: any) => {
            if (val === undefined || val === null || isNaN(Number(val))) return '-';
            const num = Number(val);
            return num.toFixed(2);
        };

        return {
            expected_return: formatPercentValue(retVal),
            volatility: formatPercentValue(riskVal),
            sharpe_ratio: formatSharpeValue(sharpeVal),
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History Optimasi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <History className="h-7 w-7 text-primary" />
                            History Optimasi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola dan pantau seluruh riwayat optimasi portofolio saham.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ['optimizations', 'statistics'] })}
                            className="gap-1.5 cursor-pointer shadow-xs"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Optimasi Hari Ini */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Optimasi Hari Ini
                            </CardTitle>
                            <CalendarSync className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.today_optimizations_count.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sesi optimasi hari ini
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Total Optimasi */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Total Optimasi
                            </CardTitle>
                            <Layers className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_optimizations_count.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Akumulasi portofolio
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Rata-rata Modal */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Rata-rata Modal
                            </CardTitle>
                            <Coins className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                                {formatRupiah(statistics.avg_capital)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rata-rata modal per sesi
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Top Saham */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Top Saham
                            </CardTitle>
                            <Award className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground flex items-center gap-1.5">
                                <span>{statistics.top_stock.ticker}</span>
                                {statistics.top_stock.count > 0 && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-sans">
                                        {statistics.top_stock.count}x
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Emiten paling sering dioptimasi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Optimization List Section */}
                <div className="space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Daftar Riwayat Optimasi</h2>
                            <p className="text-xs text-muted-foreground">
                                Total {optimizations.total} sesi optimasi portofolio tercatat di sistem.
                            </p>
                        </div>

                        {/* Filters, Search & Export */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search Box */}
                            <div className="relative w-full sm:w-56 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari user, kode ref, ticker..."
                                    className="pl-8 pr-8 text-xs sm:text-sm h-9"
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

                            {/* Sort Filter */}
                            <Select value={selectedSort} onValueChange={setSelectedSort}>
                                <SelectTrigger className="w-[165px] shrink-0 h-9 text-xs bg-background border-border/70 rounded-md focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer">
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest" className="text-xs">
                                        Terbaru
                                    </SelectItem>
                                    <SelectItem value="oldest" className="text-xs">
                                        Terlama
                                    </SelectItem>
                                    <SelectItem value="capital_desc" className="text-xs">
                                        Modal Terbesar
                                    </SelectItem>
                                    <SelectItem value="capital_asc" className="text-xs">
                                        Modal Terkecil
                                    </SelectItem>
                                    <SelectItem value="name_asc" className="text-xs">
                                        Nama User (A - Z)
                                    </SelectItem>
                                    <SelectItem value="name_desc" className="text-xs">
                                        Nama User (Z - A)
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Ekspor Excel Mini Button on Mobile/Tablet */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleExportExcel}
                                className="gap-1.5 shadow-xs h-9 cursor-pointer shrink-0"
                                title="Ekspor File Excel"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="hidden sm:inline">Ekspor</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                                    <TableHead className="text-center font-semibold w-[50px] text-xs">NO</TableHead>
                                    <TableHead className="font-semibold text-xs min-w-[170px]">Pengguna & Kode Ref</TableHead>
                                    <TableHead className="font-semibold text-xs min-w-[130px]">Nama</TableHead>
                                    <TableHead className="font-semibold text-xs min-w-[140px]">Saham Terpilih</TableHead>
                                    <TableHead className="text-right font-semibold text-xs">Modal Awal</TableHead>
                                    <TableHead className="text-center font-semibold text-xs">Periode Data</TableHead>
                                    <TableHead className="text-center font-semibold text-xs">Return</TableHead>
                                    <TableHead className="text-center font-semibold text-xs">Volatilitas</TableHead>
                                    <TableHead className="text-center font-semibold text-xs">Sharpe Ratio</TableHead>
                                    <TableHead className="text-center font-semibold text-xs">Waktu Sesi</TableHead>
                                    <TableHead className="text-right font-semibold text-xs w-[60px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {optimizations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="h-36 text-center text-muted-foreground text-xs">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShieldAlert className="h-7 w-7 text-muted-foreground/60" />
                                                <p className="font-medium text-xs sm:text-sm">Tidak ada riwayat optimasi ditemukan.</p>
                                                <p className="text-[11px]">
                                                    {searchQuery
                                                        ? 'Coba sesuaikan kata kunci pencarian Anda.'
                                                        : 'Belum ada pengguna yang melakukan simulasi portofolio.'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    optimizations.data.map((item, index) => {
                                        const cleanTickers = Array.isArray(item.tickers)
                                            ? item.tickers.map((t) => t.replace('.JK', ''))
                                            : [];
                                        const metrics = getBestPortfolioMetrics(item);

                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors text-xs">
                                                {/* Column 0: NO */}
                                                <TableCell className="text-center font-medium text-xs py-2.5">
                                                    {(optimizations.from || 1) + index}
                                                </TableCell>

                                                {/* Column 1: Pengguna & Kode Ref (Avatar + User Info Style) */}
                                                <TableCell className="py-2.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Avatar className="h-7 w-7 overflow-hidden rounded-full border border-border/50 shrink-0">
                                                            <AvatarImage src={item.user?.avatar} alt={item.user?.name || 'User'} />
                                                            <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white font-semibold text-[10px]">
                                                                {getInitials(item.user?.name || 'User')}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="min-w-0 max-w-[170px]">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-xs font-semibold text-foreground truncate block leading-tight">
                                                                    {item.user?.name || `User #${item.user_id}`}
                                                                </span>
                                                                <span className="font-mono text-[8px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                                                    {item.reference_code || `DNL${item.user_id}-${item.id}`}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground truncate block mt-0.5">
                                                                {item.user?.email || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Column 2: Nama (Title) */}
                                                <TableCell className="py-2.5 font-medium max-w-[300px]">
                                                    <div
                                                        className="text-xs text-foreground truncate"
                                                        title={item.title}
                                                    >
                                                        {item.title || 'Portofolio Tanpa Nama'}
                                                    </div>
                                                </TableCell>

                                                {/* Column 3: Saham Terpilih */}
                                                <TableCell className="py-2.5">
                                                    <div className="space-y-0.5 max-w-[180px]">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-[11px] text-foreground">
                                                                {cleanTickers.length} Saham
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            {cleanTickers.slice(0, 4).map((t, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="text-[9px] font-mono px-1 py-0 rounded bg-muted/60 text-foreground border-border/70"
                                                                >
                                                                    {t}
                                                                </Badge>
                                                            ))}
                                                            {cleanTickers.length > 4 && (
                                                                <span className="text-[9px] text-muted-foreground font-mono font-medium">
                                                                    +{cleanTickers.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Column 4: Modal Awal */}
                                                <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-foreground whitespace-nowrap">
                                                    {formatRupiah(item.initial_capital)}
                                                </TableCell>

                                                {/* Column 5: Periode Data */}
                                                <TableCell className="py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                    {item.start_date && item.end_date ? (
                                                        <div className="space-y-0.5">
                                                            <div className="text-[10px] text-foreground font-medium">
                                                                {formatDate(item.start_date)}
                                                            </div>
                                                            <div className="text-[9px] text-muted-foreground">
                                                                s/d {formatDate(item.end_date)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>

                                                {/* Column 6: Return */}
                                                <TableCell className="py-2.5 text-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {metrics?.expected_return || '-'}
                                                </TableCell>

                                                {/* Column 7: Volatilitas */}
                                                <TableCell className="py-2.5 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {metrics?.volatility || '-'}
                                                </TableCell>

                                                {/* Column 8: Sharpe Ratio */}
                                                <TableCell className="py-2.5 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    {metrics?.sharpe_ratio || '-'}
                                                </TableCell>

                                                {/* Column 9: Waktu Sesi */}
                                                <TableCell className="py-2.5 text-center text-[11px] text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(item.created_at)}
                                                </TableCell>

                                                {/* Column 10: Aksi */}
                                                <TableCell className="text-right py-2.5">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 cursor-pointer"
                                                            >
                                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        onSelect={(e) => e.preventDefault()}
                                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer text-xs"
                                                                    >
                                                                        <Trash className="mr-2 h-3.5 w-3.5" />
                                                                        <span>Hapus History</span>
                                                                    </DropdownMenuItem>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Hapus History Optimasi {item.reference_code || `DNL${item.user_id}-${item.id}`}?
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Tindakan ini akan menghapus riwayat optimasi portofolio dengan kode referensi <strong>{item.reference_code || `DNL${item.user_id}-${item.id}`}</strong> oleh pengguna <strong>{item.user?.name || `User #${item.user_id}`}</strong> ({cleanTickers.length} saham). Tindakan ini tidak dapat dibatalkan.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() => handleDeleteOptimization(item.id)}
                                                                            disabled={isDeleting === item.id}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            {isDeleting === item.id && (
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            )}
                                                                            Hapus History
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {optimizations.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground pt-2">
                            <div>
                                Menampilkan {optimizations.from} sampai {optimizations.to} dari total{' '}
                                {optimizations.total} riwayat optimasi.
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {optimizations.links.map((link, i) => (
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
                                                    sort: selectedSort !== 'latest' ? selectedSort : undefined,
                                                },
                                                { preserveState: true }
                                            )
                                        }
                                        className={`h-8 min-w-[32px] px-2 text-xs cursor-pointer ${
                                            link.active
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                                                : ''
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
