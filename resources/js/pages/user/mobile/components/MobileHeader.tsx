import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
import React from 'react';

interface MobileHeaderProps {
    basketCount?: number;
}

export function MobileHeader({
    basketCount: customBasketCount,
}: MobileHeaderProps = {}) {
    const pageProps = usePage<SharedData>().props;
    const { auth } = pageProps;
    const getInitials = useInitials();

    const serverBasketTickers = (pageProps.basket_tickers as string[]) || [];
    const basketCount =
        customBasketCount !== undefined
            ? customBasketCount
            : (pageProps.basket_count as number | undefined) ?? serverBasketTickers.length;

    return (
        <header className="flex items-center justify-between px-4 pt-3 pb-2 w-full max-w-[430px] mx-auto select-none">
            {/* Kiri: Avatar Pengguna 40x40pt */}
            <Link
                href="/settings/profile"
                className="size-10 rounded-full overflow-hidden shrink-0 active:scale-95 transition-transform"
                aria-label="Profil Pengguna"
            >
                <Avatar className="size-10 rounded-full">
                    <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || 'User'} />
                    <AvatarFallback className="size-10 rounded-full bg-gradient-to-tr from-rose-400 to-amber-300 text-white font-bold text-sm">
                        {auth?.user?.name ? getInitials(auth.user.name) : 'U'}
                    </AvatarFallback>
                </Avatar>
            </Link>

            {/* Kanan: Tombol Keranjang Saham */}
            <Link
                href="/user/analyze/keranjang"
                className="relative size-10 rounded-full bg-white flex items-center justify-center text-zinc-900 shadow-xs border border-zinc-200 hover:bg-zinc-50 active:scale-95 transition-all"
                aria-label={`Keranjang Saham (${basketCount} dipilih)`}
            >
                <ShoppingBag className="size-5 stroke-[1.75]" />

                {/* Badge Jumlah Item di Keranjang */}
                {basketCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-zinc-100">
                        {basketCount > 9 ? '9+' : basketCount}
                    </span>
                )}
            </Link>
        </header>
    );
}

export default MobileHeader;
