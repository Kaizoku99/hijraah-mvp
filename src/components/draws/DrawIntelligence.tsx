"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  BarChart3,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ExpressEntryDraw } from "@/components/application-tracker/types";
import {
  analyzeDrawHistory,
  predictNextDraw,
  compareUserScore,
  generateDrawAlerts,
  DrawAlert,
} from "@/lib/express-entry-intelligence";

interface DrawIntelligenceProps {
  draws: ExpressEntryDraw[];
  userCrsScore?: number;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-red-500",
  down: "text-green-500",
  stable: "text-gray-500",
};

const alertIcons = {
  opportunity: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const alertColors = {
  opportunity: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function DrawIntelligence({ draws, userCrsScore }: DrawIntelligenceProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // Analyze draw history
  const analysis = useMemo(() => analyzeDrawHistory(draws), [draws]);

  // Predict next draw
  const prediction = useMemo(() => predictNextDraw(draws), [draws]);

  // Compare user score
  const comparison = useMemo(
    () => (userCrsScore ? compareUserScore(userCrsScore, draws) : null),
    [userCrsScore, draws]
  );

  // Generate alerts
  const alerts = useMemo(
    () => (userCrsScore ? generateDrawAlerts(userCrsScore, draws) : []),
    [userCrsScore, draws]
  );

  const TrendIcon = trendIcons[analysis.trendDirection];
  const trendColor = trendColors[analysis.trendDirection];

  if (draws.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === "ar"
              ? "لا توجد بيانات سحب متاحة"
              : "No draw data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", isRtl && "rtl")}>
      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts
            .filter((a) => a.priority !== "low")
            .slice(0, 3)
            .map((alert, index) => {
              const AlertIcon = alertIcons[alert.type];
              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border flex items-start gap-3",
                    alertColors[alert.type],
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <AlertIcon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className={isRtl ? "text-right" : ""}>
                    <p className="font-medium text-sm">
                      {language === "ar" ? alert.titleAr : alert.titleEn}
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                      {language === "ar" ? alert.messageAr : alert.messageEn}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* User CRS Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5" />
              {language === "ar" ? "مقارنة نقاطك" : "Your Score Comparison"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score vs Average */}
            <div className={cn(
              "flex items-center justify-between",
              isRtl && "flex-row-reverse"
            )}>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "نقاطك" : "Your Score"}
                </p>
                <p className="text-3xl font-bold">{comparison.userCrsScore}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <div className={isRtl ? "text-left" : "text-right"}>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "متوسط الحد الأدنى" : "Avg. Cutoff"}
                </p>
                <p className="text-3xl font-bold text-muted-foreground">
                  {analysis.averageCrs}
                </p>
              </div>
            </div>

            {/* Qualification Status */}
            <div className={cn(
              "p-4 rounded-lg",
              comparison.wouldBeInvited
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-2",
                isRtl && "flex-row-reverse"
              )}>
                {comparison.wouldBeInvited ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  {comparison.wouldBeInvited
                    ? language === "ar"
                      ? "مؤهل للسحوبات السابقة!"
                      : "Qualified for past draws!"
                    : language === "ar"
                    ? "أقل من الحد الأدنى"
                    : "Below recent cutoffs"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {comparison.wouldBeInvited
                  ? language === "ar"
                    ? `كنت ستتأهل لـ ${comparison.matchingDraws.length} من ${draws.length} سحب حديث`
                    : `You would have qualified for ${comparison.matchingDraws.length} of ${draws.length} recent draws`
                  : language === "ar"
                    ? `تحتاج إلى ~${comparison.averageGap} نقطة إضافية في المتوسط`
                    : `You need ~${comparison.averageGap} more points on average`}
              </p>
            </div>

            {/* Percentile Bar */}
            <div className="space-y-2">
              <div className={cn(
                "flex items-center justify-between text-sm",
                isRtl && "flex-row-reverse"
              )}>
                <span className="text-muted-foreground">
                  {language === "ar" ? "نسبة التأهل" : "Qualification Rate"}
                </span>
                <span className="font-medium">{comparison.percentile}%</span>
              </div>
              <Progress value={comparison.percentile} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? `تأهلت لـ ${comparison.percentile}% من السحوبات الأخيرة`
                  : `Qualified for ${comparison.percentile}% of recent draws`}
              </p>
            </div>

            {/* Category Recommendations */}
            {comparison.categoryRecommendations.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <p className={cn(
                  "text-sm font-medium",
                  isRtl && "text-right"
                )}>
                  {language === "ar"
                    ? "أفضل الفرص حسب الفئة"
                    : "Best Opportunities by Category"}
                </p>
                {comparison.categoryRecommendations.slice(0, 3).map((cat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between py-2",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <Badge
                        variant="outline"
                        className={
                          cat.yourChance === "high"
                            ? "bg-green-100 text-green-700"
                            : cat.yourChance === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {cat.yourChance === "high"
                          ? language === "ar" ? "عالية" : "High"
                          : cat.yourChance === "medium"
                          ? language === "ar" ? "متوسطة" : "Medium"
                          : language === "ar" ? "منخفضة" : "Low"}
                      </Badge>
                      <span className="text-sm">{cat.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {language === "ar" ? "متوسط" : "Avg."} {cat.averageCrs}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draw Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {language === "ar" ? "إحصائيات السحب" : "Draw Statistics"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? `بناءً على ${analysis.drawCount} سحب حديث`
              : `Based on ${analysis.drawCount} recent draws`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {analysis.lowestCrs}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "أدنى حد" : "Lowest"}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{analysis.averageCrs}</p>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "المتوسط" : "Average"}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {analysis.highestCrs}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "أعلى حد" : "Highest"}
              </p>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className={cn(
            "flex items-center justify-center gap-2 mt-4 p-3 bg-muted/30 rounded-lg",
            isRtl && "flex-row-reverse"
          )}>
            <TrendIcon className={cn("h-5 w-5", trendColor)} />
            <span className="text-sm">
              {analysis.trendDirection === "up"
                ? language === "ar"
                  ? "الحدود في ارتفاع"
                  : "Cutoffs trending up"
                : analysis.trendDirection === "down"
                ? language === "ar"
                  ? "الحدود في انخفاض"
                  : "Cutoffs trending down"
                : language === "ar"
                ? "الحدود مستقرة"
                : "Cutoffs stable"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Next Draw Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === "ar" ? "توقع السحب القادم" : "Next Draw Prediction"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            "flex items-center justify-between",
            isRtl && "flex-row-reverse"
          )}>
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "الحد المتوقع" : "Expected Cutoff"}
              </p>
              <p className="text-3xl font-bold text-primary">
                ~{prediction.predictedCrs}
              </p>
            </div>
            <div className={isRtl ? "text-left" : "text-right"}>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "المدى" : "Range"}
              </p>
              <p className="text-lg">
                {prediction.rangeMin} - {prediction.rangeMax}
              </p>
            </div>
          </div>

          <div className={cn(
            "flex items-center justify-between text-sm",
            isRtl && "flex-row-reverse"
          )}>
            <span className="text-muted-foreground">
              {language === "ar" ? "التاريخ المتوقع" : "Expected Date"}
            </span>
            <span>
              {prediction.predictedDate.toLocaleDateString(
                language === "ar" ? "ar-SA" : "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              )}
            </span>
          </div>

          <div className={cn(
            "flex items-center justify-between text-sm",
            isRtl && "flex-row-reverse"
          )}>
            <span className="text-muted-foreground">
              {language === "ar" ? "مستوى الثقة" : "Confidence"}
            </span>
            <Badge
              variant="outline"
              className={
                prediction.confidenceLevel === "high"
                  ? "bg-green-100 text-green-700"
                  : prediction.confidenceLevel === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {prediction.confidenceLevel === "high"
                ? language === "ar" ? "عالي" : "High"
                : prediction.confidenceLevel === "medium"
                ? language === "ar" ? "متوسط" : "Medium"
                : language === "ar" ? "منخفض" : "Low"}
            </Badge>
          </div>

          {prediction.factors.length > 0 && (
            <div className={cn(
              "pt-3 border-t space-y-1",
              isRtl && "text-right"
            )}>
              {prediction.factors.map((factor, index) => (
                <p key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {factor}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Draws Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {language === "ar" ? "السحوبات الأخيرة" : "Recent Draws"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {draws.slice(0, 10).map((draw) => {
              const isQualified = userCrsScore ? userCrsScore >= draw.crsMinimum : false;
              return (
                <div
                  key={draw.id}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg",
                    isQualified ? "bg-green-50" : "bg-muted/30",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <div className={isRtl ? "text-right" : ""}>
                    <p className="text-sm font-medium">{draw.drawType}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(draw.drawDate).toLocaleDateString(
                        language === "ar" ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                      {" • "}
                      {draw.invitationsIssued.toLocaleString()}{" "}
                      {language === "ar" ? "دعوة" : "ITAs"}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2",
                    isRtl && "flex-row-reverse"
                  )}>
                    <span className={cn(
                      "font-bold",
                      isQualified ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {draw.crsMinimum}
                    </span>
                    {isQualified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
