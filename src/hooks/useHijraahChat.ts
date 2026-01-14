/**
 * Custom chat hook using Vercel AI SDK v6
 * Wraps useChat with Hijraah-specific configuration
 * Enhanced to support RAG sources and reasoning display
 */

import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";

// Source type matching server response
export interface ChatSource {
  id: string;
  url: string;
  title: string;
  relevance?: number;
  sourceType?: string;
}

// Extended message type with sources
export interface HijraahChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  suggestions?: string[];
  createdAt?: Date;
}

export interface UseHijraahChatOptions {
  conversationId?: number | null;
  language?: "ar" | "en";
  onError?: (error: Error) => void;
  onFinish?: (message: string, sources?: ChatSource[]) => void;
  onSources?: (sources: ChatSource[]) => void;
}

export function useHijraahChat(options: UseHijraahChatOptions = {}) {
  const { conversationId, language = "en", onError, onFinish, onSources } = options;
  const [input, setInput] = useState("");
  const [currentSources, setCurrentSources] = useState<ChatSource[]>([]);

  // Use ref to ensure transport always accesses the latest conversationId without needing to be recreated
  const conversationIdRef = useRef(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Configure transport with conversation context using prepareSendMessagesRequest
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: {
        "Content-Type": "application/json",
      },
      // Use prepareSendMessagesRequest to include conversationId and language
      prepareSendMessagesRequest: ({ messages }) => {
        const currentConversationId = conversationIdRef.current;
        const currentLanguage = languageRef.current;
        // console.log("[useHijraahChat] Preparing request with conversationId:", currentConversationId);

        return {
          body: {
            messages,
            conversationId: currentConversationId,
            language: currentLanguage,
          },
        };
      },
    });
  }, []); // Only create transport once, reading from refs allows dynamic updates

  const {
    messages,
    status,
    error,
    sendMessage: aiSendMessage,
    stop,
    setMessages,
  } = useAIChat({
    transport,
    onError: (err: Error) => {
      console.error("[useHijraahChat] Chat error:", err);
      onError?.(err);
    },
    onFinish: ({ message }) => {
      // console.log("[useHijraahChat] onFinish called, full message:", JSON.stringify(message, null, 2));
      // console.log("[useHijraahChat] message.parts:", message.parts);
      // console.log("[useHijraahChat] message.parts length:", message.parts?.length);

      // Extract text from message parts
      const text = message.parts
        ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("") || "";

      // Extract sources from message parts
      const sources = message.parts
        ?.filter((part) => part.type === "source-url" || part.type === "source-document")
        .map((part) => {
          const p = part as any;
          return {
            id: p.sourceId || `source-${Math.random()}`,
            url: p.url || "",
            title: p.title || "",
            sourceType: p.type,
          };
        }) || [];

      // console.log("[useHijraahChat] Extracted text length:", text?.length, "sources:", sources.length);

      if (sources.length > 0) {
        setCurrentSources(sources);
        onSources?.(sources);
      }

      onFinish?.(text, sources.length > 0 ? sources : undefined);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Helper to send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // console.log("[useHijraahChat] Sending message:", content);

    // Clear current sources before sending new message
    setCurrentSources([]);

    try {
      await aiSendMessage({
        text: content,
      });
      // console.log("[useHijraahChat] Message sent successfully");
    } catch (err) {
      console.error("[useHijraahChat] Error sending message:", err);
    }
  }, [aiSendMessage]);

  // Log status changes and raw messages
  console.log("[useHijraahChat] Status:", status, "Messages count:", messages.length);
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    console.log("[useHijraahChat] Last message role:", lastMsg.role, "parts:", lastMsg.parts?.length, "parts detail:", JSON.stringify(lastMsg.parts));
  }

  // Convert AI SDK message format to extended format with sources
  const formattedMessages = useMemo((): HijraahChatMessage[] => {
    return messages.map((msg, index) => {
      const content = msg.parts
        ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("") || "";

      // Extract sources from message parts (source-url type)
      const messageSources = msg.parts
        ?.filter((part) => part.type === "source-url" || part.type === "source-document")
        .map((part) => {
          const p = part as any;
          return {
            id: p.sourceId || `source-${Math.random()}`,
            url: p.url || "",
            title: p.title || "",
            sourceType: p.type,
          };
        }) || [];

      // Extract suggestions (if any)
      let suggestions: string[] = [];
      const suggestionsMatch = content.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
      let cleanContent = content;

      if (suggestionsMatch) {
        try {
          suggestions = JSON.parse(suggestionsMatch[1]);
          cleanContent = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/, "").trim();
        } catch (e) {
          console.error("Failed to parse suggestions:", e);
        }
      }

      // For the last assistant message, prefer currentSources if available
      const isLastAssistant =
        msg.role === "assistant" &&
        index === messages.length - 1;

      const sources = messageSources.length > 0
        ? messageSources
        : (isLastAssistant && currentSources.length > 0 ? currentSources : undefined);

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: cleanContent,
        sources,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        createdAt: undefined as Date | undefined,
      };
    });
  }, [messages, currentSources]);

  return {
    messages: formattedMessages,
    rawMessages: messages,
    input,
    setInput,
    isLoading,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    currentSources,
  };
}
