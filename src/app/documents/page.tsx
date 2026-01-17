import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getChecklists, getDocuments } from '@/actions/documents'
import { getProfile } from '@/actions/profile'
import DocumentsPage from '@/components/pages/DocumentsPage'
import getQueryClient from '../get-query-client'

export default async function Documents() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['documents', 'checklists'],
      queryFn: getChecklists,
    }),
    queryClient.prefetchQuery({
      queryKey: ['documents', 'list'],
      queryFn: getDocuments,
    }),
    queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: getProfile,
    })
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DocumentsPage />
    </HydrationBoundary>
  )
}
