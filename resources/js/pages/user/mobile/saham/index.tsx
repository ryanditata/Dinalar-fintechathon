import SparklineChart from '@/components/SparklineChart';
import StockAnalysisSheet, { type AnalyzedStockPayload } from '@/pages/user/mobile/components/StockAnalysisSheet';
import { AllocationProgressBar } from '@/pages/user/mobile/components/AllocationProgressBar';
import { FloatingBottomNav } from '@/pages/user/mobile/components/FloatingBottomNav';
import { MobileHeader } from '@/pages/user/mobile/components/MobileHeader';
import { StockExploreCard } from '@/pages/user/mobile/components/StockExploreCard';
import { MobileAppLayout } from '@/pages/user/mobile/layouts/MobileAppLayout';
import { type PaginatedData, type SharedData, type Stock } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    stocks: Stock[] | PaginatedData<Stock>;
    filters?: {
        search?: string;
        bursa?: string;
        sector?: string;
    };
    bursa_list?: string[];
    availableSectors?: string[];
    total_count?: number;
    timeframe_limits?: {
        min_date?: string | null;
        max_date?: string | null;
    };
}

export default function MobileStockIndex({
    stocks,
    filters = {},
    bursa_list = ['IDX', 'NYSE'],
    availableSectors = [],
    total_count,
    timeframe_limits,
}: Props) {
    const pageProps = usePage<SharedData>().props;
    const serverBasketTickers = (pageProps.basket_tickers as string[]) || [];

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBursa, setSelectedBursa] = useState(filters.bursa || 'all');
    const [selectedSector, setSelectedSector] = useState(filters.sector || 'all');
    const [hideTotal, setHideTotal] = useState<boolean>(false);

    // Basket State
    const [basketStocks, setBasketStocks] = useState<string[]>(() => {
        if (serverBasketTickers.length > 0) return serverBasketTickers;
        if (typeof window !== 'undefined') {
            try {
                const saved = sessionStorage.getItem('user_basket_tickers');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        if (serverBasketTickers && serverBasketTickers.length > 0) {
            setBasketStocks(serverBasketTickers);
        }
    }, [serverBasketTickers]);

    // Modal Analisis State
    const [selectedStockForModal, setSelectedStockForModal] = useState<Stock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const stockList: Stock[] = Array.isArray(stocks) ? stocks : stocks?.data || [];
    const totalEmiten = total_count || stockList.length;

    // Filters
    const applyFilters = (search: string, bursa: string, sector: string) => {
        router.get(
            '/user/saham',
            {
                search: search || undefined,
                bursa: bursa !== 'all' ? bursa : undefined,
                sector: sector !== 'all' ? sector : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchQuery, selectedBursa, selectedSector);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        applyFilters('', selectedBursa, selectedSector);
    };

    const handleBursaFilter = (bursa: string) => {
        setSelectedBursa(bursa);
        applyFilters(searchQuery, bursa, selectedSector);
    };

    const handleSectorFilter = (sector: string) => {
        setSelectedSector(sector);
        applyFilters(searchQuery, selectedBursa, sector);
    };

    // Open Modal
    const handleOpenModal = (stock: Stock) => {
        setSelectedStockForModal(stock);
        setIsModalOpen(true);
    };

    // Add to Basket
    const handleAddToBasket = (payload: AnalyzedStockPayload) => {
        const ticker = payload.ticker;
        const clean = ticker.replace('.JK', '');

        let updated = [...basketStocks];
        if (!updated.includes(ticker) && !updated.includes(clean)) {
            updated.push(ticker);
        }
        setBasketStocks(updated);

        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('user_basket_tickers', JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }
        }

        router.post('/user/analyze/basket', payload as any, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(`Saham ${clean} berhasil ditambahkan ke keranjang!`);
            },
            onError: () => {
                toast.error(`Gagal menyimpan saham ${clean} ke keranjang.`);
            },
        });
    };

    const isCurrentStockInBasket = selectedStockForModal
        ? basketStocks.some(
              (t) =>
                  t === selectedStockForModal.ticker ||
                  t === selectedStockForModal.ticker.replace('.JK', '')
          )
        : false;

    // Split stocks for Group Header "Hari Ini" (first 3) & "Bursa Terkini" (the rest)
    const todayStocks = stockList.slice(0, 3);
    const earlierStocks = stockList.slice(3);

    return (
        <MobileAppLayout>
            {/* 1. Header (Avatar 40 & Keranjang Saham) */}
            <MobileHeader />

            <div className="space-y-3 pt-1">
                {/* 1. Section Container Putih: Transaksi / Daftar Saham (Section 6.9 in desain.md) */}
                <section className="mx-1 rounded-[24px] bg-white p-4 border border-zinc-200 shadow-xs space-y-3.5">

                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari ticker atau nama saham..."
                            className="w-full h-11 pl-10 pr-9 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    {/* Bursa Pill Tabs (All, IDX, NYSE) */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleBursaFilter('all')}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                selectedBursa === 'all'
                                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBursaFilter('IDX')}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                selectedBursa === 'IDX'
                                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            IDX
                        </button>
                    </div>

                    {/* Sektor Badges (Horizontal Scroll) */}
                    {availableSectors.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                            <button
                                type="button"
                                onClick={() => handleSectorFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer ${
                                    selectedSector === 'all'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-emerald-500'
                                }`}
                            >
                                Semua Sektor
                            </button>
                            {availableSectors.map((sector) => (
                                <button
                                    key={sector}
                                    type="button"
                                    onClick={() => handleSectorFilter(sector)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer ${
                                        selectedSector === sector
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-emerald-500'
                                    }`}
                                >
                                    {sector}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Group Header "Hari Ini" dengan garis horizontal Hijau (Section 6.9) */}
                    {todayStocks.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[12px] font-semibold text-emerald-600 whitespace-nowrap">
                                    Hari Ini
                                </span>
                            </div>

                            <div className="space-y-2">
                                {todayStocks.map((stock) => {
                                    const isAdded =
                                        basketStocks.includes(stock.ticker) ||
                                        basketStocks.includes(stock.ticker.replace('.JK', ''));

                                    return (
                                        <StockExploreCard
                                            key={stock.id}
                                            ticker={stock.ticker}
                                            name={stock.name}
                                            bursa={stock.bursa || 'IDX'}
                                            price={stock.latest_price?.close_price}
                                            changePercent={stock.change_percent}
                                            recentPrices={stock.recent_prices}
                                            isAdded={isAdded}
                                            onActionClick={() => handleOpenModal(stock)}
                                            onClick={() => handleOpenModal(stock)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Group Header "Bursa Terkini" dengan garis horizontal Abu-Abu (Section 6.9) */}
                    {earlierStocks.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[12px] font-medium text-zinc-500 whitespace-nowrap">
                                    Emiten Lainnya
                                </span>
                            </div>

                            <div className="space-y-2">
                                {earlierStocks.map((stock) => {
                                    const isAdded =
                                        basketStocks.includes(stock.ticker) ||
                                        basketStocks.includes(stock.ticker.replace('.JK', ''));

                                    return (
                                        <StockExploreCard
                                            key={stock.id}
                                            ticker={stock.ticker}
                                            name={stock.name}
                                            bursa={stock.bursa || 'IDX'}
                                            price={stock.latest_price?.close_price}
                                            changePercent={stock.change_percent}
                                            recentPrices={stock.recent_prices}
                                            isAdded={isAdded}
                                            onActionClick={() => handleOpenModal(stock)}
                                            onClick={() => handleOpenModal(stock)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {stockList.length === 0 && (
                        <div className="py-12 text-center text-xs text-zinc-500">
                            Tidak ada saham yang sesuai dengan filter pencarian.
                        </div>
                    )}
                </section>
            </div>

            {/* Bottom Page Sheet Analisis & Tambah ke Keranjang */}
            <StockAnalysisSheet
                stock={selectedStockForModal}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToBasket={handleAddToBasket}
                isAlreadyInBasket={isCurrentStockInBasket}
                timeframeLimits={timeframe_limits}
            />

            {/* Bottom Nav Floating Pill */}
            <FloatingBottomNav />
        </MobileAppLayout>
    );
}
