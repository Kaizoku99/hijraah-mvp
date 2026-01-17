"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface PricingRecommendationProps {
  sopsCount: number;
  chatCount: number;
  checklistCount: number;
  language: string;
}

export const PricingRecommendation = memo(function PricingRecommendation({
  sopsCount,
  chatCount,
  checklistCount,
  language,
}: PricingRecommendationProps) {
  // Determine recommended tier based on usage
  let recommendedTier: "free" | "essential" | "premium" = "free";
  let reason = "";

  if (sopsCount > 1 || chatCount > 30) {
    recommendedTier = "premium";
    reason =
      language === "ar"
        ? "استخدامك يتجاوز الخطة الأساسية. Premium يمنحك SOPs غير محدودة!"
        : "Your usage exceeds Essential. Premium gives you unlimited SOPs!";
  } else if (sopsCount > 0 || chatCount > 15 || checklistCount > 2) {
    recommendedTier = "essential";
    reason =
      language === "ar"
        ? "للحصول على المزيد من الرسائل والمستندات، جرّب الخطة الأساسية."
        : "For more messages and documents, try the Essential plan.";
  } else {
    return null; // Free tier user with low usage - don't show recommendation
  }

  const tierInfo = {
    essential: {
      name: language === "ar" ? "أساسي" : "Essential",
      price: "$29",
      color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    },
    premium: {
      name: language === "ar" ? "مميز" : "Premium",
      price: "$79",
      color: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
    },
  }[recommendedTier];

  return (
    <Card className={`mb-6 border-l-4 ${tierInfo?.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          {language === "ar" ? "ترقية مقترحة" : "Recommended Upgrade"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Link href="/pricing">
          <Button size="sm" variant="outline">
            {tierInfo?.name} - {tierInfo?.price}/
            {language === "ar" ? "شهر" : "mo"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
