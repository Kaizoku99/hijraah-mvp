"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Clock,
  BookOpen,
  Briefcase,
  Star,
  ChevronRight,
  Target,
  Calendar,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CrsInput } from "@/lib/crs-calculator";
import {
  calculateWhatIfScenarios,
  getWhatIfRecommendations,
  estimateTimeline,
  WhatIfScenario,
} from "@/lib/crs-what-if";

interface WhatIfAnalysisProps {
  crsInput: CrsInput;
  currentScore: number;
}

const categoryIcons = {
  language: BookOpen,
  education: BookOpen,
  experience: Briefcase,
  other: Star,
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const priorityColors = {
  high: "border-green-500 bg-green-50",
  medium: "border-yellow-500 bg-yellow-50",
  low: "border-gray-300 bg-gray-50",
};

export function WhatIfAnalysis({ crsInput, currentScore }: WhatIfAnalysisProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [targetScore, setTargetScore] = useState(480);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  // Calculate what-if scenarios
  const whatIfResult = useMemo(
    () => calculateWhatIfScenarios(crsInput),
    [crsInput]
  );

  // Get recommendations
  const recommendations = useMemo(
    () => getWhatIfRecommendations(whatIfResult, targetScore),
    [whatIfResult, targetScore]
  );

  // Calculate timeline estimate
  const timeline = useMemo(
    () => estimateTimeline(currentScore, "express_entry", crsInput.hasProvincialNomination),
    [currentScore, crsInput.hasProvincialNomination]
  );

  const pointsGap = targetScore - currentScore;
  const canReachTarget = whatIfResult.combinedMaxScore >= targetScore;

  return (
    <div className={cn("space-y-6", isRtl && "rtl")}>
      {/* Header with Target Score Slider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {language === "ar" ? "تحليل السيناريوهات" : "What-If Analysis"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "اكتشف كيف يمكنك تحسين نقاط CRS الخاصة بك"
              : "Discover how you can improve your CRS score"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current vs Target */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "النقاط الحالية" : "Current Score"}
              </p>
              <p className="text-3xl font-bold">{currentScore}</p>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
            <div className={isRtl ? "text-left" : "text-right"}>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "النقاط المستهدفة" : "Target Score"}
              </p>
              <p className="text-3xl font-bold text-primary">{targetScore}</p>
            </div>
          </div>

          {/* Target Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {language === "ar" ? "حدد هدفك" : "Set your target"}
              </span>
              <span className={pointsGap <= 0 ? "text-green-600" : "text-orange-600"}>
                {pointsGap <= 0
                  ? language === "ar"
                    ? "تجاوزت الهدف! 🎉"
                    : "Above target! 🎉"
                  : `${pointsGap} ${language === "ar" ? "نقطة للوصول" : "points to go"}`}
              </span>
            </div>
            <Slider
              value={[targetScore]}
              onValueChange={([value]) => setTargetScore(value)}
              min={400}
              max={600}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>400</span>
              <span>500</span>
              <span>600</span>
            </div>
          </div>

          {/* Maximum Achievable Score */}
          <div className={cn(
            "p-4 rounded-lg border",
            canReachTarget ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {language === "ar"
                    ? "أقصى نقاط يمكنك تحقيقها"
                    : "Maximum Achievable Score"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar"
                    ? "(بدون ترشيح المقاطعة)"
                    : "(without Provincial Nomination)"}
                </p>
              </div>
              <div className="text-2xl font-bold">
                {whatIfResult.combinedMaxScore}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {language === "ar" ? "الإجراءات الموصى بها" : "Recommended Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === "ar"
                ? "أنت بالفعل في وضع ممتاز! لا توجد تحسينات متاحة."
                : "You're already in great shape! No improvements available."}
            </p>
          ) : (
            recommendations.map((rec) => {
              const CategoryIcon = categoryIcons[rec.scenario.category];
              const isExpanded = expandedScenario === rec.scenario.id;

              return (
                <Collapsible
                  key={rec.scenario.id}
                  open={isExpanded}
                  onOpenChange={() =>
                    setExpandedScenario(isExpanded ? null : rec.scenario.id)
                  }
                >
                  <div
                    className={cn(
                      "rounded-lg border-2 transition-colors",
                      priorityColors[rec.priority]
                    )}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center gap-3 p-3",
                        isRtl && "flex-row-reverse"
                      )}>
                        <div className="shrink-0 p-2 rounded-full bg-white shadow-sm">
                          <CategoryIcon className="h-4 w-4 text-primary" />
                        </div>

                        <div className={cn("flex-1 text-left", isRtl && "text-right")}>
                          <p className="font-medium text-sm">
                            {language === "ar"
                              ? rec.scenario.titleAr
                              : rec.scenario.titleEn}
                          </p>
                          <div className={cn(
                            "flex items-center gap-2 mt-1",
                            isRtl && "flex-row-reverse justify-end"
                          )}>
                            <Badge
                              variant="outline"
                              className={difficultyColors[rec.scenario.difficulty]}
                            >
                              {rec.scenario.difficulty === "easy"
                                ? language === "ar" ? "سهل" : "Easy"
                                : rec.scenario.difficulty === "medium"
                                ? language === "ar" ? "متوسط" : "Medium"
                                : language === "ar" ? "صعب" : "Hard"}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {rec.scenario.timelineMonths}{" "}
                              {language === "ar" ? "شهر" : "months"}
                            </span>
                          </div>
                        </div>

                        <div className={cn(
                          "text-right shrink-0",
                          isRtl && "text-left"
                        )}>
                          <span className="text-lg font-bold text-green-600">
                            +{rec.scenario.pointsGain}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? "نقطة" : "points"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className={cn(
                        "px-3 pb-3 pt-0 border-t",
                        isRtl && "text-right"
                      )}>
                        <p className="text-sm text-muted-foreground mt-3">
                          {language === "ar"
                            ? rec.scenario.descriptionAr
                            : rec.scenario.descriptionEn}
                        </p>
                        <div className={cn(
                          "flex items-center gap-2 mt-3 text-xs",
                          isRtl && "flex-row-reverse justify-end"
                        )}>
                          <Info className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{rec.reason}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Timeline Estimate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === "ar" ? "الجدول الزمني المتوقع" : "Estimated Timeline"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? `بناءً على نقاط CRS الحالية (${currentScore})`
              : `Based on current CRS score (${currentScore})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Badge */}
          <div className={cn(
            "flex items-center justify-between",
            isRtl && "flex-row-reverse"
          )}>
            <span className="text-sm text-muted-foreground">
              {language === "ar" ? "مستوى الثقة" : "Confidence Level"}
            </span>
            <Badge
              variant="outline"
              className={
                timeline.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : timeline.confidence === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {timeline.confidence === "high"
                ? language === "ar" ? "عالي" : "High"
                : timeline.confidence === "medium"
                ? language === "ar" ? "متوسط" : "Medium"
                : language === "ar" ? "منخفض" : "Low"}
            </Badge>
          </div>

          {/* Total Timeline */}
          <div className={cn(
            "p-4 bg-primary/5 rounded-lg",
            isRtl && "text-right"
          )}>
            <p className="text-sm text-muted-foreground">
              {language === "ar"
                ? "الوقت المتوقع للإقامة الدائمة"
                : "Estimated time to PR"}
            </p>
            <p className="text-2xl font-bold text-primary mt-1">
              ~{timeline.estimatedMonths}{" "}
              {language === "ar" ? "شهر" : "months"}
            </p>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            {timeline.milestones.map((milestone, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3",
                  isRtl && "flex-row-reverse"
                )}
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <div className={cn("flex-1", isRtl && "text-right")}>
                  <p className="text-sm font-medium">
                    {language === "ar" ? milestone.titleAr : milestone.titleEn}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {milestone.monthsFromNow}{" "}
                  {language === "ar" ? "شهر" : "mo"}
                </span>
              </div>
            ))}
          </div>

          {/* Factors */}
          {timeline.factors.length > 0 && (
            <div className={cn(
              "pt-4 border-t space-y-2",
              isRtl && "text-right"
            )}>
              <p className="text-xs font-medium text-muted-foreground">
                {language === "ar" ? "ملاحظات" : "Notes"}
              </p>
              {timeline.factors.map((factor, index) => (
                <p key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {factor}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
