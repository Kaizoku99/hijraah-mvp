"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MessageSquare,
  Calculator,
  FileText,
  FolderCheck,
  Crown,
  Activity,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getUsageStats } from "@/actions/usage";

interface UsageItemProps {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number | "unlimited";
  colorClass: string;
}

function UsageItem({ icon, label, used, limit, colorClass }: UsageItemProps) {
  const isUnlimited = limit === "unlimited" || limit === 999;
  const percentage = isUnlimited
    ? 100
    : Math.min(100, (used / (limit as number)) * 100);

  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${colorClass} ring-1 ring-inset ring-black/5 dark:ring-white/10`}
          >
            {icon}
          </div>
          <span className="font-medium text-foreground/90">{label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <span
            className={
              isAtLimit
                ? "text-destructive font-bold"
                : isNearLimit
                  ? "text-yellow-600 font-bold"
                  : ""
            }
          >
            {used}
          </span>
          <span>/</span>
          <span>{isUnlimited ? "∞" : limit}</span>
        </div>
      </div>
      <Progress
        value={percentage}
        className="h-1.5"
        indicatorClassName={
          isAtLimit
            ? "bg-destructive"
            : isNearLimit
              ? "bg-yellow-500"
              : undefined
        }
      />
    </div>
  );
}

export function UsageDisplay() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage', 'stats'],
    queryFn: getUsageStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate total usage percentage for the trigger button indicator
  const getTotalUsageIndicator = () => {
    if (!usage) return { percentage: 0, status: "ok" as const };

    const categories = [usage.chat, usage.crs, usage.sop, usage.document];
    let maxPercentage = 0;

    for (const cat of categories) {
      if (cat.limit !== "unlimited" && cat.limit !== 999) {
        const pct = (cat.used / (cat.limit as number)) * 100;
        if (pct > maxPercentage) maxPercentage = pct;
      }
    }

    if (maxPercentage >= 100) return { percentage: maxPercentage, status: "critical" as const };
    if (maxPercentage >= 80) return { percentage: maxPercentage, status: "warning" as const };
    return { percentage: maxPercentage, status: "ok" as const };
  };

  const indicator = getTotalUsageIndicator();

  const items = usage
    ? [
      {
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        label: isRtl ? "رسائل الدردشة" : "Chat",
        used: usage.chat.used,
        limit: usage.chat.limit,
        colorClass:
          "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
      },
      {
        icon: <Calculator className="h-3.5 w-3.5" />,
        label: isRtl ? "CRS" : "CRS",
        used: usage.crs.used,
        limit: usage.crs.limit,
        colorClass:
          "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
      },
      {
        icon: <FileText className="h-3.5 w-3.5" />,
        label: isRtl ? "SOP" : "SOP",
        used: usage.sop.used,
        limit: usage.sop.limit,
        colorClass:
          "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
      },
      {
        icon: <FolderCheck className="h-3.5 w-3.5" />,
        label: isRtl ? "المستندات" : "Docs",
        used: usage.document.used,
        limit: usage.document.limit,
        colorClass:
          "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
      },
    ]
    : [];

  const hasLimitReached = items.some(
    (item) =>
      item.limit !== "unlimited" &&
      item.limit !== 999 &&
      item.used >= (item.limit as number)
  );

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
              {indicator.status !== "ok" && (
                <span
                  className={`absolute top-1 right-1 h-2 w-2 rounded-full ${indicator.status === "critical"
                    ? "bg-destructive animate-pulse"
                    : "bg-yellow-500"
                    }`}
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
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isRtl ? "استخدام هذا الشهر" : "This Month's Usage"}
            </span>
          </div>
          {usage && (
            <span className="text-xs text-muted-foreground">
              {new Date(usage.periodEnd).toLocaleDateString(
                isRtl ? "ar" : undefined,
                { month: "short", day: "numeric" }
              )}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                  <div className="h-1.5 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            items.map((item, index) => <UsageItem key={index} {...item} />)
          )}
        </div>

        {/* Footer with Upgrade Button */}
        {!isLoading && (
          <div className="px-4 pb-4">
            <Link href="/pricing" className="block">
              <Button
                className={`w-full ${hasLimitReached
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  : ""
                  }`}
                variant={hasLimitReached ? "default" : "outline"}
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                {isRtl ? "ترقية الخطة" : "Upgrade Plan"}
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default UsageDisplay;
