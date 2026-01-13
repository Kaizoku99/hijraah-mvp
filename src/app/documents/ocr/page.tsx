'use client'

import dynamic from 'next/dynamic'

const DocumentOcrPage = dynamic(() => import('@/components/pages/DocumentOcrPage'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

export default function DocumentOcr() {
  return <DocumentOcrPage />
}
