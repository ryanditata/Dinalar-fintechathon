import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { History, LayoutDashboard, ShoppingBag, TrendingUp, User } from 'lucide-react';

interface NavTabItem {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    isActive: (url: string) => boolean;
    hasBadge?: boolean;
}

export function MobileBottomNav() {
    const { auth, basket_count } = usePage<SharedData>().props;
    const currentUrl = usePage().url;

    // Hanya tampilkan jika user sudah login dan ber-role 'user'
    if (!auth?.user || auth.user.role !== 'user') {
        return null;
    }

    const navItems: NavTabItem[] = [
        {
            name: 'Beranda',
            href: '/user/dashboard',
            icon: LayoutDashboard,
            isActive: (url) => url.startsWith('/user/dashboard'),
        },
        {
            name: 'Saham',
            href: '/user/saham',
            icon: TrendingUp,
            isActive: (url) => url.startsWith('/user/saham'),
        },
        {
            name: 'Keranjang',
            href: '/user/analyze/keranjang',
            icon: ShoppingBag,
            isActive: (url) => url.startsWith('/user/analyze/keranjang'),
            hasBadge: true,
        },
        {
            name: 'Riwayat',
            href: '/user/analyze/history',
            icon: History,
            isActive: (url) => url.startsWith('/user/analyze/history') || url.startsWith('/user/analyze/result'),
        },
        {
            name: 'Profil',
            href: '/settings/profile',
            icon: User,
            isActive: (url) => url.startsWith('/settings'),
        },
    ];

    const count = typeof basket_count === 'number' ? basket_count : 0;

    return (
        <nav
            aria-label="Mobile Navigation"
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.35)]"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
                {navItems.map((item) => {
                    const active = item.isActive(currentUrl);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            className={`flex flex-col items-center justify-center flex-1 h-full py-1 px-1 relative transition-all duration-150 select-none ${
                                active
                                    ? 'text-emerald-500 font-semibold'
                                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                            }`}
                        >
                            {/* Icon Container with relative positioning for badge */}
                            <div className="relative flex items-center justify-center">
                                <Icon
                                    className={`size-5 transition-transform duration-200 ${
                                        active ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                                    }`}
                                />

                                {/* Badge Counter untuk Keranjang */}
                                {item.hasBadge && count > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center shadow-xs ring-1 ring-background animate-in zoom-in-75 duration-150">
                                        {count > 99 ? '99+' : count}
                                    </span>
                                )}
                            </div>

                            {/* Label Text */}
                            <span
                                className={`text-[10.5px] mt-1 tracking-tight leading-none truncate max-w-[64px] ${
                                    active ? 'text-emerald-500' : 'text-muted-foreground'
                                }`}
                            >
                                {item.name}
                            </span>

                            {/* Active Indicator Pip */}
                            {active && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
