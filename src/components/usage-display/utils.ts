// Utility functions for Usage Display

import type { CategoryUsage, UsageStatus, UsageData } from "./types";

/**
 * Calculate usage percentage and status for a category
 */
export function getUsageMetrics(category: CategoryUsage): {
  percentage: number;
  status: UsageStatus;
  isUnlimited: boolean;
} {
  const isUnlimited =
    category.limit === "unlimited" ||
    category.limit === 999 ||
    typeof category.limit === "string";

  if (isUnlimited) {
    return { percentage: 0, status: "unlimited", isUnlimited: true };
  }

  const limit = category.limit as number;
  const percentage = Math.min(100, (category.used / limit) * 100);

  let status: UsageStatus = "ok";
  if (percentage >= 100) status = "critical";
  else if (percentage >= 80) status = "warning";

  return { percentage, status, isUnlimited };
}

/**
 * Calculate days remaining in billing cycle
 */
export function getDaysRemaining(periodEnd: Date): number {
  const now = new Date();
  const end = new Date(periodEnd);
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate usage velocity (usage per day)
 */
export function getUsageVelocity(used: number, periodStart: Date): number {
  const now = new Date();
  const start = new Date(periodStart);
  const daysPassed = Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  return used / daysPassed;
}

/**
 * Predict if user will run out before period end
 */
export function willRunOut(
  category: CategoryUsage,
  periodStart: Date,
  periodEnd: Date
): { willRunOut: boolean; daysUntilEmpty: number | null } {
  // Check for unlimited
  if (
    category.limit === "unlimited" ||
    category.limit === 999 ||
    typeof category.limit === "string"
  ) {
    return { willRunOut: false, daysUntilEmpty: null };
  }

  // Handle remaining being string ("unlimited") or number
  const remaining =
    typeof category.remaining === "string" ? Infinity : category.remaining;
  if (remaining === Infinity) {
    return { willRunOut: false, daysUntilEmpty: null };
  }
  if (remaining <= 0) {
    return { willRunOut: true, daysUntilEmpty: 0 };
  }

  const velocity = getUsageVelocity(category.used, periodStart);
  if (velocity === 0) {
    return { willRunOut: false, daysUntilEmpty: null };
  }

  const daysUntilEmpty = Math.ceil(remaining / velocity);
  const daysRemainingInPeriod = getDaysRemaining(periodEnd);

  return {
    willRunOut: daysUntilEmpty < daysRemainingInPeriod,
    daysUntilEmpty,
  };
}

/**
 * Get recommended tier based on usage patterns
 */
export function getRecommendedUpgrade(
  usage: UsageData,
  currentTier: string
): { tier: string; reason: { en: string; ar: string } } | null {
  if (currentTier === "vip") return null;

  // Check if any category is at or near limit
  const chatMetrics = getUsageMetrics(usage.chat);
  const sopMetrics = getUsageMetrics(usage.sop);
  const crsMetrics = getUsageMetrics(usage.crs);

  // Free users hitting chat limits → Essential
  if (currentTier === "free" && chatMetrics.status === "critical") {
    return {
      tier: "essential",
      reason: {
        en: "Upgrade for unlimited AI chat messages",
        ar: "ترقية للحصول على رسائل غير محدودة",
      },
    };
  }

  // Free users hitting CRS limits → Essential
  if (currentTier === "free" && crsMetrics.status === "critical") {
    return {
      tier: "essential",
      reason: {
        en: "Upgrade for unlimited score calculations",
        ar: "ترقية لحسابات نقاط غير محدودة",
      },
    };
  }

  // Essential users wanting SOP → Premium
  if (currentTier === "essential" && usage.sop.used > 0) {
    return {
      tier: "premium",
      reason: {
        en: "Upgrade to unlock SOP Writer",
        ar: "ترقية لفتح كاتب SOP",
      },
    };
  }

  // Premium users hitting SOP limits → VIP
  if (currentTier === "premium" && sopMetrics.status === "critical") {
    return {
      tier: "vip",
      reason: {
        en: "Upgrade for unlimited SOP generations",
        ar: "ترقية لإنشاء SOP غير محدود",
      },
    };
  }

  // Free users with high usage → Essential
  if (
    currentTier === "free" &&
    (chatMetrics.percentage >= 50 || crsMetrics.percentage >= 50)
  ) {
    return {
      tier: "essential",
      reason: {
        en: "You're using Hijraah a lot! Upgrade for more features",
        ar: "أنت تستخدم هجرة كثيراً! ترقية لمزيد من الميزات",
      },
    };
  }

  return null;
}
