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
  australiaAssessments,
  AustraliaAssessment,
  InsertAustraliaAssessment,
  portugalAssessments,
  PortugalAssessment,
  InsertPortugalAssessment,
} from "../drizzle/schema";
import { env } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;
let _connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Database connection configuration optimized for Supabase Supavisor pooler.
 * 
 * Settings based on Supabase docs for handling connection timeouts:
 * - connect_timeout: Time to wait for connection (seconds)
 * - idle_timeout: Close idle connections after this time
 * - max_lifetime: Maximum connection lifetime before recycling
 * - prepare: Disabled for Transaction pool mode compatibility
 * 
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres
 */
const DB_CONFIG = {
  prepare: false, // Required for Supabase "Transaction" pool mode (port 6543)
  connect_timeout: 15, // 15 seconds connection timeout (reduced for faster failure detection)
  idle_timeout: 10, // Close idle connections after 10 seconds (helps with connection recycling)
  max_lifetime: 60 * 2, // Recycle connections every 2 minutes (more aggressive recycling)
  max: 3, // Reduce max connections - serverless apps should use fewer connections
  fetch_types: false, // Faster startup, skip type fetching
  onnotice: () => { }, // Suppress notices
  connection: {
    application_name: 'hijraah-mvp', // Helps identify connections in logs
  },
};

/**
 * Lazily create the drizzle instance with retry logic for transient errors.
 * Handles Supabase connection pooler timeouts gracefully.
 */
export async function getDb() {
  if (_db) return _db;

  if (!env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not configured");
    return null;
  }

  // Reset connection attempts if we haven't tried in a while
  const now = Date.now();

  try {
    _connectionAttempts++;
    console.log(`[Database] Connecting... (attempt ${_connectionAttempts})`);

    // Add connection timeout to URL if not present
    let connectionUrl = env.DATABASE_URL;
    if (!connectionUrl.includes('connect_timeout')) {
      const separator = connectionUrl.includes('?') ? '&' : '?';
      connectionUrl = `${connectionUrl}${separator}connect_timeout=30`;
    }

    _client = postgres(connectionUrl, DB_CONFIG);
    _db = drizzle(_client);

    // Test the connection with a simple query
    await _client`SELECT 1`;

    console.log("[Database] Connected successfully");
    _connectionAttempts = 0;

    return _db;
  } catch (error: any) {
    console.warn(`[Database] Connection failed (attempt ${_connectionAttempts}):`, error?.message || error);

    // Clean up failed connection
    if (_client) {
      try {
        await _client.end();
      } catch {
        // Ignore cleanup errors
      }
    }
    _client = null;
    _db = null;

    // For transient errors, allow retry
    if (
      error?.code === 'CONNECT_TIMEOUT' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND' ||
      error?.message?.includes('timeout')
    ) {
      if (_connectionAttempts < MAX_RETRY_ATTEMPTS) {
        console.log(`[Database] Retrying connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getDb(); // Retry
      }
      console.error(`[Database] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`);
    }

    return null;
  }
}

/**
 * Force reconnection to the database.
 * Useful when connection becomes stale or after errors.
 */
export async function reconnectDb() {
  console.log("[Database] Forcing reconnection...");
  if (_client) {
    try {
      await _client.end();
    } catch {
      // Ignore cleanup errors
    }
  }
  _client = null;
  _db = null;
  _connectionAttempts = 0;
  return getDb();
}

// Get or create user by Supabase auth ID
export async function getOrCreateUserByAuthId(authId: string, userData?: { email?: string; name?: string }): Promise<typeof users.$inferSelect | null> {
  let db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get/create user: database not available");
    return null;
  }

  try {
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
  } catch (error: any) {
    // Handle connection timeout - retry once with fresh connection
    if (error?.code === 'CONNECT_TIMEOUT' || error?.message?.includes('timeout')) {
      console.warn("[Database] Connection timeout, attempting reconnect...");
      db = await reconnectDb();
      if (!db) {
        console.error("[Database] Reconnection failed");
        return null;
      }

      // Retry the query
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.authId, authId))
        .limit(1);

      if (existingUser.length > 0) {
        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.authId, authId));
        return existingUser[0];
      }

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

    // Re-throw other errors
    throw error;
  }
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

// Australia Assessment functions
export async function createAustraliaAssessment(assessment: InsertAustraliaAssessment): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(australiaAssessments).values(assessment).returning({ id: australiaAssessments.id });
  return result[0].id;
}

export async function getUserAustraliaAssessments(userId: number): Promise<AustraliaAssessment[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(australiaAssessments)
    .where(eq(australiaAssessments.userId, userId))
    .orderBy(desc(australiaAssessments.createdAt));
}

export async function getLatestAustraliaAssessment(userId: number): Promise<AustraliaAssessment | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(australiaAssessments)
    .where(eq(australiaAssessments.userId, userId))
    .orderBy(desc(australiaAssessments.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Portugal Assessment functions
export async function createPortugalAssessment(assessment: InsertPortugalAssessment): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(portugalAssessments).values(assessment).returning({ id: portugalAssessments.id });
  return result[0].id;
}

export async function getUserPortugalAssessments(userId: number): Promise<PortugalAssessment[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(portugalAssessments)
    .where(eq(portugalAssessments.userId, userId))
    .orderBy(desc(portugalAssessments.createdAt));
}

export async function getLatestPortugalAssessment(userId: number): Promise<PortugalAssessment | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(portugalAssessments)
    .where(eq(portugalAssessments.userId, userId))
    .orderBy(desc(portugalAssessments.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getPortugalAssessmentByVisaType(
  userId: number,
  visaType: string
): Promise<PortugalAssessment | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(portugalAssessments)
    .where(eq(portugalAssessments.userId, userId))
    .orderBy(desc(portugalAssessments.createdAt))
    .limit(1);

  // Return only if matching visa type
  if (result.length > 0 && result[0].visaType === visaType) {
    return result[0];
  }

  return null;
}
