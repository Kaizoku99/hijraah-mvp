'use client'

import dynamic from 'next/dynamic'

/**
 * Deferred loading of analytics components.
 * These are loaded after hydration to avoid blocking initial render.
 * This follows the bundle-defer-third-party best practice.
 */
const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false }
)

export function DeferredAnalytics() {
  return <SpeedInsights />
}
