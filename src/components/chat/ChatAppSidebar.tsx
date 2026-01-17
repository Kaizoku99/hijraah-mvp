"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  MoreHorizontal,
  MessageSquare,
  Plus,
  Trash2,
  Pencil,
  Search,
  Tag,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ai-elements/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TargetDestination, destinationConfig } from "@/hooks/useUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: number;
  title: string | null;
}

interface ChatAppSidebarProps {
  conversations: Conversation[] | undefined;
  conversationsLoading?: boolean;
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
}

// Helper to get categories based on destination
function getCategories(destination: TargetDestination) {
  return (
    destinationConfig[destination]?.categories ||
    destinationConfig.canada.categories
  );
}

export function ChatAppSidebar({
  conversations,
  conversationsLoading,
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
}: ChatAppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Get destination-aware categories
  const categories = getCategories(targetDestination);
  const destConfig = destinationConfig[targetDestination];

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery.trim()) return true;
    const title = conv.title?.toLowerCase() || "";
    return title.includes(searchQuery.toLowerCase());
  });

  const handleConversationClick = (id: number) => {
    onSelectConversation(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader
        className={cn(
          "p-3",
          isCollapsed && "flex items-center justify-center p-2"
        )}
      >
        {!isCollapsed && (
          <span className="font-semibold text-sm mb-2">
            {language === "ar" ? "المحادثات" : "Conversations"}
          </span>
        )}

        <Button
          onClick={handleNewChatClick}
          className={cn(
            "gap-2 rounded-xl transition-all",
            isCollapsed ? "h-9 w-9 p-0" : "w-full h-10"
          )}
          disabled={isCreating}
          size={isCollapsed ? "icon" : "default"}
        >
          {isCreating ? (
            <Loader size={16} />
          ) : (
            <Plus className="h-4 w-4 shrink-0" />
          )}
          {!isCollapsed && (language === "ar" ? "محادثة جديدة" : "New Chat")}
        </Button>

        {!isCollapsed && (
          <>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-9 h-9 rounded-xl text-sm"
              />
            </div>

            {/* Destination Indicator */}
            <div className="flex items-center gap-2 mt-2 px-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? destConfig.nameAr : destConfig.nameEn}{" "}
                {destConfig.flag}
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                onClick={() => onCategoryChange(null)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
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
                    "text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
                    categoryFilter === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {language === "ar" ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <ScrollArea className="h-full">
              <SidebarMenu className="px-2 py-1">
                {conversationsLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                ) : filteredConversations?.length === 0 ? (
                  <div
                    className={cn(
                      "text-center py-8 text-muted-foreground text-sm",
                      isCollapsed && "hidden"
                    )}
                  >
                    {language === "ar" ? "لا توجد محادثات" : "No conversations"}
                  </div>
                ) : (
                  filteredConversations?.map(conv => (
                    <SidebarMenuItem key={conv.id} className="group/item">
                      {editingConversationId === conv.id ? (
                        <form
                          onSubmit={onSaveRename}
                          className="flex-1 px-2 py-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={e => onEditTitleChange(e.target.value)}
                            onBlur={onCancelEdit}
                            className="h-8 text-sm"
                          />
                        </form>
                      ) : (
                        <>
                          <SidebarMenuButton
                            onClick={() => handleConversationClick(conv.id)}
                            isActive={selectedConversationId === conv.id}
                            tooltip={
                              isCollapsed
                                ? conv.title ||
                                (language === "ar"
                                  ? "محادثة جديدة"
                                  : "New Chat")
                                : undefined
                            }
                            className={cn(
                              "rounded-lg transition-all",
                              selectedConversationId === conv.id &&
                              "bg-primary/10"
                            )}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {conv.title ||
                                (language === "ar"
                                  ? "محادثة جديدة"
                                  : "New Chat")}
                            </span>
                          </SidebarMenuButton>

                          {!isCollapsed && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More</span>
                                </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                className="w-48"
                              >
                                <DropdownMenuItem
                                  onClick={e =>
                                    onRenameConversation(
                                      e,
                                      conv.id,
                                      conv.title || ""
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {language === "ar"
                                      ? "إعادة تسمية"
                                      : "Rename"}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={e =>
                                    onDeleteConversation(e, conv.id)
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>
                                    {language === "ar" ? "حذف" : "Delete"}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("p-3", isCollapsed && "p-2")}>
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center">
            {language === "ar"
              ? `${conversations?.length || 0} محادثة`
              : `${conversations?.length || 0} conversations`}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export { useSidebar };
