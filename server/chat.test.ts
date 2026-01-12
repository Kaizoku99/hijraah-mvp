import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "free",
    subscriptionStatus: "active",
    subscriptionExpiresAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    preferredLanguage: "ar",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("chat procedures", () => {
  it("should create a new conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.create({ language: "ar" });
    
    expect(result).toHaveProperty("conversationId");
    expect(typeof result.conversationId).toBe("number");
  });

  it("should list user conversations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversations = await caller.chat.list();
    
    expect(Array.isArray(conversations)).toBe(true);
  });

  it("should get conversation with messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    const { conversationId } = await caller.chat.create({ language: "en" });
    
    // Ensure conversationId is valid
    expect(conversationId).toBeGreaterThan(0);

    // Get the conversation
    const result = await caller.chat.get({ conversationId: Number(conversationId) });
    
    expect(result).toHaveProperty("conversation");
    expect(result).toHaveProperty("messages");
    expect(result.conversation.id).toBe(conversationId);
    expect(Array.isArray(result.messages)).toBe(true);
  });
});
