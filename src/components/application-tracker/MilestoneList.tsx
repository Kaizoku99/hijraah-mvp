"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  SkipForward, 
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Milestone, MilestoneStatus } from "./types";
import { MILESTONE_STATUS_CONFIG } from "./types";

interface MilestoneListProps {
  milestones: Milestone[];
  onComplete?: (milestoneId: number) => void;
  onStatusChange?: (milestoneId: number, status: MilestoneStatus) => void;
  isLoading?: boolean;
}

const statusIcons: Record<MilestoneStatus, React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
  skipped: SkipForward,
  blocked: XCircle,
};

export function MilestoneList({ 
  milestones, 
  onComplete, 
  onStatusChange,
  isLoading = false,
}: MilestoneListProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [loadingMilestoneId, setLoadingMilestoneId] = useState<number | null>(null);

  const handleComplete = async (milestoneId: number) => {
    if (onComplete) {
      setLoadingMilestoneId(milestoneId);
      try {
        await onComplete(milestoneId);
      } finally {
        setLoadingMilestoneId(null);
      }
    }
  };

  if (milestones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {language === "ar" 
          ? "لا توجد مراحل متاحة" 
          : "No milestones available"}
      </div>
    );
  }

  // Find the first incomplete milestone
  const currentMilestoneIndex = milestones.findIndex(
    (m) => m.status !== "completed" && m.status !== "skipped"
  );

  return (
    <div className={cn("space-y-2", isRtl && "rtl")}>
      {milestones.map((milestone, index) => {
        const StatusIcon = statusIcons[milestone.status];
        const config = MILESTONE_STATUS_CONFIG[milestone.status];
        const isCurrent = index === currentMilestoneIndex;
        const isExpanded = expandedMilestone === milestone.id;
        const isCompleted = milestone.status === "completed";
        const canComplete = !isCompleted && milestone.status !== "skipped";

        return (
          <Collapsible
            key={milestone.id}
            open={isExpanded}
            onOpenChange={() => 
              setExpandedMilestone(isExpanded ? null : milestone.id)
            }
          >
            <div
              className={cn(
                "rounded-lg border transition-colors",
                isCurrent && "border-primary bg-primary/5",
                isCompleted && "bg-muted/50"
              )}
            >
              <CollapsibleTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 rounded-lg",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  {/* Status Icon */}
                  <div className={cn("shrink-0", config.color)}>
                    <StatusIcon 
                      className={cn(
                        "h-5 w-5",
                        milestone.status === "in_progress" && "animate-spin"
                      )} 
                    />
                  </div>

                  {/* Milestone Content */}
                  <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                    <p className={cn(
                      "font-medium text-sm",
                      isCompleted && "text-muted-foreground line-through"
                    )}>
                      {language === "ar" && milestone.titleAr 
                        ? milestone.titleAr 
                        : milestone.title}
                    </p>
                    {isCurrent && (
                      <span className="text-xs text-primary">
                        {language === "ar" ? "المرحلة الحالية" : "Current step"}
                      </span>
                    )}
                  </div>

                  {/* Step Number */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {index + 1}/{milestones.length}
                  </span>

                  {/* Expand Icon */}
                  {(milestone.description || milestone.descriptionAr) && (
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className={cn(
                  "px-3 pb-3 pt-0 space-y-3",
                  isRtl && "text-right"
                )}>
                  {/* Description */}
                  {(milestone.description || milestone.descriptionAr) && (
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" && milestone.descriptionAr 
                        ? milestone.descriptionAr 
                        : milestone.description}
                    </p>
                  )}

                  {/* Due Date */}
                  {milestone.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "تاريخ الاستحقاق: " : "Due: "}
                      {new Date(milestone.dueDate).toLocaleDateString(
                        language === "ar" ? "ar-SA" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                  )}

                  {/* Completed Date */}
                  {milestone.completedAt && (
                    <p className="text-xs text-green-600">
                      {language === "ar" ? "تم الإكمال في: " : "Completed: "}
                      {new Date(milestone.completedAt).toLocaleDateString(
                        language === "ar" ? "ar-SA" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                  )}

                  {/* Complete Button */}
                  {canComplete && onComplete && (
                    <Button
                      size="sm"
                      variant={isCurrent ? "default" : "outline"}
                      onClick={() => handleComplete(milestone.id)}
                      disabled={loadingMilestoneId === milestone.id || isLoading}
                      className="w-full"
                    >
                      {loadingMilestoneId === milestone.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {language === "ar" ? "تم الإكمال" : "Mark as Complete"}
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
