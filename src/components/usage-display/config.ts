// Configuration for Usage Display

import {
  MessageSquare,
  Calculator,
  FileText,
  FolderCheck,
  Crown,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react";
import type { UsageItemConfig, TierConfigItem, DestinationType } from "./types";

/**
 * Get destination-specific label for the calculator/eligibility category
 */
export function getCalculatorLabel(
  destination: DestinationType,
  language: "ar" | "en"
): { labelEn: string; labelAr: string; descEn: string; descAr: string } {
  switch (destination) {
    case "canada":
      return {
        labelEn: "CRS Score",
        labelAr: "نقاط CRS",
        descEn: "Express Entry score calculations",
        descAr: "حسابات نقاط الدخول السريع",
      };
    case "australia":
      return {
        labelEn: "Points Test",
        labelAr: "اختبار النقاط",
        descEn: "SkillSelect points calculations",
        descAr: "حسابات نقاط سكيل سيليكت",
      };
    case "portugal":
      return {
        labelEn: "Eligibility",
        labelAr: "فحص الأهلية",
        descEn: "Visa eligibility checks",
        descAr: "فحوصات أهلية التأشيرة",
      };
    default:
      return {
        labelEn: "Calculator",
        labelAr: "الحاسبة",
        descEn: "Score/eligibility calculations",
        descAr: "حسابات النقاط والأهلية",
      };
  }
}

/**
 * Generate destination-aware usage categories
 */
export function getUsageCategories(destination: DestinationType): UsageItemConfig[] {
  const calcLabels = getCalculatorLabel(destination, "en");

  const baseCategories: UsageItemConfig[] = [
    {
      id: "chat",
      icon: MessageSquare,
      labelEn: "AI Chat",
      labelAr: "الدردشة الذكية",
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 dark:bg-blue-900/20",
      description: {
        en: "Messages with AI assistant",
        ar: "رسائل مع المساعد الذكي",
      },
    },
    {
      id: "crs",
      icon: Calculator,
      labelEn: calcLabels.labelEn,
      labelAr: calcLabels.labelAr,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 dark:bg-green-900/20",
      description: {
        en: calcLabels.descEn,
        ar: calcLabels.descAr,
      },
    },
  ];

  // Only add SOP for Canada and Australia (not needed for Portugal)
  if (destination !== "portugal") {
    baseCategories.push({
      id: "sop",
      icon: FileText,
      labelEn: "SOP Writer",
      labelAr: "كاتب SOP",
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50 dark:bg-purple-900/20",
      description: {
        en: "Statement of Purpose generations",
        ar: "إنشاء خطاب النوايا",
      },
    });
  }

  // Documents is always shown
  baseCategories.push({
    id: "document",
    icon: FolderCheck,
    labelEn: "Documents",
    labelAr: "المستندات",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50 dark:bg-orange-900/20",
    description: {
      en: "Document checklists created",
      ar: "قوائم المستندات المنشأة",
    },
  });

  return baseCategories;
}

// Static fallback for when destination is not known
export const DEFAULT_USAGE_CATEGORIES: UsageItemConfig[] = getUsageCategories(null);

export const TIER_CONFIG: Record<string, TierConfigItem> = {
  free: {
    nameEn: "Free",
    nameAr: "مجاني",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Activity,
  },
  essential: {
    nameEn: "Essential",
    nameAr: "أساسي",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: Zap,
  },
  premium: {
    nameEn: "Premium",
    nameAr: "متميز",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: Sparkles,
  },
  vip: {
    nameEn: "VIP",
    nameAr: "VIP",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: Crown,
  },
};
