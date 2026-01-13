/**
 * Express routes for AI streaming endpoints
 * These bypass tRPC to enable native HTTP streaming with Vercel AI SDK
 * Enhanced with RAG support for sources and reasoning display
 */

import { Router, Request, Response, NextFunction } from "express";
import { streamChatResponse, streamSopGeneration, Language, ChatMessage } from "./ai";
import { getAuthUserFromExpressRequest } from "./supabase";
import * as db from "../db";
import { 
  createMessage, 
  getConversation, 
  getConversationMessages,
  updateConversationTitle 
} from "../db";
import { ragQuery, buildRagContext, RagSearchResult, KgEntity } from "../rag";

const router = Router();

// Type for incoming messages from client
interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

// Type for sources to send to client
interface Source {
  id: string;
  url: string;
  title: string;
  relevance: number;
}

// Type for reasoning step
interface ReasoningStep {
  step: string;
  description: string;
  status: "complete" | "active" | "pending";
}

// Helper to extract text content from message
function extractMessageContent(msg: IncomingMessage): string {
  if (typeof msg.content === "string") {
    return msg.content;
  }
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

// Convert RAG results to sources format
function ragResultsToSources(chunks: RagSearchResult[], entities: KgEntity[]): Source[] {
  const sources: Source[] = [];
  
  // Add document chunks as sources
  chunks.forEach((chunk, index) => {
    if (chunk.metadata.sourceUrl) {
      sources.push({
        id: `chunk-${chunk.id}`,
        url: chunk.metadata.sourceUrl,
        title: extractTitleFromUrl(chunk.metadata.sourceUrl),
        relevance: Math.round(chunk.similarity * 100),
      });
    }
  });

  // Add unique entity sources
  entities.forEach((entity) => {
    if (entity.properties?.sourceUrl) {
      const url = entity.properties.sourceUrl;
      if (!sources.find(s => s.url === url)) {
        sources.push({
          id: `entity-${entity.id}`,
          url,
          title: entity.displayName || entity.entityName,
          relevance: Math.round(entity.confidenceScore * 100),
        });
      }
    }
  });

  return sources;
}

// Extract title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Get last part of path and clean it up
    const lastPart = path.split('/').filter(Boolean).pop() || urlObj.hostname;
    return lastPart
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\.\w+$/, '') // Remove file extension
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return url;
  }
}

// Middleware to check authentication using Supabase
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const supabaseUser = await getAuthUserFromExpressRequest(req);
    if (!supabaseUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get database user
    const dbUser = await db.getOrCreateUserByAuthId(supabaseUser.id, {
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    });

    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    (req as any).user = dbUser;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * POST /api/ai/chat
 * Streaming chat endpoint compatible with Vercel AI SDK useChat hook
 * Enhanced with RAG context and sources
 */
router.post("/chat", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { messages, conversationId }: { messages: IncomingMessage[]; conversationId?: number } = req.body;

    console.log("[AI Chat] Request received:", { 
      conversationId, 
      messageCount: messages?.length,
      firstMessage: messages?.[0],
      lastMessage: messages?.[messages?.length - 1]
    });

    if (!messages || !Array.isArray(messages)) {
      console.log("[AI Chat] Error: Messages array is required");
      return res.status(400).json({ error: "Messages array is required" });
    }

    // If conversationId provided, verify ownership and get language
    let language: Language = "en";
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (conversation.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      language = conversation.language as Language;
    }

    // Convert incoming messages to chat format
    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: extractMessageContent(msg),
    }));

    // Save the last user message to database if conversationId provided
    const lastUserMessage = chatMessages.filter(m => m.role === "user").pop();
    if (conversationId && lastUserMessage) {
      await createMessage({
        conversationId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    // Fetch RAG context for the user's query
    let ragContext = "";
    let sources: Source[] = [];
    
    if (lastUserMessage) {
      try {
        const ragResults = await ragQuery(lastUserMessage.content, {
          chunkLimit: 3,
          entityLimit: 3,
          language: language,
          includeRelatedEntities: false,
        });
        
        ragContext = buildRagContext(
          { chunks: ragResults.chunks, entities: ragResults.entities },
          language as "en" | "ar"
        );
        
        sources = ragResultsToSources(ragResults.chunks, ragResults.entities);
      } catch (error) {
        console.error("RAG query failed, continuing without context:", error);
      }
    }

    // Stream the response with RAG context using UI Message Stream format
    const result = streamChatResponse({
      messages: chatMessages,
      language,
      ragContext, // Pass RAG context to be included in system prompt
    });

    // Log what we're about to stream for debugging
    console.log("[AI Chat] Starting stream to client");

    // Save the message after streaming completes (use result.text which is a Promise)
    result.text.then(async (text) => {
      try {
        console.log("[AI Chat] Stream completed, text length:", text?.length);
        console.log("[AI Chat] Text preview:", text?.substring(0, 200));
        
        if (conversationId && text) {
          await createMessage({
            conversationId,
            role: "assistant",
            content: text,
          });

          // Update conversation title if it's the first exchange
          const conversation = await getConversation(conversationId);
          if (conversation && !conversation.title && lastUserMessage) {
            await updateConversationTitle(
              conversationId,
              lastUserMessage.content.substring(0, 50)
            );
          }
        }
      } catch (err) {
        console.error("[AI Chat] Error saving message:", err);
      }
    });

    // Pipe the stream directly to Express response with required header
    result.pipeUIMessageStreamToResponse(res, {
      headers: {
        'x-vercel-ai-ui-message-stream': 'v1',
      },
    });
  } catch (error) {
    console.error("Chat streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    }
  }
});

/**
 * POST /api/ai/chat/stream
 * Alternative endpoint using AI SDK's native data stream format
 * Compatible with useChat's DefaultChatTransport
 */
router.post("/chat/stream", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { messages, conversationId }: { messages: IncomingMessage[]; conversationId?: number } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    let language: Language = "en";
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (conversation.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      language = conversation.language as Language;
    }

    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: extractMessageContent(msg),
    }));

    const lastUserMessage = chatMessages.filter(m => m.role === "user").pop();
    if (conversationId && lastUserMessage) {
      await createMessage({
        conversationId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    const result = streamChatResponse({
      messages: chatMessages,
      language,
    });

    // Use AI SDK's native pipe method
    result.pipeTextStreamToResponse(res);

    // Save the assistant response after streaming completes
    // Using Promise.resolve to ensure we have a proper Promise
    Promise.resolve(result.text).then(async (fullText) => {
      if (conversationId) {
        await createMessage({
          conversationId,
          role: "assistant",
          content: fullText,
        });
      }
    }).catch((err) => console.error("Failed to save assistant message:", err));

  } catch (error) {
    console.error("Chat streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    }
  }
});

/**
 * POST /api/ai/sop/generate
 * Stream SOP generation
 */
router.post("/sop/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      background,
      education,
      workExperience,
      motivations,
      goals,
      whyCanada,
      additionalInfo,
      language = "en",
    } = req.body;

    if (!background || !education || !workExperience || !motivations || !goals || !whyCanada) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = streamSopGeneration({
      background,
      education,
      workExperience,
      motivations,
      goals,
      whyCanada,
      additionalInfo,
      language: language as Language,
    });

    // Stream text response
    result.pipeTextStreamToResponse(res);

  } catch (error) {
    console.error("SOP generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate SOP" });
    }
  }
});

export { router as aiRouter };
