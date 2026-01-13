import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { 
  RECENT_DRAWS, 
  analyzeScoreAgainstDraws,
  ExpressEntryDraw,
} from "@shared/expressEntryDraws";

interface DrawComparisonProps {
  score: number;
}

export function DrawComparison({ score }: DrawComparisonProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  
  const analysis = analyzeScoreAgainstDraws(score);

  const statusConfig = {
    excellent: {
      icon: Sparkles,
      label: isRtl ? "ممتاز" : "Excellent",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description: isRtl 
        ? "نقاطك أعلى بكثير من متوسط القطع. فرصك ممتازة للحصول على دعوة!"
        : "Your score is well above the average cutoff. Excellent chances of receiving an ITA!",
    },
    good: {
      icon: CheckCircle2,
      label: isRtl ? "جيد" : "Good",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      description: isRtl
        ? "نقاطك أعلى من المتوسط. فرصك جيدة للحصول على دعوة في السحوبات القادمة."
        : "Your score is above average. Good chances of receiving an ITA in upcoming draws.",
    },
    competitive: {
      icon: AlertTriangle,
      label: isRtl ? "تنافسي" : "Competitive",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      description: isRtl
        ? "نقاطك قريبة من خط القطع. حاول تحسين نقاطك لزيادة فرصك."
        : "Your score is close to the cutoff. Try improving your score to increase your chances.",
    },
    needs_improvement: {
      icon: XCircle,
      label: isRtl ? "يحتاج تحسين" : "Needs Improvement",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      description: isRtl
        ? `تحتاج إلى ${analysis.pointsNeeded} نقطة إضافية للوصول إلى أدنى خط قطع حديث.`
        : `You need ${analysis.pointsNeeded} more points to reach the lowest recent cutoff.`,
    },
  };

  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;

  // Calculate progress percentage (capped at 100%)
  const progressPercent = Math.min(100, (score / analysis.avgCutoff) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {isRtl ? "مقارنة بالسحوبات الأخيرة" : "Recent Draw Comparison"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className={`p-4 rounded-lg ${config.bgColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
            <span className={`font-bold text-lg ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Score vs Average Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{isRtl ? "نقاطك" : "Your Score"}: <strong>{score}</strong></span>
            <span>{isRtl ? "المتوسط" : "Average"}: <strong>{analysis.avgCutoff}</strong></span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-center text-muted-foreground">
            {analysis.pointsAboveAvg >= 0 ? (
              <span className="text-green-600">
                {isRtl 
                  ? `+${analysis.pointsAboveAvg} نقطة فوق المتوسط`
                  : `+${analysis.pointsAboveAvg} points above average`}
              </span>
            ) : (
              <span className="text-red-600">
                {isRtl
                  ? `${Math.abs(analysis.pointsAboveAvg)} نقطة تحت المتوسط`
                  : `${Math.abs(analysis.pointsAboveAvg)} points below average`}
              </span>
            )}
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {analysis.mostRecentDraw?.cutoff || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRtl ? "آخر قطع" : "Latest Cutoff"}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analysis.lowestCutoff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRtl ? "أدنى قطع" : "Lowest Cutoff"}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analysis.qualifiedAllProgramsCount}/{analysis.totalAllProgramsDraws}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRtl ? "سحوبات مؤهلة" : "Draws Qualified"}
            </p>
          </div>
        </div>

        {/* Recent Draws Table */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRtl ? "السحوبات الأخيرة" : "Recent Draws"}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {RECENT_DRAWS.slice(0, 6).map((draw, index) => (
              <DrawRow 
                key={index} 
                draw={draw} 
                userScore={score} 
                isRtl={isRtl} 
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DrawRowProps {
  draw: ExpressEntryDraw;
  userScore: number;
  isRtl: boolean;
}

function DrawRow({ draw, userScore, isRtl }: DrawRowProps) {
  const qualified = userScore >= draw.cutoff;
  const date = new Date(draw.date).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${
      qualified ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800" : "border-muted"
    }`}>
      <div className="flex items-center gap-3">
        {qualified ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{date}</p>
          <p className="text-xs text-muted-foreground">
            {isRtl ? draw.programAr : draw.program}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={qualified ? "default" : "secondary"}>
          {draw.cutoff}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          <Users className="h-3 w-3 inline mr-1" />
          {draw.invitations.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default DrawComparison;
