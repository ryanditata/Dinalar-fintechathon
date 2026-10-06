import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import masterStockList from '@/data/tickerSaham.json';
import { type Stock } from '@/types';
import { useForm } from '@inertiajs/react';
import { Check, ChevronDown, Loader2, Search, Sparkles, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export const SECTORS = [
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
] as const;

interface StockFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stock?: Stock | null;
}

export default function StockFormModal({ open, onOpenChange, stock }: StockFormModalProps) {
    const isEdit = Boolean(stock);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        ticker: '',
        name: '',
        bursa: 'IDX',
        sector: '',
        is_active: true,
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const comboboxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset dan inisialisasi form saat modal terbuka
    useEffect(() => {
        if (open) {
            clearErrors();
            setIsDropdownOpen(false);
            if (stock) {
                setData({
                    ticker: stock.ticker,
                    name: stock.name || '',
                    bursa: stock.bursa?.includes('IDX') ? 'IDX' : (stock.bursa || 'IDX'),
                    sector: stock.sector || '',
                    is_active: Boolean(stock.is_active),
                });
            } else {
                reset();
                setData({
                    ticker: '',
                    name: '',
                    bursa: 'IDX',
                    sector: '',
                    is_active: true,
                });
            }
        }
    }, [open, stock]);

    // Tutup dropdown saat klik di luar area combobox
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter master data saham berdasarkan input ticker atau nama perusahaan
    const filteredMasterStocks = useMemo(() => {
        const query = (data.ticker || '').toUpperCase().replace(/\s+/g, '');
        const cleanQuery = query.replace(/\.JK/g, '');
        const rawQuery = (data.ticker || '').toLowerCase().trim();

        if (!cleanQuery && !rawQuery) {
            return masterStockList.slice(0, 10);
        }

        return masterStockList
            .filter((item) => {
                const itemCleanTicker = item.ticker.toUpperCase().replace(/\.JK/g, '');
                const itemName = (item.name || '').toLowerCase();
                return itemCleanTicker.includes(cleanQuery) || itemName.includes(rawQuery);
            })
            .slice(0, 10);
    }, [data.ticker]);

    const handleSelectStock = (item: { ticker: string; name: string }) => {
        setData((prev) => ({
            ...prev,
            ticker: item.ticker,
            name: item.name,
        }));
        setIsDropdownOpen(false);
    };

    const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/\s+/g, '');
        setData('ticker', value);
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isDropdownOpen || filteredMasterStocks.length === 0) {
            if (e.key === 'ArrowDown') {
                setIsDropdownOpen(true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % filteredMasterStocks.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + filteredMasterStocks.length) % filteredMasterStocks.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredMasterStocks[highlightedIndex]) {
                handleSelectStock(filteredMasterStocks[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && stock) {
            put(`/admin/saham/${stock.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/admin/saham', {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) {
                    reset();
                    clearErrors();
                    setIsDropdownOpen(false);
                }
            }}
        >
            <DialogContent className="sm:max-w-md overflow-visible">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Data Saham' : 'Tambah Saham Baru'}</DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Perbarui informasi kode ticker, nama emiten, bursa, dan sektor.'
                                : 'Cari dari master data saham Indonesia (IDX) atau input kode emiten secara manual.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Kode Ticker dengan Searchable Autocomplete Combobox */}
                        <div className="grid gap-2">
                            <Label htmlFor="ticker">Kode Ticker <span className="text-red-500">*</span></Label>

                            <div className="relative" ref={comboboxRef}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="ticker"
                                    ref={inputRef}
                                    placeholder="Cari kode atau nama saham..."
                                    value={data.ticker}
                                    onChange={handleTickerChange}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-9 pr-9 font-mono uppercase text-xs sm:text-sm h-9 bg-background border-border/80 shadow-2xs placeholder:font-sans placeholder:normal-case"
                                    autoFocus={!isEdit}
                                    disabled={processing}
                                    autoComplete="off"
                                />
                                {data.ticker ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((prev) => ({ ...prev, ticker: '', name: '' }));
                                            setIsDropdownOpen(true);
                                            inputRef.current?.focus();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-muted"
                                        title="Hapus"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <ChevronDown
                                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                                    />
                                )}

                                {/* Dropdown Hasil Pencarian Master Saham - Menempel tepat di bawah Input */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border/70 shadow-md rounded-md overflow-hidden max-h-60 overflow-y-auto p-1 animate-in fade-in-0 zoom-in-95 duration-100">
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50 mb-1 flex items-center justify-between">
                                            <span>Data Saham ({filteredMasterStocks.length})</span>
                                        </div>

                                        {filteredMasterStocks.length > 0 ? (
                                            filteredMasterStocks.map((item, idx) => {
                                                const isSelected =
                                                    data.ticker === item.ticker ||
                                                    data.ticker === item.ticker.replace('.JK', '');
                                                const isHighlighted = idx === highlightedIndex;

                                                return (
                                                    <button
                                                        key={item.ticker}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleSelectStock(item);
                                                        }}
                                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                                        className={`relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-hidden select-none transition-colors text-left ${
                                                            isHighlighted
                                                                ? 'bg-accent text-accent-foreground'
                                                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                                        }`}
                                                    >
                                                        <span className="font-mono font-medium text-xs text-foreground shrink-0">
                                                            {item.ticker}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {item.name}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="absolute right-2 flex size-3.5 items-center justify-center">
                                                                <Check className="size-4 text-primary" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                <p className="font-medium text-foreground">
                                                    "{data.ticker}" tidak ditemukan di master data.
                                                </p>
                                                <p className="text-[11px] mt-0.5">
                                                    Anda tetap dapat mendaftarkannya secara manual.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                                Gunakan akhiran <code className="bg-muted px-1 py-0.5 rounded">.JK</code> untuk sinkronisasi harga Yahoo Finance.
                            </p>
                            <InputError message={errors.ticker} />
                        </div>

                        {/* Nama Perusahaan / Emiten */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Perusahaan / Emiten</Label>
                            <Input
                                id="name"
                                placeholder="Contoh: Bank Central Asia Tbk"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                            />
                            <InputError message={errors.name} />
                        </div>

                        {/* Bursa */}
                        <div className="grid gap-2">
                            <Label htmlFor="bursa">
                                Bursa <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.bursa} onValueChange={(val) => setData('bursa', val)}>
                                <SelectTrigger id="bursa" className="h-9 text-sm bg-background border-border/70 rounded-md shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer w-full">
                                    <SelectValue placeholder="Pilih Bursa" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border/70 shadow-md">
                                    <SelectItem value="IDX">IDX</SelectItem>
                                    <SelectItem value="NYSE">NYSE</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.bursa} />
                        </div>

                        {/* Sektor Saham */}
                        <div className="grid gap-2">
                            <Label htmlFor="sector">
                                Sektor
                            </Label>
                            <Select
                                value={data.sector || 'none'}
                                onValueChange={(val) => setData('sector', val === 'none' ? '' : val)}
                            >
                                <SelectTrigger id="sector" className="h-9 text-sm bg-background border-border/70 rounded-md shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer w-full">
                                    <SelectValue placeholder="Pilih Sektor" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border/70 shadow-md max-h-56">
                                    <SelectItem value="none">Pilih Sektor</SelectItem>
                                    {SECTORS.map((sector) => (
                                        <SelectItem key={sector} value={sector}>
                                            {sector}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.sector} />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center space-x-2 pt-1">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                disabled={processing}
                            />
                            <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                                Aktifkan Auto-Scraping untuk saham ini
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
