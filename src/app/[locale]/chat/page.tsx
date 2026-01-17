'use client'

import dynamic from 'next/dynamic'

// Dynamically import the Chat component with no SSR
// This is needed because useChat uses browser-only APIs
const ChatPage = dynamic(() => import('@/components/pages/ChatPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

export default function Chat() {
  return <ChatPage />
}
