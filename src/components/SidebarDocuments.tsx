"use client";

import { useQuery } from "@tanstack/react-query";
import { getChecklists } from "@/actions/documents";
import { queryKeys } from "@/lib/query-keys";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileWarning, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface ChecklistItem {
    id: string;
    title: string;
    status: "pending" | "uploaded" | "verified" | "rejected";
    titleAr?: string;
}

export function SidebarDocuments() {
    const router = useRouter();

    const { data: checklists, isLoading } = useQuery({
        queryKey: queryKeys.documents.checklists(),
        queryFn: async () => await getChecklists(),
    });

    // Get the first active checklist for now
    // In a real app we might want to let the user switch between checklists
    const activeChecklist = checklists && checklists.length > 0 ? checklists[0] : null;
    const items = activeChecklist ? (activeChecklist.items as ChecklistItem[]) : [];

    // Filter for pending items to show in the "Required" section
    const pendingItems = items.filter((item) => item.status === "pending" || item.status === "rejected");

    if (isLoading) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>Required Documents</SidebarGroupLabel>
                <SidebarGroupContent>
                    <div className="space-y-2 px-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (!activeChecklist || pendingItems.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="flex items-center justify-between">
                <span>Required Documents</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {pendingItems.length}
                </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {pendingItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                onClick={() => router.push(`/documents/ocr`)}
                                className="text-muted-foreground hover:text-foreground"
                                title={item.title}
                            >
                                {item.status === "rejected" ? (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                    <FileWarning className="h-4 w-4 text-amber-500/70" />
                                )}
                                <span className="truncate">{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
