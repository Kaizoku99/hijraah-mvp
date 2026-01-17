// Utility functions for Immigration Journey

import { analyzeScoreAgainstDraws } from "@/../shared/expressEntryDraws";
import type { CrsStatusResult } from "./types";

/**
 * Get the overall journey progress percentage
 */
export function calculateOverallProgress(
  profileCompletion: number,
  hasCrsScore: boolean,
  documentsUploaded: number,
  totalDocuments: number
): number {
  const profileWeight = 30;
  const scoreWeight = 30;
  const documentsWeight = 40;

  const profileProgress = (profileCompletion / 100) * profileWeight;
  const scoreProgress = hasCrsScore ? scoreWeight : 0;
  const docProgress =
    totalDocuments > 0
      ? (documentsUploaded / totalDocuments) * documentsWeight
      : 0;

  return Math.round(profileProgress + scoreProgress + docProgress);
}

/**
 * Get CRS analysis status for Canada
 */
export function getCrsStatus(score: number | null | undefined): CrsStatusResult {
  if (!score) {
    return {
      status: "unknown",
      messageEn: "Calculate your score to see your chances",
      messageAr: "احسب نقاطك لمعرفة فرصك",
      color: "text-muted-foreground",
    };
  }

  const analysis = analyzeScoreAgainstDraws(score);

  const statusMessages = {
    excellent: {
      messageEn: `Excellent! Your score of ${score} exceeds recent draw cutoffs`,
      messageAr: `ممتاز! نقاطك ${score} تتجاوز حدود السحب الأخيرة`,
      color: "text-green-600",
    },
    good: {
      messageEn: `Good standing - ${score} points is competitive`,
      messageAr: `وضع جيد - ${score} نقطة تنافسية`,
      color: "text-emerald-600",
    },
    competitive: {
      messageEn: `Close! You need ${analysis.pointsNeeded} more points`,
      messageAr: `قريب! تحتاج ${analysis.pointsNeeded} نقطة إضافية`,
      color: "text-amber-600",
    },
    needs_improvement: {
      messageEn: `Need ${analysis.pointsNeeded} more points to qualify`,
      messageAr: `تحتاج ${analysis.pointsNeeded} نقطة إضافية للتأهل`,
      color: "text-red-600",
    },
  };

  return {
    status: analysis.status,
    ...statusMessages[analysis.status],
  };
}
