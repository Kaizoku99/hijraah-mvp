import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

// cache() ensures that the same client is returned for a single request
const getQueryClient = cache(() => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
}))

export default getQueryClient
