import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare,
  Send,
  Plus,
  Loader2,
  User,
  LogOut,
  Trash2,
  Bot,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

export default function Chat() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.list.useQuery();
  const { data: conversationData, isLoading: conversationLoading } = trpc.chat.get.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: selectedConversationId !== null }
  );

  const createConversation = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      refetchConversations();
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      // Refetch conversation to get new messages
      if (selectedConversationId) {
        trpc.useUtils().chat.get.invalidate({ conversationId: selectedConversationId });
      }
    },
  });

  const deleteConversation = trpc.chat.delete.useMutation({
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConversations();
    },
  });

  const handleNewChat = () => {
    createConversation.mutate({ language: language as "ar" | "en" });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    sendMessage.mutate({
      conversationId: selectedConversationId,
      content: messageInput,
    });
  };

  const handleDeleteConversation = (conversationId: number) => {
    if (confirm(language === "ar" ? "هل تريد حذف هذه المحادثة؟" : "Delete this conversation?")) {
      deleteConversation.mutate({ conversationId });
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  // Create first conversation if none exist
  useEffect(() => {
    if (conversations && conversations.length === 0 && !createConversation.isPending) {
      handleNewChat();
    }
  }, [conversations]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {language === "ar" ? "هجرة" : "Hijraah"}
              </h1>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
            <LanguageToggle />
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.profile")}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Conversations List */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <Button onClick={handleNewChat} className="w-full gap-2" disabled={createConversation.isPending}>
              {createConversation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("chat.newChat")}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    selectedConversationId === conv.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {conv.title || (language === "ar" ? "محادثة جديدة" : "New Chat")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="max-w-3xl mx-auto space-y-4">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversationData?.messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        {language === "ar" ? "ابدأ محادثة جديدة" : "Start a New Conversation"}
                      </h3>
                      <p className="text-muted-foreground">
                        {t("chat.placeholder")}
                      </p>
                    </div>
                  ) : (
                    conversationData?.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                        <Card
                          className={`max-w-[80%] ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <CardContent className="p-3">
                            {message.role === "assistant" ? (
                              <Streamdown>{message.content}</Streamdown>
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </CardContent>
                        </Card>
                        {message.role === "user" && (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {sendMessage.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <Card className="bg-muted">
                        <CardContent className="p-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t("chat.placeholder")}
                    disabled={sendMessage.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessage.isPending}
                    className="gap-2"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{t("common.send")}</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "ar" ? "لا توجد محادثة محددة" : "No Conversation Selected"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === "ar"
                    ? "ابدأ محادثة جديدة للتحدث مع المساعد الذكي"
                    : "Start a new conversation to chat with the AI assistant"}
                </p>
                <Button onClick={handleNewChat} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("chat.newChat")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
