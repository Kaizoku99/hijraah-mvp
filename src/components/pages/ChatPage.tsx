'use client'

'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversations,
  getConversationWithMessages,
  createNewConversation,
  deleteConversation
} from "@/actions/chat";
import { useHijraahChat, HijraahChatMessage, ChatSource } from "@/hooks/useHijraahChat";
import {
  MessageSquare,
  Plus,
  User,
  LogOut,
  Trash2,
  Bot,
  Send,
  StopCircle,
  Sparkles,
  FileText,
  Calculator,
  Globe,
  Menu,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "@/lib/utils";

// AI Elements Components
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
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

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// Empty state for new conversations
function ConversationEmptyState({
  language,
  onSuggestionClick
}: {
  language: string;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const suggestions = language === "ar" ? [
    { icon: Calculator, text: "كيف يمكنني حساب نقاط CRS الخاصة بي؟" },
    { icon: FileText, text: "ما هي المستندات المطلوبة للتقديم على Express Entry؟" },
    { icon: Globe, text: "ما هي خياراتي للهجرة إلى كندا؟" },
    { icon: Sparkles, text: "كيف يمكنني تحسين نقاطي في Express Entry؟" },
  ] : [
    { icon: Calculator, text: "How can I calculate my CRS score?" },
    { icon: FileText, text: "What documents do I need for Express Entry?" },
    { icon: Globe, text: "What are my options to immigrate to Canada?" },
    { icon: Sparkles, text: "How can I improve my Express Entry score?" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-4 border-background" />
      </div>

      <h3 className="text-2xl font-bold mb-2 text-center">
        {language === "ar" ? "مرحباً! أنا مساعدك للهجرة" : "Hi! I'm your Immigration Assistant"}
      </h3>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        {language === "ar"
          ? "يمكنني مساعدتك في أسئلة الهجرة إلى كندا، حسابات CRS، والمزيد."
          : "I can help you with Canada immigration questions, CRS calculations, document requirements, and more."}
      </p>

      <div className="w-full max-w-2xl">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          {language === "ar" ? "جرب أحد هذه الأسئلة:" : "Try one of these questions:"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <suggestion.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chat input component
function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  language: string;
}) {
  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 p-2 rounded-2xl border bg-card shadow-sm">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (value.trim() && !isStreaming) {
                  onSend();
                }
              }
            }}
            placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Type your message here..."}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent border-0 outline-none focus:ring-0 px-3 py-2 max-h-32 min-h-[44px] text-sm placeholder:text-muted-foreground"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />

          {isStreaming ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="rounded-xl h-10 w-10 flex-shrink-0"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={!value.trim()}
              size="icon"
              className="rounded-xl h-10 w-10 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {language === "ar"
            ? "اضغط Enter للإرسال • Shift+Enter لسطر جديد"
            : "Press Enter to send • Shift+Enter for new line"}
        </p>
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Loader size={14} />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    idParam ? parseInt(idParam) : null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  // Fetch conversations list from Server Action
  const { data: conversations, refetch: refetchConversations } = useQuery({
    queryKey: ['chat', 'list'],
    queryFn: listConversations,
  });

  // Fetch initial messages when conversation is selected
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['chat', 'get', selectedConversationId],
    queryFn: () => getConversationWithMessages({ conversationId: selectedConversationId! }),
    enabled: selectedConversationId !== null,
  });

  // Use Vercel AI SDK for streaming chat
  const {
    messages: streamMessages,
    input,
    setInput,
    isLoading: isStreaming,
    sendMessage,
    stop,
    setMessages,
    currentSources,
  } = useHijraahChat({
    conversationId: selectedConversationId,
    language: language as "ar" | "en",
    onFinish: () => {
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'get', selectedConversationId] });
      }
      refetchConversations();
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: createNewConversation,
    onSuccess: (data) => {
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

  // Sync selectedConversationId with URL param
  useEffect(() => {
    if (idParam) {
      const id = parseInt(idParam);
      if (!isNaN(id) && id !== selectedConversationId) {
        setSelectedConversationId(id);
      }
    }
  }, [idParam, selectedConversationId]);

  // Debug logging
  console.log("[ChatPage] isStreaming:", isStreaming, "streamMessages:", streamMessages.length, "conversationData:", conversationData?.messages?.length);

  // Combine database messages with streaming messages
  const displayMessages = useCallback((): HijraahChatMessage[] => {
    const dbMessages: HijraahChatMessage[] = (conversationData?.messages || []).map((msg) => ({
      id: String(msg.id),
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    }));

    console.log("[ChatPage] displayMessages - dbMessages:", dbMessages.length, "streamMessages:", streamMessages.length);

    if (streamMessages.length > 0) {
      const dbMessageIds = new Set(dbMessages.map(m => m.content));
      const newStreamMessages = streamMessages.filter(
        m => !dbMessageIds.has(m.content)
      );
      console.log("[ChatPage] New stream messages:", newStreamMessages.length);
      return [...dbMessages, ...newStreamMessages];
    }

    return dbMessages;
  }, [conversationData?.messages, streamMessages]);

  const handleNewChat = () => {
    createConversationMutation.mutate({ language: language as "ar" | "en" });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || !selectedConversationId || isStreaming) return;
    await sendMessage(text);
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!selectedConversationId) {
      createConversationMutation.mutate({ language: language as "ar" | "en" }, {
        onSuccess: () => {
          setTimeout(() => {
            handleSendMessage(suggestion);
          }, 100);
        }
      });
    } else {
      setInput(suggestion);
      handleSendMessage(suggestion);
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm(language === "ar" ? "هل أنت متأكد من حذف هذه المحادثة؟" : "Are you sure you want to delete this conversation?")) {
      deleteConversationMutation.mutate({ conversationId: id });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    if (conversations && conversations.length === 0 && !createConversationMutation.isPending) {
      handleNewChat();
    }
  }, [conversations]);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    setMessages([]);
  }, [selectedConversationId, setMessages]);

  const allMessages = displayMessages();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {language === "ar" ? "هجرة" : "Hijraah"}
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
            <LanguageToggle />
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "border-r bg-muted/30 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 md:w-72",
          "md:relative absolute inset-y-0 left-0 z-40 md:z-0"
        )}>
          <div className="p-3 border-b">
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 rounded-xl"
              disabled={createConversationMutation.isPending}
            >
              {createConversationMutation.isPending ? (
                <Loader size={16} />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {language === "ar" ? "محادثة جديدة" : "New Chat"}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                    selectedConversationId === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent"
                  )}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    router.push(`/chat?id=${conv.id}`);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedConversationId === conv.id
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}>
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-sm truncate">
                      {conv.title || (language === "ar" ? "محادثة جديدة" : "New Chat")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg"
                    onClick={(e) => {
                      handleDeleteConversation(e, conv.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversationId ? (
            <>
              <StickToBottom className="flex-1 relative overflow-hidden" resize="smooth" initial="smooth">
                <StickToBottom.Content className="flex flex-col gap-6 p-4 pb-6">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size={24} />
                    </div>
                  ) : allMessages.length === 0 ? (
                    <ConversationEmptyState
                      language={language}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  ) : (
                    <>
                      {allMessages.map((message, index) => (
                        <Message key={message.id} from={message.role} className="group">
                          {message.role === "assistant" && (
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Reasoning indicator - shows during streaming for the last message */}
                                {isStreaming && index === allMessages.length - 1 && !message.content && (
                                  <Reasoning isStreaming={true} defaultOpen={true}>
                                    <ReasoningTrigger
                                      getThinkingMessage={(streaming) =>
                                        streaming
                                          ? (language === "ar" ? "جاري التفكير..." : "Thinking...")
                                          : (language === "ar" ? "تم التفكير" : "Thought process")
                                      }
                                    />
                                    <ReasoningContent>
                                      {language === "ar"
                                        ? "أقوم بتحليل سؤالك والبحث في قاعدة المعرفة..."
                                        : "Analyzing your question and searching the knowledge base..."}
                                    </ReasoningContent>
                                  </Reasoning>
                                )}

                                <MessageContent className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                                  <MessageResponse>{message.content}</MessageResponse>
                                </MessageContent>

                                {/* Sources display - show if message has sources */}
                                {message.sources && message.sources.length > 0 && (
                                  <div className="mt-2">
                                    <Sources>
                                      <SourcesTrigger count={message.sources.length}>
                                        <span className="font-medium text-xs">
                                          {language === "ar"
                                            ? `${message.sources.length} مصادر مستخدمة`
                                            : `${message.sources.length} sources used`}
                                        </span>
                                      </SourcesTrigger>
                                      <SourcesContent>
                                        {message.sources.map((source) => (
                                          <Source
                                            key={source.id}
                                            href={source.url}
                                            title={source.title}
                                          >
                                            <span className="text-xs">
                                              {source.title}
                                              {source.relevance && (
                                                <span className="text-muted-foreground ml-1">
                                                  ({source.relevance}% {language === "ar" ? "صلة" : "relevant"})
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
                                {isStreaming && index === allMessages.length - 1 && currentSources.length > 0 && !message.sources && (
                                  <div className="mt-2">
                                    <Sources defaultOpen>
                                      <SourcesTrigger count={currentSources.length}>
                                        <span className="font-medium text-xs">
                                          {language === "ar"
                                            ? `${currentSources.length} مصادر مستخدمة`
                                            : `${currentSources.length} sources used`}
                                        </span>
                                      </SourcesTrigger>
                                      <SourcesContent>
                                        {currentSources.map((source) => (
                                          <Source
                                            key={source.id}
                                            href={source.url}
                                            title={source.title}
                                          >
                                            <span className="text-xs">
                                              {source.title}
                                              {source.relevance && (
                                                <span className="text-muted-foreground ml-1">
                                                  ({source.relevance}% {language === "ar" ? "صلة" : "relevant"})
                                                </span>
                                              )}
                                            </span>
                                          </Source>
                                        ))}
                                      </SourcesContent>
                                    </Sources>
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
                                  <p className="whitespace-pre-wrap">{message.content}</p>
                                </MessageContent>
                                <div className="flex items-center gap-1 mt-1">
                                  <CopyButton text={message.content} />
                                </div>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </Message>
                      ))}

                      {isStreaming && streamMessages.length === 0 && (
                        <TypingIndicator />
                      )}
                    </>
                  )}
                </StickToBottom.Content>

                <ConversationScrollButton />
              </StickToBottom>

              {allMessages.length > 0 && !isStreaming && (
                <div className="px-4 pb-2">
                  <Suggestions>
                    {(language === "ar"
                      ? ["المزيد من التفاصيل", "كيف أبدأ؟", "ما الخطوة التالية؟"]
                      : ["More details", "How do I start?", "What's the next step?"]
                    ).map((suggestion) => (
                      <Suggestion
                        key={suggestion}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    ))}
                  </Suggestions>
                </div>
              )}

              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => handleSendMessage()}
                onStop={stop}
                isStreaming={isStreaming}
                language={language}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "ar" ? "لا توجد محادثة محددة" : "No Conversation Selected"}
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
    </div>
  );
}

