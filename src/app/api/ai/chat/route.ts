/**
 * AI Chat API Route Handler
 * Uses Vercel AI SDK v6 with Google Gemini for streaming responses
 *
 * Feature Flag: ENABLE_AGENT_CHAT
 * When enabled, uses multi-agent routing with specialized tools
 */

import { streamText, UIMessage, convertToModelMessages } from "ai";
import { after } from "next/server";
import { google, generateChatTitle } from "@/../server/_core/gemini";
import { env } from "@/../server/_core/env";
import { getAuthenticatedUser } from "@/actions/auth";
import { ragQuery, buildRagContext } from "@/../server/rag";
import {
  getWorkingMemory,
  addMemoryToChat,
  updateWorkingMemory,
} from "@/lib/memory";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  createConversation,
  getConversation,
  createMessage,
  getConversationMessages,
  updateConversationTitle,
  getUserProfile,
} from "@/../server/db";
import { getSubscriptionStatus } from "@/../server/stripe";
import { checkUsageLimit, incrementUsage } from "@/../server/usage";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

import {
  calculateCRSTool,
  validateDocumentTool,
  generateComparisonTool,
} from "../tools";

// Agent tools (conditionally imported for agent mode)
import { eligibilityTools } from "@/../server/agents/tools/eligibility-tools";
import { documentTools } from "@/../server/agents/tools/document-tools";
import { submissionTools } from "@/../server/agents/tools/submission-tools";
import { routeToSpecialist, type CaseContext } from "@/../server/agents";
import { getUserDocumentChecklists } from "@/../server/documents";

export async function POST(req: Request) {
  try {
    const {
      messages,
      conversationId,
      language = "en",
    }: {
      messages: UIMessage[];
      conversationId?: number | null;
      language?: "ar" | "en";
    } = await req.json();

    // Authenticate user
    const user = await getAuthenticatedUser();

    // Rate Limit Check
    if (user) {
      const limit = await checkRateLimit(user.id.toString());
      if (!limit.success) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.limit.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
            },
          }
        );
      }
    }

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id);
    const usageCheck = await checkUsageLimit(
      user.id,
      subscriptionStatus?.tier || "free",
      "chat"
    );

    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error:
            "You've reached your monthly chat limit. Upgrade to Essential ($29/month) for unlimited messages.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      // Create a new conversation if none provided
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      const textPart = lastUserMessage?.parts.find(p => p.type === "text");
      const title =
        (textPart && "text" in textPart ? textPart.text : "")?.substring(
          0,
          50
        ) || "New Conversation";
      activeConversationId = await createConversation({
        userId: user.id,
        title,
        language,
      });
    }

    // Verify conversation belongs to user
    const conversation = await getConversation(activeConversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (conversation.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the last user message for RAG and memory
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    const lastTextPart = lastUserMessage?.parts.find(p => p.type === "text");
    const userQuery =
      lastTextPart && "text" in lastTextPart ? lastTextPart.text : "";

    // Save user message to database (don't await - can proceed in parallel)
    const saveMessagePromise = userQuery
      ? createMessage({
          conversationId: activeConversationId,
          role: "user",
          content: userQuery,
        })
      : Promise.resolve();

    // Fetch RAG context, Working Memory, and User Profile in parallel
    // This eliminates sequential waterfall for independent operations
    const [ragResults, workingMem, userProfile] = await Promise.all([
      // RAG query
      ragQuery(userQuery, {
        chunkLimit: 15, // Increased from 3 to 15 to capture broader context for list-type questions
        entityLimit: 10, // Increased from 3 to 10 to include more KG entities
        language: language,
        includeRelatedEntities: true, // Enable KG connections
      }).catch(error => {
        console.error("RAG query failed, continuing without context:", error);
        return null;
      }),
      // Working Memory
      getWorkingMemory(user.id.toString()).catch(error => {
        console.error("Working memory fetch failed:", error);
        return null;
      }),
      // User Profile
      getUserProfile(user.id).catch(error => {
        console.error("Profile fetch failed:", error);
        return null;
      }),
    ]);

    // Ensure message is saved before continuing
    await saveMessagePromise;

    // Build RAG context
    let ragContext = "";
    if (ragResults) {
      ragContext = buildRagContext(
        { chunks: ragResults.chunks, entities: ragResults.entities },
        language
      );
    }

    // Build memory context
    let memoryContext = "";
    if (workingMem) {
      memoryContext = `\n\nUser Context & Working Memory:\n${workingMem}`;
    }

    // Build profile context
    let profileContext = "";
    if (userProfile) {
      profileContext =
        `\n\nUser Profile Information (Verified):\n` +
        `- Name: ${user.name || "Unknown"}\n` +
        `- Nationality: ${userProfile.nationality || "Unknown"}\n` +
        `- Current Country: ${userProfile.currentCountry || "Unknown"}\n` +
        `- Source Country: ${userProfile.sourceCountry || "Unknown"}\n` +
        `- Education Level: ${userProfile.educationLevel || "Unknown"}\n` +
        `- Field of Study: ${userProfile.fieldOfStudy || "Unknown"}\n` +
        `- Work Experience: ${userProfile.yearsOfExperience || "0"} years\n` +
        `- Current Occupation: ${userProfile.currentOccupation || "Unknown"}\n` +
        `- Target Destination: ${userProfile.targetDestination || "Canada"}\n` +
        `- Immigration Pathway: ${userProfile.immigrationPathway || "Unknown"}\n`;
    }

    // Determine target destination (default to Canada)
    const targetDest =
      userProfile?.targetDestination?.toLowerCase() || "canada";
    const isAustralia = targetDest === "australia";

    // Build system instruction
    const baseSystemInstruction =
      language === "ar"
        ? `أنت "هجرة" - مساعد ذكي متخصص في الهجرة إلى ${isAustralia ? "أستراليا" : "كندا"}. أجب باللغة العربية.
        
        في نهاية إجابتك، اقترح دائماً 3 أسئلة متابعة قصيرة ذات صلة بصيغة مصفوفة JSON داخل وسوم <suggestions>، مثال:
        <suggestions>["كيفية التقديم؟", "ما هي التكلفة؟", "المستندات المطلوبة"]</suggestions>`
        : `You are "Hijraah" - a specialized AI immigration assistant helping people immigrate to ${isAustralia ? "Australia" : "Canada"}.
        
        At the end of your response, ALWAYS suggest 3 short, relevant follow-up questions formatted as a JSON array inside <suggestions> tags, e.g.:
        <suggestions>["How to apply?", "What is the cost?", "Required documents"]</suggestions>`;

    let systemInstruction = baseSystemInstruction;

    if (ragContext) {
      systemInstruction += `\n\n${ragContext}`;
    } else {
      const fallbackWarning =
        language === "ar"
          ? "\n\nتنبيه: لم يتم العثور على معلومات محددة في قاعدة البيانات لهذا السؤال. يجب عليك إبلاغ المستخدم بذلك بوضوح. لا تقدم إجابات عامة غير مدعومة بالمصادر المتاحة."
          : "\n\nNOTE: No specific information found in the knowledge base for this question. You must explicitly inform the user of this. Do NOT provide general answers that are not supported by the available sources.";
      systemInstruction += fallbackWarning;
    }

    systemInstruction += profileContext + memoryContext;

    // STRICT ANSWERING POLICY
    const strictPolicy =
      language === "ar"
        ? `\n\nسياسة الإجابة الصارمة:
            1. اعتمد *فقط* على المعلومات الواردة في <KNOWLEDGE_BASE> و <User Profile> و <User Documents>.
            2. إذا لم تكن المعلومة موجودة في السياق، قل: "عذراً، لا تتوفر لدي معلومات كافية في قاعدة البيانات الحالية للإجابة على هذا السؤال بدقة."
            3. لا تستخدم معرفتك العامة للإجابة على أسئلة حول قوانين الهجرة أو الإجراءات ما لم تكن مدعومة بالسياق المرفق.
            4. إذا كان السؤال عاماً (مثل: من هو رئيس كندا؟)، وضح أنك متخصص فقط في شؤون الهجرة.`
        : `\n\nSTRICT ANSWERING POLICY:
            1. Rely *ONLY* on the information provided in <KNOWLEDGE_BASE>, <User Profile>, and <User Documents>.
            2. If the information is not in the context, say: "I apologize, but I don't have enough information in my current database to answer this question accurately."
            3. Do NOT use your general knowledge to answer questions about immigration laws or procedures unless supported by the attached context.
            4. If the question is general (e.g., "Who is the president of Canada?"), clarify that you specialize only in immigration matters.`;

    systemInstruction += strictPolicy;

    // ============================================
    // AGENT MODE: Route to specialist with enhanced tools
    // ============================================
    const isAgentMode = env.ENABLE_AGENT_CHAT === "true";
    let agentMetadata: {
      agent: string;
      intent: string;
      confidence: string;
    } | null = null;
    let activeTools = {
      calculateCRS: calculateCRSTool,
      validateDocument: validateDocumentTool,
      compareItems: generateComparisonTool,
    };

    if (isAgentMode) {
      // Build case context for agent routing
      const userChecklists = await getUserDocumentChecklists(user.id).catch(
        () => []
      );

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
        const pendingItems = items.filter(
          item => item.status === "pending"
        ).length;

        totalRequired += items.length;
        uploaded += uploadedItems;
        pending += pendingItems;

        checklists.push({
          pathway: pathwayLabel,
          completionRate:
            items.length > 0
              ? Math.round((uploadedItems / items.length) * 100)
              : 0,
        });
      }

      const caseContext: CaseContext = {
        userId: user.id,
        conversationId: activeConversationId!,
        language,
        profile: userProfile
          ? {
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
        documents: { totalRequired, uploaded, pending, checklists },
        workingMemory: workingMem || undefined,
        ragContext: ragContext || undefined,
      };

      // Route to appropriate specialist
      const routing = await routeToSpecialist(userQuery, caseContext);
      agentMetadata = {
        agent: routing.targetAgent,
        intent: routing.intent,
        confidence: routing.confidence,
      };

      // Add specialist-specific system instructions and tools
      const specialistContext =
        language === "ar"
          ? `\n\n[تم التوجيه إلى: ${routing.targetAgent === "assessment" ? "متخصص التقييم" : routing.targetAgent === "preparation" ? "متخصص التحضير" : routing.targetAgent === "submission" ? "متخصص التقديم" : "المساعد العام"}]`
          : `\n\n[Routed to: ${routing.targetAgent === "assessment" ? "Assessment Specialist" : routing.targetAgent === "preparation" ? "Preparation Specialist" : routing.targetAgent === "submission" ? "Submission Specialist" : "General Assistant"}]`;

      systemInstruction += specialistContext;

      // Add agent-specific tools based on routing
      switch (routing.targetAgent) {
        case "assessment":
          activeTools = {
            ...activeTools,
            ...eligibilityTools,
          } as typeof activeTools;
          break;
        case "preparation":
          activeTools = {
            ...activeTools,
            ...documentTools,
          } as typeof activeTools;
          break;
        case "submission":
          activeTools = {
            ...activeTools,
            ...submissionTools,
          } as typeof activeTools;
          break;
      }
    }

    // Stream the response using Gemini
    const model = google("gemini-2.5-flash");

    const result = streamText({
      model,
      system: systemInstruction,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      tools: activeTools,
      // Include agent metadata in the response headers if in agent mode
      experimental_telemetry:
        isAgentMode && agentMetadata
          ? {
              isEnabled: true,
              metadata: agentMetadata,
            }
          : undefined,
      onFinish: async ({ text }) => {
        // Save AI response to database
        try {
          await createMessage({
            conversationId: activeConversationId!,
            role: "assistant",
            content: text,
          });

          // Track usage
          await incrementUsage(user.id, "chat");

          // Generate AI-powered title for new conversations
          // Check for empty, null, undefined, or default titles
          const needsTitle =
            !conversation.title ||
            conversation.title === "New Conversation" ||
            conversation.title === "New Chat" ||
            conversation.title === "محادثة جديدة" ||
            conversation.title.length < 3;

          if (needsTitle && userQuery) {
            // Generate title async using after() to prevent serverless termination
            after(async () => {
              try {
                const generatedTitle = await generateChatTitle(
                  userQuery,
                  language
                );
                await updateConversationTitle(
                  activeConversationId!,
                  generatedTitle
                );
                console.log(
                  `[Chat] Generated title: "${generatedTitle}" for conversation ${activeConversationId}`
                );
              } catch (err) {
                console.error("Title generation failed:", err);
              }
            });
          }

          // Add conversation to memory (async, don't block)
          // Add conversation to memory (async, don't block)
          after(async () => {
            try {
              await addMemoryToChat(
                user.id.toString(),
                activeConversationId!.toString(),
                [
                  { role: "user", content: userQuery },
                  { role: "assistant", content: text },
                ]
              );
            } catch (err) {
              console.error("Memory add failed:", err);
            }
          });
        } catch (error) {
          console.error("Error saving message:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle authentication errors
    if (
      error.message?.includes("Not authenticated") ||
      error.code === "UNAUTHORIZED"
    ) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
