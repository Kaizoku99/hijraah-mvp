import { useEffect, useState } from 'react';
import { HijraahChatMessage } from '@/hooks/useHijraahChat';

interface ChatLiveRegionProps {
    messages: HijraahChatMessage[];
    isStreaming: boolean;
}

export function ChatLiveRegion({ messages, isStreaming }: ChatLiveRegionProps) {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        // Only announce when streaming finishes and we have a new assistant message
        if (!isStreaming && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                const content = lastMessage.content;
                // Clean up any internal tags if present (though displayMessages usually handles this)
                const cleanContent = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/, "").trim();
                setAnnouncement(cleanContent);
            }
        }
    }, [isStreaming, messages]);

    return (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
        </div>
    );
}
