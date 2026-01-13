import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { usageTracking, InsertUsageTracking } from "../drizzle/schema";
import { SUBSCRIPTION_TIERS, getTierById } from "./stripe-products";

/**
 * Get or create usage tracking for the current month
 */
export async function getOrCreateMonthlyUsage(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Try to find existing usage for this period
  const existing = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        gte(usageTracking.periodStart, periodStart),
        lte(usageTracking.periodEnd, periodEnd)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new usage tracking for this period
  const newUsage: InsertUsageTracking = {
    userId,
    chatMessagesCount: 0,
    sopGenerationsCount: 0,
    documentUploadsCount: 0,
    crsCalculationsCount: 0,
    periodStart,
    periodEnd,
  };

  const result = await db.insert(usageTracking).values(newUsage).returning();
  return result[0];
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  userId: number,
  type: "chat" | "sop" | "document" | "crs"
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const usage = await getOrCreateMonthlyUsage(userId);

  const updateField = {
    chat: "chatMessagesCount" as const,
    sop: "sopGenerationsCount" as const,
    document: "documentUploadsCount" as const,
    crs: "crsCalculationsCount" as const,
  }[type];

  await db
    .update(usageTracking)
    .set({
      [updateField]: (usage[updateField] || 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(usageTracking.id, usage.id));
}

/**
 * Check if user can perform action based on their tier limits
 */
export async function checkUsageLimit(
  userId: number,
  subscriptionTier: string,
  type: "chat" | "sop" | "document" | "crs"
): Promise<{ allowed: boolean; remaining: number | "unlimited"; limit: number | "unlimited"; reason?: string }> {
  const tier = getTierById(subscriptionTier || "free");
  if (!tier) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const limitMap: Record<string, number | "unlimited"> = {
    chat: tier.limits.chatMessages,
    sop: tier.limits.sopGenerations,
    document: tier.limits.documentChecklists,
    crs: tier.limits.crsCalculations,
  };

  const limit = limitMap[type];

  // Unlimited access
  if (limit === "unlimited") {
    return { allowed: true, remaining: "unlimited", limit: "unlimited" };
  }

  // No access
  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  // Check current usage
  const usage = await getOrCreateMonthlyUsage(userId);

  const usageField = {
    chat: usage.chatMessagesCount,
    sop: usage.sopGenerationsCount,
    document: usage.documentUploadsCount,
    crs: usage.crsCalculationsCount,
  }[type];

  const currentUsage = usageField || 0;
  const remaining = Math.max(0, (limit as number) - currentUsage);
  const allowed = remaining > 0;
  const reason = allowed ? undefined : `Monthly limit reached for ${type}`;

  return { allowed, remaining, limit: limit as number, reason };
}

/**
 * Get usage stats for a user
 */
export async function getUserUsageStats(userId: number, subscriptionTier: string) {
  const usage = await getOrCreateMonthlyUsage(userId);
  const tier = getTierById(subscriptionTier || "free");

  if (!tier) {
    return null;
  }

  return {
    chat: {
      used: usage.chatMessagesCount,
      limit: tier.limits.chatMessages,
      remaining: tier.limits.chatMessages === "unlimited"
        ? "unlimited"
        : Math.max(0, (tier.limits.chatMessages as number) - usage.chatMessagesCount),
    },
    sop: {
      used: usage.sopGenerationsCount,
      limit: tier.limits.sopGenerations,
      remaining: tier.limits.sopGenerations === 999
        ? "unlimited"
        : Math.max(0, tier.limits.sopGenerations - usage.sopGenerationsCount),
    },
    document: {
      used: usage.documentUploadsCount,
      limit: tier.limits.documentChecklists,
      remaining: tier.limits.documentChecklists === "unlimited"
        ? "unlimited"
        : Math.max(0, (tier.limits.documentChecklists as number) - usage.documentUploadsCount),
    },
    crs: {
      used: usage.crsCalculationsCount,
      limit: tier.limits.crsCalculations,
      remaining: tier.limits.crsCalculations === "unlimited"
        ? "unlimited"
        : Math.max(0, (tier.limits.crsCalculations as number) - usage.crsCalculationsCount),
    },
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
  };
}
