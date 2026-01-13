import { Mistral } from "@mistralai/mistralai";
import { generateChatResponse } from "./_core/gemini";

let mistralClient: Mistral | null = null;

function getMistralClient(): Mistral {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY environment variable is not set");
  }

  if (!mistralClient) {
    mistralClient = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    });
  }

  return mistralClient;
}

export interface OcrResult {
  pages: OcrPage[];
  totalPages: number;
  extractedText: string;
  language: string;
  confidence: number;
}

export interface OcrPage {
  index: number;
  markdown: string;
  text: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Process a document with Mistral OCR
 * Supports images (PNG, JPEG) and PDFs
 */
export async function processDocumentOcr(
  documentUrl: string
): Promise<OcrResult> {
  const mistral = getMistralClient();

  try {
    const result = await mistral.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: documentUrl,
      },
    });

    // Extract text from pages
    const pages: OcrPage[] = (result.pages || []).map((page: any, index: number) => ({
      index: page.index ?? index,
      markdown: page.markdown || "",
      text: stripMarkdown(page.markdown || ""),
    }));

    const extractedText = pages.map((p) => p.text).join("\n\n");

    // Detect language (simple heuristic for Arabic)
    const arabicPattern = /[\u0600-\u06FF]/;
    const hasArabic = arabicPattern.test(extractedText);
    const language = hasArabic ? "ar" : "en";

    return {
      pages,
      totalPages: pages.length,
      extractedText,
      language,
      confidence: 0.95, // Mistral OCR is highly accurate
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error("Failed to process document with OCR");
  }
}

/**
 * Process a document from base64
 */
export async function processDocumentOcrBase64(
  base64Data: string,
  mimeType: string
): Promise<OcrResult> {
  const mistral = getMistralClient();

  // Determine document type
  const isImage = mimeType.startsWith("image/");
  const type = isImage ? "image_url" : "document_url";

  try {
    // For base64, we need to create a data URL
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const result = await mistral.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: type as any,
        documentUrl: dataUrl,
      },
    });

    const pages: OcrPage[] = (result.pages || []).map((page: any, index: number) => ({
      index: page.index ?? index,
      markdown: page.markdown || "",
      text: stripMarkdown(page.markdown || ""),
    }));

    const extractedText = pages.map((p) => p.text).join("\n\n");

    const arabicPattern = /[\u0600-\u06FF]/;
    const hasArabic = arabicPattern.test(extractedText);
    const language = hasArabic ? "ar" : "en";

    return {
      pages,
      totalPages: pages.length,
      extractedText,
      language,
      confidence: 0.95,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error("Failed to process document with OCR");
  }
}

/**
 * Translate text using Gemini
 */
export async function translateText(
  text: string,
  sourceLanguage: string = "ar",
  targetLanguage: string = "en"
): Promise<TranslationResult> {
  const languageNames: Record<string, string> = {
    ar: "Arabic",
    en: "English",
    fr: "French",
  };

  const sourceName = languageNames[sourceLanguage] || sourceLanguage;
  const targetName = languageNames[targetLanguage] || targetLanguage;

  const prompt = `You are a professional translator specializing in immigration documents. Translate the following text from ${sourceName} to ${targetName}.

Important guidelines:
- Maintain the exact meaning and tone of the original
- Preserve any proper nouns, names, dates, and numbers exactly as they appear
- Keep document formatting and structure
- For official document terms, use the standard ${targetName} equivalents used in Canadian immigration
- If there are any unclear or ambiguous parts, translate them as accurately as possible

Text to translate:
---
${text}
---

Provide only the translation, no explanations or notes.`;

  const translatedText = await generateChatResponse({
    messages: [{ role: "user", parts: prompt }],
    systemInstruction: "You are an expert translator for immigration documents. Provide accurate, professional translations.",
    temperature: 0.2,
    maxOutputTokens: 4096,
  });

  return {
    originalText: text,
    translatedText: translatedText.trim(),
    sourceLanguage,
    targetLanguage,
  };
}

/**
 * Process document and translate in one step
 */
export async function processAndTranslate(
  documentUrl: string,
  targetLanguage: string = "en"
): Promise<{
  ocr: OcrResult;
  translation: TranslationResult | null;
}> {
  const ocrResult = await processDocumentOcr(documentUrl);

  // Only translate if the document is not in the target language
  let translation: TranslationResult | null = null;
  if (ocrResult.language !== targetLanguage && ocrResult.extractedText.trim()) {
    translation = await translateText(
      ocrResult.extractedText,
      ocrResult.language,
      targetLanguage
    );
  }

  return {
    ocr: ocrResult,
    translation,
  };
}

/**
 * Process base64 document and translate
 */
export async function processBase64AndTranslate(
  base64Data: string,
  mimeType: string,
  targetLanguage: string = "en"
): Promise<{
  ocr: OcrResult;
  translation: TranslationResult | null;
}> {
  const ocrResult = await processDocumentOcrBase64(base64Data, mimeType);

  let translation: TranslationResult | null = null;
  if (ocrResult.language !== targetLanguage && ocrResult.extractedText.trim()) {
    translation = await translateText(
      ocrResult.extractedText,
      ocrResult.language,
      targetLanguage
    );
  }

  return {
    ocr: ocrResult,
    translation,
  };
}

/**
 * Strip markdown formatting to get plain text
 */
function stripMarkdown(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
