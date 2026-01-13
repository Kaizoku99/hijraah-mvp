'use client'

import dynamic from 'next/dynamic'

const SopNewPage = dynamic(() => import('@/components/pages/SopNewPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

export default function SopNew() {
  return <SopNewPage />
}
