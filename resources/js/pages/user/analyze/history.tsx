import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Clock,
    Coins,
    Edit,
    History,
    Layers,
    Loader2,
    MoreHorizontal,
    Plus,
    Tag,
    Trash,
    TrendingUp,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
];

interface HistoryItem {
    id: number;
    user_id: number;
    reference_code?: string;
    title: string;
    initial_capital: number;
    risk_free_rate: number;
    tickers: string[];
    created_at: string;
}

interface HistoryProps {
    history: PaginatedData<HistoryItem> | { data: HistoryItem[] };
}

export default function OptimizationHistoryPage({ history }: HistoryProps) {
    const list = 'data' in history ? history.data : [];

    // Edit Modal State
    const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
    const [editTitle, setEditTitle] = useState<string>('');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // Delete Modal State
    const [deletingItem, setDeletingItem] = useState<HistoryItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const openEditModal = (item: HistoryItem) => {
        setEditingItem(item);
        setEditTitle(item.title || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (!editTitle.trim()) {
            toast.error('Judul portofolio tidak boleh kosong.');
            return;
        }

        setIsUpdating(true);
        router.put(
            `/user/analyze/history/${editingItem.id}`,
            { title: editTitle.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Judul portofolio berhasil diperbarui.');
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                },
                onError: (errors) => {
                    toast.error(errors.title || 'Gagal memperbarui judul portofolio.');
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const openDeleteModal = (item: HistoryItem) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        setIsDeleting(true);
        router.delete(`/user/analyze/history/${deletingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Riwayat portofolio berhasil dihapus.');
                setIsDeleteModalOpen(false);
                setDeletingItem(null);
            },
            onError: () => {
                toast.error('Gagal menghapus riwayat portofolio.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    // Summary statistics for TradingView/Stockbit mini stats bar
    const stats = useMemo(() => {
        const totalPortfolios = list.length;
        const totalCapital = list.reduce((sum, item) => sum + Number(item.initial_capital || 0), 0);
        const totalTickersCount = list.reduce(
            (sum, item) => sum + (Array.isArray(item.tickers) ? item.tickers.length : 0),
            0
        );
        const avgTickers = totalPortfolios > 0 ? (totalTickersCount / totalPortfolios).toFixed(1) : '0';
        const avgRiskFree = list.length > 0 ? Number(list[0].risk_free_rate || 6.0) : 6.0;

        return {
            totalPortfolios,
            totalCapital,
            avgTickers,
            avgRiskFree,
        };
    }, [list]);

    const formatRupiah = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || isNaN(Number(val))) return 'Rp -';
        return `Rp ${Number(val).toLocaleString('id-ID')}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Portofolio" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 mx-auto w-full pb-20">
                {/* 1. HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-500/15 blur-xl" />

                    <div className="relative z-10 flex items-center gap-4 w-full justify-between overflow-hidden">
                        <div className="shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-xs">
                                <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                Riwayat Portofolio
                            </span>
                        </div>

                        {/* Button tambah saham */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                            <Button asChild size="sm" className="gap-2 shadow-xs cursor-pointer h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Link href="/user/analyze/keranjang">
                                    <Plus className="h-4 w-4" />
                                    Analisis
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. MINI STATS BAR (Stockbit & TradingView Style) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    <Card className="border border-border/70 shadow-2xs bg-card/50 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
                        <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Total Portofolio</span>
                                <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                    {stats.totalPortfolios} <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">Portofolio</span>
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
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Akumulasi Modal</span>
                                <span className="text-xs sm:text-base font-extrabold font-mono text-foreground block truncate" title={formatRupiah(stats.totalCapital)}>
                                    {formatRupiah(stats.totalCapital)}
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
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Rata-rata Emiten</span>
                                <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                    {stats.avgTickers} <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">Saham</span>
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
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground block font-medium truncate">Risk-Free Rate (Rf)</span>
                                <span className="text-xs sm:text-base font-extrabold font-mono text-foreground truncate block">
                                    {stats.avgRiskFree}% <span className="text-[10px] sm:text-xs text-muted-foreground font-sans font-normal">SBN/BI</span>
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 3. TRANSACTION LIST TABLE CARD */}
                <Card className="border border-border/70 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <span>Daftar Portofolio</span>
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {list.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                                    <History className="h-7 w-7" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">Belum Ada Riwayat Portofolio</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                    Anda belum menjalankan optimasi portofolio. Silakan pilih minimal 2 saham dari menu Eksplorasi Saham.
                                </p>
                                <Button asChild size="sm" className="mt-4 gap-1.5 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Link href="/user/analyze/keranjang">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span>Mulai Analisis Saham</span>
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <Table className="min-w-[680px]">
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="text-xs font-bold w-44 py-3.5 px-4">Kode Referensi</TableHead>
                                            <TableHead className="text-xs font-bold py-3.5 px-4">Judul & Emiten Saham</TableHead>
                                            <TableHead className="text-xs font-bold text-right py-3.5 px-4">Modal Investasi</TableHead>
                                            <TableHead className="text-xs font-bold text-right w-16 py-3.5 px-4">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {list.map((item) => {
                                            const refCode = item.reference_code || `DNL${item.user_id}-${item.id}`;
                                            const tickersList = Array.isArray(item.tickers)
                                                ? item.tickers.map((t) => t.replace('.JK', ''))
                                                : [];

                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    onClick={() => router.visit(`/user/analyze/result/${item.id}`)}
                                                    className="group cursor-pointer hover:bg-muted/40 active:scale-[0.999] transition-all border-b border-border/40"
                                                >
                                                    {/* Kolom 1: Kode Referensi (TradingView Badge Tag) */}
                                                    <TableCell className="py-4 px-4 align-top">
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                                                                <Tag className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                {refCode}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                                                                <Clock className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                                                <span>{formatDate(item.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Kolom 2: Judul & Stock Pill Badges (Yahoo Finance / Stockbit Style) */}
                                                    <TableCell className="py-4 px-4 align-top space-y-2">
                                                        <div className="flex items-center gap-1.5 group/title">
                                                            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                                                                {item.title}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEditModal(item);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                                                title="Edit Judul"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                            {tickersList.map((t, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted/60 text-foreground hover:text-emerald-700 border border-border/50 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-colors"
                                                                >
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    {/* Kolom 3: Modal Investasi */}
                                                    <TableCell className="py-4 px-4 align-top text-right whitespace-nowrap">
                                                        <span className="font-mono font-extrabold text-sm text-foreground block">
                                                            {formatRupiah(item.initial_capital)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground block font-sans">
                                                            Rf: {item.risk_free_rate || 6.0}%
                                                        </span>
                                                    </TableCell>

                                                    {/* Kolom 4: Action Dropdown Menu (Style Admin Saham) */}
                                                    <TableCell className="py-4 px-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                                    <span className="sr-only">Menu aksi</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => router.visit(`/user/analyze/result/${item.id}`)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                                    <span>Detail Analisis</span>
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={() => openEditModal(item)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    <span>Edit Judul</span>
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteModal(item)}
                                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    <span>Hapus Portofolio</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* MODAL DIALOG EDIT JUDUL PORTOFOLIO */}
            <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && !isUpdating && setIsEditModalOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSaveEdit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-base font-bold text-foreground">
                                Edit Judul Portofolio
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Ubah judul portofolio untuk referensi <strong className="font-mono text-foreground">{editingItem?.reference_code || `DNL${editingItem?.user_id}-${editingItem?.id}`}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-2">
                            <Label htmlFor="portfolio-title" className="text-xs font-medium text-muted-foreground">
                                Judul Portofolio
                            </Label>
                            <Input
                                id="portfolio-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Contoh: Portofolio Bluechip LQ45 Q1"
                                className="h-9 text-xs bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                                maxLength={255}
                                autoFocus
                            />
                        </div>

                        <DialogFooter className="flex justify-end gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={isUpdating}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 shadow-2xs"
                                disabled={isUpdating || !editTitle.trim()}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL DIALOG KONFIRMASI HAPUS PORTOFOLIO */}
            <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && !isDeleting && setIsDeleteModalOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive text-base font-bold">
                            <AlertCircle className="h-5 w-5" />
                            Hapus Riwayat Portofolio
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Apakah Anda yakin ingin menghapus portofolio <strong className="text-foreground">{deletingItem?.title}</strong> (<span className="font-mono">{deletingItem?.reference_code || `DNL${deletingItem?.user_id}-${deletingItem?.id}`}</span>)? Data analisis hasil optimasi ini akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={isDeleting}>
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleConfirmDelete}
                            className="cursor-pointer gap-1.5 shadow-2xs"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Menghapus...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ya, Hapus</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
