'use client'

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "@/components/LanguageToggle"
import { UsageDisplay } from "@/components/UsageDisplay"
import { useQuery } from "@tanstack/react-query"
import { getProfile } from "@/actions/profile"
import { getLatestCrs, getCrsHistory } from "@/actions/crs"
import { getChecklists, getDocuments } from "@/actions/documents"
import { listSops } from "@/actions/sop"
import { listConversations } from "@/actions/chat"
import {
  MessageSquare,
  Calculator,
  FileText,
  BookOpen,
  User,
  LogOut,
  Loader2,
  ArrowRight,
  ArrowRightCircle,
  Crown,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useState, useEffect } from "react"
import OnboardingWizard, { isOnboardingComplete } from "@/components/OnboardingWizard"
import { ImmigrationJourney } from "@/components/ImmigrationJourney"

// Context-aware Focus Card - shows user their next step
function DashboardFocusCard({
  profileCompletion,
  hasCrsScore,
  docCompletion,
  language,
  router
}: {
  profileCompletion: number;
  hasCrsScore: boolean;
  docCompletion: { completed: number; total: number };
  language: string;
  router: ReturnType<typeof useRouter>
}) {
  // Determine user state
  let state: 'profile' | 'crs' | 'documents' | 'complete' = 'profile';

  if (profileCompletion < 100) {
    state = 'profile';
  } else if (!hasCrsScore) {
    state = 'crs';
  } else if (docCompletion.total > 0 && docCompletion.completed < docCompletion.total) {
    state = 'documents';
  } else {
    state = 'complete';
  }

  const content = {
    profile: {
      title: language === "ar" ? "أكمل ملفك الشخصي" : "Complete Your Profile",
      description: language === "ar"
        ? `أنت في ${profileCompletion}% من الطريق! إكمال ملفك الشخصي يزيد من دقة حساب نقاط CRS.`
        : `You are ${profileCompletion}% there. Completing your profile improves CRS score accuracy.`,
      action: language === "ar" ? "الذهاب للملف الشخصي" : "Go to Profile",
      icon: User,
      href: "/profile",
      color: "text-blue-600",
      bg: "bg-blue-50/50 dark:bg-blue-950/20"
    },
    crs: {
      title: language === "ar" ? "احسب نقاط CRS" : "Calculate Your CRS Score",
      description: language === "ar"
        ? "اكتشف مدى أهليتك للهجرة إلى كندا الآن."
        : "Find out your eligibility for Canadian immigration right now.",
      action: language === "ar" ? "بدء الحساب" : "Start Calculator",
      icon: Calculator,
      href: "/calculator",
      color: "text-purple-600",
      bg: "bg-purple-50/50 dark:bg-purple-950/20"
    },
    documents: {
      title: language === "ar" ? "رفع المستندات المطلوبة" : "Upload Required Documents",
      description: language === "ar"
        ? `لديك ${docCompletion.total - docCompletion.completed} مستندات بانتظار الرفع.`
        : `You have ${docCompletion.total - docCompletion.completed} pending documents to upload.`,
      action: language === "ar" ? "عرض القائمة" : "View Checklist",
      icon: FileText,
      href: "/documents",
      color: "text-amber-600",
      bg: "bg-amber-50/50 dark:bg-amber-950/20"
    },
    complete: {
      title: language === "ar" ? "أنت جاهز للتقديم!" : "You're Ready to Apply",
      description: language === "ar"
        ? "تحدث مع مساعدنا الذكي للبدء في إجراءات التقديم."
        : "Talk to our AI assistant to guide you through the submission process.",
      action: language === "ar" ? "تحدث مع هجرة" : "Talk to Hijraah AI",
      icon: Sparkles,
      href: "/chat?new=true",
      color: "text-green-600",
      bg: "bg-green-50/50 dark:bg-green-950/20"
    }
  }[state];

  return (
    <Card className={`mb-6 border-l-4 ${content.bg} overflow-hidden`} style={{ borderLeftColor: 'currentColor' }}>
      <div className={content.color}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <content.icon className="h-6 w-6" />
                {content.title}
              </CardTitle>
              <CardDescription className="text-base">
                {content.description}
              </CardDescription>
            </div>
            <Button onClick={() => router.push(content.href)} className="shrink-0 gap-2">
              {content.action}
              <ArrowRightCircle className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </CardHeader>
      </div>
    </Card>
  );
}

// Usage-based pricing recommendation
function PricingRecommendation({
  sopsCount,
  chatCount,
  checklistCount,
  language,
}: {
  sopsCount: number;
  chatCount: number;
  checklistCount: number;
  language: string;
}) {
  // Determine recommended tier based on usage
  let recommendedTier: 'free' | 'essential' | 'premium' = 'free';
  let reason = '';

  if (sopsCount > 1 || chatCount > 30) {
    recommendedTier = 'premium';
    reason = language === "ar"
      ? "استخدامك يتجاوز الخطة الأساسية. Premium يمنحك SOPs غير محدودة!"
      : "Your usage exceeds Essential. Premium gives you unlimited SOPs!";
  } else if (sopsCount > 0 || chatCount > 15 || checklistCount > 2) {
    recommendedTier = 'essential';
    reason = language === "ar"
      ? "للحصول على المزيد من الرسائل والمستندات، جرّب الخطة الأساسية."
      : "For more messages and documents, try the Essential plan.";
  } else {
    return null; // Free tier user with low usage - don't show recommendation
  }

  const tierInfo = {
    essential: {
      name: language === "ar" ? "أساسي" : "Essential",
      price: "$29",
      color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
    },
    premium: {
      name: language === "ar" ? "مميز" : "Premium",
      price: "$79",
      color: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
    }
  }[recommendedTier];

  return (
    <Card className={`mb-6 border-l-4 ${tierInfo?.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          {language === "ar" ? "ترقية مقترحة" : "Recommended Upgrade"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Link href="/pricing">
          <Button size="sm" variant="outline">
            {tierInfo?.name} - {tierInfo?.price}/{language === "ar" ? "شهر" : "mo"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check for first-time user on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isOnboardingComplete()) {
      setShowOnboarding(true)
    }
  }, [])

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const { data: latestCrs, isLoading: crsLoading } = useQuery({
    queryKey: ['crs', 'latest'],
    queryFn: getLatestCrs,
  })
  const { data: crsHistory } = useQuery({
    queryKey: ['crs', 'history'],
    queryFn: getCrsHistory,
  })
  const { data: checklists } = useQuery({
    queryKey: ['documents', 'checklists'],
    queryFn: getChecklists,
  })
  const { data: documents } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: getDocuments,
  })
  const { data: sops } = useQuery({
    queryKey: ['sop', 'list'],
    queryFn: listSops,
  })
  const { data: conversations } = useQuery({
    queryKey: ['chat', 'list'],
    queryFn: listConversations,
  })

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0
    const fields = [
      profile.dateOfBirth,
      profile.nationality,
      profile.sourceCountry,
      profile.currentCountry,
      profile.maritalStatus,
      profile.educationLevel,
      profile.fieldOfStudy,
      profile.yearsOfExperience,
      profile.currentOccupation,
      profile.englishLevel,
      profile.immigrationPathway,
    ]
    const filledFields = fields.filter(Boolean).length
    return Math.round((filledFields / fields.length) * 100)
  }

  // Calculate document completion
  const calculateDocumentCompletion = () => {
    if (!checklists || checklists.length === 0) return { completed: 0, total: 0 }

    let totalItems = 0
    let completedItems = 0

    checklists.forEach((checklist: any) => {
      const items = checklist.items as any[]
      if (Array.isArray(items)) {
        totalItems += items.length
        completedItems += items.filter((item: any) => item.status === "completed" || item.status === "uploaded").length
      }
    })

    return { completed: completedItems, total: totalItems }
  }

  const profileCompletion = calculateProfileCompletion()
  const docCompletion = calculateDocumentCompletion()
  const docCompletionPercent = docCompletion.total > 0
    ? Math.round((docCompletion.completed / docCompletion.total) * 100)
    : 0

  // Get CRS trend
  const getCrsTrend = () => {
    if (!crsHistory || crsHistory.length < 2) return null
    const latest = crsHistory[0].totalScore
    const previous = crsHistory[1].totalScore
    return latest - previous
  }

  const crsTrend = getCrsTrend()

  const quickActions = [
    {
      icon: MessageSquare,
      title: language === "ar" ? "محادثة جديدة" : "New Chat",
      description: language === "ar" ? "ابدأ محادثة مع المساعد" : "Start a conversation",
      href: "/chat?new=true",
      color: "bg-blue-500",
    },
    {
      icon: Calculator,
      title: language === "ar" ? "احسب CRS" : "Calculate CRS",
      description: language === "ar" ? "احسب نقاطك" : "Calculate your score",
      href: "/calculator",
      color: "bg-green-500",
    },
    {
      icon: FileText,
      title: language === "ar" ? "المستندات" : "Documents",
      description: language === "ar" ? "إدارة مستنداتك" : "Manage your documents",
      href: "/documents",
      color: "bg-purple-500",
    },
    {
      icon: BookOpen,
      title: language === "ar" ? "خطاب نوايا" : "Write SOP",
      description: language === "ar" ? "كتابة خطاب النوايا" : "Create your SOP",
      href: "/sop/new",
      color: "bg-orange-500",
    },
  ]

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {language === "ar" ? "هجرة" : "Hijraah"}
            </h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <UsageDisplay />
            <LanguageToggle />
            <Link href="/profile" className="hidden md:block">
              <Button variant="ghost" size="icon-lg" aria-label="Profile">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon-lg" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="container py-8 pb-24 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">
            {language === "ar"
              ? `مرحباً، ${user?.name || user?.email?.split('@')[0] || 'مستخدم'}`
              : `Welcome back, ${user?.name || user?.email?.split('@')[0] || 'User'}`}
          </h2>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "تابع رحلتك نحو الهجرة إلى كندا"
              : "Continue your journey to Canada"}
          </p>
        </div>

        {/* Context-aware Focus Card */}
        <DashboardFocusCard
          profileCompletion={profileCompletion}
          hasCrsScore={!!latestCrs}
          docCompletion={docCompletion}
          language={language}
          router={router}
        />

        {/* Pricing Recommendation (only shows if applicable) */}
        <PricingRecommendation
          sopsCount={sops?.length || 0}
          chatCount={conversations?.length || 0}
          checklistCount={checklists?.length || 0}
          language={language}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 mb-8">
          {/* CRS Score Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "نقاط CRS" : "CRS Score"}
              </CardTitle>
              {crsTrend !== null && (
                crsTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )
              )}
            </CardHeader>
            <CardContent>
              {crsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : latestCrs ? (
                <>
                  <div className="text-3xl font-bold">{latestCrs.totalScore}</div>
                  {crsTrend !== null && (
                    <p className={`text-xs ${crsTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {crsTrend >= 0 ? '+' : ''}{crsTrend} {language === "ar" ? "منذ آخر تقييم" : "from last"}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "لم يتم الحساب بعد" : "Not calculated yet"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "اكتمال الملف" : "Profile"}
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profileCompletion}%</div>
              <Progress value={profileCompletion} className="mt-2" />
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "المستندات" : "Documents"}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {docCompletion.completed}/{docCompletion.total}
              </div>
              <Progress value={docCompletionPercent} className="mt-2" />
            </CardContent>
          </Card>

          {/* SOPs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "خطابات النوايا" : "SOPs"}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sops?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "تم إنشاؤها" : "Created"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {language === "ar" ? "الإجراءات السريعة" : "Quick Actions"}
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {language === "ar" ? "المحادثات الأخيرة" : "Recent Conversations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations && conversations.length > 0 ? (
                <div className="space-y-4">
                  {conversations.slice(0, 3).map((conv: any) => (
                    <Link key={conv.id} href={`/chat?id=${conv.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                        <div>
                          <p className="font-medium">{conv.title || (language === "ar" ? "محادثة جديدة" : "New conversation")}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(conv.updatedAt), 'PPp', { locale: language === 'ar' ? ar : enUS })}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {language === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Immigration Journey */}
          <ImmigrationJourney
            profileCompletion={profileCompletion}
            hasCrsScore={!!latestCrs}
            documentsUploaded={docCompletion.completed}
            totalDocuments={docCompletion.total}
          />
        </div>
      </main>

      {/* Onboarding Wizard for first-time users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false)
            router.push("/calculator")
          }}
          onSkip={() => setShowOnboarding(false)}
          existingProfile={profile}
        />
      )}
    </div>
  )
}
