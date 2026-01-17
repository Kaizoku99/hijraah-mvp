"use client";

import { useState } from "react";
import { 
  Bell,
  BellOff,
  Calendar,
  TrendingUp,
  FileWarning,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification, NotificationType } from "./types";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead?: (notificationId: number) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  isLoading?: boolean;
}

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  deadline_reminder: Calendar,
  draw_result: TrendingUp,
  policy_change: AlertCircle,
  document_expiry: FileWarning,
  milestone_completed: CheckCircle,
  application_update: Bell,
  tip: Lightbulb,
};

const typeColors: Record<NotificationType, string> = {
  deadline_reminder: "text-orange-500",
  draw_result: "text-blue-500",
  policy_change: "text-red-500",
  document_expiry: "text-red-500",
  milestone_completed: "text-green-500",
  application_update: "text-purple-500",
  tip: "text-yellow-500",
};

function formatTimeAgo(date: Date, language: string): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return language === "ar" ? "الآن" : "Just now";
  }
  if (diffMins < 60) {
    return language === "ar" 
      ? `منذ ${diffMins} دقيقة` 
      : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return language === "ar" 
      ? `منذ ${diffHours} ساعة` 
      : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return language === "ar" 
      ? `منذ ${diffDays} يوم` 
      : `${diffDays}d ago`;
  }
  return new Date(date).toLocaleDateString(
    language === "ar" ? "ar-SA" : "en-US",
    { month: "short", day: "numeric" }
  );
}

export function NotificationCenter({ 
  notifications, 
  unreadCount,
  onMarkAsRead, 
  onMarkAllAsRead,
  onNotificationClick,
  isLoading = false,
}: NotificationCenterProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [open, setOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) {
      setMarkingAllRead(true);
      try {
        await onMarkAllAsRead();
      } finally {
        setMarkingAllRead(false);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={language === "ar" ? "الإشعارات" : "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align={isRtl ? "start" : "end"}
        sideOffset={8}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          isRtl && "flex-row-reverse"
        )}>
          <h3 className="font-semibold">
            {language === "ar" ? "الإشعارات" : "Notifications"}
          </h3>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead || isLoading}
            >
              {markingAllRead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              {language === "ar" ? "قراءة الكل" : "Mark all read"}
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === "ar" 
                  ? "لا توجد إشعارات" 
                  : "No notifications"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type];
                const iconColor = typeColors[notification.type];

                return (
                  <button
                    key={notification.id}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/5",
                      isRtl && "text-right"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn(
                      "flex gap-3",
                      isRtl && "flex-row-reverse"
                    )}>
                      {/* Icon */}
                      <div className={cn("shrink-0 mt-0.5", iconColor)}>
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "flex items-center gap-2 mb-1",
                          isRtl && "flex-row-reverse justify-end"
                        )}>
                          <p className={cn(
                            "font-medium text-sm truncate",
                            !notification.isRead && "text-primary"
                          )}>
                            {language === "ar" && notification.titleAr 
                              ? notification.titleAr 
                              : notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {language === "ar" && notification.messageAr 
                            ? notification.messageAr 
                            : notification.message}
                        </p>
                        <div className={cn(
                          "flex items-center gap-2 mt-1",
                          isRtl && "flex-row-reverse justify-end"
                        )}>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.createdAt, language)}
                          </span>
                          {notification.link && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
