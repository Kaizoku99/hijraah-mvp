"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Crown,
  Activity,
  Loader2,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getUsageStats } from "@/actions/usage";
import { getStatus } from "@/actions/subscription";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";

import type {
  UsageStatus,
  UsageCategory,
  CategoryUsage,
  SmartInsight,
  DestinationType
} from "./types";
import { getUsageCategories, TIER_CONFIG } from "./config";
import { getUsageMetrics, getDaysRemaining, getRecommendedUpgrade, willRunOut } from "./utils";
import { UsageItem } from "./UsageItem";
import { TierBadge } from "./TierBadge";
import { SmartInsightCard } from "./SmartInsightCard";

interface UsageDisplayProps {
  /** Target destination for context-aware display (hides SOP for Portugal) */
  targetDestination?: DestinationType;
}

export function UsageDisplay({ targetDestination }: UsageDisplayProps = {}) {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // Fetch usage stats
  const {
    data: usage,
    isLoading: usageLoading,
    refetch: refetchUsage,
  } = useQuery({
    queryKey: queryKeys.usage.stats(),
    queryFn: getUsageStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: queryKeys.subscription.status(),
    queryFn: getStatus,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const isLoading = usageLoading || subscriptionLoading;
  const currentTier = subscription?.tier || "free";

  // Calculate overall status for trigger button
  const overallStatus = useMemo((): UsageStatus => {
    if (!usage) return "ok";

    const categories = [usage.chat, usage.crs, usage.sop, usage.document];
    let maxStatus: UsageStatus = "ok";

    for (const cat of categories) {
      const { status } = getUsageMetrics(cat);
      if (status === "critical") return "critical";
      if (status === "warning") maxStatus = "warning";
    }

    return maxStatus;
  }, [usage]);

  // Days remaining in billing cycle
  const daysRemaining = useMemo(
    () => (usage ? getDaysRemaining(usage.periodEnd) : null),
    [usage]
  );

  // Get recommended upgrade
  const recommendedUpgrade = useMemo(
    () => (usage ? getRecommendedUpgrade(usage, currentTier) : null),
    [usage, currentTier]
  );

  // Generate smart insights (destination-aware)
  const insights = useMemo((): SmartInsight[] => {
    if (!usage) return [];

    const result: SmartInsight[] = [];
    const destCategories = getUsageCategories(targetDestination);

    // Build categories list based on destination
    const categoriesToCheck: [UsageCategory, CategoryUsage][] = [
      ["chat", usage.chat],
      ["crs", usage.crs],
    ];

    // Only include SOP for non-Portugal destinations
    if (targetDestination !== "portugal") {
      categoriesToCheck.push(["sop", usage.sop]);
    }

    categoriesToCheck.push(["document", usage.document]);

    for (const [id, cat] of categoriesToCheck) {
      const { status } = getUsageMetrics(cat);
      if (status === "critical") {
        const config = destCategories.find(c => c.id === id);
        if (config) {
          result.push({
            id: `${id}-critical`,
            icon: AlertTriangle,
            message: isRtl
              ? `وصلت للحد الأقصى في ${config.labelAr}`
              : `You've reached your ${config.labelEn} limit`,
            type: "warning",
            action: {
              href: "/pricing",
              text: isRtl ? "ترقية" : "Upgrade",
            },
          });
          break; // Only show one critical warning
        }
      }
    }

    // Warning: Usage prediction
    if (result.length === 0 && daysRemaining && daysRemaining > 3) {
      for (const [id, cat] of categoriesToCheck) {
        const prediction = willRunOut(cat, usage.periodStart, usage.periodEnd);
        if (
          prediction.willRunOut &&
          prediction.daysUntilEmpty &&
          prediction.daysUntilEmpty > 0
        ) {
          const config = destCategories.find(c => c.id === id);
          if (config) {
            result.push({
              id: `${id}-prediction`,
              icon: TrendingDown,
              message: isRtl
                ? `${config.labelAr} قد ينفد قبل نهاية الشهر`
                : `${config.labelEn} may run out before month end`,
              type: "info",
            });
            break;
          }
        }
      }
    }

    // Success: Good standing
    if (
      result.length === 0 &&
      overallStatus === "ok" &&
      currentTier !== "free"
    ) {
      result.push({
        id: "good-standing",
        icon: Sparkles,
        message: isRtl
          ? "استخدامك في نطاق جيد هذا الشهر"
          : "Your usage is in good standing this month",
        type: "success",
      });
    }

    return result.slice(0, 1); // Max 1 insight
  }, [
    usage,
    daysRemaining,
    overallStatus,
    currentTier,
    isRtl,
    targetDestination,
  ]);

  // Get destination-aware categories with proper labels
  const visibleCategories = useMemo(() => {
    return getUsageCategories(targetDestination);
  }, [targetDestination]);

  // Check if any limit reached for upgrade button styling
  const hasLimitReached = useMemo(() => {
    if (!usage) return false;
    return [usage.chat, usage.crs, usage.sop, usage.document].some(cat => {
      const { status } = getUsageMetrics(cat);
      return status === "critical";
    });
  }, [usage]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 relative"
          aria-label={isRtl ? "الاستخدام" : "Usage"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Activity className="h-4 w-4" />
              {/* Status indicator dot */}
              {overallStatus !== "ok" && (
                <span
                  className={cn(
                    "absolute top-1 h-2 w-2 rounded-full",
                    isRtl ? "left-1" : "right-1",
                    overallStatus === "critical"
                      ? "bg-destructive animate-pulse"
                      : "bg-amber-500"
                  )}
                />
              )}
            </>
          )}
          <span className="hidden sm:inline">
            {isRtl ? "الاستخدام" : "Usage"}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b bg-muted/30",
            isRtl && "flex-row-reverse"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              isRtl && "flex-row-reverse"
            )}
          >
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isRtl ? "استخدام هذا الشهر" : "This Month's Usage"}
            </span>
          </div>
          <TierBadge tier={currentTier} isRtl={isRtl} />
        </div>

        {/* Period info */}
        {usage && (
          <div
            className={cn(
              "flex items-center justify-between px-4 py-2 bg-muted/20 text-xs text-muted-foreground border-b",
              isRtl && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1",
                isRtl && "flex-row-reverse"
              )}
            >
              <Clock className="h-3 w-3" />
              <span>
                {daysRemaining === 0
                  ? isRtl
                    ? "ينتهي اليوم"
                    : "Resets today"
                  : daysRemaining === 1
                    ? isRtl
                      ? "ينتهي غداً"
                      : "Resets tomorrow"
                    : isRtl
                      ? `${daysRemaining} يوم متبقي`
                      : `${daysRemaining} days left`}
              </span>
            </div>
            <button
              onClick={() => refetchUsage()}
              className="hover:text-foreground transition-colors p-1"
              title={isRtl ? "تحديث" : "Refresh"}
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                  <div className="h-1.5 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : usage ? (
            <>
              {/* Usage items */}
              {visibleCategories.map(config => (
                <UsageItem
                  key={config.id}
                  config={config}
                  usage={usage[config.id]}
                  periodStart={usage.periodStart}
                  periodEnd={usage.periodEnd}
                  isRtl={isRtl}
                />
              ))}

              {/* Smart insights */}
              {insights.length > 0 && (
                <div className="pt-2 border-t">
                  {insights.map(insight => (
                    <SmartInsightCard
                      key={insight.id}
                      insight={insight}
                      isRtl={isRtl}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              {isRtl ? "تعذر تحميل البيانات" : "Unable to load data"}
            </div>
          )}
        </div>

        {/* Footer with Upgrade Button */}
        {!isLoading && (
          <div className="px-4 pb-4">
            <Link href="/pricing" className="block">
              <Button
                className={cn(
                  "w-full gap-2",
                  hasLimitReached &&
                  "bg-linear-to-r from-primary to-purple-600 text-primary-foreground hover:opacity-90"
                )}
                variant={hasLimitReached ? "default" : "outline"}
                size="sm"
              >
                <Crown className="h-4 w-4" />
                {recommendedUpgrade ? (
                  <span>
                    {isRtl
                      ? `ترقية إلى ${TIER_CONFIG[recommendedUpgrade.tier]?.nameAr || recommendedUpgrade.tier}`
                      : `Upgrade to ${TIER_CONFIG[recommendedUpgrade.tier]?.nameEn || recommendedUpgrade.tier}`}
                  </span>
                ) : (
                  <span>{isRtl ? "عرض الخطط" : "View Plans"}</span>
                )}
              </Button>
            </Link>
            {recommendedUpgrade && (
              <p
                className={cn(
                  "text-[10px] text-muted-foreground mt-1.5 text-center",
                  isRtl && "text-right"
                )}
              >
                {isRtl
                  ? recommendedUpgrade.reason.ar
                  : recommendedUpgrade.reason.en}
              </p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default UsageDisplay;
