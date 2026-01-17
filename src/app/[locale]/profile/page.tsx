import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getProfile } from '@/actions/profile'
import { queryKeys } from '@/lib/query-keys'
import getQueryClient from '@/app/get-query-client'
import ProfilePage from '@/components/pages/ProfilePage'

export default async function Profile() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: getProfile,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfilePage />
    </HydrationBoundary>
  )
}
