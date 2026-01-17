"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardSummaryAction,
  completeMilestoneAction,
  completeDeadlineAction,
  deleteDeadlineAction,
  createDeadlineAction,
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/applications";
import type { DashboardSummary, Notification } from "@/components/application-tracker/types";

export const APPLICATION_TRACKER_KEYS = {
  all: ["application-tracker"] as const,
  summary: () => [...APPLICATION_TRACKER_KEYS.all, "summary"] as const,
  notifications: () => [...APPLICATION_TRACKER_KEYS.all, "notifications"] as const,
};

export function useApplicationTracker() {
  const queryClient = useQueryClient();

  // Fetch dashboard summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: APPLICATION_TRACKER_KEYS.summary(),
    queryFn: async () => {
      const result = await getDashboardSummaryAction();
      return result as DashboardSummary;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch notifications
  const {
    data: notifications,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: APPLICATION_TRACKER_KEYS.notifications(),
    queryFn: async () => {
      const result = await getNotificationsAction(20);
      return result as Notification[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Complete milestone mutation
  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: number) => {
      await completeMilestoneAction(milestoneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Complete deadline mutation
  const completeDeadlineMutation = useMutation({
    mutationFn: async (deadlineId: number) => {
      await completeDeadlineAction(deadlineId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Delete deadline mutation
  const deleteDeadlineMutation = useMutation({
    mutationFn: async (deadlineId: number) => {
      await deleteDeadlineAction(deadlineId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Create deadline mutation
  const createDeadlineMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      title: string;
      titleAr?: string;
      description?: string;
      descriptionAr?: string;
      dueDate: string;
      applicationId?: number;
      documentId?: number;
    }) => {
      await createDeadlineAction({
        type: data.type as any,
        title: data.title,
        titleAr: data.titleAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
        dueDate: data.dueDate,
        applicationId: data.applicationId,
        documentId: data.documentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await markNotificationAsReadAction(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.notifications() });
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Mark all notifications as read mutation
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      await markAllNotificationsAsReadAction();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.notifications() });
      queryClient.invalidateQueries({ queryKey: APPLICATION_TRACKER_KEYS.summary() });
    },
  });

  // Handler functions
  const handleCompleteMilestone = useCallback(async (milestoneId: number) => {
    await completeMilestoneMutation.mutateAsync(milestoneId);
  }, [completeMilestoneMutation]);

  const handleCompleteDeadline = useCallback(async (deadlineId: number) => {
    await completeDeadlineMutation.mutateAsync(deadlineId);
  }, [completeDeadlineMutation]);

  const handleDeleteDeadline = useCallback(async (deadlineId: number) => {
    await deleteDeadlineMutation.mutateAsync(deadlineId);
  }, [deleteDeadlineMutation]);

  const handleCreateDeadline = useCallback(async (data: {
    type: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    dueDate: string;
    applicationId?: number;
    documentId?: number;
  }) => {
    await createDeadlineMutation.mutateAsync(data);
  }, [createDeadlineMutation]);

  const handleMarkNotificationRead = useCallback(async (notificationId: number) => {
    await markNotificationReadMutation.mutateAsync(notificationId);
  }, [markNotificationReadMutation]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    await markAllNotificationsReadMutation.mutateAsync();
  }, [markAllNotificationsReadMutation]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchSummary(),
      refetchNotifications(),
    ]);
  }, [refetchSummary, refetchNotifications]);

  return {
    // Data
    summary: summary || null,
    notifications: notifications || [],
    unreadNotificationCount: summary?.unreadNotificationCount || 0,

    // Loading states
    isLoading: summaryLoading || notificationsLoading,
    isMutating: 
      completeMilestoneMutation.isPending ||
      completeDeadlineMutation.isPending ||
      deleteDeadlineMutation.isPending ||
      createDeadlineMutation.isPending ||
      markNotificationReadMutation.isPending ||
      markAllNotificationsReadMutation.isPending,

    // Error states
    error: summaryError,

    // Handlers
    completeMilestone: handleCompleteMilestone,
    completeDeadline: handleCompleteDeadline,
    deleteDeadline: handleDeleteDeadline,
    createDeadline: handleCreateDeadline,
    markNotificationRead: handleMarkNotificationRead,
    markAllNotificationsRead: handleMarkAllNotificationsRead,
    refresh: handleRefresh,
  };
}
