import { Link, usePage } from '@inertiajs/react';
import { Home, TrendingUp, UserRound, History } from 'lucide-react';
import React from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: typeof Home;
    isActive: (url: string) => boolean;
}

export function FloatingBottomNav() {
    const currentUrl = usePage().url;

    const items: NavItem[] = [
        {
            name: 'Home',
            href: '/user/dashboard',
            icon: Home,
            isActive: (url) => url.startsWith('/user/dashboard'),
        },
        {
            name: 'Saham',
            href: '/user/saham',
            icon: TrendingUp,
            isActive: (url) => url.startsWith('/user/saham'),
        },
        {
            name: 'History',
            href: '/user/analyze/history',
            icon: History,
            isActive: (url) => url.startsWith('/user/analyze/history') || url.startsWith('/user/analyze/result') || url.startsWith('/user/analyze/keranjang'),
        },
        {
            name: 'Profile',
            href: '/settings/profile',
            icon: UserRound,
            isActive: (url) => url.startsWith('/settings'),
        },
    ];

    return (
        <aside
            aria-label="Floating Navigation"
            className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
            style={{
                bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            }}
        >
            <nav
                className="flex items-center gap-1 p-1.5 h-14 bg-emerald-950 rounded-full pointer-events-auto border border-emerald-500/20"
            >
                {items.map((item) => {
                    const active = item.isActive(currentUrl);
                    const Icon = item.icon;

                    if (active) {
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current="page"
                                className="flex items-center gap-2 h-11 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold transition-all duration-200 shadow-sm"
                            >
                                <Icon className="size-5 stroke-[2.2] shrink-0 text-white" />
                                <span className="tracking-tight leading-none whitespace-nowrap">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center justify-center size-11 rounded-full text-white hover:bg-emerald-600 transition-colors duration-150 active:scale-95"
                            aria-label={item.name}
                        >
                            <Icon className="size-5 stroke-[1.8] shrink-0" />
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export default FloatingBottomNav;
