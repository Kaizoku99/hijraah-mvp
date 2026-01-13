'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminGuidesPage() {
    const { language } = useLanguage();
    const [page, setPage] = useState(0);
    const limit = 20;

    const { data, isLoading, refetch } = trpc.guides.listAll.useQuery({
        limit,
        offset: page * limit,
    });

    const togglePublishMutation = trpc.guides.togglePublish.useMutation({
        onSuccess: () => {
            toast.success('Guide status updated');
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = trpc.guides.delete.useMutation({
        onSuccess: () => {
            toast.success('Guide deleted');
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleTogglePublish = (id: number, currentStatus: boolean) => {
        togglePublishMutation.mutate({ id, isPublished: !currentStatus });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this guide?')) {
            deleteMutation.mutate({ id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Immigration Guides</h1>
                <Link href="/admin/guides/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Guide
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title (EN)</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No guides found. Create your first one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.map((guide) => (
                                <TableRow key={guide.id}>
                                    <TableCell className="font-medium">{guide.titleEn}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{guide.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                guide.isPublished
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-100/80'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100/80'
                                            }
                                        >
                                            {guide.isPublished ? 'Published' : 'Draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(guide.updatedAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleTogglePublish(guide.id, guide.isPublished)}
                                                title={guide.isPublished ? 'Unpublish' : 'Publish'}
                                            >
                                                {guide.isPublished ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-primary" />
                                                )}
                                            </Button>
                                            <Link href={`/admin/guides/${guide.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(guide.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {data && (
                <div className="flex items-center justify-center gap-4 text-sm">
                    <span>
                        Page {page + 1} of {Math.ceil((data?.length || 0) / limit)}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(page + 1) * limit >= (data?.length || 0)}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
