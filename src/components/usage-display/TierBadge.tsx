"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TIER_CONFIG } from "./config";

export interface TierBadgeProps {
  tier: string;
  isRtl: boolean;
}

export const TierBadge = memo(function TierBadge({ tier, isRtl }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1 text-xs", config.bgColor, config.color)}
    >
      <Icon className="h-3 w-3" />
      {isRtl ? config.nameAr : config.nameEn}
    </Badge>
  );
});
