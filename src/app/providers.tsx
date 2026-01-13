'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from '@/lib/trpc'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/ErrorBoundary'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ThemeProvider defaultTheme="light">
              <TooltipProvider>
                <Toaster />
                {children}
              </TooltipProvider>
            </ThemeProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  )
}
