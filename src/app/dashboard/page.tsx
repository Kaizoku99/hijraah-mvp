'use client'

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "@/components/LanguageToggle"
import { UsageDisplay } from "@/components/UsageDisplay"
import { trpc } from "@/lib/trpc"
import {
  MessageSquare,
  Calculator,
  FileText,
  BookOpen,
  User,
  LogOut,
  Loader2,
  ArrowRight,
  Crown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery()
  const { data: latestCrs, isLoading: crsLoading } = trpc.crs.latest.useQuery()
  const { data: crsHistory } = trpc.crs.history.useQuery()
  const { data: checklists } = trpc.documents.getChecklists.useQuery()
  const { data: documents } = trpc.documents.getDocuments.useQuery()
  const { data: sops } = trpc.sop.list.useQuery()
  const { data: conversations } = trpc.chat.list.useQuery()

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
      href: "/chat",
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
          <div className="flex items-center gap-4">
            <UsageDisplay />
            <LanguageToggle />
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {language === "ar" 
              ? `مرحباً، ${profile?.name || user?.email?.split('@')[0] || 'مستخدم'}` 
              : `Welcome back, ${profile?.name || user?.email?.split('@')[0] || 'User'}`}
          </h2>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "تابع رحلتك نحو الهجرة إلى كندا"
              : "Continue your journey to Canada"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

          {/* Recent SOPs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {language === "ar" ? "خطابات النوايا الأخيرة" : "Recent SOPs"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sops && sops.length > 0 ? (
                <div className="space-y-4">
                  {sops.slice(0, 3).map((sop: any) => (
                    <Link key={sop.id} href={`/sop/${sop.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                        <div>
                          <p className="font-medium">{sop.title || (language === "ar" ? "خطاب نوايا" : "SOP")}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sop.createdAt), 'PPp', { locale: language === 'ar' ? ar : enUS })}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {language === "ar" ? "لم يتم إنشاء خطابات بعد" : "No SOPs created yet"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
