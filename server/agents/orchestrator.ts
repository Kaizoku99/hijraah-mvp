/**
 * Agent Orchestrator for Hijraah Immigration Platform
 *
 * Routes user messages to appropriate specialist agents based on:
 * 1. Keyword matching (fast path)
 * 2. LLM-based intent classification (fallback)
 *
 * Follows existing Hijraah patterns - context-injection, not multi-turn agent loops.
 */

import { generateText } from "ai";
import { google } from "@/server/_core/gemini";
import {
  type CaseContext,
  type AgentRole,
  type IntentCategory,
  type RoutingDecision,
  INTENT_KEYWORDS,
} from "./types";

// ============================================
// INTENT DETECTION (KEYWORD-BASED)
// ============================================

/**
 * Fast keyword-based intent detection.
 * Returns intent if confidence is high, otherwise null for LLM fallback.
 */
export function detectIntentFromKeywords(
  message: string,
  language: "ar" | "en"
): IntentCategory | null {
  const lowerMessage = message.toLowerCase();

  // Score each intent category
  const scores: Record<IntentCategory, number> = {
    eligibility: 0,
    pathway: 0,
    documents: 0,
    mena_workflow: 0,
    application: 0,
    timeline: 0,
    general: 0,
    unknown: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const langKeywords = keywords[language] || keywords.en;
    for (const keyword of langKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[intent as IntentCategory] += 1;
      }
    }
  }

  // Find highest scoring intent
  let maxScore = 0;
  let topIntent: IntentCategory = "unknown";

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topIntent = intent as IntentCategory;
    }
  }

  // Only return if confidence is high enough (at least 2 keyword matches)
  if (maxScore >= 2) {
    return topIntent;
  }

  return null;
}

// ============================================
// INTENT TO AGENT MAPPING
// ============================================

const INTENT_TO_AGENT: Record<IntentCategory, AgentRole> = {
  eligibility: "assessment",
  pathway: "assessment",
  documents: "preparation",
  mena_workflow: "preparation",
  application: "submission",
  timeline: "submission",
  general: "orchestrator",
  unknown: "orchestrator",
};

// ============================================
// LLM-BASED INTENT CLASSIFICATION
// ============================================

/**
 * Use LLM to classify intent when keyword matching fails.
 * This is the fallback path - more accurate but slower/costlier.
 */
export async function classifyIntentWithLLM(
  message: string,
  context: CaseContext
): Promise<IntentCategory> {
  const model = google("gemini-2.5-flash");

  const systemPrompt = `You are an intent classifier for an immigration assistant.
Classify the user's message into ONE of these categories:

- eligibility: Questions about CRS score, points calculation, whether they qualify, Express Entry eligibility
- pathway: Questions about which visa/program to choose, comparing options, D7 vs D8, PNP options
- documents: Questions about required documents, checklists, passport, certificates, transcripts
- mena_workflow: Questions about attestation, MOFA, embassy, police clearance, apostille, VFS
- application: Questions about how to apply, forms, fees, costs, SOP (statement of purpose)
- timeline: Questions about processing time, how long, deadlines, when to expect results
- general: Greetings, thanks, off-topic, or unclear messages

User's profile:
- Target destination: ${context.profile?.targetDestination || "Unknown"}
- Source country: ${context.profile?.sourceCountry || "Unknown"}

Respond with ONLY the category name, nothing else.`;

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      temperature: 0.1,
      maxOutputTokens: 20,
    });

    const intent = text.trim().toLowerCase() as IntentCategory;

    // Validate the intent is one of our categories
    if (Object.keys(INTENT_TO_AGENT).includes(intent)) {
      return intent;
    }

    return "unknown";
  } catch (error) {
    console.error("Intent classification failed:", error);
    return "unknown";
  }
}

// ============================================
// MAIN ROUTING FUNCTION
// ============================================

/**
 * Route user message to appropriate specialist agent.
 *
 * Strategy:
 * 1. Try keyword matching first (fast, free)
 * 2. Fall back to LLM classification if keywords don't match
 * 3. Default to orchestrator for general/unknown intents
 */
export async function routeToSpecialist(
  message: string,
  context: CaseContext
): Promise<RoutingDecision> {
  // Step 1: Try keyword matching
  const keywordIntent = detectIntentFromKeywords(message, context.language);

  if (
    keywordIntent &&
    keywordIntent !== "unknown" &&
    keywordIntent !== "general"
  ) {
    return {
      intent: keywordIntent,
      targetAgent: INTENT_TO_AGENT[keywordIntent],
      confidence: "high",
      reasoning: `Keyword match for "${keywordIntent}"`,
    };
  }

  // Step 2: Fall back to LLM classification
  const llmIntent = await classifyIntentWithLLM(message, context);

  return {
    intent: llmIntent,
    targetAgent: INTENT_TO_AGENT[llmIntent],
    confidence: llmIntent === "unknown" ? "low" : "medium",
    reasoning: `LLM classified as "${llmIntent}"`,
  };
}

// ============================================
// ORCHESTRATOR RESPONSE GENERATOR
// ============================================

/**
 * Generate a response when the orchestrator handles the message directly.
 * Used for greetings, general questions, and unknown intents.
 */
export async function generateOrchestratorResponse(
  message: string,
  context: CaseContext
): Promise<string> {
  const model = google("gemini-2.5-flash");

  const isArabic = context.language === "ar";

  const systemPrompt = isArabic
    ? `أنت "هجرة" - مساعد هجرة ذكي متخصص في مساعدة المتقدمين من منطقة الشرق الأوسط وشمال أفريقيا.

سياق المستخدم:
- الوجهة المستهدفة: ${context.profile?.targetDestination || "غير محدد"}
- بلد المصدر: ${context.profile?.sourceCountry || "غير محدد"}
- مستوى التعليم: ${context.profile?.educationLevel || "غير محدد"}

أجب بشكل ودود ومختصر. إذا كان السؤال غير واضح، اطلب توضيحاً.
اقترح 3 أسئلة متابعة في نهاية إجابتك داخل وسوم <suggestions>["سؤال1", "سؤال2", "سؤال3"]</suggestions>`
    : `You are "Hijraah" - an AI immigration assistant specialized in helping MENA region applicants.

User context:
- Target destination: ${context.profile?.targetDestination || "Not specified"}
- Source country: ${context.profile?.sourceCountry || "Not specified"}
- Education level: ${context.profile?.educationLevel || "Not specified"}

Respond in a friendly, concise manner. If the question is unclear, ask for clarification.
Suggest 3 follow-up questions at the end inside <suggestions>["q1", "q2", "q3"]</suggestions>`;

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error("Orchestrator response failed:", error);
    return isArabic
      ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
      : "Sorry, an error occurred. Please try again.";
  }
}

// ============================================
// EXPORTS
// ============================================

export { INTENT_TO_AGENT };
