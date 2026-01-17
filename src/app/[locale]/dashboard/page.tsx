import { Suspense } from 'react'
import { getProfile } from "@/actions/profile"
import { getLatestCrs, getCrsHistory } from "@/actions/crs"
import { getChecklists, getDocuments } from "@/actions/documents"
import { listSops } from "@/actions/sop"
import { listConversations } from "@/actions/chat"
import DashboardClient from './DashboardClient'
import { Skeleton } from "@/components/ui/skeleton"

import { getLatestAustraliaPoints } from "@/actions/points-test"

export default async function Dashboard() {
  // Fetch all data in parallel on the server
  // This reduces client-side waterfall and provides typed initial data
  const [
    profile,
    latestCrs,
    latestAustraliaPoints,
    crsHistory,
    checklists,
    documents,
    sops,
    conversations
  ] = await Promise.all([
    getProfile().catch(() => null),
    getLatestCrs().catch(() => null),
    getLatestAustraliaPoints().catch(() => null),
    getCrsHistory().catch(() => []),
    getChecklists().catch(() => []),
    getDocuments().catch(() => []),
    listSops().catch(() => []),
    listConversations().catch(() => [])
  ])

  const initialData = {
    profile,
    latestCrs,
    latestAustraliaPoints,
    crsHistory,
    checklists,
    documents,
    sops,
    conversations
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
