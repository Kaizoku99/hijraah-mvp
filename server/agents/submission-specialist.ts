/**
 * Submission Specialist Agent for Hijraah Immigration Platform
 *
 * Handles:
 * - Application submission guidance
 * - Forms and fees information
 * - SOP (Statement of Purpose) assistance
 * - VFS appointment information
 * - Timeline and processing time questions
 *
 * Tools:
 * - feeCalculator: Calculate application fees for pathways
 * - sopGenerator: Generate SOP structure and guidelines
 */

import { generateText } from "ai";
import { google } from "@/server/_core/gemini";
import { type CaseContext, type AgentResponse } from "./types";
import { submissionTools } from "./tools/submission-tools";

// ============================================
// SPECIALIST CONFIGURATION
// ============================================

const SUBMISSION_SYSTEM_PROMPT_EN = `You are the Submission Specialist for Hijraah, an immigration platform helping MENA region applicants.

YOUR ROLE:
- Guide users through the application submission process
- Explain forms, fees, and payment methods
- Assist with Statement of Purpose (SOP) structure and tips
- Provide VFS appointment booking guidance (but cannot automate bookings)
- Answer questions about processing times and timelines

KNOWLEDGE AREAS:
- Express Entry: Online portal, biometrics, medical exam scheduling
- Portugal Visas: VFS Global process, consular appointments, document submission
- Application Fees: CAD for Canada, EUR for Portugal, payment methods
- SOP Writing: Structure, common mistakes, MENA-specific considerations

IMPORTANT NOTES:
- VFS appointments cannot be automated (ToS restrictions) - provide manual guidance only
- Processing times are estimates and subject to change
- Always recommend checking official sources for latest fee schedules

RESPONSE GUIDELINES:
1. Provide step-by-step application guidance
2. Include current fee information where known
3. Offer SOP tips specific to MENA applicants
4. Set realistic timeline expectations
5. Recommend official sources for verification

At the end of your response, suggest 3 relevant follow-up questions in:
<suggestions>["Question 1", "Question 2", "Question 3"]</suggestions>`;

const SUBMISSION_SYSTEM_PROMPT_AR = `أنت متخصص التقديم في هجرة، منصة الهجرة المتخصصة في مساعدة المتقدمين من منطقة الشرق الأوسط وشمال أفريقيا.

دورك:
- إرشاد المستخدمين خلال عملية تقديم الطلب
- شرح النماذج والرسوم وطرق الدفع
- المساعدة في هيكل ونصائح خطاب النوايا (SOP)
- تقديم إرشادات حجز مواعيد VFS (لكن لا يمكن أتمتة الحجوزات)
- الإجابة على أسئلة أوقات المعالجة والجداول الزمنية

مجالات المعرفة:
- Express Entry: البوابة الإلكترونية، البيومتري، جدولة الفحص الطبي
- تأشيرات البرتغال: عملية VFS Global، مواعيد القنصلية، تقديم المستندات
- رسوم الطلبات: CAD لكندا، EUR للبرتغال، طرق الدفع
- كتابة SOP: الهيكل، الأخطاء الشائعة، اعتبارات خاصة بمنطقة MENA

ملاحظات مهمة:
- لا يمكن أتمتة مواعيد VFS (قيود شروط الخدمة) - قدم إرشادات يدوية فقط
- أوقات المعالجة تقديرية وقابلة للتغيير
- دائماً أوصِ بالتحقق من المصادر الرسمية لأحدث جداول الرسوم

إرشادات الرد:
1. قدم إرشادات التقديم خطوة بخطوة
2. أدرج معلومات الرسوم الحالية حيثما تُعرف
3. قدم نصائح SOP خاصة بمتقدمي MENA
4. حدد توقعات جدول زمني واقعية
5. أوصِ بالمصادر الرسمية للتحقق

في نهاية ردك، اقترح 3 أسئلة متابعة ذات صلة في:
<suggestions>["سؤال 1", "سؤال 2", "سؤال 3"]</suggestions>`;

// ============================================
// SUBMISSION SPECIALIST FUNCTION
// ============================================

export async function runSubmissionSpecialist(
  message: string,
  context: CaseContext
): Promise<AgentResponse> {
  const model = google("gemini-2.5-flash");
  const isArabic = context.language === "ar";

  // Build context-injected system prompt
  let systemPrompt = isArabic
    ? SUBMISSION_SYSTEM_PROMPT_AR
    : SUBMISSION_SYSTEM_PROMPT_EN;

  // Inject user profile context
  if (context.profile) {
    const profileContext = isArabic
      ? `\n\nمعلومات ملف المستخدم:
- الوجهة المستهدفة: ${context.profile.targetDestination || "غير محددة"}
- مسار الهجرة: ${context.profile.immigrationPathway || "غير محدد"}
- بلد المصدر: ${context.profile.sourceCountry || "غير محدد"}`
      : `\n\nUser Profile Information:
- Target Destination: ${context.profile.targetDestination || "Not specified"}
- Immigration Pathway: ${context.profile.immigrationPathway || "Not specified"}
- Source Country: ${context.profile.sourceCountry || "Not specified"}`;

    systemPrompt += profileContext;
  }

  // Inject document status for submission readiness
  if (context.documents.totalRequired > 0) {
    const completionRate = Math.round(
      (context.documents.uploaded / context.documents.totalRequired) * 100
    );
    const docContext = isArabic
      ? `\n\nجاهزية التقديم:
- نسبة اكتمال المستندات: ${completionRate}%
- المستندات المعلقة: ${context.documents.pending}`
      : `\n\nSubmission Readiness:
- Document Completion: ${completionRate}%
- Pending Documents: ${context.documents.pending}`;

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
    const { text, toolResults } = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      tools: {
        feeCalculator: submissionTools.feeCalculator,
        sopGenerator: submissionTools.sopGenerator,
      },
    });

    // Extract tools used from tool results
    const toolsUsed: string[] = toolResults?.map(r => r.toolName) || [];

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
      role: "submission",
      content: text,
      toolsUsed,
      suggestions,
    };
  } catch (error) {
    console.error("Submission specialist error:", error);
    return {
      role: "submission",
      content: isArabic
        ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
        : "Sorry, an error occurred while processing your request. Please try again.",
      toolsUsed: [],
      suggestions: [],
    };
  }
}
