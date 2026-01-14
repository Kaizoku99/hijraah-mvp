import { Mistral } from "@mistralai/mistralai";
import { generateChatResponse } from "./_core/gemini";
import { supabaseAdmin } from "./_core/supabase";
import { nanoid } from "nanoid";

let mistralClient: Mistral | null = null;

function getMistralClient(): Mistral {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY environment variable is not set");
  }

  if (!mistralClient) {
    mistralClient = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    });
    console.log(`[MistralClient] Initialized. API Key present: ${!!process.env.MISTRAL_API_KEY}, Length: ${process.env.MISTRAL_API_KEY?.length}`);
  }

  return mistralClient;
}

/**
 * Retry helper with exponential backoff for transient API errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; retryableStatuses?: number[] } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, retryableStatuses = [429, 500, 502, 503, 504] } = options;

  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const statusCode = error.statusCode || error.status;
      const isRetryable = retryableStatuses.includes(statusCode) ||
        error.message?.includes('503') ||
        error.message?.includes('overflow') ||
        error.message?.includes('timeout');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[Mistral OCR] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (error: ${statusCode || error.message?.substring(0, 50)})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
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
 * Process a document from base64 by uploading to Supabase Storage first
 * This avoids sending large base64 data directly to Mistral
 */
export async function processDocumentOcrBase64(
  base64Data: string,
  mimeType: string
): Promise<OcrResult> {
  const mistral = getMistralClient();

  // Generate unique filename
  const fileExt = mimeType.split("/")[1] || "jpg";
  const fileName = `ocr-temp/${nanoid()}.${fileExt}`;

  console.log(`[OCR Storage] Uploading file to Supabase Storage: ${fileName}`);

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from("documents")
    .upload(fileName, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[OCR Storage] Upload failed:", uploadError);
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  console.log(`[OCR Storage] Upload successful: ${uploadData.path}`);

  // Get signed URL (valid for 5 minutes) - more reliable than public URL for external services
  const { data: urlData, error: signedUrlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(fileName, 300); // 300 seconds = 5 minutes

  if (signedUrlError || !urlData?.signedUrl) {
    console.error("[OCR Storage] Signed URL creation failed:", signedUrlError);
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
  }

  const signedUrl = urlData.signedUrl;
  console.log(`[OCR Storage] Signed URL generated (expires in 5 min)`);

  try {
    console.log(`[Mistral OCR] Sending request with signed URL. Model: mistral-ocr-latest`);
    const startTime = Date.now();

    // Create a timeout promise (45 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Mistral API call timed out after 45000ms")), 45000);
    });

    // Race the OCR request against the timeout, with retry for transient errors
    const result = await withRetry(async () => {
      return await Promise.race([
        mistral.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            documentUrl: signedUrl,
          },
        }),
        timeoutPromise,
      ]) as any;
    }, { maxRetries: 3, baseDelay: 1500 });

    console.log(`[Mistral OCR] Response received in ${Date.now() - startTime}ms`);
    console.log(`[Mistral OCR] Pages: ${result.pages?.length || 0}`);

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
  } catch (error: any) {
    console.error("OCR processing error:", error);
    if (error.response) {
      console.error("OCR Error Response Data:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to process document with OCR: ${error.message}`);
  } finally {
    // Clean up: delete the temporary file from storage
    console.log(`[OCR Storage] Cleaning up temporary file: ${fileName}`);
    const { error: deleteError } = await supabaseAdmin.storage
      .from("documents")
      .remove([fileName]);

    if (deleteError) {
      console.warn(`[OCR Storage] Failed to delete temp file: ${deleteError.message}`);
    } else {
      console.log(`[OCR Storage] Temp file deleted successfully`);
    }
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
    messages: [{ role: "user", content: prompt } as any],
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
