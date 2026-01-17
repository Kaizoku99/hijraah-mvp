"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { SmartTip } from "./types";

interface SmartTipCardProps {
  tip: SmartTip;
  isRtl: boolean;
}

const colorClasses = {
  info: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  success: "text-green-600 bg-green-50 dark:bg-green-950/30",
  warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  action: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
} as const;

export const SmartTipCard = memo(function SmartTipCard({ 
  tip, 
  isRtl 
}: SmartTipCardProps) {
  const Icon = tip.icon;
  const colorClass = colorClasses[tip.type];

  return (
    <div
      className={cn(
        "flex gap-2 p-2 rounded-lg text-xs",
        colorClass,
        isRtl && "flex-row-reverse text-right"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p>{tip.message}</p>
        {tip.link && (
          <Link
            href={tip.link}
            className="font-medium underline mt-1 inline-block"
          >
            {tip.linkText}
          </Link>
        )}
      </div>
    </div>
  );
});
