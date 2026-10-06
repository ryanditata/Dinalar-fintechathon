import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const isRegularUser = auth?.user?.role === 'user';

    // Jika role bukan 'user' (misal: Admin), pertahankan header default untuk semua ukuran layar
    if (!isRegularUser || !auth?.user) {
        return (
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </header>
        );
    }

    // Untuk role 'user':
    // - Di Mobile (md:hidden): Tampilkan Mobile App Bar Elegan (Logo di kiri, Avatar/User Menu di kanan)
    // - Di Desktop (hidden md:flex): Tetap gunakan SidebarTrigger + Breadcrumbs
    return (
        <header className="shrink-0 border-b border-sidebar-border/50 transition-[width,height] ease-linear">
            {/* Tampilan Desktop untuk User */}
            <div className="hidden md:flex h-16 items-center gap-2 px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Mobile App Bar Elegan untuk User */}
            <div className="flex md:hidden h-14 items-center justify-between px-4 bg-background/95 backdrop-blur-md">
                {/* Brand Logo & Name */}
                <Link href="/user/dashboard" className="flex items-center gap-2.5 active:opacity-80 transition-opacity">
                    <img
                        src="/images/newLogo.png?v=4"
                        alt="Dinalar Logo"
                        className="h-7 w-auto object-contain"
                    />
                    <span className="font-bold text-sm tracking-tight text-emerald-600 dark:text-emerald-400">
                        DINALAR
                    </span>
                </Link>

                {/* Right: User Avatar & Quick Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="User profile menu"
                            className="flex items-center justify-center p-0.5 rounded-full ring-1 ring-border/80 hover:ring-emerald-500/60 transition-all focus:outline-hidden cursor-pointer active:scale-95"
                        >
                            <Avatar className="size-8 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-lg border-border/80">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
