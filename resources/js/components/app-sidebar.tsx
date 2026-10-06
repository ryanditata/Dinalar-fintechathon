import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CloudDownload, History, Layers, LayoutDashboard, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const dashboardUrl = auth.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
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
                title: 'Eksplorasi Saham',
                href: '/user/saham',
                icon: TrendingUp,
            },
            {
                title: 'Keranjang Saham',
                href: '/user/analyze/keranjang',
                icon: ShoppingBag,
            },
            {
                title: 'Riwayat Portofolio',
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
                <NavMain items={mainNavItems} label="Platform" />
                {adminItems.length > 0 && <NavMain items={adminItems} label="Manajemen User" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
