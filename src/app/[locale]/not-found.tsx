'use client'

import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"

export default function NotFound() {
  const { language } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
        </Link>
      </div>
    </div>
  )
}
