import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

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

          {/* Profile Completion */}
          {!profileLoading && !profile && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900">
                  {language === "ar" ? "أكمل ملفك الشخصي" : "Complete Your Profile"}
                </CardTitle>
                <CardDescription className="text-yellow-800">
                  {language === "ar"
                    ? "أكمل ملفك الشخصي للحصول على توصيات مخصصة وحساب دقيق لنقاط CRS."
                    : "Complete your profile to get personalized recommendations and accurate CRS score calculation."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button className="gap-2">
                    {language === "ar" ? "أكمل الملف الشخصي" : "Complete Profile"}
                    <ArrowRight className="h-4 w-4" />
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

          {/* Progress Overview */}
          <div>
            <h3 className="text-2xl font-bold mb-4">{t("dashboard.progress")}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "نقاط CRS" : "CRS Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {language === "ar" ? "لم يتم الحساب" : "Not Calculated"}
                  </div>
                  <Link href="/calculator">
                    <Button variant="link" className="p-0 h-auto mt-2">
                      {language === "ar" ? "احسب الآن" : "Calculate Now"} →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("dashboard.documents")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0/0</div>
                  <Link href="/documents">
                    <Button variant="link" className="p-0 h-auto mt-2">
                      {language === "ar" ? "إدارة المستندات" : "Manage Documents"} →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "خطاب النوايا" : "SOP Status"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {language === "ar" ? "لم يتم الإنشاء" : "Not Created"}
                  </div>
                  <Link href="/sop">
                    <Button variant="link" className="p-0 h-auto mt-2">
                      {language === "ar" ? "إنشاء الآن" : "Create Now"} →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.nextSteps")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!profile && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {language === "ar" ? "أكمل ملفك الشخصي" : "Complete your profile"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? "أضف معلوماتك الشخصية والتعليمية والمهنية"
                          : "Add your personal, educational, and professional information"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {!profile ? "2" : "1"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {language === "ar" ? "احسب نقاط CRS الخاصة بك" : "Calculate your CRS score"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? "اكتشف أهليتك لنظام الدخول السريع"
                        : "Discover your eligibility for Express Entry"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {!profile ? "3" : "2"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {language === "ar" ? "جهز مستنداتك" : "Prepare your documents"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? "احصل على قائمة مخصصة بالمستندات المطلوبة"
                        : "Get a personalized list of required documents"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
