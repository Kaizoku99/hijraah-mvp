"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { TargetDestination } from "@/hooks/useUserProfile";

interface Conversation {
  id: number;
  title: string | null;
}

interface ChatSidebarContextValue {
  // State
  conversations: Conversation[] | undefined;
  conversationsLoading: boolean;
  selectedConversationId: number | null;
  language: string;
  searchQuery: string;
  categoryFilter: string | null;
  editingConversationId: number | null;
  editTitle: string;
  isCreating: boolean;
  targetDestination: TargetDestination;

  // Actions
  setConversations: (conversations: Conversation[] | undefined) => void;
  setConversationsLoading: (loading: boolean) => void;
  setSelectedConversationId: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setEditingConversationId: (id: number | null) => void;
  setEditTitle: (title: string) => void;
  setIsCreating: (creating: boolean) => void;

  // Derived actions (to be provided by consumer)
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (e: React.MouseEvent, id: number) => void;
  onRenameConversation: (
    e: React.MouseEvent,
    id: number,
    title: string
  ) => void;
  onSaveRename: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextValue | undefined>(
  undefined
);

interface ChatSidebarProviderProps {
  children: React.ReactNode;
  language: string;
  targetDestination?: TargetDestination;
  // External state handlers
  conversations?: Conversation[];
  conversationsLoading?: boolean;
  selectedConversationId: number | null;
  isCreating?: boolean;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (e: React.MouseEvent, id: number) => void;
  onRenameConversation: (
    e: React.MouseEvent,
    id: number,
    title: string
  ) => void;
  onSaveRename: (e: React.FormEvent) => void;
}

export function ChatSidebarProvider({
  children,
  language,
  targetDestination = "canada",
  conversations,
  conversationsLoading = false,
  selectedConversationId,
  isCreating = false,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onSaveRename,
}: ChatSidebarProviderProps) {
  // Local sidebar state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<
    number | null
  >(null);
  const [editTitle, setEditTitle] = useState("");

  const handleCancelEdit = useCallback(() => {
    setEditingConversationId(null);
    setEditTitle("");
  }, []);

  const handleRenameConversation = useCallback(
    (e: React.MouseEvent, id: number, title: string) => {
      e.stopPropagation();
      setEditingConversationId(id);
      setEditTitle(title);
    },
    []
  );

  const handleSaveRename = useCallback(
    (e: React.FormEvent) => {
      onSaveRename(e);
      setEditingConversationId(null);
      setEditTitle("");
    },
    [onSaveRename]
  );

  const contextValue = useMemo<ChatSidebarContextValue>(
    () => ({
      // State
      conversations,
      conversationsLoading,
      selectedConversationId,
      language,
      searchQuery,
      categoryFilter,
      editingConversationId,
      editTitle,
      isCreating,
      targetDestination,

      // State setters (mostly for internal use)
      setConversations: () => {}, // Managed externally
      setConversationsLoading: () => {}, // Managed externally
      setSelectedConversationId: () => {}, // Managed externally
      setSearchQuery,
      setCategoryFilter,
      setEditingConversationId,
      setEditTitle,
      setIsCreating: () => {}, // Managed externally

      // Actions
      onSelectConversation,
      onNewChat,
      onDeleteConversation,
      onRenameConversation: handleRenameConversation,
      onSaveRename: handleSaveRename,
      onCancelEdit: handleCancelEdit,
    }),
    [
      conversations,
      conversationsLoading,
      selectedConversationId,
      language,
      searchQuery,
      categoryFilter,
      editingConversationId,
      editTitle,
      isCreating,
      targetDestination,
      onSelectConversation,
      onNewChat,
      onDeleteConversation,
      handleRenameConversation,
      handleSaveRename,
      handleCancelEdit,
    ]
  );

  return (
    <ChatSidebarContext.Provider value={contextValue}>
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error("useChatSidebar must be used within a ChatSidebarProvider");
  }
  return context;
}

// Export for type usage
export type { ChatSidebarContextValue, Conversation };
