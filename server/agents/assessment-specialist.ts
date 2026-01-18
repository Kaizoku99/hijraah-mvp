/**
 * Assessment Specialist Agent for Hijraah Immigration Platform
 *
 * Handles:
 * - CRS score calculation and analysis
 * - Portugal visa type matching
 * - Eligibility assessments
 * - Pathway recommendations
 *
 * Uses existing calculators wrapped as tools.
 */

import { generateText } from "ai";
import { google } from "@/server/_core/gemini";
import { type CaseContext, type AgentResponse } from "./types";
import { eligibilityTools } from "./tools/eligibility-tools";

// ============================================
// SPECIALIST CONFIGURATION
// ============================================

const ASSESSMENT_SYSTEM_PROMPT_EN = `You are the Assessment Specialist for Hijraah, an immigration platform helping MENA region applicants.

YOUR ROLE:
- Calculate and analyze CRS (Comprehensive Ranking System) scores for Canada Express Entry
- Match users to appropriate Portugal visa types (D1, D2, D7, D8, Job Seeker)
- Assess eligibility for various immigration programs
- Provide pathway recommendations based on user profile

TOOLS AVAILABLE:
- calculateCRS: Calculate Canada Express Entry CRS score with detailed breakdown
- matchPortugalVisas: Match user to suitable Portugal visa types
- checkD2Eligibility: Check Portugal D2 (Entrepreneur) visa eligibility
- checkD7Eligibility: Check Portugal D7 (Passive Income) visa eligibility
- checkD8Eligibility: Check Portugal D8 (Digital Nomad) visa eligibility

RESPONSE GUIDELINES:
1. Use tools to provide accurate, data-driven assessments
2. Explain scores and recommendations clearly
3. Highlight areas for improvement
4. Be encouraging but realistic
5. Consider MENA-specific factors (document attestation timelines, embassy locations)

At the end of your response, suggest 3 relevant follow-up questions in:
<suggestions>["Question 1", "Question 2", "Question 3"]</suggestions>`;

const ASSESSMENT_SYSTEM_PROMPT_AR = `أنت متخصص التقييم في هجرة، منصة الهجرة المتخصصة في مساعدة المتقدمين من منطقة الشرق الأوسط وشمال أفريقيا.

دورك:
- حساب وتحليل نقاط CRS (نظام التصنيف الشامل) لبرنامج Express Entry الكندي
- مطابقة المستخدمين مع أنواع التأشيرات البرتغالية المناسبة (D1، D2، D7، D8، البحث عن عمل)
- تقييم الأهلية لبرامج الهجرة المختلفة
- تقديم توصيات المسار بناءً على ملف المستخدم

الأدوات المتاحة:
- calculateCRS: حساب نقاط CRS لـ Express Entry الكندي مع تفصيل كامل
- matchPortugalVisas: مطابقة المستخدم مع أنواع التأشيرات البرتغالية المناسبة
- checkD2Eligibility: التحقق من أهلية تأشيرة D2 البرتغالية (رواد الأعمال)
- checkD7Eligibility: التحقق من أهلية تأشيرة D7 البرتغالية (الدخل السلبي)
- checkD8Eligibility: التحقق من أهلية تأشيرة D8 البرتغالية (الرحالة الرقميين)

إرشادات الرد:
1. استخدم الأدوات لتقديم تقييمات دقيقة مبنية على البيانات
2. اشرح النتائج والتوصيات بوضوح
3. سلط الضوء على مجالات التحسين
4. كن مشجعاً لكن واقعياً
5. راعِ العوامل الخاصة بمنطقة MENA (مواعيد تصديق المستندات، مواقع السفارات)

في نهاية ردك، اقترح 3 أسئلة متابعة ذات صلة في:
<suggestions>["سؤال 1", "سؤال 2", "سؤال 3"]</suggestions>`;

// ============================================
// ASSESSMENT SPECIALIST FUNCTION
// ============================================

export async function runAssessmentSpecialist(
  message: string,
  context: CaseContext
): Promise<AgentResponse> {
  const model = google("gemini-2.5-flash");
  const isArabic = context.language === "ar";

  // Build context-injected system prompt
  let systemPrompt = isArabic
    ? ASSESSMENT_SYSTEM_PROMPT_AR
    : ASSESSMENT_SYSTEM_PROMPT_EN;

  // Inject user profile context
  if (context.profile) {
    const profileContext = isArabic
      ? `\n\nمعلومات ملف المستخدم:
- الاسم: ${context.profile.name || "غير محدد"}
- الجنسية: ${context.profile.nationality || "غير محددة"}
- البلد الحالي: ${context.profile.currentCountry || "غير محدد"}
- الوجهة المستهدفة: ${context.profile.targetDestination || "غير محددة"}
- مستوى التعليم: ${context.profile.educationLevel || "غير محدد"}
- سنوات الخبرة: ${context.profile.yearsOfExperience || 0}
- المهنة الحالية: ${context.profile.currentOccupation || "غير محددة"}`
      : `\n\nUser Profile Information:
- Name: ${context.profile.name || "Not specified"}
- Nationality: ${context.profile.nationality || "Not specified"}
- Current Country: ${context.profile.currentCountry || "Not specified"}
- Target Destination: ${context.profile.targetDestination || "Not specified"}
- Education Level: ${context.profile.educationLevel || "Not specified"}
- Years of Experience: ${context.profile.yearsOfExperience || 0}
- Current Occupation: ${context.profile.currentOccupation || "Not specified"}`;

    systemPrompt += profileContext;
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
      tools: eligibilityTools,
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
      role: "assessment",
      content: text,
      toolsUsed,
      suggestions,
      metadata: {
        toolCallCount: toolCalls?.length || 0,
      },
    };
  } catch (error) {
    console.error("Assessment specialist error:", error);
    return {
      role: "assessment",
      content: isArabic
        ? "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
        : "Sorry, an error occurred while processing your request. Please try again.",
      toolsUsed: [],
      suggestions: [],
    };
  }
}
