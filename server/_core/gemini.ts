import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  if (!model) {
    model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  return { genAI, model };
}

export interface GeminiMessage {
  role: "user" | "model";
  parts: string;
}

export interface GeminiChatOptions {
  messages: GeminiMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Generate a chat response using Gemini 2.5 Pro
 */
export async function generateChatResponse(options: GeminiChatOptions): Promise<string> {
  const { model } = getGeminiClient();

  const chat = model.startChat({
    history: options.messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
    systemInstruction: options.systemInstruction ? {
      role: "user",
      parts: [{ text: options.systemInstruction }],
    } : undefined,
  });

  const result = await chat.sendMessage("");
  const response = await result.response;
  return response.text();
}

/**
 * Generate a streaming chat response using Gemini 2.5 Pro
 */
export async function* generateChatResponseStream(
  options: GeminiChatOptions
): AsyncGenerator<string, void, unknown> {
  const { model } = getGeminiClient();

  const chat = model.startChat({
    history: options.messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
    systemInstruction: options.systemInstruction ? {
      role: "user",
      parts: [{ text: options.systemInstruction }],
    } : undefined,
  });

  const result = await chat.sendMessageStream("");

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield chunkText;
    }
  }
}

/**
 * Generate structured JSON response using Gemini
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  schema: any,
  systemInstruction?: string
): Promise<T> {
  const { model } = getGeminiClient();

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction,
  } as any);

  const response = await result.response;
  const text = response.text();
  return JSON.parse(text) as T;
}

/**
 * Analyze image with Gemini Vision
 */
export async function analyzeImage(
  imageData: string,
  prompt: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const { genAI } = getGeminiClient();
  const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await visionModel.generateContent([
    {
      inlineData: {
        data: imageData,
        mimeType,
      },
    },
    prompt,
  ]);

  const response = await result.response;
  return response.text();
}

/**
 * Generate embeddings using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { genAI } = getGeminiClient();
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Batch generate embeddings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { genAI } = getGeminiClient();
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const results = await Promise.all(
    texts.map((text) => embeddingModel.embedContent(text))
  );

  return results.map((result: any) => result.embedding.values);
}
