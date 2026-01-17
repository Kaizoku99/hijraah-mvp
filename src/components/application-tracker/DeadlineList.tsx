"use client";

import { useState } from "react";
import { 
  Calendar,
  FileX,
  ClipboardCheck,
  HeartPulse,
  Fingerprint,
  Video,
  Send,
  Flag,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Deadline, DeadlineType } from "./types";
import { DEADLINE_TYPE_CONFIG } from "./types";

interface DeadlineListProps {
  deadlines: Deadline[];
  showOverdue?: boolean;
  onComplete?: (deadlineId: number) => void;
  onDelete?: (deadlineId: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const typeIcons: Record<DeadlineType, React.ComponentType<{ className?: string }>> = {
  document_expiry: FileX,
  application_window: Calendar,
  test_validity: ClipboardCheck,
  medical_exam: HeartPulse,
  biometrics: Fingerprint,
  interview: Video,
  submission: Send,
  custom: Flag,
};

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(daysUntil: number): string {
  if (daysUntil < 0) return "text-red-600 bg-red-50 border-red-200";
  if (daysUntil <= 7) return "text-orange-600 bg-orange-50 border-orange-200";
  if (daysUntil <= 14) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export function DeadlineList({ 
  deadlines, 
  showOverdue = false,
  onComplete, 
  onDelete,
  isLoading = false,
  emptyMessage,
}: DeadlineListProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [loadingDeadlineId, setLoadingDeadlineId] = useState<number | null>(null);
  const [deletingDeadlineId, setDeletingDeadlineId] = useState<number | null>(null);

  const handleComplete = async (deadlineId: number) => {
    if (onComplete) {
      setLoadingDeadlineId(deadlineId);
      try {
        await onComplete(deadlineId);
      } finally {
        setLoadingDeadlineId(null);
      }
    }
  };

  const handleDelete = async (deadlineId: number) => {
    if (onDelete) {
      setDeletingDeadlineId(deadlineId);
      try {
        await onDelete(deadlineId);
      } finally {
        setDeletingDeadlineId(null);
      }
    }
  };

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage || (language === "ar" 
          ? "لا توجد مواعيد نهائية قادمة" 
          : "No upcoming deadlines")}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", isRtl && "rtl")}>
      {deadlines.map((deadline) => {
        const TypeIcon = typeIcons[deadline.type];
        const config = DEADLINE_TYPE_CONFIG[deadline.type];
        const daysUntil = getDaysUntil(new Date(deadline.dueDate));
        const isOverdue = daysUntil < 0;
        const urgencyClass = getUrgencyColor(daysUntil);

        return (
          <div
            key={deadline.id}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              urgencyClass,
              deadline.isCompleted && "opacity-60"
            )}
          >
            <div className={cn(
              "flex items-start gap-3",
              isRtl && "flex-row-reverse"
            )}>
              {/* Type Icon */}
              <div className={cn("shrink-0 mt-0.5", config.color)}>
                <TypeIcon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                <div className={cn(
                  "flex items-center gap-2 mb-1",
                  isRtl && "flex-row-reverse justify-end"
                )}>
                  <h4 className={cn(
                    "font-medium text-sm",
                    deadline.isCompleted && "line-through"
                  )}>
                    {language === "ar" && deadline.titleAr 
                      ? deadline.titleAr 
                      : deadline.title}
                  </h4>
                  {isOverdue && !deadline.isCompleted && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {language === "ar" ? "متأخر" : "Overdue"}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {(deadline.description || deadline.descriptionAr) && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === "ar" && deadline.descriptionAr 
                      ? deadline.descriptionAr 
                      : deadline.description}
                  </p>
                )}

                {/* Due Date Info */}
                <div className={cn(
                  "flex items-center gap-4 text-xs",
                  isRtl && "flex-row-reverse justify-end"
                )}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(deadline.dueDate).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isOverdue ? (
                      <span className="text-red-600 font-medium">
                        {Math.abs(daysUntil)} {language === "ar" ? "يوم متأخر" : "days overdue"}
                      </span>
                    ) : daysUntil === 0 ? (
                      <span className="text-orange-600 font-medium">
                        {language === "ar" ? "اليوم" : "Today"}
                      </span>
                    ) : daysUntil === 1 ? (
                      <span className="text-orange-600 font-medium">
                        {language === "ar" ? "غداً" : "Tomorrow"}
                      </span>
                    ) : (
                      <span>
                        {daysUntil} {language === "ar" ? "يوم متبقي" : "days left"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={cn(
                "shrink-0 flex items-center gap-1",
                isRtl && "flex-row-reverse"
              )}>
                {!deadline.isCompleted && onComplete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleComplete(deadline.id)}
                    disabled={loadingDeadlineId === deadline.id || isLoading}
                    title={language === "ar" ? "تم الإكمال" : "Mark complete"}
                  >
                    {loadingDeadlineId === deadline.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingDeadlineId === deadline.id || isLoading}
                        title={language === "ar" ? "حذف" : "Delete"}
                      >
                        {deletingDeadlineId === deadline.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {language === "ar" 
                            ? "هل أنت متأكد؟" 
                            : "Are you sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === "ar"
                            ? "سيتم حذف هذا الموعد النهائي بشكل دائم."
                            : "This deadline will be permanently deleted."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(deadline.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {language === "ar" ? "حذف" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
