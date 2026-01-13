'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery } from "@tanstack/react-query";
import { listSops } from "@/actions/sop";
import { FileText, User, LogOut, Plus, Loader2, Calendar, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function SopList() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const { data: sops, isLoading } = useQuery({
    queryKey: ['sop', 'list'],
    queryFn: listSops,
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const statusLabels = {
    draft: { en: "Draft", ar: "مسودة", color: "bg-gray-100 text-gray-800" },
    generated: { en: "Generated", ar: "تم الإنشاء", color: "bg-blue-100 text-blue-800" },
    revised: { en: "Revised", ar: "تم المراجعة", color: "bg-yellow-100 text-yellow-800" },
    final: { en: "Final", ar: "نهائي", color: "bg-green-100 text-green-800" },
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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
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
        <div className="container max-w-4xl space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {language === "ar" ? "خطابات النوايا" : "Statements of Purpose"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {language === "ar"
                  ? "إدارة خطابات النوايا الخاصة بك لطلبات الهجرة"
                  : "Manage your statements of purpose for immigration applications"}
              </p>
            </div>
            <Link href="/sop/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {language === "ar" ? "إنشاء جديد" : "Create New"}
              </Button>
            </Link>
          </div>

          {/* SOP List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !sops || sops.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "ar" ? "لا توجد خطابات نوايا" : "No Statements of Purpose"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {language === "ar"
                    ? "ابدأ بإنشاء خطاب نوايا جديد لطلب الهجرة الخاص بك"
                    : "Start by creating a new statement of purpose for your immigration application"}
                </p>
                <Link href="/sop/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {language === "ar" ? "إنشاء خطاب نوايا" : "Create SOP"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sops.map((sop) => {
                const status = statusLabels[sop.status as keyof typeof statusLabels] || statusLabels.draft;
                return (
                  <Card key={sop.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {language === "ar" ? `خطاب نوايا #${sop.id}` : `SOP #${sop.id}`}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {sop.goals
                              ? sop.goals.substring(0, 100) + (sop.goals.length > 100 ? "..." : "")
                              : language === "ar"
                                ? "لا يوجد وصف"
                                : "No description"}
                          </CardDescription>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {language === "ar" ? status.ar : status.en}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(sop.createdAt), "PPP", {
                              locale: language === "ar" ? ar : enUS,
                            })}
                          </span>
                          <span>
                            {language === "ar" ? `الإصدار ${sop.version}` : `Version ${sop.version}`}
                          </span>
                          <span>
                            {sop.language === "ar" ? "🇸🇦 العربية" : "🇺🇸 English"}
                          </span>
                        </div>
                        <Link href={`/sop/${sop.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            {language === "ar" ? "عرض" : "View"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
