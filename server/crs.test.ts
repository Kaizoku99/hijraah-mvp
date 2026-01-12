import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { calculateCRS } from "./crs-calculator";

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
    preferredLanguage: "en",
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

describe("CRS Calculator", () => {
  it("should calculate CRS score correctly", () => {
    const input = {
      age: 28,
      educationLevel: "bachelor" as const,
      firstLanguageTest: {
        speaking: 8,
        listening: 8,
        reading: 8,
        writing: 8,
      },
      canadianWorkExperience: 0,
      hasSpouse: false,
      foreignWorkExperience: 3,
      hasCertificateOfQualification: false,
      hasCanadianSiblings: false,
      hasFrenchLanguageSkills: false,
      hasProvincialNomination: false,
      hasValidJobOffer: false,
      jobOfferNOC: "none" as const,
      hasCanadianEducation: false,
    };

    const result = calculateCRS(input);

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.breakdown).toHaveProperty("coreHumanCapital");
    expect(result.breakdown).toHaveProperty("spouseFactors");
    expect(result.breakdown).toHaveProperty("skillTransferability");
    expect(result.breakdown).toHaveProperty("additionalPoints");
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("should save CRS assessment via tRPC", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crs.calculate({
      age: 30,
      educationLevel: "master",
      firstLanguageTest: {
        speaking: 9,
        listening: 9,
        reading: 9,
        writing: 9,
      },
      canadianWorkExperience: 1,
      hasSpouse: false,
      foreignWorkExperience: 5,
      hasCertificateOfQualification: false,
      hasCanadianSiblings: false,
      hasFrenchLanguageSkills: false,
      hasProvincialNomination: false,
      hasValidJobOffer: false,
      jobOfferNOC: "none",
      hasCanadianEducation: false,
      saveAssessment: true,
    });

    expect(result.totalScore).toBeGreaterThan(400);
    expect(result.breakdown.coreHumanCapital).toBeGreaterThan(0);
  });

  it("should retrieve assessment history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.crs.history();
    expect(Array.isArray(history)).toBe(true);
  });
});
