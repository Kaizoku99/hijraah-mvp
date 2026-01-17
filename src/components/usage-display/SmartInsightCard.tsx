"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { SmartInsight } from "./types";

export interface SmartInsightCardProps {
  insight: SmartInsight;
  isRtl: boolean;
}

const bgClasses = {
  info: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  warning:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  success:
    "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
  action:
    "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
} as const;

export const SmartInsightCard = memo(function SmartInsightCard({ 
  insight, 
  isRtl 
}: SmartInsightCardProps) {
  const Icon = insight.icon;
  const bgClass = bgClasses[insight.type];

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2.5 rounded-lg text-xs",
        bgClass,
        isRtl && "flex-row-reverse text-right"
      )}
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p>{insight.message}</p>
        {insight.action && (
          <Link
            href={insight.action.href}
            className="font-semibold underline inline-flex items-center gap-0.5 mt-1"
          >
            {insight.action.text}
            <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
          </Link>
        )}
      </div>
    </div>
  );
});
