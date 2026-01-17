import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getProfile } from '@/actions/profile'
import CalculatorPage from '@/components/pages/CalculatorPage'
import getQueryClient from '@/app/get-query-client'

export default async function Calculator() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['profile', 'get'],
    queryFn: getProfile,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalculatorPage />
    </HydrationBoundary>
  )
}
