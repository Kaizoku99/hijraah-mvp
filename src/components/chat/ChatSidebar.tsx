"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageSquare, Plus, Trash2, Pencil, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ai-elements/loader";
import PullToRefresh from "react-simple-pull-to-refresh";
import { TargetDestination, destinationConfig } from "@/hooks/useUserProfile";

interface Conversation {
  id: number;
  title: string | null;
}

interface ChatSidebarProps {
  conversations: Conversation[] | undefined;
  selectedConversationId: number | null;
  language: string;
  searchQuery: string;
  categoryFilter: string | null;
  editingConversationId: number | null;
  editTitle: string;
  isCreating: boolean;
  targetDestination?: TargetDestination;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (e: React.MouseEvent, id: number) => void;
  onRenameConversation: (
    e: React.MouseEvent,
    id: number,
    title: string
  ) => void;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  onEditTitleChange: (title: string) => void;
  onSaveRename: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onRefresh: () => Promise<void>;
  // Mobile-specific
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
}

// Helper to get categories based on destination
function getCategories(destination: TargetDestination = "canada") {
  return (
    destinationConfig[destination]?.categories ||
    destinationConfig.canada.categories
  );
}

/**
 * Sidebar content component used in both mobile Sheet and desktop aside.
 */
function SidebarContent({
  conversations,
  selectedConversationId,
  language,
  searchQuery,
  categoryFilter,
  editingConversationId,
  editTitle,
  isCreating,
  targetDestination = "canada",
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onSearchChange,
  onCategoryChange,
  onEditTitleChange,
  onSaveRename,
  onCancelEdit,
  onRefresh,
  isMobile = false,
  onMobileClose,
}: ChatSidebarProps & { isMobile?: boolean; onMobileClose?: () => void }) {
  // Get destination-aware categories
  const categories = getCategories(targetDestination);

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery.trim()) return true;
    const title = conv.title?.toLowerCase() || "";
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <div className={cn("p-3 border-b", isMobile && "")}>
        <Button
          onClick={() => {
            onNewChat();
            onMobileClose?.();
          }}
          className={cn(
            "w-full gap-2 rounded-xl",
            isMobile ? "h-11 touch-manipulation" : "h-11"
          )}
          disabled={isCreating}
        >
          {isCreating ? <Loader size={16} /> : <Plus className="h-4 w-4" />}
          {language === "ar" ? "محادثة جديدة" : "New Chat"}
        </Button>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              language === "ar"
                ? "بحث في المحادثات..."
                : "Search conversations..."
            }
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className={cn(
              "pl-9 rounded-xl",
              isMobile ? "h-11 touch-manipulation" : "h-10"
            )}
          />
        </div>
        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full transition-colors",
              isMobile && "min-h-[32px] touch-manipulation",
              categoryFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            {language === "ar" ? "الكل" : "All"}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() =>
                onCategoryChange(categoryFilter === cat.id ? null : cat.id)
              }
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1",
                isMobile && "min-h-[32px] touch-manipulation",
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              <Tag className="h-3 w-3" />
              {language === "ar" ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <PullToRefresh
          onRefresh={onRefresh}
          pullingContent={
            <div className="flex justify-center py-2">
              <Loader size={16} />
            </div>
          }
          refreshingContent={
            <div className="flex justify-center py-2">
              <Loader size={16} />
            </div>
          }
        >
          <div className="p-2 space-y-1">
            {filteredConversations?.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                  isMobile ? "min-h-[56px] touch-manipulation" : "min-h-[52px]",
                  selectedConversationId === conv.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-accent"
                )}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onMobileClose?.();
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "rounded-lg flex items-center justify-center shrink-0",
                      isMobile ? "h-10 w-10" : "h-9 w-9",
                      selectedConversationId === conv.id
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}
                  >
                    <MessageSquare
                      className={isMobile ? "h-5 w-5" : "h-4 w-4"}
                    />
                  </div>
                  {editingConversationId === conv.id ? (
                    <form
                      onSubmit={onSaveRename}
                      className="flex-1 min-w-0 flex items-center gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => onEditTitleChange(e.target.value)}
                        onBlur={onCancelEdit}
                        className="flex-1 bg-background border rounded px-2 py-1 text-sm h-8 min-w-0"
                      />
                      <button type="submit" className="hidden" />
                    </form>
                  ) : (
                    <span className="text-sm truncate">
                      {conv.title ||
                        (language === "ar" ? "محادثة جديدة" : "New Chat")}
                    </span>
                  )}
                </div>
                {!isMobile && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {!editingConversationId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={e =>
                          onRenameConversation(e, conv.id, conv.title || "")
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={e => onDeleteConversation(e, conv.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </PullToRefresh>
      </ScrollArea>
    </>
  );
}

/**
 * Mobile sidebar using Sheet component.
 */
export function ChatMobileSidebar(props: ChatSidebarProps) {
  const { sidebarOpen, onSidebarClose, language, ...rest } = props;

  return (
    <Sheet open={sidebarOpen} onOpenChange={onSidebarClose}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>
            {language === "ar" ? "المحادثات" : "Conversations"}
          </SheetTitle>
        </SheetHeader>
        <SidebarContent
          {...rest}
          language={language}
          isMobile={true}
          onMobileClose={onSidebarClose}
        />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Desktop sidebar component.
 */
export function ChatDesktopSidebar(props: ChatSidebarProps) {
  return (
    <aside className="hidden md:flex w-72 border-r bg-muted/30 flex-col">
      <SidebarContent {...props} isMobile={false} />
    </aside>
  );
}
