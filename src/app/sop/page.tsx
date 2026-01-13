'use client'

import dynamic from 'next/dynamic'

const SopListPage = dynamic(() => import('@/components/pages/SopListPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

export default function SopList() {
  return <SopListPage />
}
