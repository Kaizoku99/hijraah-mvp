/**
 * Express Entry Draw Intelligence
 * Real-time tracking, analysis, and predictions for Express Entry draws
 */

import type { ExpressEntryDraw } from "@/components/application-tracker/types";

// Draw types for category-based draws
export const DRAW_CATEGORIES = {
  "No program specified": "general",
  "Canadian Experience Class": "cec",
  "Federal Skilled Worker": "fsw",
  "Federal Skilled Trades": "fst",
  "Provincial Nominee Program": "pnp",
  "Healthcare occupations": "healthcare",
  "STEM occupations": "stem",
  "Trade occupations": "trades",
  "Transport occupations": "transport",
  "Agriculture and agri-food occupations": "agriculture",
  "French language proficiency": "french",
} as const;

export type DrawCategory = typeof DRAW_CATEGORIES[keyof typeof DRAW_CATEGORIES];

export interface DrawAnalysis {
  averageCrs: number;
  lowestCrs: number;
  highestCrs: number;
  averageInvitations: number;
  totalInvitations: number;
  drawCount: number;
  trendDirection: "up" | "down" | "stable";
  trendStrength: number; // -100 to 100
}

export interface DrawPrediction {
  predictedCrs: number;
  confidenceLevel: "high" | "medium" | "low";
  predictedDate: Date;
  factors: string[];
  rangeMin: number;
  rangeMax: number;
}

export interface UserDrawComparison {
  userCrsScore: number;
  wouldBeInvited: boolean;
  matchingDraws: ExpressEntryDraw[];
  averageGap: number;
  percentile: number;
  categoryRecommendations: Array<{
    category: string;
    averageCrs: number;
    yourChance: "high" | "medium" | "low";
  }>;
}

/**
 * Analyze draw history to identify trends
 */
export function analyzeDrawHistory(
  draws: ExpressEntryDraw[],
  category?: string
): DrawAnalysis {
  const filteredDraws = category
    ? draws.filter((d) => d.drawType.toLowerCase().includes(category.toLowerCase()))
    : draws;

  if (filteredDraws.length === 0) {
    return {
      averageCrs: 0,
      lowestCrs: 0,
      highestCrs: 0,
      averageInvitations: 0,
      totalInvitations: 0,
      drawCount: 0,
      trendDirection: "stable",
      trendStrength: 0,
    };
  }

  const crsScores = filteredDraws.map((d) => d.crsMinimum);
  const invitations = filteredDraws.map((d) => d.invitationsIssued);

  const averageCrs = Math.round(crsScores.reduce((a, b) => a + b, 0) / crsScores.length);
  const lowestCrs = Math.min(...crsScores);
  const highestCrs = Math.max(...crsScores);
  const averageInvitations = Math.round(
    invitations.reduce((a, b) => a + b, 0) / invitations.length
  );
  const totalInvitations = invitations.reduce((a, b) => a + b, 0);

  // Calculate trend using linear regression on recent draws
  const recentDraws = filteredDraws.slice(0, Math.min(10, filteredDraws.length));
  const trendData = calculateTrend(recentDraws.map((d) => d.crsMinimum));

  return {
    averageCrs,
    lowestCrs,
    highestCrs,
    averageInvitations,
    totalInvitations,
    drawCount: filteredDraws.length,
    trendDirection: trendData.direction,
    trendStrength: trendData.strength,
  };
}

/**
 * Calculate trend direction and strength
 */
function calculateTrend(values: number[]): { direction: "up" | "down" | "stable"; strength: number } {
  if (values.length < 2) {
    return { direction: "stable", strength: 0 };
  }

  // Simple linear regression
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Normalize slope to -100 to 100 range
  const normalizedStrength = Math.max(-100, Math.min(100, slope * 10));

  let direction: "up" | "down" | "stable";
  if (normalizedStrength > 5) {
    direction = "up";
  } else if (normalizedStrength < -5) {
    direction = "down";
  } else {
    direction = "stable";
  }

  return { direction, strength: normalizedStrength };
}

/**
 * Predict next draw CRS cutoff
 */
export function predictNextDraw(
  draws: ExpressEntryDraw[],
  drawType: string = "No program specified"
): DrawPrediction {
  const analysis = analyzeDrawHistory(draws, drawType);
  const recentDraws = draws.filter(
    (d) => drawType === "No program specified" || d.drawType.includes(drawType)
  ).slice(0, 10);

  if (recentDraws.length === 0) {
    return {
      predictedCrs: 480,
      confidenceLevel: "low",
      predictedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      factors: ["No historical data available for prediction"],
      rangeMin: 450,
      rangeMax: 520,
    };
  }

  // Calculate weighted average of recent draws (more recent = higher weight)
  let weightedSum = 0;
  let weightTotal = 0;
  recentDraws.forEach((draw, index) => {
    const weight = recentDraws.length - index;
    weightedSum += draw.crsMinimum * weight;
    weightTotal += weight;
  });

  let predictedCrs = Math.round(weightedSum / weightTotal);

  // Adjust based on trend
  if (analysis.trendDirection === "up") {
    predictedCrs += Math.round(Math.abs(analysis.trendStrength) / 10);
  } else if (analysis.trendDirection === "down") {
    predictedCrs -= Math.round(Math.abs(analysis.trendStrength) / 10);
  }

  // Calculate confidence based on variance
  const variance = calculateVariance(recentDraws.map((d) => d.crsMinimum));
  let confidenceLevel: "high" | "medium" | "low";
  if (variance < 100) {
    confidenceLevel = "high";
  } else if (variance < 400) {
    confidenceLevel = "medium";
  } else {
    confidenceLevel = "low";
  }

  // Estimate next draw date (typically every 2 weeks)
  const lastDraw = recentDraws[0];
  const daysSinceLastDraw = Math.floor(
    (Date.now() - new Date(lastDraw.drawDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  const daysUntilNext = Math.max(0, 14 - daysSinceLastDraw);
  const predictedDate = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);

  // Build factors list
  const factors: string[] = [];
  if (analysis.trendDirection === "up") {
    factors.push("CRS cutoffs have been increasing recently");
  } else if (analysis.trendDirection === "down") {
    factors.push("CRS cutoffs have been decreasing recently");
  }
  if (variance > 200) {
    factors.push("High variance in recent draws adds uncertainty");
  }
  if (recentDraws.length < 5) {
    factors.push("Limited recent data for this draw type");
  }

  // Calculate range
  const stdDev = Math.sqrt(variance);
  const rangeMin = Math.max(400, Math.round(predictedCrs - stdDev));
  const rangeMax = Math.min(600, Math.round(predictedCrs + stdDev));

  return {
    predictedCrs,
    confidenceLevel,
    predictedDate,
    factors,
    rangeMin,
    rangeMax,
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Compare user's CRS score against historical draws
 */
export function compareUserScore(
  userCrsScore: number,
  draws: ExpressEntryDraw[]
): UserDrawComparison {
  const sortedDraws = [...draws].sort((a, b) => b.crsMinimum - a.crsMinimum);
  const matchingDraws = draws.filter((d) => userCrsScore >= d.crsMinimum);
  const wouldBeInvited = matchingDraws.length > 0;

  // Calculate average gap (how far from cutoffs)
  const gaps = draws.map((d) => d.crsMinimum - userCrsScore);
  const averageGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);

  // Calculate percentile (what percentage of draws user would qualify for)
  const percentile = Math.round((matchingDraws.length / draws.length) * 100);

  // Analyze by category for recommendations
  const categoryMap = new Map<string, number[]>();
  draws.forEach((draw) => {
    const existing = categoryMap.get(draw.drawType) || [];
    existing.push(draw.crsMinimum);
    categoryMap.set(draw.drawType, existing);
  });

  const categoryRecommendations: UserDrawComparison["categoryRecommendations"] = [];
  categoryMap.forEach((scores, category) => {
    const avgCrs = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const minCrs = Math.min(...scores);
    
    let chance: "high" | "medium" | "low";
    if (userCrsScore >= avgCrs) {
      chance = "high";
    } else if (userCrsScore >= minCrs) {
      chance = "medium";
    } else {
      chance = "low";
    }

    categoryRecommendations.push({
      category,
      averageCrs: avgCrs,
      yourChance: chance,
    });
  });

  // Sort by chance and average CRS
  categoryRecommendations.sort((a, b) => {
    const chanceOrder = { high: 0, medium: 1, low: 2 };
    if (chanceOrder[a.yourChance] !== chanceOrder[b.yourChance]) {
      return chanceOrder[a.yourChance] - chanceOrder[b.yourChance];
    }
    return a.averageCrs - b.averageCrs;
  });

  return {
    userCrsScore,
    wouldBeInvited,
    matchingDraws,
    averageGap,
    percentile,
    categoryRecommendations,
  };
}

/**
 * Generate smart alerts based on draw analysis
 */
export interface DrawAlert {
  type: "opportunity" | "warning" | "info";
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  priority: "high" | "medium" | "low";
}

export function generateDrawAlerts(
  userCrsScore: number,
  draws: ExpressEntryDraw[]
): DrawAlert[] {
  const alerts: DrawAlert[] = [];
  const comparison = compareUserScore(userCrsScore, draws);
  const prediction = predictNextDraw(draws);
  const analysis = analyzeDrawHistory(draws);

  // Check if user is close to qualifying
  if (!comparison.wouldBeInvited && comparison.averageGap < 20) {
    alerts.push({
      type: "opportunity",
      titleEn: "Almost There!",
      titleAr: "على وشك التأهل!",
      messageEn: `You're only ${Math.abs(comparison.averageGap)} points away from qualifying for recent draws. Consider improving your score.`,
      messageAr: `أنت على بعد ${Math.abs(comparison.averageGap)} نقطة فقط من التأهل للسحوبات الأخيرة. فكر في تحسين نقاطك.`,
      priority: "high",
    });
  }

  // Alert if scores are trending down
  if (analysis.trendDirection === "down" && Math.abs(analysis.trendStrength) > 20) {
    alerts.push({
      type: "opportunity",
      titleEn: "CRS Cutoffs Dropping",
      titleAr: "انخفاض حدود CRS",
      messageEn: "Recent draw cutoffs have been decreasing. This might be a good time to prepare your application.",
      messageAr: "حدود السحب الأخيرة في انخفاض. قد يكون هذا وقتًا جيدًا لإعداد طلبك.",
      priority: "medium",
    });
  }

  // Alert if scores are trending up
  if (analysis.trendDirection === "up" && Math.abs(analysis.trendStrength) > 20) {
    alerts.push({
      type: "warning",
      titleEn: "CRS Cutoffs Rising",
      titleAr: "ارتفاع حدود CRS",
      messageEn: "Recent draw cutoffs have been increasing. Consider improving your score soon.",
      messageAr: "حدود السحب الأخيرة في ارتفاع. فكر في تحسين نقاطك قريبًا.",
      priority: "medium",
    });
  }

  // Category-based recommendations
  const highChanceCategories = comparison.categoryRecommendations.filter(
    (c) => c.yourChance === "high"
  );
  if (highChanceCategories.length > 0 && !comparison.wouldBeInvited) {
    const categoryNames = highChanceCategories.slice(0, 2).map((c) => c.category).join(", ");
    alerts.push({
      type: "info",
      titleEn: "Category-Based Draw Opportunity",
      titleAr: "فرصة السحب القائم على الفئة",
      messageEn: `You have a high chance in category-based draws: ${categoryNames}`,
      messageAr: `لديك فرصة عالية في السحوبات القائمة على الفئة: ${categoryNames}`,
      priority: "medium",
    });
  }

  // Predicted draw info
  alerts.push({
    type: "info",
    titleEn: "Next Draw Prediction",
    titleAr: "توقع السحب القادم",
    messageEn: `Next draw expected around ${prediction.predictedDate.toLocaleDateString()} with CRS cutoff of ~${prediction.predictedCrs} (range: ${prediction.rangeMin}-${prediction.rangeMax})`,
    messageAr: `السحب القادم متوقع حوالي ${prediction.predictedDate.toLocaleDateString('ar-SA')} مع حد CRS ~${prediction.predictedCrs} (المدى: ${prediction.rangeMin}-${prediction.rangeMax})`,
    priority: "low",
  });

  return alerts;
}
