import { generateChatResponse } from "./_core/gemini";

export interface SopQualityScore {
  overallScore: number; // 0-100
  categories: {
    clarity: { score: number; feedback: string; feedbackAr: string };
    structure: { score: number; feedback: string; feedbackAr: string };
    persuasiveness: { score: number; feedback: string; feedbackAr: string };
    relevance: { score: number; feedback: string; feedbackAr: string };
    grammar: { score: number; feedback: string; feedbackAr: string };
  };
  strengths: string[];
  strengthsAr: string[];
  improvements: string[];
  improvementsAr: string[];
}

/**
 * Analyze SOP quality using Gemini AI
 */
export async function analyzeSopQuality(sopContent: string): Promise<SopQualityScore> {
  const prompt = `You are an expert immigration consultant and professional writer. Analyze the following Statement of Purpose (SOP) for a Canadian immigration/study application and provide a detailed quality assessment.

SOP Content:
---
${sopContent}
---

Evaluate the SOP on these criteria (score each 0-100):
1. **Clarity**: Is the writing clear, concise, and easy to understand?
2. **Structure**: Does it have a logical flow with proper introduction, body, and conclusion?
3. **Persuasiveness**: Does it effectively convince the reader of the applicant's qualifications and goals?
4. **Relevance**: Does it address why Canada, why this program, and career goals appropriately?
5. **Grammar**: Is it free of grammatical errors and professionally written?

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{
  "overallScore": <number 0-100>,
  "categories": {
    "clarity": { "score": <number>, "feedback": "<English feedback>", "feedbackAr": "<Arabic feedback>" },
    "structure": { "score": <number>, "feedback": "<English feedback>", "feedbackAr": "<Arabic feedback>" },
    "persuasiveness": { "score": <number>, "feedback": "<English feedback>", "feedbackAr": "<Arabic feedback>" },
    "relevance": { "score": <number>, "feedback": "<English feedback>", "feedbackAr": "<Arabic feedback>" },
    "grammar": { "score": <number>, "feedback": "<English feedback>", "feedbackAr": "<Arabic feedback>" }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "strengthsAr": ["<قوة 1>", "<قوة 2>", "<قوة 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "improvementsAr": ["<تحسين 1>", "<تحسين 2>", "<تحسين 3>"]
}`;

  const response = await generateChatResponse({
    messages: [{ role: "user", parts: prompt }],
    systemInstruction: "You are an expert immigration consultant who evaluates Statements of Purpose. Always respond with valid JSON only, no markdown formatting.",
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  try {
    // Clean the response - remove any markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const result = JSON.parse(cleanedResponse) as SopQualityScore;
    
    // Validate and sanitize scores
    result.overallScore = Math.min(100, Math.max(0, result.overallScore));
    for (const category of Object.values(result.categories)) {
      category.score = Math.min(100, Math.max(0, category.score));
    }

    return result;
  } catch (error) {
    console.error("Failed to parse SOP quality response:", error, response);
    // Return a default response on parse error
    return {
      overallScore: 70,
      categories: {
        clarity: { score: 70, feedback: "Unable to analyze. Please try again.", feedbackAr: "تعذر التحليل. يرجى المحاولة مرة أخرى." },
        structure: { score: 70, feedback: "Unable to analyze. Please try again.", feedbackAr: "تعذر التحليل. يرجى المحاولة مرة أخرى." },
        persuasiveness: { score: 70, feedback: "Unable to analyze. Please try again.", feedbackAr: "تعذر التحليل. يرجى المحاولة مرة أخرى." },
        relevance: { score: 70, feedback: "Unable to analyze. Please try again.", feedbackAr: "تعذر التحليل. يرجى المحاولة مرة أخرى." },
        grammar: { score: 70, feedback: "Unable to analyze. Please try again.", feedbackAr: "تعذر التحليل. يرجى المحاولة مرة أخرى." },
      },
      strengths: ["Your SOP has been generated successfully."],
      strengthsAr: ["تم إنشاء خطاب النوايا بنجاح."],
      improvements: ["Review the content and make personal adjustments."],
      improvementsAr: ["راجع المحتوى وأجرِ تعديلات شخصية."],
    };
  }
}
