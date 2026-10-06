import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData, type SharedData, type User } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    Loader2,
    MoreHorizontal,
    Plus,
    Radio,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Sparkles,
    Trash,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Manajemen User', href: '/admin/users' },
];

export interface UserStatistics {
    total_users: number;
    online_users_count: number;
    admin_count: number;
    user_role_count: number;
    new_users_7d: number;
}

interface Props {
    users: PaginatedData<User>;
    filters?: {
        search?: string;
        role?: string;
        status?: string;
    };
    statistics?: UserStatistics;
}

export default function UserIndex({ users, filters = {}, statistics }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const getInitials = useInitials();

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Default fallback statistics if backend hasn't supplied statistics prop yet
    const stats: UserStatistics = statistics || {
        total_users: users.total || users.data.length || 0,
        online_users_count: users.data.filter((u) => u.is_online).length || 0,
        admin_count: users.data.filter((u) => u.role === 'admin').length || 0,
        user_role_count: users.data.filter((u) => u.role === 'user').length || 0,
        new_users_7d: users.data.length || 0,
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                toast.success('Pengguna baru berhasil ditambahkan');
            },
            onError: () => {
                toast.error('Gagal menambahkan pengguna baru');
            },
        });
    };

    // Watch flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success as string);
        }
        if (flash?.error) {
            toast.error(flash.error as string);
        }
    }, [flash]);

    // Debounced search & filter handler
    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentSearch = filters.search || '';
            const currentRole = filters.role || 'all';
            const currentStatus = filters.status || 'all';

            if (searchQuery !== currentSearch || selectedRole !== currentRole || selectedStatus !== currentStatus) {
                router.get(
                    '/admin/users',
                    {
                        search: searchQuery || undefined,
                        role: selectedRole !== 'all' ? selectedRole : undefined,
                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
                    },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery, selectedRole, selectedStatus]);

    const handleUpdateRole = (user: User, newRole: string) => {
        if (user.id === auth.user.id) return;
        setIsUpdating(user.id);
        router.patch(
            `/admin/users/${user.id}/role`,
            { role: newRole },
            {
                preserveScroll: true,
                onFinish: () => setIsUpdating(null),
            }
        );
    };

    const handleDelete = (userId: number) => {
        if (userId === auth.user.id) return;
        setIsDeleting(userId);
        router.delete(`/admin/users/${userId}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen User" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                            <Users className="h-7 w-7 text-primary" />
                            Manajemen User
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola akun pengguna, status akses, serta hak akses role sistem.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ['users', 'statistics'] })}
                            className="gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh</span>
                        </Button>
                    </div>
                </div>

                {/* 1. METRIC CARDS (4 Columns Shadcn Grid) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: User Online */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">User Online</CardTitle>
                            <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {stats.online_users_count.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aktif</span> dalam 5 menit
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Total Pengguna */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Pengguna</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-foreground">
                                {stats.total_users.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Akun terdaftar di database
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Komposisi Role */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Komposisi Role</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                                <span className="text-purple-600 dark:text-purple-400">Admin: {stats.admin_count}</span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400">User: {stats.user_role_count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Peran akun sistem
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Pendaftar Baru */}
                    <Card className="border-border/60 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pendaftar Baru</CardTitle>
                            <UserPlus className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-foreground">
                                {stats.new_users_7d.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dalam 7 hari terakhir
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. ADVANCED FILTER BAR & USER LIST SECTION */}
                <div className="space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">Daftar Pengguna Sistem</h2>
                            <p className="text-xs text-muted-foreground">
                                Total {users.total} user terdaftar di sistem.
                            </p>
                        </div>

                        {/* Filters & Action Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <div className="relative w-full sm:w-44 md:w-48 lg:w-52">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    className="pl-8 pr-8 text-xs sm:text-sm h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                        title="Reset pencarian"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Segmented Control / Tabs: Role Filter */}
                            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs h-9 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('all')}
                                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedRole === 'all'
                                        ? 'bg-background text-foreground shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('admin')}
                                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedRole === 'admin'
                                        ? 'bg-background text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('user')}
                                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${selectedRole === 'user'
                                        ? 'bg-background text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    User
                                </button>
                            </div>

                            {/* Status Filter Dropdown */}
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[125px] shrink-0 h-9 text-xs bg-background border-border/70 rounded-md focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Action Button: Create User Modal Trigger */}
                            <Dialog
                                open={isCreateModalOpen}
                                onOpenChange={(open) => {
                                    setIsCreateModalOpen(open);
                                    if (!open) {
                                        reset();
                                        clearErrors();
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="gap-1.5 shadow-xs h-9 cursor-pointer shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        title="Tambah User"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="sm:max-w-md">
                                    <form onSubmit={handleCreateSubmit}>
                                        <DialogHeader>
                                            <DialogTitle>Tambah User Baru</DialogTitle>
                                            <DialogDescription>
                                                Buat akun pengguna baru dengan mengisi formulir di bawah ini.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Nama Lengkap</Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Masukkan nama lengkap"
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="Masukkan email"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Minimal 8 karakter"
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="role">Role</Label>
                                                <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                                                    <SelectTrigger id="role" className="h-9 text-sm bg-background border-border/70 rounded-md shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer w-full">
                                                        <SelectValue placeholder="Pilih Role" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-background border border-border/70 shadow-md">
                                                        <SelectItem value="user">User</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.role} />
                                            </div>
                                        </div>

                                        <DialogFooter className="gap-2 pt-2">
                                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                                Batal
                                            </Button>
                                            <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Simpan
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* 3. TABLE SECTION WITH PRESERVED AVATAR & RADAR PING */}
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-center font-semibold w-[60px]">NO</TableHead>
                                    <TableHead className="font-semibold">Nama</TableHead>
                                    <TableHead className="font-semibold">Email</TableHead>
                                    <TableHead className="text-center font-semibold">Role</TableHead>
                                    <TableHead className="text-center font-semibold">Total Optimasi</TableHead>
                                    <TableHead className="text-center font-semibold">Terdaftar</TableHead>
                                    <TableHead className="text-right font-semibold w-[80px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-36 text-center text-muted-foreground text-xs">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShieldAlert className="h-7 w-7 text-muted-foreground/60" />
                                                <p className="font-medium text-xs sm:text-sm">Tidak ada pengguna ditemukan.</p>
                                                <p className="text-[11px]">
                                                    {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                                                        ? 'Coba sesuaikan kata kunci pencarian atau filter Anda.'
                                                        : 'Belum ada data pengguna yang terdaftar di sistem.'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user, index) => {
                                        const isSelf = user.id === auth.user.id;
                                        const isOnline = user.is_online ?? false;
                                        const isAdmin = user.role === 'admin';

                                        return (
                                            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="text-center font-medium">{(users.from || 1) + index}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar with Radar Ping Indicator */}
                                                        <div className="relative shrink-0">
                                                            <Avatar className="h-8 w-8 overflow-hidden rounded-full border border-border/50">
                                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white font-semibold text-xs">
                                                                    {getInitials(user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span
                                                                className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5"
                                                                title={isOnline ? 'Online (Aktif)' : 'Offline'}
                                                            >
                                                                {isOnline && (
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                )}
                                                                <span
                                                                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ring-2 ring-background ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
                                                                        }`}
                                                                ></span>
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col justify-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-foreground">{user.name}</span>
                                                                {isOnline && (
                                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold">
                                                                        {isSelf ? 'Online (Anda)' : 'Online'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground font-mono">ID: #{user.id}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-medium text-foreground">{user.email}</TableCell>

                                                <TableCell className="text-center">
                                                    <Badge variant={isAdmin ? 'default' : 'secondary'} className={isAdmin ? 'bg-primary text-primary-foreground font-bold' : ''}>
                                                        {isAdmin ? 'Admin' : 'User'}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="inline-flex items-center gap-1.5 font-mono font-bold text-xs rounded-full border-emerald-300 text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                        <Sparkles className="h-3 w-3 shrink-0" />
                                                        <span>{user.portfolio_optimizations_count ?? 0}</span>
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-center text-xs text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer" disabled={isSelf}>
                                                                <span className="sr-only">Buka menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {user.role === 'user' ? (
                                                                <DropdownMenuItem onClick={() => handleUpdateRole(user, 'admin')} disabled={isUpdating === user.id}>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    <span>Jadikan Admin</span>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleUpdateRole(user, 'user')} disabled={isUpdating === user.id}>
                                                                    <ShieldOff className="mr-2 h-4 w-4" />
                                                                    <span>Jadikan User</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                                                        <Trash className="mr-2 h-4 w-4" />
                                                                        <span>Hapus Akun</span>
                                                                    </DropdownMenuItem>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Hapus Akun {user.name}?</DialogTitle>
                                                                        <DialogDescription>
                                                                            Tindakan ini akan menghapus akun pengguna <strong>{user.name}</strong> ({user.email}) beserta seluruh data riwayat optimasi portofolio yang tersimpan. Tindakan ini tidak dapat dibatalkan.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button variant="destructive" onClick={() => handleDelete(user.id)} disabled={isDeleting === user.id}>
                                                                            {isDeleting === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                            Hapus Akun
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {users.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground pt-2">
                            <div>
                                Menampilkan {users.from} hingga {users.to} dari {users.total} data.
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {users.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, { search: searchQuery, role: selectedRole !== 'all' ? selectedRole : undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined }, { preserveState: true })}
                                        className={`h-8 min-w-[32px] px-2 text-xs cursor-pointer ${link.active ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
