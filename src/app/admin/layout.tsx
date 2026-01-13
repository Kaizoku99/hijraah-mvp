'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'admin') {
                router.push('/dashboard');
            } else {
                setIsAdmin(true);
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b bg-muted/30">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/guides" className="font-bold text-xl">
                            Admin Dashboard
                        </Link>
                        <nav className="flex gap-4">
                            <Link href="/admin/guides" className="text-sm font-medium hover:text-primary transition-colors">
                                Guides
                            </Link>
                            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                                App Dashboard
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Logged in as {user?.email}</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 container py-8">
                {children}
            </main>
        </div>
    );
}
