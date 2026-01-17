"use client";

import { useMemo } from "react";
import {
  Circle,
  Map,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  FileCheck,
  GraduationCap,
  Briefcase,
  Plane,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { 
  ImmigrationJourneyProps, 
  JourneyStep, 
  SmartTip 
} from "./types";
import { PATHWAY_LABELS, DESTINATION_CONFIG } from "./config";
import { calculateOverallProgress, getCrsStatus } from "./utils";
import { StepItem } from "./StepItem";
import { SmartTipCard } from "./SmartTipCard";

export function ImmigrationJourney({
  profileCompletion,
  hasCrsScore,
  crsScore,
  documentsUploaded,
  totalDocuments,
  targetDestination,
  immigrationPathway,
  educationLevel,
  yearsOfExperience,
  frenchLevel,
  hasProvincialNomination,
}: ImmigrationJourneyProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // Memoized destination configuration
  const destConfig = useMemo(() => {
    const dest = targetDestination || "other";
    return DESTINATION_CONFIG[dest] || DESTINATION_CONFIG.other;
  }, [targetDestination]);

  // Memoized pathway label
  const pathwayLabel = useMemo(() => {
    if (!immigrationPathway) return null;
    const labels = PATHWAY_LABELS[immigrationPathway];
    return labels ? (language === "ar" ? labels.ar : labels.en) : null;
  }, [immigrationPathway, language]);

  // Memoized overall progress
  const overallProgress = useMemo(
    () =>
      calculateOverallProgress(
        profileCompletion,
        hasCrsScore,
        documentsUploaded,
        totalDocuments
      ),
    [profileCompletion, hasCrsScore, documentsUploaded, totalDocuments]
  );

  // Memoized CRS status (Canada only)
  const crsStatus = useMemo(
    () => (targetDestination === "canada" ? getCrsStatus(crsScore) : null),
    [targetDestination, crsScore]
  );

  // Generate destination-specific steps
  const steps = useMemo((): JourneyStep[] => {
    const baseProfileStep: JourneyStep = {
      id: "profile",
      title: language === "ar" ? "إكمال الملف الشخصي" : "Complete Profile",
      description:
        language === "ar"
          ? `${profileCompletion}% مكتمل`
          : `${profileCompletion}% complete`,
      isCompleted: profileCompletion === 100,
      isActive: profileCompletion < 100,
      link: "/profile",
      linkText: language === "ar" ? "إكمال الملف" : "Complete Profile",
      icon: Circle,
      progress: profileCompletion,
      tip:
        profileCompletion < 100
          ? language === "ar"
            ? "إكمال ملفك يزيد من دقة التقييم"
            : "Completing your profile improves assessment accuracy"
          : undefined,
    };

    // Canada-specific steps
    if (targetDestination === "canada") {
      const crsCompleted = hasCrsScore && crsScore !== null;
      return [
        baseProfileStep,
        {
          id: "crs",
          title: language === "ar" ? "حساب نقاط CRS" : "Calculate CRS Score",
          description: crsScore
            ? `${crsScore} ${language === "ar" ? "نقطة" : "points"}`
            : language === "ar"
              ? "اعرف فرصك"
              : "Know your chances",
          isCompleted: crsCompleted,
          isActive: profileCompletion === 100 && !crsCompleted,
          link: "/calculator",
          linkText: language === "ar" ? "احسب الآن" : "Calculate Now",
          icon: Target,
          badge:
            crsStatus && crsScore
              ? {
                  text:
                    crsStatus.status === "excellent"
                      ? language === "ar"
                        ? "ممتاز"
                        : "Excellent"
                      : crsStatus.status === "good"
                        ? language === "ar"
                          ? "جيد"
                          : "Good"
                        : crsStatus.status === "competitive"
                          ? language === "ar"
                            ? "تنافسي"
                            : "Competitive"
                          : language === "ar"
                            ? "يحتاج تحسين"
                            : "Improve",
                  variant:
                    crsStatus.status === "excellent" ||
                    crsStatus.status === "good"
                      ? "default"
                      : crsStatus.status === "competitive"
                        ? "secondary"
                        : "destructive",
                }
              : undefined,
          tip: !hasCrsScore
            ? language === "ar"
              ? "احسب نقاطك لمعرفة إذا كنت مؤهلاً للسحب الحالي"
              : "Calculate your score to see if you qualify for current draws"
            : undefined,
        },
        {
          id: "documents",
          title: language === "ar" ? "تجهيز المستندات" : "Prepare Documents",
          description:
            language === "ar"
              ? `${documentsUploaded}/${totalDocuments || "?"} مستند`
              : `${documentsUploaded}/${totalDocuments || "?"} documents`,
          isCompleted:
            totalDocuments > 0 && documentsUploaded >= totalDocuments,
          isActive:
            crsCompleted &&
            (totalDocuments === 0 || documentsUploaded < totalDocuments),
          link: "/documents",
          linkText: language === "ar" ? "إدارة المستندات" : "Manage Documents",
          icon: FileCheck,
          progress:
            totalDocuments > 0
              ? Math.round((documentsUploaded / totalDocuments) * 100)
              : undefined,
        },
        {
          id: "pool",
          title:
            language === "ar" ? "دخول مجمع المرشحين" : "Enter Candidate Pool",
          description:
            language === "ar"
              ? "قدم على Express Entry"
              : "Submit Express Entry profile",
          isCompleted: false,
          isActive: false,
          link: "#",
          linkText: language === "ar" ? "قريباً" : "Coming Soon",
          icon: Briefcase,
        },
        {
          id: "ita",
          title: language === "ar" ? "استلام الدعوة" : "Receive ITA",
          description: language === "ar" ? "الخطوة النهائية" : "Final step",
          isCompleted: false,
          isActive: false,
          link: "#",
          linkText: language === "ar" ? "قريباً" : "Coming Soon",
          icon: Plane,
        },
      ];
    }

    // Australia-specific steps
    if (targetDestination === "australia") {
      return [
        baseProfileStep,
        {
          id: "points",
          title: language === "ar" ? "حساب النقاط" : "Calculate Points",
          description:
            language === "ar"
              ? "نظام النقاط الأسترالي"
              : "Australian points system",
          isCompleted: hasCrsScore,
          isActive: profileCompletion === 100 && !hasCrsScore,
          link: "/calculator",
          linkText: language === "ar" ? "احسب الآن" : "Calculate Now",
          icon: Target,
        },
        {
          id: "skills",
          title: language === "ar" ? "تقييم المهارات" : "Skills Assessment",
          description:
            language === "ar"
              ? "تقييم من جهة معتمدة"
              : "Assessment from relevant authority",
          isCompleted: false,
          isActive: hasCrsScore,
          link: "/documents",
          linkText: language === "ar" ? "عرض المتطلبات" : "View Requirements",
          icon: GraduationCap,
          tip:
            language === "ar"
              ? "اختر الجهة المناسبة لمهنتك"
              : "Choose the right assessing authority for your occupation",
        },
        {
          id: "documents",
          title: language === "ar" ? "تجهيز المستندات" : "Prepare Documents",
          description:
            language === "ar"
              ? `${documentsUploaded}/${totalDocuments || "?"} مستند`
              : `${documentsUploaded}/${totalDocuments || "?"} documents`,
          isCompleted:
            totalDocuments > 0 && documentsUploaded >= totalDocuments,
          isActive: false,
          link: "/documents",
          linkText: language === "ar" ? "إدارة المستندات" : "Manage Documents",
          icon: FileCheck,
        },
        {
          id: "eoi",
          title: language === "ar" ? "تقديم EOI" : "Submit EOI",
          description:
            language === "ar"
              ? "الدخول في SkillSelect"
              : "Enter SkillSelect pool",
          isCompleted: false,
          isActive: false,
          link: "#",
          linkText: language === "ar" ? "قريباً" : "Coming Soon",
          icon: Plane,
        },
      ];
    }

    // Portugal-specific steps
    if (targetDestination === "portugal") {
      const visaType = immigrationPathway?.startsWith("d")
        ? immigrationPathway.toUpperCase().replace("_", " ")
        : "Visa";
      return [
        baseProfileStep,
        {
          id: "eligibility",
          title: language === "ar" ? "فحص الأهلية" : "Check Eligibility",
          description:
            language === "ar"
              ? `تحقق من أهليتك لـ ${visaType}`
              : `Verify ${visaType} eligibility`,
          isCompleted: hasCrsScore,
          isActive: profileCompletion === 100 && !hasCrsScore,
          link: "/calculator",
          linkText: language === "ar" ? "فحص الآن" : "Check Now",
          icon: Target,
          tip:
            language === "ar"
              ? "تحقق من متطلبات الدخل والمستندات"
              : "Verify income requirements and document needs",
        },
        {
          id: "documents",
          title: language === "ar" ? "تجهيز المستندات" : "Prepare Documents",
          description:
            language === "ar"
              ? `${documentsUploaded}/${totalDocuments || "?"} مستند`
              : `${documentsUploaded}/${totalDocuments || "?"} documents`,
          isCompleted:
            totalDocuments > 0 && documentsUploaded >= totalDocuments,
          isActive:
            hasCrsScore &&
            (totalDocuments === 0 || documentsUploaded < totalDocuments),
          link: "/documents",
          linkText: language === "ar" ? "إدارة المستندات" : "Manage Documents",
          icon: FileCheck,
          progress:
            totalDocuments > 0
              ? Math.round((documentsUploaded / totalDocuments) * 100)
              : undefined,
          tip:
            language === "ar"
              ? "معظم المستندات تحتاج ترجمة وتصديق"
              : "Most documents require translation and apostille",
        },
        {
          id: "appointment",
          title: language === "ar" ? "حجز موعد" : "Book Appointment",
          description:
            language === "ar"
              ? "موعد في السفارة/VFS"
              : "Embassy/VFS appointment",
          isCompleted: false,
          isActive: false,
          link: "#",
          linkText: language === "ar" ? "قريباً" : "Coming Soon",
          icon: Briefcase,
        },
        {
          id: "visa",
          title: language === "ar" ? "استلام التأشيرة" : "Receive Visa",
          description: language === "ar" ? "الخطوة النهائية" : "Final step",
          isCompleted: false,
          isActive: false,
          link: "#",
          linkText: language === "ar" ? "قريباً" : "Coming Soon",
          icon: Plane,
        },
      ];
    }

    // Generic/Other destination steps
    return [
      baseProfileStep,
      {
        id: "eligibility",
        title: language === "ar" ? "فحص الأهلية" : "Check Eligibility",
        description:
          language === "ar" ? "اكتشف خياراتك" : "Discover your options",
        isCompleted: hasCrsScore,
        isActive: profileCompletion === 100 && !hasCrsScore,
        link: "/calculator",
        linkText: language === "ar" ? "ابدأ الآن" : "Start Now",
        icon: Target,
      },
      {
        id: "documents",
        title: language === "ar" ? "تجهيز المستندات" : "Prepare Documents",
        description:
          language === "ar"
            ? `${documentsUploaded}/${totalDocuments || "?"} مستند`
            : `${documentsUploaded}/${totalDocuments || "?"} documents`,
        isCompleted: totalDocuments > 0 && documentsUploaded >= totalDocuments,
        isActive:
          hasCrsScore &&
          (totalDocuments === 0 || documentsUploaded < totalDocuments),
        link: "/documents",
        linkText: language === "ar" ? "إدارة المستندات" : "Manage Documents",
        icon: FileCheck,
      },
      {
        id: "application",
        title: language === "ar" ? "تقديم الطلب" : "Submit Application",
        description: language === "ar" ? "الخطوة النهائية" : "Final step",
        isCompleted: false,
        isActive: false,
        link: "#",
        linkText: language === "ar" ? "قريباً" : "Coming Soon",
        icon: Plane,
      },
    ];
  }, [
    language,
    targetDestination,
    immigrationPathway,
    profileCompletion,
    hasCrsScore,
    crsScore,
    documentsUploaded,
    totalDocuments,
    crsStatus,
  ]);

  // Generate smart tips based on user context
  const smartTips = useMemo((): SmartTip[] => {
    const tips: SmartTip[] = [];

    // Profile-based tips
    if (profileCompletion < 100) {
      tips.push({
        id: "complete-profile",
        icon: Info,
        message:
          language === "ar"
            ? "أكمل ملفك الشخصي للحصول على تقييم أكثر دقة"
            : "Complete your profile for more accurate assessment",
        type: "action",
        link: "/profile",
        linkText: language === "ar" ? "إكمال الملف" : "Complete Profile",
      });
    }

    // Canada-specific tips
    if (targetDestination === "canada") {
      if (frenchLevel && frenchLevel !== "none") {
        tips.push({
          id: "french-bonus",
          icon: Sparkles,
          message:
            language === "ar"
              ? "مهاراتك في الفرنسية قد تمنحك نقاط إضافية!"
              : "Your French skills may earn you bonus points!",
          type: "success",
        });
      }

      if (crsScore && crsScore < 470 && !hasProvincialNomination) {
        tips.push({
          id: "pnp-suggestion",
          icon: TrendingUp,
          message:
            language === "ar"
              ? "الترشيح الإقليمي (PNP) يمنحك 600 نقطة إضافية"
              : "Provincial Nomination (PNP) adds 600 points to your score",
          type: "info",
        });
      }

      if (educationLevel === "master" || educationLevel === "phd") {
        tips.push({
          id: "education-advantage",
          icon: GraduationCap,
          message:
            language === "ar"
              ? "شهادتك العليا ميزة كبيرة في Express Entry"
              : "Your advanced degree is a major advantage for Express Entry",
          type: "success",
        });
      }
    }

    // Portugal-specific tips
    if (targetDestination === "portugal") {
      if (immigrationPathway === "d8_digital_nomad") {
        tips.push({
          id: "d8-income",
          icon: AlertCircle,
          message:
            language === "ar"
              ? "D8 يتطلب دخل شهري €3,680 على الأقل (4× الحد الأدنى)"
              : "D8 requires minimum €3,680/month income (4x minimum wage)",
          type: "warning",
        });
      }
    }

    // Generic improvement tip
    if (
      yearsOfExperience !== null &&
      yearsOfExperience !== undefined &&
      yearsOfExperience < 3
    ) {
      tips.push({
        id: "experience-tip",
        icon: Briefcase,
        message:
          language === "ar"
            ? "زيادة خبرتك العملية تحسن فرصك بشكل كبير"
            : "Gaining more work experience significantly improves your chances",
        type: "info",
      });
    }

    return tips.slice(0, 2); // Show max 2 tips
  }, [
    language,
    targetDestination,
    immigrationPathway,
    profileCompletion,
    crsScore,
    frenchLevel,
    educationLevel,
    yearsOfExperience,
    hasProvincialNomination,
  ]);

  // Destination title
  const destinationTitle = useMemo(() => {
    const config = destConfig;
    const destName = language === "ar" ? config.nameAr : config.nameEn;

    if (targetDestination && targetDestination !== "other") {
      return language === "ar"
        ? `رحلتك نحو ${destName} ${config.flag}`
        : `Your Journey to ${destName} ${config.flag}`;
    }
    return language === "ar" ? "رحلة الهجرة" : "Immigration Journey";
  }, [language, targetDestination, destConfig]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div
          className={cn(
            "flex items-start justify-between gap-2",
            isRtl && "flex-row-reverse"
          )}
        >
          <div>
            <CardTitle
              className={cn(
                "text-lg flex items-center gap-2",
                isRtl && "flex-row-reverse"
              )}
            >
              <Map className="h-5 w-5" />
              {destinationTitle}
            </CardTitle>
            {pathwayLabel && (
              <CardDescription className="mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {pathwayLabel}
                </Badge>
              </CardDescription>
            )}
          </div>
          <div className={cn("text-right shrink-0", isRtl && "text-left")}>
            <span className="text-2xl font-bold">{overallProgress}%</span>
            <p className="text-xs text-muted-foreground">
              {language === "ar" ? "مكتمل" : "complete"}
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <Progress value={overallProgress} className="mt-3 h-2" />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Steps */}
        <div className="flex-1 space-y-0">
          {steps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              index={index}
              totalSteps={steps.length}
              isRtl={isRtl}
            />
          ))}
        </div>

        {/* Smart Tips */}
        {smartTips.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <h5
              className={cn(
                "text-xs font-semibold text-muted-foreground flex items-center gap-1",
                isRtl && "flex-row-reverse"
              )}
            >
              <Lightbulb className="h-3 w-3" />
              {language === "ar" ? "نصائح ذكية" : "Smart Tips"}
            </h5>
            {smartTips.map(tip => (
              <SmartTipCard key={tip.id} tip={tip} isRtl={isRtl} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ImmigrationJourney;
