import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  userProfiles,
  InsertUserProfile,
  UserProfile,
  conversations,
  Conversation,
  InsertConversation,
  messages,
  Message,
  InsertMessage,
  crsAssessments,
  CrsAssessment,
  InsertCrsAssessment,
} from "../drizzle/schema";
import { env } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && env.DATABASE_URL) {
    try {
      // Disable prefetch as it is not supported for "Transaction" pool mode
      _client = postgres(env.DATABASE_URL, { prepare: false });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Get or create user by Supabase auth ID
export async function getOrCreateUserByAuthId(authId: string, userData?: { email?: string; name?: string }): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get/create user: database not available");
    return null;
  }

  // Try to find existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.authId, authId))
    .limit(1);

  if (existingUser.length > 0) {
    // Update last signed in
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.authId, authId));
    return existingUser[0];
  }

  // Create new user
  const newUser: InsertUser = {
    authId,
    email: userData?.email ?? null,
    name: userData?.name ?? null,
    lastSignedIn: new Date(),
  };

  const result = await db
    .insert(users)
    .values(newUser)
    .returning();

  return result[0];
}

export async function getUserByAuthId(authId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.authId, authId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user profile: database not available");
    return null;
  }

  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createUserProfile(profile: InsertUserProfile) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(userProfiles).values(profile).returning();
  return result[0];
}

export async function updateUserProfile(userId: number, updates: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(userProfiles).set(updates).where(eq(userProfiles.userId, userId));
}

export async function updateUserLanguagePreference(userId: number, language: "ar" | "en") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ preferredLanguage: language }).where(eq(users.id, userId));
}

export async function updateUserSubscription(
  userId: number,
  subscription: {
    tier: "free" | "essential" | "premium" | "vip";
    status: "active" | "canceled" | "expired";
    expiresAt?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({
    subscriptionTier: subscription.tier,
    subscriptionStatus: subscription.status,
    subscriptionExpiresAt: subscription.expiresAt,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  }).where(eq(users.id, userId));
}

export async function updateUserBasicInfo(userId: number, updates: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const cleanUpdates: any = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.email !== undefined) cleanUpdates.email = updates.email;

  if (Object.keys(cleanUpdates).length === 0) return;

  await db.update(users).set(cleanUpdates).where(eq(users.id, userId));
}

// Chat conversation functions
export async function createConversation(conversation: InsertConversation): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(conversations).values(conversation).returning({ id: conversations.id });
  return result[0].id;
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(conversationId: number): Promise<Conversation | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateConversationTitle(conversationId: number, title: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function deleteConversation(conversationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(conversations).where(eq(conversations.id, conversationId));
}

// Chat message functions
export async function createMessage(message: InsertMessage): Promise<number> {
  console.log("[DB] createMessage called with:", JSON.stringify(message, null, 2));
  const db = await getDb();
  if (!db) {
    console.error("[DB] createMessage failed: Database not available");
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(messages).values(message).returning({ id: messages.id });
    console.log("[DB] createMessage success, id:", result[0]?.id);
    return result[0].id;
  } catch (error) {
    console.error("[DB] createMessage error:", error);
    throw error;
  }
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// CRS Assessment functions
export async function createCrsAssessment(assessment: InsertCrsAssessment): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(crsAssessments).values(assessment).returning({ id: crsAssessments.id });
  return result[0].id;
}

export async function getUserCrsAssessments(userId: number): Promise<CrsAssessment[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(crsAssessments)
    .where(eq(crsAssessments.userId, userId))
    .orderBy(desc(crsAssessments.createdAt));
}

export async function getLatestCrsAssessment(userId: number): Promise<CrsAssessment | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(crsAssessments)
    .where(eq(crsAssessments.userId, userId))
    .orderBy(desc(crsAssessments.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
