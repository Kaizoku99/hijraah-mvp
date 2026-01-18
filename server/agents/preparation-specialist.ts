/**
 * Preparation Specialist Agent for Hijraah Immigration Platform
 *
 * Handles:
 * - Document requirements and checklists
 * - MENA attestation workflows
 * - Police clearance processes
 * - Embassy and VFS information
 * - Bank statement requirements
 *
 * Uses MENA workflow tools.
 */

import { generateText } from "ai";
import { google } from "@/server/_core/gemini";
import { type CaseContext, type AgentResponse } from "./types";
import { documentTools } from "./tools/document-tools";

// ============================================
// SPECIALIST CONFIGURATION
// ============================================

const PREPARATION_SYSTEM_PROMPT_EN = `You are the Preparation Specialist for Hijraah, an immigration platform helping MENA region applicants.

YOUR ROLE:
- Guide users through document preparation and requirements
- Explain MENA-specific attestation workflows (MOFA, notarization, apostille)
- Provide police clearance certificate processes by country
- Share embassy and VFS center information
- Clarify bank statement and proof of funds requirements

TOOLS AVAILABLE:
- getEmbassyInfo: Get embassy and VFS center locations, hours, and contact info
- getAttestationWorkflow: Get step-by-step document attestation process for a MENA country
- getPoliceClearanceWorkflow: Get police clearance certificate process for a MENA country
- getBankStatementRequirements: Get bank statement format requirements for immigration programs
- getSupportedMENACountries: List all supported MENA countries

RESPONSE GUIDELINES:
1. Use tools to provide accurate, country-specific information
2. Present steps in a clear, numbered format
3. Include estimated times and costs where available
4. Highlight tips and common mistakes to avoid
5. Provide both English and Arabic names for authorities when relevant

At the end of your response, suggest 3 relevant follow-up questions in:
<suggestions>["Question 1", "Question 2", "Question 3"]</suggestions>`;

const PREPARATION_SYSTEM_PROMPT_AR = `أنت متخصص التحضير في هجرة، منصة الهجرة المتخصصة في مساعدة المتقدمين من منطقة الشرق الأوسط وشمال أفريقيا.

دورك:
- إرشاد المستخدمين خلال تحضير المستندات ومتطلباتها
- شرح عمليات التصديق الخاصة بمنطقة MENA (وزارة الخارجية، كاتب العدل، الأبوستيل)
- تقديم عمليات شهادة حسن السيرة حسب البلد
- مشاركة معلومات السفارات ومراكز VFS
- توضيح متطلبات كشف الحساب البنكي وإثبات الأموال

الأدوات المتاحة:
- getEmbassyInfo: الحصول على مواقع وساعات ومعلومات الاتصال بالسفارات ومراكز VFS
- getAttestationWorkflow: الحصول على عملية تصديق المستندات خطوة بخطوة لبلد من منطقة MENA
- getPoliceClearanceWorkflow: الحصول على عملية شهادة حسن السيرة لبلد من منطقة MENA
- getBankStatementRequirements: الحصول على متطلبات شكل كشف الحساب البنكي لبرامج الهجرة
- getSupportedMENACountries: قائمة بجميع دول MENA المدعومة

إرشادات الرد:
1. استخدم الأدوات لتقديم معلومات دقيقة وخاصة بكل بلد
2. قدم الخطوات بشكل واضح ومرقم
3. أدرج الأوقات والتكاليف المقدرة حيثما توفرت
4. سلط الضوء على النصائح والأخطاء الشائعة
5. قدم الأسماء بالإنجليزية والعربية للجهات الرسمية عند الحاجة

في نهاية ردك، اقترح 3 أسئلة متابعة ذات صلة في:
<suggestions>["سؤال 1", "سؤال 2", "سؤال 3"]</suggestions>`;

// ============================================
// PREPARATION SPECIALIST FUNCTION
// ============================================

export async function runPreparationSpecialist(
  message: string,
  context: CaseContext
): Promise<AgentResponse> {
  const model = google("gemini-2.5-flash");
  const isArabic = context.language === "ar";

  // Build context-injected system prompt
  let systemPrompt = isArabic
    ? PREPARATION_SYSTEM_PROMPT_AR
    : PREPARATION_SYSTEM_PROMPT_EN;

  // Inject user profile context
  if (context.profile) {
    const profileContext = isArabic
      ? `\n\nمعلومات ملف المستخدم:
- البلد الحالي/المصدر: ${context.profile.sourceCountry || context.profile.currentCountry || "غير محدد"}
- الوجهة المستهدفة: ${context.profile.targetDestination || "غير محددة"}
- مسار الهجرة: ${context.profile.immigrationPathway || "غير محدد"}`
      : `\n\nUser Profile Information:
- Current/Source Country: ${context.profile.sourceCountry || context.profile.currentCountry || "Not specified"}
- Target Destination: ${context.profile.targetDestination || "Not specified"}
- Immigration Pathway: ${context.profile.immigrationPathway || "Not specified"}`;

    systemPrompt += profileContext;
  }

  // Inject document status
  if (context.documents.totalRequired > 0) {
    const docContext = isArabic
      ? `\n\nحالة المستندات:
- المستندات المرفوعة: ${context.documents.uploaded}/${context.documents.totalRequired}
- المستندات المعلقة: ${context.documents.pending}`
      : `\n\nDocument Status:
- Documents Uploaded: ${context.documents.uploaded}/${context.documents.totalRequired}
- Documents Pending: ${context.documents.pending}`;

    systemPrompt += docContext;
  }

  // Inject working memory if available
  if (context.workingMemory) {
    systemPrompt += `\n\nPrevious Context:\n${context.workingMemory}`;
  }

  // Inject RAG context if available
  if (context.ragContext) {
    systemPrompt += `\n\n${context.ragContext}`;
  }

  try {
    const { text, toolCalls } = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      tools: documentTools,
      temperature: 0.7,
    });

    // Extract tool names that were called
    const toolsUsed = toolCalls?.map(tc => tc.toolName) || [];

    // Extract suggestions from response
    const suggestionsMatch = text.match(
      /<suggestions>\s*(\[[\s\S]*?\])\s*<\/suggestions>/
    );
    let suggestions: string[] = [];
    if (suggestionsMatch) {
      try {
        suggestions = JSON.parse(suggestionsMatch[1]);
      } catch {
        // Ignore parsing errors
      }
    }

    return {
      role: "preparation",
      content: text,
      toolsUsed,
      suggestions,
      metadata: {
        toolCallCount: toolCalls?.length || 0,
      },
    };
  } catch (error) {
    console.error("Preparation specialist error:", error);
    return {
      role: "preparation",
      content: isArabic
        ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
        : "Sorry, an error occurred while processing your request. Please try again.",
      toolsUsed: [],
      suggestions: [],
    };
  }
}
