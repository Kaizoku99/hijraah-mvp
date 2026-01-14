'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { UsageDisplay } from "@/components/UsageDisplay";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/actions/profile";
import { getLatestCrs, getCrsHistory } from "@/actions/crs";
import { getChecklists, getDocuments } from "@/actions/documents";
import { listSops } from "@/actions/sop";
import { listConversations } from "@/actions/chat";
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
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import OnboardingWizard, { isOnboardingComplete } from "@/components/OnboardingWizard";
import { ImmigrationJourney } from "@/components/ImmigrationJourney";
import { useState, useEffect } from "react";

// Proper type for checklist items
interface ChecklistItem {
  name: string;
  status: 'pending' | 'uploaded' | 'verified' | 'completed';
}

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
  router: any
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
        ? `أنت في منتصف الطريق! إكمال ملفك الشخصي يزيد من دقة حساب نقاط CRS.`
        : `You are ${profileCompletion}% there. completing your profile improves CRS score accuracy.`,
      action: language === "ar" ? "الذهاب للملف الشخصي" : "Go to Profile",
      icon: User,
      href: "/profile",
      color: "text-blue-600",
      bg: "bg-blue-50/50"
    },
    crs: {
      title: language === "ar" ? "احسب نقاط CRS" : "Calculate Your CRS Score",
      description: language === "ar"
        ? "اكتشف مدى أهليتك للهجرة إلى كندا الآن."
        : "Find out your eligibility for Canadian immigration right now.",
      action: language === "ar" ? "بدء الحساب" : "Start Calculator",
      icon: Calculator,
      href: "/tools/crs",
      color: "text-purple-600",
      bg: "bg-purple-50/50"
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
      bg: "bg-amber-50/50"
    },
    complete: {
      title: language === "ar" ? "أنت جاهز للتقديم!" : "You're Ready to Apply",
      description: language === "ar"
        ? "تحدث مع مساعدنا الذكي للبدء في إجراءات التقديم."
        : "Talk to our AI assistant to guide you through the submission process.",
      action: language === "ar" ? "تحدث مع هجرة" : "Talk to Hijraah AI",
      icon: Sparkles,
      href: "/chat",
      color: "text-green-600",
      bg: "bg-green-50/50"
    }
  }[state];

  return (
    <Card className={`mb-6 border-l-4 ${content.bg} overflow-hidden`} style={{ borderLeftColor: 'currentColor' }}>
      <div className={`${content.color}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
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
              {language === "ar" ? <ArrowRightCircle className="h-4 w-4 rotate-180" /> : <ArrowRightCircle className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
      </div>
    </Card>
  );
}

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
      color: "border-blue-500 bg-blue-50/50"
    },
    premium: {
      name: language === "ar" ? "مميز" : "Premium",
      price: "$79",
      color: "border-purple-500 bg-purple-50/50"
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
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{reason}</p>
        </div>
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
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for first-time user on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isOnboardingComplete()) {
      setShowOnboarding(true);
    }
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: getProfile,
  });
  const { data: latestCrs, isLoading: crsLoading } = useQuery({
    queryKey: ['crs', 'latest'],
    queryFn: getLatestCrs,
  });
  const { data: crsHistory } = useQuery({
    queryKey: ['crs', 'history'],
    queryFn: getCrsHistory,
  });
  const { data: checklists } = useQuery({
    queryKey: ['documents', 'checklists'],
    queryFn: getChecklists,
  });
  const { data: documents } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: getDocuments,
  });
  const { data: sops } = useQuery({
    queryKey: ['sop', 'list'],
    queryFn: listSops,
  });
  const { data: conversations } = useQuery({
    queryKey: ['chat', 'list'],
    queryFn: listConversations,
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
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
    ];
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Calculate document completion
  const calculateDocumentCompletion = () => {
    if (!checklists || checklists.length === 0) return { completed: 0, total: 0 };

    let totalItems = 0;
    let completedItems = 0;

    checklists.forEach((checklist: any) => {
      const items = checklist.items as any[];
      if (Array.isArray(items)) {
        totalItems += items.length;
        completedItems += items.filter((item: any) => item.status === "completed" || item.status === "uploaded").length;
      }
    });

    return { completed: completedItems, total: totalItems };
  };

  // Get CRS score trend
  const getCrsTrend = () => {
    if (!crsHistory || crsHistory.length < 2) return null;
    const sorted = [...crsHistory].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (sorted.length < 2) return null;
    const diff = sorted[0].totalScore - sorted[1].totalScore;
    return diff;
  };

  const profileCompletion = calculateProfileCompletion();
  const docCompletion = calculateDocumentCompletion();
  const crsTrend = getCrsTrend();

  const quickActions = [
    {
      icon: MessageSquare,
      titleKey: "nav.chat",
      descriptionKey: "features.chat.description",
      href: "/chat",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Calculator,
      titleKey: "nav.calculator",
      descriptionKey: "features.calculator.description",
      href: "/calculator",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: FileText,
      titleKey: "nav.documents",
      descriptionKey: "features.documents.description",
      href: "/documents",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: BookOpen,
      titleKey: "nav.sop",
      descriptionKey: "features.sop.description",
      href: "/sop",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const subscriptionTierNames = {
    free: language === "ar" ? "مجاني" : "Free",
    essential: language === "ar" ? "أساسي" : "Essential",
    premium: language === "ar" ? "مميز" : "Premium",
    vip: language === "ar" ? "في آي بي" : "VIP",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.profile")}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {t("dashboard.welcome")}, {user?.name || (language === "ar" ? "مستخدم" : "User")}!
            </h2>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "مرحبًا بك في لوحة التحكم الخاصة بك. ابدأ رحلتك نحو كندا اليوم."
                : "Welcome to your dashboard. Start your journey to Canada today."}
            </p>
          </div>

          <DashboardFocusCard
            profileCompletion={profileCompletion}
            hasCrsScore={!!latestCrs}
            docCompletion={docCompletion}
            language={language}
            router={router}
          />

          <PricingRecommendation
            sopsCount={sops?.length || 0}
            chatCount={conversations?.length || 0}
            checklistCount={checklists?.length || 0}
            language={language}
          />

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CRS Score Card */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {language === "ar" ? "نقاط CRS" : "CRS Score"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : latestCrs ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{latestCrs.totalScore}</span>
                      {crsTrend !== null && (
                        <span className={`flex items-center text-sm ${crsTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {crsTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {crsTrend >= 0 ? "+" : ""}{crsTrend}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(latestCrs.createdAt), "PPP", { locale: language === "ar" ? ar : enUS })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-muted-foreground">—</span>
                    <Link href="/calculator">
                      <Button variant="link" className="p-0 h-auto block mt-1 text-xs">
                        {language === "ar" ? "احسب الآن" : "Calculate Now"} {language === "ar" ? "←" : "→"}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {language === "ar" ? "المستندات" : "Documents"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {docCompletion.completed}/{docCompletion.total}
                  </span>
                </div>
                {docCompletion.total > 0 && (
                  <Progress
                    value={(docCompletion.completed / docCompletion.total) * 100}
                    className="mt-2 h-2"
                  />
                )}
                <Link href="/documents">
                  <Button variant="link" className="p-0 h-auto block mt-1 text-xs">
                    {language === "ar" ? "إدارة المستندات" : "Manage"} {language === "ar" ? "←" : "→"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* SOPs Card */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {language === "ar" ? "خطابات النوايا" : "SOPs"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{sops?.length || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    {language === "ar" ? "خطاب" : "created"}
                  </span>
                </div>
                <Link href="/sop">
                  <Button variant="link" className="p-0 h-auto block mt-1 text-xs">
                    {sops?.length ? (language === "ar" ? "عرض الكل" : "View All") : (language === "ar" ? "إنشاء جديد" : "Create New")} {language === "ar" ? "←" : "→"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profile Completion Card */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === "ar" ? "الملف الشخصي" : "Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="mt-2 h-2" />
                {profileCompletion < 100 && (
                  <Link href="/profile">
                    <Button variant="link" className="p-0 h-auto block mt-1 text-xs">
                      {language === "ar" ? "أكمل الملف" : "Complete"} {language === "ar" ? "←" : "→"}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <CardTitle>{t("profile.subscription")}</CardTitle>
                </div>
                <Link href="/pricing">
                  <Button variant="outline" size="sm">
                    {language === "ar" ? "ترقية الخطة" : "Upgrade Plan"}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {subscriptionTierNames[user?.subscriptionTier || "free"]}
                </span>
                {user?.subscriptionTier === "free" && (
                  <span className="text-sm text-muted-foreground">
                    ({language === "ar" ? "محدود" : "Limited features"})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion Alert */}
          {!profileLoading && (!profile || profileCompletion < 100) && (
            <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {language === "ar" ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
                </CardTitle>
                <CardDescription className="text-yellow-800 dark:text-yellow-200">
                  {language === "ar"
                    ? "أكمل ملفك الشخصي للحصول على توصيات مخصصة وحساب دقيق لنقاط CRS."
                    : "Complete your profile to get personalized recommendations and accurate CRS score calculation."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button className="gap-2">
                    {language === "ar" ? "أكمل الملف الشخصي" : "Complete Profile"}
                    <ArrowRight className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              {language === "ar" ? "إجراءات سريعة" : "Quick Actions"}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Card className="border-2 hover:border-primary transition-all hover:shadow-md cursor-pointer h-full">
                      <CardHeader>
                        <div className={`h-12 w-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3`}>
                          <Icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <CardTitle className="text-lg">{t(action.titleKey)}</CardTitle>
                        <CardDescription className="text-sm">{t(action.descriptionKey)}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="space-y-3">
                    {conversations.slice(0, 3).map((conv: any) => (
                      <Link key={conv.id} href={`/chat?conversation=${conv.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.title || (language === "ar" ? "محادثة جديدة" : "New Conversation")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(conv.updatedAt), "PPP", { locale: language === "ar" ? ar : enUS })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}
                  </p>
                )}
                <Link href="/chat">
                  <Button variant="outline" className="w-full mt-4">
                    {language === "ar" ? "بدء محادثة جديدة" : "Start New Chat"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Next Steps / Journey */}
            <ImmigrationJourney
              profileCompletion={profileCompletion}
              hasCrsScore={!!latestCrs}
              documentsUploaded={docCompletion.completed}
              totalDocuments={docCompletion.total}
            />
          </div>
        </div>
      </main>

      {/* Onboarding Wizard for first-time users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            router.push("/calculator");
          }}
          onSkip={() => setShowOnboarding(false)}
          existingProfile={profile}
        />
      )}
    </div>
  );
}

