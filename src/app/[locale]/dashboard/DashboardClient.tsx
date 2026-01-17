"use client"

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/LanguageContext"
import { AppHeader } from "@/components/AppHeader"
import { useQueries } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { getProfile } from "@/actions/profile"
import { getLatestAustraliaPoints } from "@/actions/points-test"
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness"

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
    Loader2,
    ArrowRight,
    TrendingUp,
    TrendingDown,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useState, useEffect, useMemo } from "react"
import OnboardingWizard, { isOnboardingComplete } from "@/components/OnboardingWizard"
import { ImmigrationJourney } from "@/components/ImmigrationJourney"
import { DashboardFocusCard, PricingRecommendation } from "@/components/dashboard"

interface DashboardClientProps {
    initialData: {
        profile: any
        latestCrs: any
        latestAustraliaPoints?: any
        crsHistory: any
        checklists: any
        documents: any
        sops: any
        conversations: any
    }
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const router = useRouter()
    const [showOnboarding, setShowOnboarding] = useState(false)

    // Fetch all dashboard data in parallel using useQueries with caching
    // We use initialData to skip the first fetch and hydrate the cache immediately
    const results = useQueries({
        queries: [
            {
                queryKey: queryKeys.user.profile(),
                queryFn: getProfile,
                initialData: initialData.profile,
                staleTime: 1000 * 60 * 5, // 5 minutes - profile doesn't change often
                gcTime: 1000 * 60 * 30, // 30 minutes cache
            },
            {
                queryKey: queryKeys.crs.latest(),
                queryFn: getLatestCrs,
                initialData: initialData.latestCrs,
                staleTime: 1000 * 60 * 10, // 10 minutes
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: ['australia-points', 'latest'],
                queryFn: getLatestAustraliaPoints,
                initialData: initialData.latestAustraliaPoints,
                staleTime: 1000 * 60 * 10,
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: queryKeys.crs.history(),
                queryFn: getCrsHistory,
                initialData: initialData.crsHistory,
                staleTime: 1000 * 60 * 10,
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: queryKeys.documents.checklists(),
                queryFn: getChecklists,
                initialData: initialData.checklists,
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: queryKeys.documents.list(),
                queryFn: getDocuments,
                initialData: initialData.documents,
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: queryKeys.sop.list(),
                queryFn: listSops,
                initialData: initialData.sops,
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 30,
            },
            {
                queryKey: queryKeys.chat.list(),
                queryFn: listConversations,
                initialData: initialData.conversations,
                staleTime: 1000 * 60 * 2, // 2 minutes - conversations change more often
                gcTime: 1000 * 60 * 15,
            },
        ],
    })

    // Destructure results for easier access
    const [
        profileQuery,
        latestCrsQuery,
        latestAustraliaPointsQuery,
        crsHistoryQuery,
        checklistsQuery,
        documentsQuery,
        sopsQuery,
        conversationsQuery,
    ] = results

    const profile = profileQuery.data
    const profileLoading = profileQuery.isLoading && !profileQuery.data
    const latestCrs = latestCrsQuery.data
    const latestAustraliaPoints = latestAustraliaPointsQuery.data
    const crsLoading = latestCrsQuery.isLoading && !latestCrsQuery.data
    const crsHistory = crsHistoryQuery.data
    const checklists = checklistsQuery.data
    const documents = documentsQuery.data
    const sops = sopsQuery.data
    const conversations = conversationsQuery.data

    // Check if any critical data is still loading (first load only)
    const isInitialLoad = profileLoading

    // Check for first-time user:
    // 1. If profile is loaded but null, user needs onboarding
    // 2. If profile exists but is missing critical fields (like nationality/destination), user needs onboarding
    // 3. Fallback to localStorage check only if profile is still loading (optional, but safer to wait for profile)
    useEffect(() => {
        if (!profileLoading) {
            // If no profile exists, or critical fields are missing, show onboarding
            const needsOnboarding = !profile || !profile.nationality || !profile.targetDestination

            if (needsOnboarding && !isOnboardingComplete()) {
                setShowOnboarding(true)
            } else if (needsOnboarding && isOnboardingComplete()) {
                // If local storage says complete but profile is missing, trust profile (server state)
                // This handles cases where user might have cleared DB or it's a new account with old local storage
                setShowOnboarding(true)
            }
        }
    }, [profile, profileLoading])

    // Calculate profile completion percentage
    // @ts-ignore
    const { percentage: profileCompletion } = useProfileCompleteness(profile, language)

    // Calculate document completion
    const docCompletion = useMemo(() => {
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
    }, [checklists])

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

    // Destination-aware calculator title
    const getCalculatorTitle = () => {
        if (profile?.targetDestination === 'australia') {
            return language === "ar" ? "حاسبة النقاط" : "Points Calculator"
        } else if (profile?.targetDestination === 'portugal') {
            return language === "ar" ? "فاحص الأهلية" : "Eligibility Checker"
        }
        return language === "ar" ? "احسب CRS" : "Calculate CRS"
    }

    const getCalculatorDescription = () => {
        if (profile?.targetDestination === 'australia') {
            return language === "ar" ? "احسب نقاطك الأسترالية" : "Calculate Australia points"
        } else if (profile?.targetDestination === 'portugal') {
            return language === "ar" ? "تحقق من أهليتك للتأشيرة" : "Check visa eligibility"
        }
        return language === "ar" ? "احسب نقاطك" : "Calculate your score"
    }

    const baseQuickActions = [
        {
            icon: MessageSquare,
            title: language === "ar" ? "محادثة جديدة" : "New Chat",
            description: language === "ar" ? "ابدأ محادثة مع المساعد" : "Start a conversation",
            href: "/chat?new=true",
            color: "bg-blue-500",
        },
        {
            icon: Calculator,
            title: getCalculatorTitle(),
            description: getCalculatorDescription(),
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
    ];

    // Add SOP action only for Canada and Australia (not needed for Portugal)
    const quickActions = profile?.targetDestination === 'portugal'
        ? baseQuickActions
        : [
            ...baseQuickActions,
            {
                icon: BookOpen,
                title: language === "ar" ? "خطاب نوايا" : "Write SOP",
                description: language === "ar" ? "كتابة خطاب النوايا" : "Create your SOP",
                href: "/sop/new",
                color: "bg-orange-500",
            },
        ];

    // Don't block the entire page - show skeleton states inline instead
    // The loading.tsx handles navigation loading states

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <AppHeader />

            <main id="main-content" className="container py-8 pb-24 md:pb-8">
                {/* Welcome Section */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-2">
                        {language === "ar"
                            ? `مرحباً، ${user?.name || user?.email?.split('@')[0] || 'مستخدم'}`
                            : `Welcome back, ${user?.name || user?.email?.split('@')[0] || 'User'}`}
                    </h2>
                    {isInitialLoad ? (
                        <Skeleton className="h-5 w-80" />
                    ) : (
                        <p className="text-muted-foreground">
                            {profile?.targetDestination === 'australia'
                                ? (language === "ar" ? "تابع رحلتك نحو الهجرة إلى أستراليا" : "Continue your journey to Australia")
                                : profile?.targetDestination === 'portugal'
                                    ? (language === "ar" ? "تابع رحلتك نحو البرتغال" : "Continue your journey to Portugal")
                                    : (language === "ar" ? "تابع رحلتك نحو الهجرة إلى كندا" : "Continue your journey to Canada")}
                        </p>
                    )}
                </div>

                {/* Context-aware Focus Card */}
                {isInitialLoad ? (
                    <Card className="mb-6 border-l-4 border-l-muted">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-7 w-48" />
                                    <Skeleton className="h-5 w-full max-w-md" />
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                    <DashboardFocusCard
                        profileCompletion={profileCompletion}
                        hasCrsScore={!!latestCrs}
                        docCompletion={docCompletion}
                        language={language}
                        router={router}
                        targetDestination={profile?.targetDestination}
                    />
                )}

                {/* Pricing Recommendation (only shows if applicable) */}
                <PricingRecommendation
                    sopsCount={sops?.length || 0}
                    chatCount={conversations?.length || 0}
                    checklistCount={checklists?.length || 0}
                    language={language}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 mb-8">
                    {/* Score/Eligibility Card - Destination-specific */}
                    {profile?.targetDestination === 'canada' && (
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
                    )}

                    {profile?.targetDestination === 'australia' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {language === "ar" ? "نقاط أستراليا" : "Australia Points"}
                                </CardTitle>
                                {latestAustraliaPoints && (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                {latestAustraliaPoints ? (
                                    <>
                                        <div className="text-3xl font-bold">{latestAustraliaPoints.totalScore}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {language === "ar" ? "مجموع النقاط" : "Total Points"}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {language === "ar" ? "لم يتم الحساب بعد" : "Not calculated yet"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {profile?.targetDestination === 'portugal' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {language === "ar" ? "حالة الأهلية" : "Eligibility"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {language === "ar" ? "تحقق من أهليتك للتأشيرة" : "Check visa eligibility"}
                                </p>
                                <Link href="/calculator">
                                    <Button variant="link" size="sm" className="px-0">
                                        {language === "ar" ? "ابدأ الفحص" : "Start Check"}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {!profile?.targetDestination && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {language === "ar" ? "الأهلية" : "Eligibility"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {language === "ar" ? "حدد وجهتك أولاً" : "Select your destination first"}
                                </p>
                            </CardContent>
                        </Card>
                    )}

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

                    {/* SOPs - Only for Canada and Australia */}
                    {(profile?.targetDestination === 'canada' || profile?.targetDestination === 'australia') && (
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
                    )}
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
                            {conversationsQuery.isLoading && !conversations ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-3">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            ) : conversations && conversations.length > 0 ? (
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

                    {/* Immigration Journey - Enhanced with context awareness */}
                    <ImmigrationJourney
                        profileCompletion={profileCompletion}
                        hasCrsScore={!!latestCrs}
                        crsScore={latestCrs?.totalScore}
                        documentsUploaded={docCompletion.completed}
                        totalDocuments={docCompletion.total}
                        targetDestination={profile?.targetDestination as 'canada' | 'australia' | 'portugal' | 'other' | undefined}
                        immigrationPathway={profile?.immigrationPathway as any}
                        educationLevel={profile?.educationLevel}
                        yearsOfExperience={profile?.yearsOfExperience}
                        englishLevel={profile?.englishLevel}
                        frenchLevel={profile?.frenchLevel}
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
