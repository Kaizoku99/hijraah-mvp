"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  FileSearch,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

/**
 * Agent type identifiers matching the agent-chat.ts routing output
 */
export type AgentType =
  | "assessment"
  | "preparation"
  | "submission"
  | "orchestrator";

/**
 * Agent metadata for display
 */
interface AgentInfo {
  id: AgentType;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: LucideIcon;
  color: string;
}

const AGENT_INFO: Record<AgentType, AgentInfo> = {
  assessment: {
    id: "assessment",
    name: { en: "Assessment", ar: "التقييم" },
    description: {
      en: "CRS calculation, eligibility checks, pathway recommendations",
      ar: "حساب CRS، فحص الأهلية، توصيات المسار",
    },
    icon: FileSearch,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  preparation: {
    id: "preparation",
    name: { en: "Preparation", ar: "التحضير" },
    description: {
      en: "Documents, attestation workflows, embassy information",
      ar: "المستندات، عمليات التصديق، معلومات السفارات",
    },
    icon: ClipboardCheck,
    color:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  submission: {
    id: "submission",
    name: { en: "Submission", ar: "التقديم" },
    description: {
      en: "Applications, forms, fees, SOP assistance",
      ar: "التطبيقات، النماذج، الرسوم، مساعدة خطاب النوايا",
    },
    icon: Send,
    color:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  orchestrator: {
    id: "orchestrator",
    name: { en: "General", ar: "عام" },
    description: {
      en: "General immigration guidance and routing",
      ar: "إرشادات الهجرة العامة والتوجيه",
    },
    icon: Sparkles,
    color:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
};

export type AgentBadgeProps = ComponentProps<typeof Badge> & {
  agent: AgentType;
  language?: "ar" | "en";
  showTooltip?: boolean;
  size?: "sm" | "default";
};

/**
 * AgentBadge - Shows which specialist agent handled a message
 *
 * Used in the chat UI to display agent attribution for each response.
 * Supports bilingual display and optional tooltip with agent description.
 */
export function AgentBadge({
  agent,
  language = "en",
  showTooltip = true,
  size = "default",
  className,
  ...props
}: AgentBadgeProps) {
  const info = AGENT_INFO[agent];
  if (!info) return null;

  const Icon = info.icon;
  const name = info.name[language];
  const description = info.description[language];

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        info.color,
        size === "sm" && "text-xs py-0 px-1.5",
        className
      )}
      {...props}
    >
      <Icon
        className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
      />
      <span>{name}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * AgentIndicator - Compact inline indicator for agent type
 *
 * A smaller, icon-only version for tight spaces.
 */
export function AgentIndicator({
  agent,
  language = "en",
  className,
}: {
  agent: AgentType;
  language?: "ar" | "en";
  className?: string;
}) {
  const info = AGENT_INFO[agent];
  if (!info) return null;

  const Icon = info.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center h-5 w-5 rounded-full",
              info.color,
              className
            )}
          >
            <Icon className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{info.name[language]}</p>
          <p className="text-xs text-muted-foreground">
            {info.description[language]}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper to get agent info for custom rendering
 */
export function getAgentInfo(agent: AgentType): AgentInfo | undefined {
  return AGENT_INFO[agent];
}
