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
  createConversation,
  getUserConversations,
  getConversation,
  updateConversationTitle,
  deleteConversation,
  createMessage,
  getConversationMessages,
  createCrsAssessment,
  getUserCrsAssessments,
  getLatestCrsAssessment,
} from "./db";
import { generateChatResponse, generateChatResponseStream, GeminiMessage } from "./_core/gemini";
import { calculateCRS, CrsInput } from "./crs-calculator";
import { TRPCError } from "@trpc/server";

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

  chat: router({
    // Get all conversations for the user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserConversations(ctx.user.id);
    }),

    // Get a specific conversation with messages
    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }
        
        if (conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const messages = await getConversationMessages(input.conversationId);
        
        return {
          conversation,
          messages,
        };
      }),

    // Create a new conversation
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
          language: z.enum(["ar", "en"]).default("ar"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversationId = await createConversation({
          userId: ctx.user.id,
          title: input.title,
          language: input.language,
        });

        return { conversationId };
      }),

    // Send a message and get AI response
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify conversation belongs to user
        const conversation = await getConversation(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }
        if (conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Get conversation history
        const history = await getConversationMessages(input.conversationId);
        
        // Convert to Gemini format
        const geminiMessages: GeminiMessage[] = history
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: msg.content,
          }));

        // System instruction based on language
        const systemInstruction = conversation.language === "ar"
          ? `أنت مساعد ذكي متخصص في الهجرة إلى كندا. أنت تساعد المستخدمين الناطقين بالعربية من منطقة الشرق الأوسط وشمال أفريقيا في فهم عملية الهجرة إلى كندا.

مهامك:
- تقديم معلومات دقيقة وحديثة حول برامج الهجرة الكندية
- شرح متطلبات نظام الدخول السريع (Express Entry)
- مساعدة المستخدمين في فهم نظام نقاط CRS
- تقديم نصائح حول المستندات المطلوبة
- الإجابة على الأسئلة المتعلقة بالدراسة والعمل في كندا

إرشادات:
- كن ودودًا ومفيدًا
- استخدم لغة عربية واضحة وبسيطة
- قدم معلومات محددة وعملية
- اذكر المصادر الرسمية عند الإمكان
- إذا لم تكن متأكدًا من معلومة، أخبر المستخدم بذلك
- لا تقدم نصائح قانونية محددة - انصح بالتواصل مع محامي هجرة مرخص للحالات المعقدة`
          : `You are an AI immigration assistant specialized in helping people immigrate to Canada. You assist Arabic-speaking users from the MENA region in understanding the Canadian immigration process.

Your tasks:
- Provide accurate and up-to-date information about Canadian immigration programs
- Explain Express Entry requirements
- Help users understand the CRS points system
- Provide guidance on required documents
- Answer questions about studying and working in Canada

Guidelines:
- Be friendly and helpful
- Use clear and simple language
- Provide specific and practical information
- Mention official sources when possible
- If you're unsure about information, tell the user
- Don't provide specific legal advice - recommend consulting a licensed immigration lawyer for complex cases`;

        // Generate AI response
        const aiResponse = await generateChatResponse({
          messages: geminiMessages,
          systemInstruction,
          temperature: 0.7,
        });

        // Save AI response
        await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: aiResponse,
        });

        // Update conversation timestamp
        await updateConversationTitle(
          input.conversationId,
          conversation.title || input.content.substring(0, 50)
        );

        return {
          content: aiResponse,
        };
      }),

    // Delete a conversation
    delete: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }
        if (conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        await deleteConversation(input.conversationId);
        return { success: true };
      }),
  }),

  crs: router({
    // Calculate CRS score
    calculate: protectedProcedure
      .input(
        z.object({
          age: z.number().min(18).max(60),
          educationLevel: z.enum(["none", "high_school", "one_year", "two_year", "bachelor", "two_or_more", "master", "phd"]),
          firstLanguageTest: z.object({
            speaking: z.number().min(0).max(10),
            listening: z.number().min(0).max(10),
            reading: z.number().min(0).max(10),
            writing: z.number().min(0).max(10),
          }),
          secondLanguageTest: z.object({
            speaking: z.number().min(0).max(10),
            listening: z.number().min(0).max(10),
            reading: z.number().min(0).max(10),
            writing: z.number().min(0).max(10),
          }).optional(),
          canadianWorkExperience: z.number().min(0).max(10),
          hasSpouse: z.boolean(),
          spouseEducation: z.enum(["none", "high_school", "one_year", "two_year", "bachelor", "two_or_more", "master", "phd"]).optional(),
          spouseLanguageTest: z.object({
            speaking: z.number().min(0).max(10),
            listening: z.number().min(0).max(10),
            reading: z.number().min(0).max(10),
            writing: z.number().min(0).max(10),
          }).optional(),
          spouseCanadianWorkExperience: z.number().min(0).max(10).optional(),
          foreignWorkExperience: z.number().min(0).max(20),
          hasCertificateOfQualification: z.boolean(),
          hasCanadianSiblings: z.boolean(),
          hasFrenchLanguageSkills: z.boolean(),
          hasProvincialNomination: z.boolean(),
          hasValidJobOffer: z.boolean(),
          jobOfferNOC: z.enum(["00", "0", "A", "B", "none"]),
          hasCanadianEducation: z.boolean(),
          canadianEducationLevel: z.enum(["one_two_year", "three_year_plus", "master_phd"]).optional(),
          saveAssessment: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { saveAssessment, ...crsInput } = input;
        
        // Calculate CRS score
        const result = calculateCRS(crsInput as CrsInput);

        // Save assessment if requested
        if (saveAssessment) {
          await createCrsAssessment({
            userId: ctx.user.id,
            totalScore: result.totalScore,
            coreScore: result.breakdown.coreHumanCapital,
            spouseScore: result.breakdown.spouseFactors,
            skillTransferabilityScore: result.breakdown.skillTransferability,
            additionalScore: result.breakdown.additionalPoints,
            recommendations: result.recommendations,
            age: crsInput.age,
            educationLevel: crsInput.educationLevel,
            firstLanguageScore: crsInput.firstLanguageTest,
            secondLanguageScore: crsInput.secondLanguageTest,
            canadianWorkExperience: crsInput.canadianWorkExperience,
            foreignWorkExperience: crsInput.foreignWorkExperience,
            hasSpouse: crsInput.hasSpouse,
            spouseEducation: crsInput.spouseEducation,
            spouseLanguageScore: crsInput.spouseLanguageTest,
            spouseCanadianWorkExperience: crsInput.spouseCanadianWorkExperience,
            hasSiblingInCanada: crsInput.hasCanadianSiblings,
            hasFrenchLanguageSkills: crsInput.hasFrenchLanguageSkills,
            hasProvincialNomination: crsInput.hasProvincialNomination,
            hasJobOffer: crsInput.hasValidJobOffer,
            hasCanadianStudyExperience: crsInput.hasCanadianEducation,
          });
        }

        return result;
      }),

    // Get user's assessment history
    history: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCrsAssessments(ctx.user.id);
    }),

    // Get latest assessment
    latest: protectedProcedure.query(async ({ ctx }) => {
      return await getLatestCrsAssessment(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
