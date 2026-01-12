import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  updateUserLanguagePreference,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getUserProfile(ctx.user.id);
      return profile;
    }),

    create: protectedProcedure
      .input(
        z.object({
          dateOfBirth: z.string().optional(),
          nationality: z.string().optional(),
          sourceCountry: z.string().optional(),
          currentCountry: z.string().optional(),
          maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
          educationLevel: z.enum(["high_school", "bachelor", "master", "phd", "other"]).optional(),
          fieldOfStudy: z.string().optional(),
          yearsOfExperience: z.number().optional(),
          currentOccupation: z.string().optional(),
          nocCode: z.string().optional(),
          englishLevel: z.enum(["none", "basic", "intermediate", "advanced", "native"]).optional(),
          frenchLevel: z.enum(["none", "basic", "intermediate", "advanced", "native"]).optional(),
          ieltsScore: z.string().optional(),
          tefScore: z.string().optional(),
          targetDestination: z.string().optional(),
          immigrationPathway: z.enum(["express_entry", "study_permit", "family_sponsorship", "other"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { dateOfBirth, ...rest } = input;
        await createUserProfile({
          userId: ctx.user.id,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          ...rest,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          dateOfBirth: z.string().optional(),
          nationality: z.string().optional(),
          sourceCountry: z.string().optional(),
          currentCountry: z.string().optional(),
          maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
          educationLevel: z.enum(["high_school", "bachelor", "master", "phd", "other"]).optional(),
          fieldOfStudy: z.string().optional(),
          yearsOfExperience: z.number().optional(),
          currentOccupation: z.string().optional(),
          nocCode: z.string().optional(),
          englishLevel: z.enum(["none", "basic", "intermediate", "advanced", "native"]).optional(),
          frenchLevel: z.enum(["none", "basic", "intermediate", "advanced", "native"]).optional(),
          ieltsScore: z.string().optional(),
          tefScore: z.string().optional(),
          targetDestination: z.string().optional(),
          immigrationPathway: z.enum(["express_entry", "study_permit", "family_sponsorship", "other"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { dateOfBirth, ...rest } = input;
        await updateUserProfile(ctx.user.id, {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          ...rest,
        });
        return { success: true };
      }),

    updateLanguage: protectedProcedure
      .input(z.object({ language: z.enum(["ar", "en"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserLanguagePreference(ctx.user.id, input.language);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
