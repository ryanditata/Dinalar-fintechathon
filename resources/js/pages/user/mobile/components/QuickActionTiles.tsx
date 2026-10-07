import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { type SharedData } from '@/types';

export function QuickActionTiles() {
    const pageProps = usePage<SharedData>().props;
    const basketTickers = (pageProps.basket_tickers as string[]) || [];
    const basketCount = basketTickers.length;

    const tiles = [
        {
            title: 'Eksplorasi Saham',
            href: '/user/saham',
            image: '/images/saham.png',
            badge: null,
        },
        {
            title: 'Riwayat Portofolio',
            href: '/user/analyze/history',
            image: '/images/riwayat.png',
            badge: null,
        },
        {
            title: 'Keranjang Saham',
            href: '/user/analyze/keranjang',
            image: '/images/keranjang.png',
            badge: basketCount > 0 ? basketCount : null,
        },
    ];

    return (
        <section aria-label="Aksi Cepat" className="mx-3 grid grid-cols-3 gap-2.5">
            {tiles.map((tile) => (
                <Link
                    key={tile.title}
                    href={tile.href}
                    className="relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 transition-all duration-150 group"
                >
                    <div className="size-9 flex items-center justify-center shrink-0">
                        <img
                            src={tile.image}
                            alt={tile.title}
                            className="size-9 object-contain drop-shadow-xs transition-transform duration-200 select-none"
                            loading="lazy"
                        />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-700 text-center leading-tight mt-1 line-clamp-2 w-full px-0.5">
                        {tile.title}
                    </span>
                </Link>
            ))}
        </section>
    );
}

export default QuickActionTiles;
