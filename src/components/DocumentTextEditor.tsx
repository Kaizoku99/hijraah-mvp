import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Languages, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"

interface DocumentTextEditorProps {
    initialText: string
    isRtl: boolean
    isTranslating: boolean
    onTextChange: (text: string) => void
    onTranslate: () => void
}

export function DocumentTextEditor({
    initialText,
    isRtl,
    isTranslating,
    onTextChange,
    onTranslate,
}: DocumentTextEditorProps) {
    const [text, setText] = React.useState(initialText)

    // Use debounced value to trigger updates
    const debouncedText = useDebounce(text, 500)

    // Sync internal state when doc changes (e.g. user selects different doc)
    React.useEffect(() => {
        setText(initialText)
    }, [initialText])

    // Propagate changes when debounced value changes
    React.useEffect(() => {
        if (debouncedText !== initialText) {
            onTextChange(debouncedText)
        }
    }, [debouncedText, onTextChange, initialText])

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(text)
        toast.success(isRtl ? "تم النسخ" : "Copied to clipboard")
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={cn(
                        "min-h-[400px] font-mono text-sm resize-y p-4 leading-relaxed",
                        isRtl && "rtl text-right"
                    )}
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        {isRtl ? "نسخ" : "Copy"}
                    </Button>
                </div>
                <Button
                    onClick={onTranslate}
                    disabled={isTranslating}
                    className="gap-2"
                >
                    {isTranslating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Languages className="h-4 w-4" />
                    )}
                    {isRtl ? "ترجمة" : "Translate"}
                </Button>
            </div>
        </div>
    )
}
