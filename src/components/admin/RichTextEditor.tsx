'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Toggle } from '@/components/ui/toggle';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
        ],
        content,
        editorProps: {
            attributes: {
                className: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setIsLinkDialogOpen(false);
        setLinkUrl('');
    };

    const addImage = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
        }
        setIsImageDialogOpen(false);
        setImageUrl('');
    };

    return (
        <div className={`border rounded-md ${className}`}>
            <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'left' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                >
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'center' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                >
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'right' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                >
                    <AlignRight className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Toggle size="sm" pressed={editor.isActive('link')}>
                            <LinkIcon className="h-4 w-4" />
                        </Toggle>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Link</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                            <Button onClick={setLink}>Add</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                    <DialogTrigger asChild>
                        <Toggle size="sm" pressed={editor.isActive('image')}>
                            <ImageIcon className="h-4 w-4" />
                        </Toggle>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Image</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Image URL"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <Button onClick={addImage}>Add</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
