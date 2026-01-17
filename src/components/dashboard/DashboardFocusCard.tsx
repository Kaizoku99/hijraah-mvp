"use client";

import { memo } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Calculator,
  FileText,
  Sparkles,
  ArrowRightCircle,
} from "lucide-react";

interface DashboardFocusCardProps {
  profileCompletion: number;
  hasCrsScore: boolean;
  docCompletion: { completed: number; total: number };
  language: string;
  router: AppRouterInstance;
  targetDestination?: string;
}

export const DashboardFocusCard = memo(function DashboardFocusCard({
  profileCompletion,
  hasCrsScore,
  docCompletion,
  language,
  router,
  targetDestination,
}: DashboardFocusCardProps) {
  // Determine user state
  let state: "profile" | "crs" | "documents" | "complete" = "profile";

  if (profileCompletion < 100) {
    state = "profile";
  } else if (!hasCrsScore && targetDestination === "canada") {
    state = "crs";
  } else if (
    docCompletion.total > 0 &&
    docCompletion.completed < docCompletion.total
  ) {
    state = "documents";
  } else {
    state = "complete";
  }

  // Dynamic profile completion message based on destination
  const getProfileDescription = () => {
    if (targetDestination === "canada") {
      return language === "ar"
        ? `أنت في ${profileCompletion}% من الطريق! إكمال ملفك الشخصي يزيد من دقة حساب نقاط CRS.`
        : `You are ${profileCompletion}% there. Completing your profile improves CRS score accuracy.`;
    } else if (targetDestination === "australia") {
      return language === "ar"
        ? `أنت في ${profileCompletion}% من الطريق! إكمال ملفك الشخصي يزيد من دقة حساب النقاط.`
        : `You are ${profileCompletion}% there. Completing your profile improves points calculation accuracy.`;
    } else if (targetDestination === "portugal") {
      return language === "ar"
        ? `أنت في ${profileCompletion}% من الطريق! إكمال ملفك الشخصي يحسن تقييم أهليتك.`
        : `You are ${profileCompletion}% there. Completing your profile improves eligibility assessment.`;
    }
    return language === "ar"
      ? `أنت في ${profileCompletion}% من الطريق! أكمل ملفك الشخصي.`
      : `You are ${profileCompletion}% there. Complete your profile.`;
  };

  // Dynamic calculator message based on destination
  const getCalculatorContent = () => {
    if (targetDestination === "canada") {
      return {
        title: language === "ar" ? "احسب نقاط CRS" : "Calculate Your CRS Score",
        description:
          language === "ar"
            ? "اكتشف مدى أهليتك للهجرة إلى كندا الآن."
            : "Find out your eligibility for Canadian immigration right now.",
      };
    } else if (targetDestination === "australia") {
      return {
        title: language === "ar" ? "احسب نقاطك" : "Calculate Your Points",
        description:
          language === "ar"
            ? "اكتشف مدى أهليتك للهجرة إلى أستراليا."
            : "Find out your eligibility for Australian immigration.",
      };
    } else if (targetDestination === "portugal") {
      return {
        title:
          language === "ar" ? "تحقق من الأهلية" : "Check Your Eligibility",
        description:
          language === "ar"
            ? "تحقق من أهليتك للحصول على تأشيرة البرتغال."
            : "Check your eligibility for a Portugal visa.",
      };
    }
    return {
      title: language === "ar" ? "تحقق من الأهلية" : "Check Eligibility",
      description:
        language === "ar"
          ? "احسب نقاطك أو تحقق من أهليتك."
          : "Calculate your score or check eligibility.",
    };
  };

  const calculatorContent = getCalculatorContent();

  const content = {
    profile: {
      title: language === "ar" ? "أكمل ملفك الشخصي" : "Complete Your Profile",
      description: getProfileDescription(),
      action: language === "ar" ? "الذهاب للملف الشخصي" : "Go to Profile",
      icon: User,
      href: "/profile",
      color: "text-blue-600",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
    },
    crs: {
      title: calculatorContent.title,
      description: calculatorContent.description,
      action: language === "ar" ? "بدء الحساب" : "Start Calculator",
      icon: Calculator,
      href: "/calculator",
      color: "text-purple-600",
      bg: "bg-purple-50/50 dark:bg-purple-950/20",
    },
    documents: {
      title:
        language === "ar"
          ? "رفع المستندات المطلوبة"
          : "Upload Required Documents",
      description:
        language === "ar"
          ? `لديك ${docCompletion.total - docCompletion.completed} مستندات بانتظار الرفع.`
          : `You have ${docCompletion.total - docCompletion.completed} pending documents to upload.`,
      action: language === "ar" ? "عرض القائمة" : "View Checklist",
      icon: FileText,
      href: "/documents",
      color: "text-amber-600",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
    },
    complete: {
      title: language === "ar" ? "أنت جاهز للتقديم!" : "You're Ready to Apply",
      description:
        language === "ar"
          ? "تحدث مع مساعدنا الذكي للبدء في إجراءات التقديم."
          : "Talk to our AI assistant to guide you through the submission process.",
      action: language === "ar" ? "تحدث مع هجرة" : "Talk to Hijraah AI",
      icon: Sparkles,
      href: "/chat?new=true",
      color: "text-green-600",
      bg: "bg-green-50/50 dark:bg-green-950/20",
    },
  }[state];

  return (
    <Card
      className={`mb-6 border-l-4 ${content.bg} overflow-hidden`}
      style={{ borderLeftColor: "currentColor" }}
    >
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
            <Button
              onClick={() => router.push(content.href)}
              className="shrink-0 gap-2"
            >
              {content.action}
              <ArrowRightCircle
                className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
      </div>
    </Card>
  );
});
