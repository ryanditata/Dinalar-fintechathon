import React from 'react';

/**
 * Skeleton placeholder untuk daftar kartu saham pada halaman Eksplorasi Saham (/user/saham)
 */
export function StockCardsSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2 pt-1 animate-pulse" aria-busy="true" aria-label="Memuat daftar saham...">
            <div className="h-4 w-20 bg-zinc-200/80 rounded-full mb-2" />
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="w-full rounded-2xl bg-white border border-zinc-200/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                >
                    {/* Kiri: Ticker & Nama */}
                    <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-14 bg-zinc-200 rounded-md" />
                            <div className="h-3.5 w-10 bg-zinc-100 rounded-md" />
                        </div>
                        <div className="h-3 w-32 bg-zinc-100 rounded-md" />
                    </div>

                    {/* Tengah: Sparkline placeholder */}
                    <div className="w-16 h-8 bg-zinc-100/70 rounded-md hidden sm:block" />

                    {/* Kanan: Harga & Tombol */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right space-y-1.5">
                            <div className="h-4 w-16 bg-zinc-200 rounded-md ml-auto" />
                            <div className="h-3 w-12 bg-zinc-100 rounded-md ml-auto" />
                        </div>
                        <div className="size-8 rounded-full bg-zinc-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton placeholder untuk daftar saham pilihan/gainers/losers pada Dashboard (/user/dashboard)
 */
export function DashboardStockCardsSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2.5 animate-pulse" aria-busy="true" aria-label="Memuat data pasar...">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="w-full rounded-2xl bg-white border border-zinc-200/80 p-3.5 space-y-2.5 shadow-2xs"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-14 bg-zinc-200 rounded-md" />
                                <div className="h-3.5 w-10 bg-zinc-100 rounded-md" />
                            </div>
                            <div className="h-3 w-28 bg-zinc-100 rounded-md" />
                        </div>
                        <div className="h-6 w-16 bg-zinc-100 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                        <div className="h-4 w-20 bg-zinc-200 rounded-md" />
                        <div className="h-3.5 w-14 bg-zinc-100 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton placeholder untuk daftar riwayat portofolio AI (/user/analyze/history)
 */
export function HistoryListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Memuat riwayat optimasi...">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="w-full rounded-2xl bg-white border border-zinc-200/80 p-4 space-y-3 shadow-2xs"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-40 bg-zinc-200 rounded-md" />
                            <div className="h-3 w-24 bg-zinc-100 rounded-md" />
                        </div>
                        <div className="size-7 bg-zinc-100 rounded-lg" />
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                        <div className="h-5 w-12 bg-zinc-100 rounded-full" />
                        <div className="h-5 w-12 bg-zinc-100 rounded-full" />
                        <div className="h-5 w-12 bg-zinc-100 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <div className="h-3.5 w-24 bg-zinc-100 rounded-md" />
                        <div className="h-4 w-28 bg-zinc-200 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
