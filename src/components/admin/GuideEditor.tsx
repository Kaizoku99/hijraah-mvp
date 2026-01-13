'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Wand2 } from 'lucide-react';
import Link from 'next/link';

// Categories matching the DB schema/enum
const CATEGORIES = [
    'General',
    'Express Entry',
    'Provincial Nominee Programs',
    'Family Sponsorship',
    'Work Permits',
    'Study Permits',
    'Citizenship',
    'Refugee Status',
];

interface GuideEditorProps {
    guideId?: number; // If present, edit mode
}

export default function GuideEditor({ guideId }: GuideEditorProps) {
    const router = useRouter();
    const [titleEn, setTitleEn] = useState('');
    const [contentEn, setContentEn] = useState('');
    const [excerptEn, setExcerptEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [contentAr, setContentAr] = useState('');
    const [excerptAr, setExcerptAr] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('General');
    const [isPublished, setIsPublished] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    // Fetch guide data if editing
    const { data: guide, isLoading: isLoadingGuide } = trpc.guides.byId.useQuery(
        { id: guideId! },
        { enabled: !!guideId }
    );

    // Auto-fill form when guide loaded
    useEffect(() => {
        if (guide) {
            setTitleEn(guide.titleEn);
            setContentEn(guide.contentEn);
            setExcerptEn(guide.excerptEn || '');
            setTitleAr(guide.titleAr);
            setContentAr(guide.contentAr);
            setExcerptAr(guide.excerptAr || '');
            setSlug(guide.slug);
            setCategory(guide.category);
            setIsPublished(guide.isPublished);
        }
    }, [guide]);

    // Generate slug from title
    useEffect(() => {
        if (!guideId && titleEn) {
            setSlug(
                titleEn
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
            );
        }
    }, [titleEn, guideId]);

    const createMutation = trpc.guides.create.useMutation({
        onSuccess: () => {
            toast.success('Guide created successfully');
            router.push('/admin/guides');
        },
        onError: (error) => toast.error(error.message),
    });

    const updateMutation = trpc.guides.update.useMutation({
        onSuccess: () => {
            toast.success('Guide updated successfully');
            router.push('/admin/guides');
        },
        onError: (error) => toast.error(error.message),
    });

    const translateMutation = trpc.guides.translate.useMutation({
        onSuccess: (data) => {
            setTitleAr(data.titleAr);
            setContentAr(data.contentAr);
            setExcerptAr(data.excerptAr);
            toast.success('Content translated successfully');
            setIsTranslating(false);
        },
        onError: (error) => {
            toast.error('Translation failed: ' + error.message);
            setIsTranslating(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titleEn || !contentEn || !slug) {
            toast.error('Please fill in required fields (Title EN, Content EN, Slug)');
            return;
        }

        const payload = {
            titleEn,
            contentEn,
            excerptEn,
            titleAr,
            contentAr,
            excerptAr,
            slug,
            category,
            isPublished,
        };

        if (guideId) {
            updateMutation.mutate({ id: guideId, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleTranslate = () => {
        if (!titleEn || !contentEn) {
            toast.error('Please enter English title and content first');
            return;
        }

        setIsTranslating(true);
        translateMutation.mutate({
            titleEn,
            contentEn,
            excerptEn,
        });
    };

    if (guideId && isLoadingGuide) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/guides">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">
                    {guideId ? 'Edit Guide' : 'Create New Guide'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="md:col-span-2 space-y-6">

                        {/* English Section */}
                        <div className="space-y-4 border p-4 rounded-lg bg-card">
                            <h2 className="text-lg font-semibold">English Content</h2>
                            <div className="space-y-2">
                                <Label htmlFor="titleEn">Title (Required)</Label>
                                <Input
                                    id="titleEn"
                                    value={titleEn}
                                    onChange={(e) => setTitleEn(e.target.value)}
                                    placeholder="Guide title in English"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="guide-url-slug"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerptEn">Excerpt</Label>
                                <Textarea
                                    id="excerptEn"
                                    value={excerptEn}
                                    onChange={(e) => setExcerptEn(e.target.value)}
                                    placeholder="Short summary..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Content (Required)</Label>
                                <RichTextEditor
                                    content={contentEn}
                                    onChange={setContentEn}
                                    placeholder="Write guide content here..."
                                />
                            </div>
                        </div>

                        {/* Translation Button */}
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleTranslate}
                                disabled={isTranslating || !titleEn || !contentEn}
                                className="gap-2"
                            >
                                {isTranslating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="h-4 w-4" />
                                )}
                                Auto-Translate to Arabic
                            </Button>
                        </div>

                        {/* Arabic Section */}
                        <div className="space-y-4 border p-4 rounded-lg bg-card" dir="rtl">
                            <h2 className="text-lg font-semibold">المحتوى العربي</h2>
                            <div className="space-y-2">
                                <Label htmlFor="titleAr">العنوان</Label>
                                <Input
                                    id="titleAr"
                                    value={titleAr}
                                    onChange={(e) => setTitleAr(e.target.value)}
                                    placeholder="عنوان الدليل بالعربية"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerptAr">مقتطف</Label>
                                <Textarea
                                    id="excerptAr"
                                    value={excerptAr}
                                    onChange={(e) => setExcerptAr(e.target.value)}
                                    placeholder="ملخص قصير..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>المحتوى</Label>
                                <RichTextEditor
                                    content={contentAr}
                                    onChange={setContentAr}
                                    placeholder="اكتب محتوى الدليل هنا..."
                                    className="text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="border p-4 rounded-lg bg-card space-y-4">
                            <h3 className="font-medium">Publishing</h3>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="published">Published</Label>
                                <Switch
                                    id="published"
                                    checked={isPublished}
                                    onCheckedChange={setIsPublished}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                {guideId ? 'Update Guide' : 'Create Guide'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
