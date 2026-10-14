import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useTranslation } from '@/i18n/LanguageContext';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CloudDownload, History, LayoutDashboard, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
    const dashboardUrl = auth.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

    const mainNavItems: NavItem[] = [
        {
            title: auth.user.role === 'admin' ? 'Dashboard' : t('nav.dashboard', 'Dashboard'),
            href: dashboardUrl,
            icon: LayoutDashboard,
        },
    ];

    if (auth.user.role === 'admin') {
        mainNavItems.push(
            {
                title: 'Data Saham',
                href: '/admin/saham',
                icon: TrendingUp,
            },
            {
                title: 'Scraping Data',
                href: '/admin/scraper',
                icon: CloudDownload,
            },
            {
                title: 'History',
                href: '/admin/history',
                icon: History,
            }
        );
    } else {
        mainNavItems.push(
            {
                title: t('nav.explore_stocks', 'Eksplorasi Saham'),
                href: '/user/saham',
                icon: TrendingUp,
            },
            {
                title: t('nav.basket_stocks', 'Keranjang Saham'),
                href: '/user/analyze/keranjang',
                icon: ShoppingBag,
            },
            {
                title: t('nav.portfolio_history', 'Riwayat Portofolio'),
                href: '/user/analyze/history',
                icon: History,
            }
        );
    }

    const adminItems: NavItem[] = [];

    if (auth.user.role === 'admin') {
        adminItems.push({
            title: 'User',
            href: '/admin/users',
            icon: Users,
        });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label={auth.user.role === 'admin' ? 'Platform' : t('nav.platform', 'Platform')} />
                {adminItems.length > 0 && <NavMain items={adminItems} label="Manajemen User" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
