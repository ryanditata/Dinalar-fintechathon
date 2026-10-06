import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => {
                    const isActive =
                        page.url === item.href ||
                        (item.href !== '/admin/dashboard' &&
                            item.href !== '/user/dashboard' &&
                            page.url.startsWith(item.href));

                    return (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-600 dark:data-[active=true]:text-emerald-400 [&>span]:text-emerald-600 dark:[&>span]:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400'
                                        : 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:[&>svg]:text-emerald-600 dark:hover:[&>svg]:text-emerald-400'
                                }
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}
                                >
                                    {item.icon && (
                                        <item.icon
                                            className={`h-4 w-4 shrink-0 ${
                                                isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                                            }`}
                                        />
                                    )}
                                    <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
