"use client";

import { memo, useMemo } from "react";
import { TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CategoryUsage, UsageItemConfig } from "./types";
import { getUsageMetrics, willRunOut } from "./utils";

export interface UsageItemProps {
  config: UsageItemConfig;
  usage: CategoryUsage;
  periodStart: Date;
  periodEnd: Date;
  isRtl: boolean;
  showPrediction?: boolean;
}

export const UsageItem = memo(function UsageItem({
  config,
  usage,
  periodStart,
  periodEnd,
  isRtl,
  showPrediction = true,
}: UsageItemProps) {
  const { percentage, status, isUnlimited } = useMemo(
    () => getUsageMetrics(usage),
    [usage]
  );

  const prediction = useMemo(
    () => (showPrediction ? willRunOut(usage, periodStart, periodEnd) : null),
    [usage, periodStart, periodEnd, showPrediction]
  );

  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-between text-sm",
          isRtl && "flex-row-reverse"
        )}
      >
        <div
          className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
        >
          <div
            className={cn(
              "p-1.5 rounded-md ring-1 ring-inset ring-black/5 dark:ring-white/10",
              config.bgClass,
              config.colorClass
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium text-foreground/90">
            {isRtl ? config.labelAr : config.labelEn}
          </span>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5",
            isRtl && "flex-row-reverse"
          )}
        >
          {/* Prediction warning */}
          {prediction?.willRunOut &&
            prediction.daysUntilEmpty !== null &&
            prediction.daysUntilEmpty > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      {isRtl
                        ? `قد ينفد خلال ${prediction.daysUntilEmpty} يوم`
                        : `May run out in ${prediction.daysUntilEmpty} days`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

          {/* Usage count */}
          <span
            className={cn(
              "text-xs font-mono",
              status === "critical" && "text-destructive font-bold",
              status === "warning" && "text-amber-600 font-semibold",
              status === "unlimited" && "text-green-600",
              status === "ok" && "text-muted-foreground"
            )}
          >
            {usage.used}
            <span className="text-muted-foreground mx-0.5">/</span>
            {isUnlimited ? "∞" : usage.limit}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <Progress
          value={percentage}
          className="h-1.5"
          indicatorClassName={cn(
            status === "critical" && "bg-destructive",
            status === "warning" && "bg-amber-500"
          )}
        />
      )}

      {/* Unlimited indicator */}
      {isUnlimited && (
        <div className="flex items-center gap-1 text-[10px] text-green-600">
          <Sparkles className="h-3 w-3" />
          <span>{isRtl ? "غير محدود" : "Unlimited"}</span>
        </div>
      )}
    </div>
  );
});
