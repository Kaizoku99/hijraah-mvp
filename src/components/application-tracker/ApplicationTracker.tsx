"use client";

import { useState, useCallback } from "react";
import { 
  Plane,
  Target,
  FileText,
  Calendar,
  TrendingUp,
  ChevronRight,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { MilestoneList } from "./MilestoneList";
import { DeadlineList } from "./DeadlineList";
import type { DashboardSummary, ApplicationStatus } from "./types";
import { APPLICATION_STATUS_CONFIG } from "./types";

interface ApplicationTrackerProps {
  summary: DashboardSummary;
  onRefresh?: () => void;
  onMilestoneComplete?: (milestoneId: number) => Promise<void>;
  onDeadlineComplete?: (deadlineId: number) => Promise<void>;
  onDeadlineDelete?: (deadlineId: number) => Promise<void>;
  isLoading?: boolean;
}

const DESTINATION_FLAGS: Record<string, string> = {
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Portugal: "🇵🇹",
  UK: "🇬🇧",
  Germany: "🇩🇪",
};

const PATHWAY_LABELS: Record<string, { en: string; ar: string }> = {
  express_entry: { en: "Express Entry", ar: "الدخول السريع" },
  study_permit: { en: "Study Permit", ar: "تصريح الدراسة" },
  family_sponsorship: { en: "Family Sponsorship", ar: "كفالة الأسرة" },
  skilled_independent: { en: "Skilled Independent", ar: "العمالة الماهرة المستقلة" },
  state_nominated: { en: "State Nominated", ar: "ترشيح الولاية" },
  study_visa: { en: "Study Visa", ar: "تأشيرة الدراسة" },
  d1_subordinate_work: { en: "D1 Work Visa", ar: "تأشيرة العمل D1" },
  d2_independent_entrepreneur: { en: "D2 Entrepreneur", ar: "رائد أعمال D2" },
  d7_passive_income: { en: "D7 Passive Income", ar: "الدخل السلبي D7" },
  d8_digital_nomad: { en: "D8 Digital Nomad", ar: "البدو الرقمي D8" },
  job_seeker_pt: { en: "Job Seeker", ar: "الباحث عن عمل" },
  other: { en: "Other", ar: "أخرى" },
};

export function ApplicationTracker({
  summary,
  onRefresh,
  onMilestoneComplete,
  onDeadlineComplete,
  onDeadlineDelete,
  isLoading = false,
}: ApplicationTrackerProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const {
    application,
    milestones,
    upcomingDeadlines,
    overdueDeadlines,
    progress,
    latestDraws,
  } = summary;

  const hasApplication = application !== null;
  const statusConfig = hasApplication 
    ? APPLICATION_STATUS_CONFIG[application.status as ApplicationStatus]
    : null;
  const pathwayLabel = hasApplication && application.immigrationPathway
    ? PATHWAY_LABELS[application.immigrationPathway]
    : null;
  const destinationFlag = hasApplication
    ? DESTINATION_FLAGS[application.targetDestination] || "🌍"
    : "🌍";

  // If no application exists, show create prompt
  if (!hasApplication) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {language === "ar" 
                  ? "ابدأ رحلة الهجرة" 
                  : "Start Your Immigration Journey"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {language === "ar"
                  ? "قم بإنشاء طلب لتتبع تقدمك والحصول على تذكيرات مخصصة"
                  : "Create an application to track your progress and get personalized reminders"}
              </p>
            </div>
            <Button asChild>
              <Link href="/applications/new">
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "إنشاء طلب" : "Create Application"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", isRtl && "rtl")}>
      {/* Application Overview Card */}
      <Card>
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isRtl && "flex-row-reverse"
        )}>
          <div className={isRtl ? "text-right" : ""}>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="text-2xl">{destinationFlag}</span>
              {application.targetDestination}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {pathwayLabel && (
                <span>
                  {language === "ar" ? pathwayLabel.ar : pathwayLabel.en}
                </span>
              )}
            </CardDescription>
          </div>
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            {statusConfig && (
              <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                {language === "ar" ? statusConfig.labelAr : statusConfig.labelEn}
              </Badge>
            )}
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  (refreshing || isLoading) && "animate-spin"
                )} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Section */}
          <div className="space-y-2">
            <div className={cn(
              "flex items-center justify-between text-sm",
              isRtl && "flex-row-reverse"
            )}>
              <span className="text-muted-foreground">
                {language === "ar" ? "التقدم الإجمالي" : "Overall Progress"}
              </span>
              <span className="font-medium">
                {progress.completed}/{progress.total} {language === "ar" ? "مراحل" : "milestones"}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <div className={cn(
              "flex items-center justify-between text-xs text-muted-foreground",
              isRtl && "flex-row-reverse"
            )}>
              <span>{progress.percentage}%</span>
              <span>
                {language === "ar" 
                  ? `${progress.total - progress.completed} متبقي`
                  : `${progress.total - progress.completed} remaining`}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={cn(
            "grid grid-cols-3 gap-4 mt-6 pt-4 border-t",
            "text-center"
          )}>
            <div>
              <div className="text-2xl font-bold text-primary">
                {upcomingDeadlines.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "مواعيد قادمة" : "Upcoming"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {overdueDeadlines.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "متأخرة" : "Overdue"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {progress.completed}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === "ar" ? "مكتملة" : "Completed"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Milestones and Deadlines */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="milestones" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="milestones" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                {language === "ar" ? "المراحل" : "Milestones"}
              </TabsTrigger>
              <TabsTrigger value="deadlines" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {language === "ar" ? "المواعيد" : "Deadlines"}
                {(upcomingDeadlines.length + overdueDeadlines.length) > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {upcomingDeadlines.length + overdueDeadlines.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="milestones" className="mt-4">
              <MilestoneList 
                milestones={milestones}
                onComplete={onMilestoneComplete}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="deadlines" className="mt-4 space-y-6">
              {/* Overdue Deadlines */}
              {overdueDeadlines.length > 0 && (
                <div>
                  <h4 className={cn(
                    "text-sm font-medium text-red-600 mb-3 flex items-center gap-2",
                    isRtl && "flex-row-reverse"
                  )}>
                    <span>{language === "ar" ? "متأخرة" : "Overdue"}</span>
                    <Badge variant="destructive">{overdueDeadlines.length}</Badge>
                  </h4>
                  <DeadlineList
                    deadlines={overdueDeadlines}
                    showOverdue
                    onComplete={onDeadlineComplete}
                    onDelete={onDeadlineDelete}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Upcoming Deadlines */}
              <div>
                {overdueDeadlines.length > 0 && (
                  <h4 className={cn(
                    "text-sm font-medium mb-3",
                    isRtl && "text-right"
                  )}>
                    {language === "ar" ? "قادمة" : "Upcoming"}
                  </h4>
                )}
                <DeadlineList
                  deadlines={upcomingDeadlines}
                  onComplete={onDeadlineComplete}
                  onDelete={onDeadlineDelete}
                  isLoading={isLoading}
                  emptyMessage={
                    overdueDeadlines.length === 0
                      ? (language === "ar"
                          ? "لا توجد مواعيد نهائية. أضف واحدة لتتبع مستنداتك."
                          : "No deadlines. Add one to track your documents.")
                      : undefined
                  }
                />
              </div>

              {/* Add Deadline Button */}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/deadlines/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إضافة موعد نهائي" : "Add Deadline"}
                </Link>
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Express Entry Draws (for Canada) */}
      {application.targetDestination === "Canada" && 
       application.immigrationPathway === "express_entry" && 
       latestDraws.length > 0 && (
        <Card>
          <CardHeader className={cn(
            "flex flex-row items-center justify-between space-y-0",
            isRtl && "flex-row-reverse"
          )}>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === "ar" ? "آخر سحوبات Express Entry" : "Latest Express Entry Draws"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/draws">
                {language === "ar" ? "عرض الكل" : "View All"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestDraws.slice(0, 5).map((draw) => (
                <div 
                  key={draw.id}
                  className={cn(
                    "flex items-center justify-between py-2 border-b last:border-0",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <div className={isRtl ? "text-right" : ""}>
                    <div className="text-sm font-medium">
                      {draw.drawType}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(draw.drawDate).toLocaleDateString(
                        language === "ar" ? "ar-SA" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </div>
                  </div>
                  <div className={cn("text-right", isRtl && "text-left")}>
                    <div className="text-sm font-bold text-primary">
                      {draw.crsMinimum}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      CRS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
