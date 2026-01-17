"use client";

import { memo } from "react";
import { CheckCircle2, Clock, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import type { JourneyStep } from "./types";

interface StepItemProps {
  step: JourneyStep;
  index: number;
  totalSteps: number;
  isRtl: boolean;
}

export const StepItem = memo(function StepItem({ 
  step, 
  index, 
  totalSteps, 
  isRtl 
}: StepItemProps) {
  const Icon = step.icon;

  return (
    <div
      className={cn(
        "relative flex gap-4 pb-6 last:pb-0",
        isRtl && "flex-row-reverse text-right"
      )}
    >
      {/* Connector Line */}
      {index < totalSteps - 1 && (
        <div
          className={cn(
            "absolute w-0.5 z-0",
            step.isCompleted ? "bg-green-500" : "bg-muted",
            isRtl ? "right-[15px]" : "left-[15px]",
            "top-8 bottom-0"
          )}
        />
      )}

      {/* Step Icon */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 transition-all",
          step.isCompleted && "ring-green-500 text-green-500",
          step.isActive &&
            "ring-primary text-primary ring-offset-2 ring-offset-background",
          !step.isCompleted &&
            !step.isActive &&
            "ring-muted text-muted-foreground"
        )}
      >
        {step.isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : step.isActive ? (
          <Clock className="h-5 w-5 animate-pulse" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h4
              className={cn(
                "text-sm font-semibold leading-tight",
                step.isCompleted && "text-green-600 dark:text-green-500",
                step.isActive && "text-primary"
              )}
            >
              {step.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
          {step.badge && (
            <Badge
              variant={step.badge.variant}
              className="text-[10px] h-5 shrink-0"
            >
              {step.badge.text}
            </Badge>
          )}
        </div>

        {/* Progress bar for active step */}
        {step.isActive && step.progress !== undefined && (
          <div className="mt-2">
            <Progress value={step.progress} className="h-1.5" />
          </div>
        )}

        {/* Tip tooltip */}
        {step.tip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                  <Lightbulb className="h-3 w-3" />
                  <span className="underline decoration-dashed">Tip</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[250px]">
                <p className="text-xs">{step.tip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Action button */}
        {step.isActive && step.link !== "#" && (
          <Link href={step.link} className="inline-block mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 group"
            >
              {step.linkText}
              <ChevronRight
                className={cn(
                  "h-3 w-3 group-hover:translate-x-0.5 transition-transform",
                  isRtl && "rotate-180 group-hover:-translate-x-0.5"
                )}
              />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
});
