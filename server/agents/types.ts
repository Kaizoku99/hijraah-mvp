/**
 * Agent System Types for Hijraah Immigration Platform
 *
 * This module defines the core types used across the multi-agent system.
 * Follows existing Hijraah patterns (context-injection, bilingual support).
 */

import type { CrsInput, CrsResult } from "@/lib/crs-calculator";
import type {
  VisaMatcherInput,
  VisaRecommendation,
  D2EligibilityInput,
  D7EligibilityInput,
  D8EligibilityInput,
  EligibilityResult,
} from "@/lib/portugal-visa-matcher";
import type { EmbassyInfo, AttestationStep } from "@/lib/mena-workflows";

// ============================================
// CASE CONTEXT (Injected to all agents)
// ============================================

export interface CaseContext {
  // User identification
  userId: number;
  conversationId: number;

  // Language preference
  language: "ar" | "en";

  // User profile (from DB)
  profile: {
    name?: string;
    nationality?: string;
    currentCountry?: string;
    sourceCountry?: string;
    educationLevel?: string;
    fieldOfStudy?: string;
    yearsOfExperience?: number;
    currentOccupation?: string;
    targetDestination?: "canada" | "australia" | "portugal";
    immigrationPathway?: string;
  } | null;

  // Document status summary
  documents: {
    totalRequired: number;
    uploaded: number;
    pending: number;
    checklists: Array<{
      pathway: string;
      completionRate: number;
    }>;
  };

  // Working memory (persistent AI scratchpad)
  workingMemory?: string;

  // RAG context (retrieved knowledge)
  ragContext?: string;
}

// ============================================
// AGENT TYPES
// ============================================

export type AgentRole =
  | "orchestrator"
  | "assessment" // Eligibility, CRS, pathway matching
  | "preparation" // Documents, MENA workflows, checklists
  | "submission"; // Applications, SOP, fees, VFS

export interface AgentResponse {
  role: AgentRole;
  content: string;
  toolsUsed: string[];
  suggestions?: string[]; // Follow-up questions
  metadata?: Record<string, unknown>;
}

// ============================================
// TOOL RESULT TYPES
// ============================================

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  language: "ar" | "en";
}

// CRS Calculator Tool
export interface CrsToolInput {
  age: number;
  educationLevel: CrsInput["educationLevel"];
  firstLanguageTest: CrsInput["firstLanguageTest"];
  secondLanguageTest?: CrsInput["secondLanguageTest"];
  canadianWorkExperience: number;
  hasSpouse: boolean;
  spouseEducation?: CrsInput["spouseEducation"];
  spouseLanguageTest?: CrsInput["spouseLanguageTest"];
  spouseCanadianWorkExperience?: number;
  foreignWorkExperience: number;
  hasCertificateOfQualification: boolean;
  hasCanadianSiblings: boolean;
  hasFrenchLanguageSkills: boolean;
  hasProvincialNomination: boolean;
  hasValidJobOffer: boolean;
  jobOfferNOC: CrsInput["jobOfferNOC"];
  hasCanadianEducation: boolean;
  canadianEducationLevel?: CrsInput["canadianEducationLevel"];
}

export type CrsToolResult = ToolResult<CrsResult>;

// Portugal Visa Matcher Tool
export interface PortugalVisaToolInput {
  hasPortugueseJobOffer: boolean;
  isRemoteWorker: boolean;
  hasPassiveIncome: boolean;
  planningBusiness: boolean;
  monthlyIncome: number;
  employerCountry?: string;
}

export type PortugalVisaToolResult = ToolResult<VisaRecommendation[]>;

// Portugal Eligibility Check Tools
export type D2EligibilityToolInput = D2EligibilityInput;
export type D7EligibilityToolInput = D7EligibilityInput;
export type D8EligibilityToolInput = D8EligibilityInput;
export type EligibilityToolResult = ToolResult<EligibilityResult>;

// MENA Workflow Tools
export interface EmbassyInfoToolInput {
  sourceCountry: string;
  destinationCountry?: string;
}

export type EmbassyInfoToolResult = ToolResult<EmbassyInfo[]>;

export interface AttestationWorkflowToolInput {
  sourceCountry: string;
}

export type AttestationWorkflowToolResult = ToolResult<{
  steps: AttestationStep[];
  totalDays: number;
  estimatedCost: string;
}>;

export interface PoliceClearanceToolInput {
  sourceCountry: string;
}

export type PoliceClearanceToolResult = ToolResult<{
  steps: AttestationStep[];
  totalDays: number;
}>;

// ============================================
// ROUTING TYPES
// ============================================

export type IntentCategory =
  | "eligibility" // CRS, points, qualification questions
  | "pathway" // Which visa/program to choose
  | "documents" // Document requirements, checklists
  | "mena_workflow" // Attestation, police clearance, embassy
  | "application" // How to apply, forms, fees
  | "timeline" // Processing times, deadlines
  | "general" // Greetings, off-topic, unclear
  | "unknown";

export interface RoutingDecision {
  intent: IntentCategory;
  targetAgent: AgentRole;
  confidence: "high" | "medium" | "low";
  reasoning?: string;
}

// ============================================
// SPECIALIST CONFIGS
// ============================================

export interface SpecialistConfig {
  role: AgentRole;
  nameEn: string;
  nameAr: string;
  systemPromptEn: string;
  systemPromptAr: string;
  capabilities: string[];
  tools: string[];
}

// ============================================
// MESSAGE TYPES (Compatible with existing chat)
// ============================================

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  agentRole?: AgentRole;
  toolCalls?: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
}

// ============================================
// CONSTANTS
// ============================================

export const SUPPORTED_DESTINATIONS = [
  "canada",
  "australia",
  "portugal",
] as const;
export type SupportedDestination = (typeof SUPPORTED_DESTINATIONS)[number];

export const AGENT_ROLES: AgentRole[] = [
  "orchestrator",
  "assessment",
  "preparation",
  "submission",
];

// Intent keywords for fast routing (before LLM fallback)
export const INTENT_KEYWORDS: Record<
  IntentCategory,
  { en: string[]; ar: string[] }
> = {
  eligibility: {
    en: [
      "crs",
      "score",
      "points",
      "eligible",
      "qualify",
      "calculate",
      "express entry",
      "skilled worker",
    ],
    ar: ["نقاط", "درجة", "مؤهل", "احسب", "تأهل", "اكسبرس انتري"],
  },
  pathway: {
    en: [
      "which visa",
      "what program",
      "best option",
      "recommend",
      "d7",
      "d8",
      "d2",
      "pnp",
      "provincial",
    ],
    ar: ["أي تأشيرة", "أي برنامج", "أفضل خيار", "توصية", "إقليمي"],
  },
  documents: {
    en: [
      "document",
      "checklist",
      "requirement",
      "passport",
      "certificate",
      "transcript",
      "ielts",
      "tef",
    ],
    ar: ["مستند", "وثيقة", "متطلبات", "جواز", "شهادة", "كشف درجات"],
  },
  mena_workflow: {
    en: [
      "attestation",
      "mofa",
      "embassy",
      "consulate",
      "police clearance",
      "apostille",
      "vfs",
    ],
    ar: [
      "تصديق",
      "وزارة الخارجية",
      "سفارة",
      "قنصلية",
      "شهادة حسن السيرة",
      "أبوستيل",
    ],
  },
  application: {
    en: [
      "apply",
      "submit",
      "form",
      "fee",
      "cost",
      "payment",
      "application",
      "sop",
      "statement of purpose",
    ],
    ar: ["تقديم", "طلب", "نموذج", "رسوم", "تكلفة", "دفع", "خطاب نوايا"],
  },
  timeline: {
    en: ["how long", "processing time", "deadline", "when", "duration", "wait"],
    ar: ["كم يستغرق", "مدة المعالجة", "موعد نهائي", "متى", "انتظار"],
  },
  general: {
    en: ["hello", "hi", "thanks", "thank you", "help", "start"],
    ar: ["مرحبا", "أهلا", "شكرا", "مساعدة", "ابدأ"],
  },
  unknown: {
    en: [],
    ar: [],
  },
};
