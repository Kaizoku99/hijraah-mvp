import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { listSops } from '@/actions/sop'
import SopListPage from '@/components/pages/SopListPage'
import getQueryClient from '@/app/get-query-client'

export default async function SopList() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['sop', 'list'],
    queryFn: listSops,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SopListPage />
    </HydrationBoundary>
  )
}
