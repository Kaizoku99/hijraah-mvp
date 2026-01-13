import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Target,
  Lightbulb,
  TrendingUp,
  FileCheck,
  Pencil,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface SopQualityScoreProps {
  sopId: number;
}

export function SopQualityScore({ sopId }: SopQualityScoreProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.sop.analyzeQuality.useMutation({
    onSuccess: () => {
      toast.success(isRtl ? "تم تحليل خطاب النوايا بنجاح" : "SOP analyzed successfully");
    },
    onError: (error) => {
      toast.error(isRtl ? "فشل في التحليل" : "Analysis failed");
      console.error(error);
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeMutation.mutate({ sopId });
  };

  const data = analyzeMutation.data;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return isRtl ? "ممتاز" : "Excellent";
    if (score >= 80) return isRtl ? "جيد جداً" : "Very Good";
    if (score >= 70) return isRtl ? "جيد" : "Good";
    if (score >= 60) return isRtl ? "مقبول" : "Fair";
    return isRtl ? "يحتاج تحسين" : "Needs Work";
  };

  const categoryIcons = {
    clarity: BookOpen,
    structure: FileCheck,
    persuasiveness: MessageSquare,
    relevance: Target,
    grammar: Pencil,
  };

  const categoryLabels = {
    clarity: { en: "Clarity", ar: "الوضوح" },
    structure: { en: "Structure", ar: "الهيكل" },
    persuasiveness: { en: "Persuasiveness", ar: "الإقناع" },
    relevance: { en: "Relevance", ar: "الملاءمة" },
    grammar: { en: "Grammar", ar: "القواعد" },
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRtl ? "تحليل جودة خطاب النوايا" : "SOP Quality Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {isRtl
              ? "احصل على تقييم شامل لخطاب النوايا مع اقتراحات للتحسين باستخدام الذكاء الاصطناعي."
              : "Get a comprehensive AI-powered evaluation of your SOP with improvement suggestions."}
          </p>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isRtl ? "جاري التحليل..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {isRtl ? "تحليل الجودة" : "Analyze Quality"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRtl ? "نتيجة تحليل الجودة" : "Quality Analysis Results"}
          </div>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              isRtl ? "إعادة التحليل" : "Re-analyze"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className={`p-6 rounded-lg text-center ${getScoreBgColor(data.overallScore)}`}>
          <div className={`text-5xl font-bold ${getScoreColor(data.overallScore)}`}>
            {data.overallScore}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRtl ? "الدرجة الإجمالية" : "Overall Score"}
          </p>
          <Badge variant="secondary" className="mt-2">
            {getScoreLabel(data.overallScore)}
          </Badge>
        </div>

        {/* Category Scores */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            {isRtl ? "التفاصيل حسب الفئة" : "Category Breakdown"}
          </h4>
          {Object.entries(data.categories).map(([key, value]) => {
            const Icon = categoryIcons[key as keyof typeof categoryIcons];
            const label = categoryLabels[key as keyof typeof categoryLabels];
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {isRtl ? label.ar : label.en}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(value.score)}`}>
                    {value.score}/100
                  </span>
                </div>
                <Progress value={value.score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {isRtl ? value.feedbackAr : value.feedback}
                </p>
              </div>
            );
          })}
        </div>

        {/* Strengths */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {isRtl ? "نقاط القوة" : "Strengths"}
          </h4>
          <ul className="space-y-2">
            {(isRtl ? data.strengthsAr : data.strengths).map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-amber-600">
            <Lightbulb className="h-4 w-4" />
            {isRtl ? "اقتراحات للتحسين" : "Improvement Suggestions"}
          </h4>
          <ul className="space-y-2">
            {(isRtl ? data.improvementsAr : data.improvements).map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-amber-600 mt-0.5">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default SopQualityScore;
