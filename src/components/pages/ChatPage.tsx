"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { Logo } from "@/components/Logo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserProfile, TargetDestination } from "@/hooks/useUserProfile";

// Destination-aware default follow-up suggestions
const defaultFollowUps: Record<TargetDestination, { ar: string[]; en: string[] }> = {
  canada: {
    ar: ["المزيد من التفاصيل", "كيف أحسب نقاطي؟", "ما الخطوة التالية؟"],
    en: ["More details", "How do I calculate my score?", "What's the next step?"],
  },
  australia: {
    ar: ["المزيد من التفاصيل", "كيف أقدم للـ SkillSelect؟", "ما الخطوة التالية؟"],
    en: ["More details", "How do I apply to SkillSelect?", "What's the next step?"],
  },
  portugal: {
    ar: ["المزيد من التفاصيل", "ما المتطلبات المالية؟", "ما الخطوة التالية؟"],
    en: ["More details", "What are the financial requirements?", "What's the next step?"],
  },
  other: {
    ar: ["المزيد من التفاصيل", "كيف أبدأ؟", "ما الخطوة التالية؟"],
    en: ["More details", "How do I start?", "What's the next step?"],
  },
};

function getDefaultFollowUpSuggestions(destination: TargetDestination, language: 'ar' | 'en'): string[] {
  return defaultFollowUps[destination]?.[language] || defaultFollowUps.other[language];
}
import {
  listConversations,
  getConversationWithMessages,
  createNewConversation,
  deleteConversation,
  updateConversationTitleAction,
} from "@/actions/chat";
import { useHijraahChat, HijraahChatMessage } from "@/hooks/useHijraahChat";
import {
  MessageSquare,
  Plus,
  User,
  LogOut,
  Bot,
  StopCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Sidebar components
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Chat components (extracted for better maintainability)
import {
  ChatEmptyState,
  ChatTypingIndicator,
  CopyButton,
  ChatAppSidebar,
} from "@/components/chat";

// AI Elements Components
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { ChatLiveRegion } from "@/components/accessibility/ChatLiveRegion";
import { CRSScoreDisplay } from "@/components/artifacts/CRSScoreDisplay";
import { DocumentValidator } from "@/components/artifacts/DocumentValidator";
import { ComparisonTable } from "@/components/artifacts/ComparisonTable";

// Conversation scroll components
function ConversationScrollButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <Button
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg z-10"
      onClick={() => scrollToBottom()}
      size="sm"
      variant="outline"
    >
      <span className="mr-2">↓</span>
      New messages
    </Button>
  );
}

export default function ChatPage() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  
  // Fetch user profile for destination-aware UI
  const { targetDestination } = useUserProfile();

  const isNewChat = searchParams.get("new") === "true";
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(idParam ? parseInt(idParam) : null);
  const [editingConversationId, setEditingConversationId] = useState<
    number | null
  >(null);
  const [editTitle, setEditTitle] = useState("");
  const [responseLanguage, setResponseLanguage] = useState<
    "auto" | "ar" | "en"
  >("auto");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch conversations list from Server Action
  const { data: conversations, refetch: refetchConversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["chat", "list"],
    queryFn: listConversations,
  });

  // Fetch initial messages when conversation is selected
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ["chat", "get", selectedConversationId],
    queryFn: () =>
      getConversationWithMessages({ conversationId: selectedConversationId! }),
    enabled: selectedConversationId !== null,
  });

  // Use Vercel AI SDK for streaming chat
  const {
    messages: streamMessages,
    rawMessages,
    input,
    setInput,
    isLoading: isStreaming,
    status,
    sendMessage,
    stop,
    setMessages,
    currentSources,
  } = useHijraahChat({
    conversationId: selectedConversationId,
    language: language as "ar" | "en",
    onFinish: () => {
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["chat", "get", selectedConversationId],
        });
      }
      refetchConversations();
      // Delayed refetch to catch async title generation from server's after()
      // Title generation runs asynchronously after response stream ends
      setTimeout(() => {
        refetchConversations();
      }, 2000);
    },
    onError: error => {
      console.error("Chat error:", error);
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: createNewConversation,
    onSuccess: data => {
      setSelectedConversationId(data.conversationId);
      router.push(`/chat?id=${data.conversationId}`);
      refetchConversations();
      setMessages([]);
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      setSelectedConversationId(null);
      router.push("/chat");
      setMessages([]);
      refetchConversations();
    },
  });

  // Rename conversation mutation
  const renameConversationMutation = useMutation({
    mutationFn: updateConversationTitleAction,
    onSuccess: () => {
      setEditingConversationId(null);
      refetchConversations();
    },
  });

  // Sync selectedConversationId with URL param
  useEffect(() => {
    if (idParam) {
      const id = parseInt(idParam);
      if (!isNaN(id) && id !== selectedConversationId) {
        setSelectedConversationId(id);
      }
    }
  }, [idParam, selectedConversationId]);

  // Combine database messages with streaming messages
  const displayMessages = useCallback((): HijraahChatMessage[] => {
    const dbMessages: HijraahChatMessage[] = (
      conversationData?.messages || []
    ).map(msg => {
      const content = msg.content;
      let suggestions: string[] = [];
      const suggestionsMatch = content.match(
        /<suggestions>([\s\S]*?)<\/suggestions>/
      );
      let cleanContent = content;

      if (suggestionsMatch) {
        try {
          suggestions = JSON.parse(suggestionsMatch[1]);
          cleanContent = content
            .replace(/<suggestions>[\s\S]*?<\/suggestions>/, "")
            .trim();
        } catch (e) {
          console.error("Failed to parse suggestions in DB message:", e);
        }
      }

      return {
        id: String(msg.id),
        role: msg.role as "user" | "assistant",
        content: cleanContent,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        createdAt: new Date(msg.createdAt),
      };
    });

    if (streamMessages.length > 0) {
      const dbMessageIds = new Set(dbMessages.map(m => m.content));
      const newStreamMessages = streamMessages.filter(
        m => !dbMessageIds.has(m.content)
      );

      return [...dbMessages, ...newStreamMessages];
    }

    return dbMessages;
  }, [conversationData?.messages, streamMessages]);

  const handleNewChat = useCallback(() => {
    createConversationMutation.mutate({ language: language as "ar" | "en" });
  }, [createConversationMutation, language]);

  const handleSendMessage = async (messageText?: string) => {
    let text = messageText || input;
    if (!text.trim() || !selectedConversationId || isStreaming) return;

    // Append language instruction if not already handled and not auto
    if (!messageText && responseLanguage !== "auto") {
      if (responseLanguage === "ar") {
        text += "\n\n(Please answer in Arabic)";
      } else if (responseLanguage === "en") {
        text += "\n\n(Please answer in English)";
      }
    }

    await sendMessage(text);
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!selectedConversationId) {
      createConversationMutation.mutate(
        { language: language as "ar" | "en" },
        {
          onSuccess: () => {
            setTimeout(() => {
              handleSendMessage(suggestion);
            }, 100);
          },
        }
      );
    } else {
      setInput(suggestion);
      // Determine if we need to append language instruction
      let finalMessage = suggestion;
      if (responseLanguage === "ar") {
        finalMessage += "\n\n(Please answer in Arabic)";
      } else if (responseLanguage === "en") {
        finalMessage += "\n\n(Please answer in English)";
      }
      handleSendMessage(finalMessage);
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (
      confirm(
        language === "ar"
          ? "هل أنت متأكد من حذف هذه المحادثة؟"
          : "Are you sure you want to delete this conversation?"
      )
    ) {
      deleteConversationMutation.mutate({ conversationId: id });
    }
  };

  const handleRenameConversation = (
    e: React.MouseEvent,
    id: number,
    title: string
  ) => {
    e.stopPropagation();
    setEditingConversationId(id);
    setEditTitle(title);
  };

  const saveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConversationId && editTitle.trim()) {
      renameConversationMutation.mutate({
        conversationId: editingConversationId,
        title: editTitle.trim(),
      });
    }
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    // Show toast feedback to user
    const feedbackText =
      language === "ar"
        ? type === "up"
          ? "شكراً لملاحظاتك!"
          : "سنعمل على تحسين ذلك."
        : type === "up"
          ? "Thanks for your feedback!"
          : "We'll work on improving this.";

    toast.success(feedbackText, { duration: 2000 });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    if (
      (conversations &&
        conversations.length === 0 &&
        !createConversationMutation.isPending) ||
      (isNewChat &&
        !selectedConversationId &&
        !createConversationMutation.isPending)
    ) {
      handleNewChat();
    }
  }, [
    conversations,
    isNewChat,
    selectedConversationId,
    createConversationMutation.isPending,
    handleNewChat,
  ]);

  useEffect(() => {
    // Only auto-select if:
    // 1. We have conversations
    // 2. No conversation is currently selected
    // 3. The user did NOT explicitly ask for a new chat (via ?new=true)
    if (
      conversations &&
      conversations.length > 0 &&
      !selectedConversationId &&
      !isNewChat
    ) {
      setSelectedConversationId(conversations[0].id);
    }
    // If it IS a new chat request and we have no selected ID, ensure the UI reflects that (it should be null already)
  }, [conversations, selectedConversationId, isNewChat]);

  useEffect(() => {
    setMessages([]);
  }, [selectedConversationId, setMessages]);

  const allMessages = displayMessages();

  return (
    <SidebarProvider>
      <ChatLiveRegion messages={allMessages} isStreaming={isStreaming} />
      
      {/* Unified Sidebar using shadcn Sidebar */}
      <ChatAppSidebar
        conversations={conversations}
        conversationsLoading={conversationsLoading}
        selectedConversationId={selectedConversationId}
        language={language}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        editingConversationId={editingConversationId}
        editTitle={editTitle}
        isCreating={createConversationMutation.isPending}
        targetDestination={targetDestination}
        onSelectConversation={(id) => {
          setSelectedConversationId(id);
          router.push(`/chat?id=${id}`);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onEditTitleChange={setEditTitle}
        onSaveRename={saveRename}
        onCancelEdit={() => setEditingConversationId(null)}
      />

      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header */}
        <AppHeader
          leftSection={
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9" />
              <Logo />
            </div>
          }
          additionalActions={
            <Link href="/dashboard" className="hidden md:block">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
          }
          showUsage={false}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
        <div id="main-content" className="flex-1 flex flex-col min-w-0">
          {selectedConversationId ? (
            <>
              <StickToBottom
                className="flex-1 relative overflow-hidden"
                resize="smooth"
                initial="smooth"
              >
                <StickToBottom.Content className="flex flex-col gap-6 p-4 pb-6">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size={24} />
                    </div>
                  ) : allMessages.length === 0 ? (
                    <ChatEmptyState
                      language={language}
                      targetDestination={targetDestination}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  ) : (
                    <>
                      {allMessages.map((message, index) => (
                        <Message
                          key={message.id}
                          from={message.role}
                          className="group"
                        >
                          {message.role === "assistant" && (
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Reasoning indicator - shows during streaming for the last message */}
                                {isStreaming &&
                                  index === allMessages.length - 1 &&
                                  !message.content && (
                                    <Reasoning
                                      isStreaming={true}
                                      defaultOpen={true}
                                    >
                                      <ReasoningTrigger
                                        getThinkingMessage={streaming =>
                                          streaming
                                            ? language === "ar"
                                              ? "جاري التفكير..."
                                              : "Thinking..."
                                            : language === "ar"
                                              ? "تم التفكير"
                                              : "Thought process"
                                        }
                                      />
                                      <ReasoningContent>
                                        {language === "ar"
                                          ? "أقوم بتحليل سؤالك والبحث في قاعدة المعرفة..."
                                          : "Analyzing your question and searching the knowledge base..."}
                                      </ReasoningContent>
                                    </Reasoning>
                                  )}

                                {/* Chain of Thought - shows AI's thinking steps */}
                                {message.reasoning && !isStreaming && (
                                  <ChainOfThought className="mb-3">
                                    <ChainOfThoughtHeader>
                                      {language === "ar"
                                        ? "مسار التفكير"
                                        : "Chain of Thought"}
                                    </ChainOfThoughtHeader>
                                    <ChainOfThoughtContent>
                                      {Array.isArray(message.reasoning) ? (
                                        message.reasoning.map(
                                          (step: string, idx: number) => (
                                            <ChainOfThoughtStep
                                              key={idx}
                                              label={step}
                                              status="complete"
                                            />
                                          )
                                        )
                                      ) : (
                                        <ChainOfThoughtStep
                                          label={message.reasoning}
                                          status="complete"
                                        />
                                      )}
                                    </ChainOfThoughtContent>
                                  </ChainOfThought>
                                )}

                                <MessageContent className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                                  <MessageResponse>
                                    {message.content}
                                  </MessageResponse>
                                </MessageContent>

                                {/* AI Artifact Components - auto-render when data exists */}
                                <CRSScoreDisplay />
                                <DocumentValidator />
                                <ComparisonTable />

                                {/* Inline Citations - show if message has sources with URLs */}
                                {message.sources &&
                                  message.sources.length > 0 &&
                                  message.sources.some(s => s.url) && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {message.sources
                                        .filter(s => s.url)
                                        .slice(0, 3)
                                        .map(source => (
                                          <InlineCitation key={source.id}>
                                            <InlineCitationCard>
                                              <InlineCitationCardTrigger
                                                sources={[source.url]}
                                              />
                                              <InlineCitationCardBody>
                                                <InlineCitationSource
                                                  title={source.title}
                                                  url={source.url}
                                                  description={
                                                    source.relevance
                                                      ? `${source.relevance}% ${language === "ar" ? "صلة" : "relevant"}`
                                                      : undefined
                                                  }
                                                />
                                              </InlineCitationCardBody>
                                            </InlineCitationCard>
                                          </InlineCitation>
                                        ))}
                                    </div>
                                  )}

                                {/* Sources display - show if message has sources */}
                                {message.sources &&
                                  message.sources.length > 0 && (
                                    <div className="mt-2">
                                      <Sources>
                                        <SourcesTrigger
                                          count={message.sources.length}
                                        >
                                          <span className="font-medium text-xs">
                                            {language === "ar"
                                              ? `${message.sources.length} مصادر مستخدمة`
                                              : `${message.sources.length} sources used`}
                                          </span>
                                        </SourcesTrigger>
                                        <SourcesContent>
                                          {message.sources.map(source => (
                                            <Source
                                              key={source.id}
                                              href={source.url}
                                              title={source.title}
                                            >
                                              <span className="text-xs">
                                                {source.title}
                                                {source.relevance && (
                                                  <span className="text-muted-foreground ml-1">
                                                    ({source.relevance}%{" "}
                                                    {language === "ar"
                                                      ? "صلة"
                                                      : "relevant"}
                                                    )
                                                  </span>
                                                )}
                                              </span>
                                            </Source>
                                          ))}
                                        </SourcesContent>
                                      </Sources>
                                    </div>
                                  )}

                                {/* Show current sources while streaming */}
                                {isStreaming &&
                                  index === allMessages.length - 1 &&
                                  currentSources.length > 0 &&
                                  !message.sources && (
                                    <div className="mt-2">
                                      <Sources defaultOpen>
                                        <SourcesTrigger
                                          count={currentSources.length}
                                        >
                                          <span className="font-medium text-xs">
                                            {language === "ar"
                                              ? `${currentSources.length} مصادر مستخدمة`
                                              : `${currentSources.length} sources used`}
                                          </span>
                                        </SourcesTrigger>
                                        <SourcesContent>
                                          {currentSources.map(source => (
                                            <Source
                                              key={source.id}
                                              href={source.url}
                                              title={source.title}
                                            >
                                              <span className="text-xs">
                                                {source.title}
                                                {source.relevance && (
                                                  <span className="text-muted-foreground ml-1">
                                                    ({source.relevance}%{" "}
                                                    {language === "ar"
                                                      ? "صلة"
                                                      : "relevant"}
                                                    )
                                                  </span>
                                                )}
                                              </span>
                                            </Source>
                                          ))}
                                        </SourcesContent>
                                      </Sources>
                                    </div>
                                  )}

                                {/* Feedback Actions */}
                                {!isStreaming && (
                                  <div className="mt-2 flex items-center justify-end">
                                    <MessageActions>
                                      <MessageAction
                                        tooltip={
                                          language === "ar" ? "مفيد" : "Helpful"
                                        }
                                        onClick={() =>
                                          handleFeedback(message.id, "up")
                                        }
                                      >
                                        <ThumbsUp className="h-4 w-4" />
                                      </MessageAction>
                                      <MessageAction
                                        tooltip={
                                          language === "ar"
                                            ? "غير مفيد"
                                            : "Not helpful"
                                        }
                                        onClick={() =>
                                          handleFeedback(message.id, "down")
                                        }
                                      >
                                        <ThumbsDown className="h-4 w-4" />
                                      </MessageAction>
                                      <MessageAction
                                        tooltip={
                                          language === "ar" ? "نسخ" : "Copy"
                                        }
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            message.content
                                          )
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </MessageAction>
                                    </MessageActions>
                                  </div>
                                )}

                                <div className="flex items-center gap-1 mt-1">
                                  <CopyButton text={message.content} />
                                </div>
                              </div>
                            </div>
                          )}
                          {message.role === "user" && (
                            <div className="flex items-start gap-3 justify-end">
                              <div className="flex-1 min-w-0 flex flex-col items-end">
                                <MessageContent className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3">
                                  <p className="whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                </MessageContent>
                                <div className="flex items-center gap-1 mt-1">
                                  <CopyButton text={message.content} />
                                </div>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </Message>
                      ))}

                      {/* Show typing indicator when streaming and waiting for assistant response */}
                      {isStreaming &&
                        (allMessages.length === 0 ||
                          allMessages[allMessages.length - 1]?.role ===
                            "user") && <ChatTypingIndicator />}
                    </>
                  )}
                </StickToBottom.Content>

                <ConversationScrollButton />
              </StickToBottom>

              {allMessages.length > 0 && !isStreaming && (
                <div className="px-4 pb-2">
                  <Suggestions>
                    {// Use suggestions from the last assistant message if available
                    (allMessages[allMessages.length - 1].role === "assistant" &&
                    allMessages[allMessages.length - 1].suggestions
                      ? allMessages[allMessages.length - 1].suggestions
                      : getDefaultFollowUpSuggestions(targetDestination, language as 'ar' | 'en')
                    )?.map(suggestion => (
                      <Suggestion
                        key={suggestion}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    ))}
                  </Suggestions>
                </div>
              )}

              <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="max-w-3xl mx-auto">
                  <PromptInput
                    onSubmit={async ({ text }) => {
                      if (!text.trim() || isStreaming) return;
                      let finalText = text;
                      if (responseLanguage === "ar") {
                        finalText += "\n\n(Please answer in Arabic)";
                      } else if (responseLanguage === "en") {
                        finalText += "\n\n(Please answer in English)";
                      }
                      await sendMessage(finalText);
                    }}
                    className="rounded-2xl border bg-card shadow-sm"
                  >
                    <PromptInputTextarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={
                        language === "ar"
                          ? "اكتب رسالتك هنا..."
                          : "Type your message here..."
                      }
                      disabled={isStreaming}
                      className="min-h-[44px] text-base touch-manipulation"
                    />
                    <PromptInputFooter className="p-2">
                      <PromptInputTools>
                        <PromptInputButton
                          className={cn(
                            "h-10 w-10 touch-manipulation",
                            responseLanguage === "ar" &&
                              "text-primary bg-primary/10"
                          )}
                          onClick={() =>
                            setResponseLanguage(
                              responseLanguage === "ar" ? "auto" : "ar"
                            )
                          }
                          aria-label={
                            language === "ar"
                              ? "اطلب الإجابة بالعربية"
                              : "Ask for Arabic answer"
                          }
                        >
                          <span className="text-sm font-bold">ع</span>
                        </PromptInputButton>
                        <PromptInputButton
                          className={cn(
                            "h-10 w-10 touch-manipulation",
                            responseLanguage === "en" &&
                              "text-primary bg-primary/10"
                          )}
                          onClick={() =>
                            setResponseLanguage(
                              responseLanguage === "en" ? "auto" : "en"
                            )
                          }
                          aria-label={
                            language === "ar"
                              ? "اطلب الإجابة بالإنجليزية"
                              : "Ask for English answer"
                          }
                        >
                          <span className="text-sm font-bold">En</span>
                        </PromptInputButton>
                      </PromptInputTools>
                      {isStreaming ? (
                        <Button
                          type="button"
                          onClick={stop}
                          variant="destructive"
                          size="icon"
                          className="rounded-xl h-12 w-12 touch-manipulation"
                          aria-label={language === "ar" ? "إيقاف" : "Stop"}
                        >
                          <StopCircle className="h-5 w-5" />
                        </Button>
                      ) : (
                        <PromptInputSubmit
                          disabled={!input.trim()}
                          className="rounded-xl h-12 w-12 touch-manipulation"
                        />
                      )}
                    </PromptInputFooter>
                  </PromptInput>
                  <p className="text-xs text-muted-foreground text-center mt-2 hidden md:block">
                    {language === "ar"
                      ? "اضغط Enter للإرسال • Shift+Enter لسطر جديد"
                      : "Press Enter to send • Shift+Enter for new line"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "ar"
                    ? "لا توجد محادثة محددة"
                    : "No Conversation Selected"}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  {language === "ar"
                    ? "ابدأ محادثة جديدة للتحدث مع المساعد الذكي"
                    : "Start a new conversation to chat with the AI assistant"}
                </p>
                <Button onClick={handleNewChat} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  {language === "ar" ? "محادثة جديدة" : "New Chat"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  );
}
