"use server";

/**
 * Agent-Powered Chat Action for Hijraah Immigration Platform
 *
 * This is an alternative to the existing chat.ts that uses the multi-agent system.
 * It can be enabled via feature flag for gradual rollout.
 *
 * Architecture:
 * 1. Build CaseContext from user profile, documents, and memory
 * 2. Route message to appropriate specialist using orchestrator
 * 3. Run specialist with context-injected prompts and tools
 * 4. Save response and update memory
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "./auth";
import { ActionError } from "@/lib/action-client";
import { invalidateUserChat } from "@/lib/cache";
import {
  getConversation,
  createMessage,
  getConversationMessages,
} from "@/server/db";
import { getUserDocumentChecklists } from "@/../server/documents";
import { getSubscriptionStatus } from "@/server/stripe";
import { checkUsageLimit, incrementUsage } from "@/server/usage";
import { ragQuery, buildRagContext } from "@/server/rag";
import { getWorkingMemory, addMemoryToChat } from "@/lib/memory";
import { getUserProfile } from "@/server/db";

// Agent imports
import {
  type CaseContext,
  routeToSpecialist,
  generateOrchestratorResponse,
  runAssessmentSpecialist,
  runPreparationSpecialist,
  runSubmissionSpecialist,
} from "@/../server/agents";

// ============================================
// SCHEMAS
// ============================================

const SendAgentMessageSchema = z.object({
  conversationId: z.number(),
  content: z.string(),
});

export type SendAgentMessageInput = z.infer<typeof SendAgentMessageSchema>;

// ============================================
// CONTEXT BUILDER
// ============================================

async function buildCaseContext(
  userId: number,
  conversationId: number,
  language: "ar" | "en",
  userMessage: string
): Promise<CaseContext> {
  // Fetch all context in parallel
  const [userProfile, userChecklists, workingMemory, ragResults] =
    await Promise.all([
      getUserProfile(userId).catch(() => null),
      getUserDocumentChecklists(userId).catch(() => []),
      getWorkingMemory(userId.toString()).catch(() => null),
      ragQuery(userMessage, {
        chunkLimit: 3,
        entityLimit: 3,
        language,
        includeRelatedEntities: false,
      }).catch(() => ({ chunks: [], entities: [] })),
    ]);

  // Build document status
  let totalRequired = 0;
  let uploaded = 0;
  let pending = 0;
  const checklists: { pathway: string; completionRate: number }[] = [];

  for (const checklist of userChecklists) {
    const items = checklist.items as { status: string }[] | null;
    if (!items || !Array.isArray(items)) continue;

    const pathwayLabel = checklist.immigrationPathway || "Unknown";
    const uploadedItems = items.filter(
      item =>
        item.status === "uploaded" ||
        item.status === "completed" ||
        item.status === "verified"
    ).length;
    const pendingItems = items.filter(item => item.status === "pending").length;

    totalRequired += items.length;
    uploaded += uploadedItems;
    pending += pendingItems;

    checklists.push({
      pathway: pathwayLabel,
      completionRate:
        items.length > 0 ? Math.round((uploadedItems / items.length) * 100) : 0,
    });
  }

  // Build RAG context string
  const ragContext = buildRagContext(
    { chunks: ragResults.chunks, entities: ragResults.entities },
    language
  );

  return {
    userId,
    conversationId,
    language,
    profile: userProfile
      ? {
          name: undefined, // Name comes from user table, not profile
          nationality: userProfile.nationality || undefined,
          currentCountry: userProfile.currentCountry || undefined,
          sourceCountry: userProfile.sourceCountry || undefined,
          educationLevel: userProfile.educationLevel || undefined,
          fieldOfStudy: userProfile.fieldOfStudy || undefined,
          yearsOfExperience: userProfile.yearsOfExperience || undefined,
          currentOccupation: userProfile.currentOccupation || undefined,
          targetDestination:
            (userProfile.targetDestination as
              | "canada"
              | "australia"
              | "portugal") || undefined,
          immigrationPathway: userProfile.immigrationPathway || undefined,
        }
      : null,
    documents: {
      totalRequired,
      uploaded,
      pending,
      checklists,
    },
    workingMemory: workingMemory || undefined,
    ragContext: ragContext || undefined,
  };
}

// ============================================
// MAIN AGENT CHAT ACTION
// ============================================

/**
 * Send a message using the agent-powered chat system.
 * Routes to appropriate specialist based on intent.
 */
export async function sendAgentMessage(input: SendAgentMessageInput) {
  const user = await getAuthenticatedUser();
  const validated = SendAgentMessageSchema.parse(input);

  // Check usage limits
  const subscriptionStatus = await getSubscriptionStatus(user.id);
  const usageCheck = await checkUsageLimit(
    user.id,
    subscriptionStatus?.tier || "free",
    "chat"
  );

  if (!usageCheck.allowed) {
    throw new ActionError(
      "You've reached your monthly chat limit. Upgrade to Essential ($29/month) for unlimited messages.",
      "USAGE_LIMIT"
    );
  }

  // Verify conversation belongs to user
  const conversation = await getConversation(validated.conversationId);
  if (!conversation) {
    throw new ActionError("Conversation not found", "NOT_FOUND");
  }
  if (conversation.userId !== user.id) {
    throw new ActionError("Access denied", "FORBIDDEN");
  }

  // Save user message
  await createMessage({
    conversationId: validated.conversationId,
    role: "user",
    content: validated.content,
  });

  // Build case context
  const language = (conversation.language as "ar" | "en") || "en";
  const context = await buildCaseContext(
    user.id,
    validated.conversationId,
    language,
    validated.content
  );

  // Route to specialist
  const routing = await routeToSpecialist(validated.content, context);

  // Run appropriate specialist
  let response: {
    content: string;
    suggestions?: string[];
    toolsUsed: string[];
  };

  switch (routing.targetAgent) {
    case "assessment":
      response = await runAssessmentSpecialist(validated.content, context);
      break;
    case "preparation":
      response = await runPreparationSpecialist(validated.content, context);
      break;
    case "submission":
      response = await runSubmissionSpecialist(validated.content, context);
      break;
    case "orchestrator":
    default:
      const orchestratorContent = await generateOrchestratorResponse(
        validated.content,
        context
      );
      response = {
        content: orchestratorContent,
        toolsUsed: [],
        suggestions: [],
      };
      break;
  }

  // Save AI response
  await createMessage({
    conversationId: validated.conversationId,
    role: "assistant",
    content: response.content,
  });

  // Track usage
  await incrementUsage(user.id, "chat");

  // Update memory (async, don't block)
  addMemoryToChat(user.id.toString(), validated.conversationId.toString(), [
    { role: "user", content: validated.content },
    { role: "assistant", content: response.content },
  ]).catch(err => console.error("Memory update failed:", err));

  invalidateUserChat(user.id);
  revalidatePath("/chat");

  return {
    content: response.content,
    routing: {
      intent: routing.intent,
      agent: routing.targetAgent,
      confidence: routing.confidence,
    },
    toolsUsed: response.toolsUsed,
    suggestions: response.suggestions,
  };
}

// ============================================
// HELPER: GET AGENT CAPABILITIES
// ============================================

/**
 * Get information about available agents and their capabilities.
 * Useful for UI to show what the system can do.
 */
export async function getAgentCapabilities() {
  return {
    agents: [
      {
        role: "assessment",
        name: { en: "Assessment Specialist", ar: "متخصص التقييم" },
        capabilities: [
          { en: "CRS score calculation", ar: "حساب نقاط CRS" },
          { en: "Portugal visa matching", ar: "مطابقة تأشيرات البرتغال" },
          { en: "Eligibility assessments", ar: "تقييمات الأهلية" },
          { en: "Pathway recommendations", ar: "توصيات المسار" },
        ],
      },
      {
        role: "preparation",
        name: { en: "Preparation Specialist", ar: "متخصص التحضير" },
        capabilities: [
          { en: "Document requirements", ar: "متطلبات المستندات" },
          { en: "MENA attestation workflows", ar: "عمليات التصديق من MENA" },
          { en: "Police clearance processes", ar: "عمليات شهادة حسن السيرة" },
          { en: "Embassy information", ar: "معلومات السفارات" },
        ],
      },
      {
        role: "submission",
        name: { en: "Submission Specialist", ar: "متخصص التقديم" },
        capabilities: [
          { en: "Application guidance", ar: "إرشادات التقديم" },
          { en: "Forms and fees", ar: "النماذج والرسوم" },
          { en: "SOP assistance", ar: "مساعدة خطاب النوايا" },
          { en: "Processing times", ar: "أوقات المعالجة" },
        ],
      },
    ],
  };
}
