'use client'

import { Bot } from "lucide-react"
import { Loader } from "@/components/ai-elements/loader"

/**
 * Typing indicator component displayed when the AI is generating a response.
 */
export function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Loader size={14} />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  )
}
