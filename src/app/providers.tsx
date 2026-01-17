'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider, type Language } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import { MobileNav } from '@/components/MobileNav'
import { Provider as AIStoreProvider } from '@ai-sdk-tools/store'

export function Providers({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: Language }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider initialLanguage={initialLanguage}>
          <ThemeProvider defaultTheme="light">
            <AIStoreProvider>
              <TooltipProvider>
                <Toaster />
                <div className="pb-16 md:pb-0">
                  {children}
                </div>
                <MobileNav />
              </TooltipProvider>
            </AIStoreProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
