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
import {
  createDocumentChecklist,
  getUserDocumentChecklists,
  getDocumentChecklist,
  updateDocumentChecklist,
  deleteDocumentChecklist,
  createDocument,
  getUserDocuments,
  getChecklistDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  generateDocumentChecklist,
} from "./documents";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  createSopGeneration,
  getUserSopGenerations,
  getSopGeneration,
  updateSopGeneration,
  deleteSopGeneration,
} from "./sop";
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
      return profile || null;
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

  documents: router({
    // Generate document checklist
    generateChecklist: protectedProcedure
      .input(
        z.object({
          sourceCountry: z.enum(["tunisia", "jordan", "lebanon", "morocco", "egypt", "sudan", "syria"]),
          immigrationPathway: z.enum(["express_entry", "study_permit", "work_permit", "family_sponsorship"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = generateDocumentChecklist(input.sourceCountry, input.immigrationPathway);
        
        const checklistId = await createDocumentChecklist({
          userId: ctx.user.id,
          sourceCountry: input.sourceCountry,
          immigrationPathway: input.immigrationPathway,
          items: items,
        });

        return { checklistId, items };
      }),

    // Get user's checklists
    getChecklists: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDocumentChecklists(ctx.user.id);
    }),

    // Get specific checklist
    getChecklist: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ ctx, input }) => {
        const checklist = await getDocumentChecklist(input.checklistId);
        
        if (!checklist || checklist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
        }

        return checklist;
      }),

    // Update checklist items
    updateChecklist: protectedProcedure
      .input(
        z.object({
          checklistId: z.number(),
          items: z.any(), // ChecklistItem[]
        })
      )
      .mutation(async ({ ctx, input }) => {
        const checklist = await getDocumentChecklist(input.checklistId);
        
        if (!checklist || checklist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
        }

        await updateDocumentChecklist(input.checklistId, { items: input.items });
        return { success: true };
      }),

    // Delete checklist
    deleteChecklist: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const checklist = await getDocumentChecklist(input.checklistId);
        
        if (!checklist || checklist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
        }

        await deleteDocumentChecklist(input.checklistId);
        return { success: true };
      }),

    // Upload document
    uploadDocument: protectedProcedure
      .input(
        z.object({
          checklistId: z.number().optional(),
          documentType: z.string(),
          fileName: z.string(),
          fileData: z.string(), // base64 encoded
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileSize = fileBuffer.length;

        // Generate unique file key
        const fileExtension = input.fileName.split(".").pop();
        const fileKey = `${ctx.user.id}/documents/${input.documentType}-${nanoid()}.${fileExtension}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Save document record
        const documentId = await createDocument({
          userId: ctx.user.id,
          checklistId: input.checklistId,
          documentType: input.documentType,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize,
          status: "uploaded",
        });

        return { documentId, fileUrl: url };
      }),

    // Get user's documents
    getDocuments: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDocuments(ctx.user.id);
    }),

    // Get checklist documents
    getChecklistDocuments: protectedProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getChecklistDocuments(input.checklistId);
      }),

    // Delete document
    deleteDocument: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const document = await getDocument(input.documentId);
        
        if (!document || document.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }

        await deleteDocument(input.documentId);
        return { success: true };
      }),
  }),

  sop: router({
    // Generate SOP based on questionnaire
    generate: protectedProcedure
      .input(
        z.object({
          targetProgram: z.string(),
          targetInstitution: z.string().optional(),
          background: z.string(),
          education: z.string(),
          workExperience: z.string(),
          motivation: z.string(),
          careerGoals: z.string(),
          whyCanada: z.string(),
          whyThisProgram: z.string(),
          uniqueStrengths: z.string(),
          challenges: z.string().optional(),
          additionalInfo: z.string().optional(),
          language: z.enum(["en", "ar"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { language, ...questionnaireData } = input;

        // Generate SOP using Gemini
        const prompt = `You are an expert immigration consultant specializing in Canadian immigration applications. Generate a professional, compelling Statement of Purpose (SOP) for a Canada immigration/study application based on the following information:

Target Program: ${input.targetProgram}
${input.targetInstitution ? `Target Institution: ${input.targetInstitution}` : ""}

Background:
${input.background}

Education:
${input.education}

Work Experience:
${input.workExperience}

Motivation:
${input.motivation}

Career Goals:
${input.careerGoals}

Why Canada:
${input.whyCanada}

Why This Program:
${input.whyThisProgram}

Unique Strengths:
${input.uniqueStrengths}

${input.challenges ? `Challenges/Gaps to Address:\n${input.challenges}` : ""}

${input.additionalInfo ? `Additional Information:\n${input.additionalInfo}` : ""}

Generate a well-structured, professional SOP that:
1. Has a compelling introduction that captures attention
2. Clearly presents the applicant's academic and professional background
3. Demonstrates strong motivation and clear career goals
4. Explains why Canada and this specific program are the right fit
5. Highlights unique strengths and addresses any gaps/challenges positively
6. Concludes with a strong statement of commitment
7. Uses professional, formal language appropriate for immigration applications
8. Is approximately 800-1000 words
9. Follows a logical structure with clear paragraphs

${language === "ar" ? "Generate the SOP in Arabic." : "Generate the SOP in English."}

Provide the SOP as a complete, ready-to-use document.`;

        const response = await generateChatResponse({
          messages: [{ role: "user", parts: prompt }],
          systemInstruction: "You are an expert immigration consultant who writes compelling Statements of Purpose for Canada immigration applications.",
          maxOutputTokens: 4096,
        });

        const generatedContent = response;

        // Save to database
        const sopId = await createSopGeneration({
          userId: ctx.user.id,
          background: input.background,
          education: input.education,
          workExperience: input.workExperience,
          motivations: input.motivation,
          goals: input.careerGoals,
          whyCanada: input.whyCanada,
          additionalInfo: input.additionalInfo,
          generatedSop: generatedContent,
          language,
          version: 1,
          status: "generated",
        });
        return {
          sopId,
          content: generatedContent,
        };
      }),

    // Get SOP by ID
    get: protectedProcedure
      .input(z.object({ sopId: z.number() }))
      .query(async ({ ctx, input }) => {
        const sop = await getSopGeneration(input.sopId);
        if (!sop || sop.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "SOP not found",
          });
        }
        return {
          ...sop,
          content: sop.generatedSop,
        };
      }),

    // List user's SOPs
    list: protectedProcedure.query(async ({ ctx }) => {
      const sops = await getUserSopGenerations(ctx.user.id);
      return sops.map((sop) => ({
        ...sop,
        content: sop.generatedSop,
      }));
    }),

    // Refine/improve existing SOP
    refine: protectedProcedure
      .input(
        z.object({
          sopId: z.number(),
          feedback: z.string(),
          focusAreas: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sop = await getSopGeneration(input.sopId);

        if (!sop || sop.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "SOP not found" });
        }

        const prompt = `You are an expert immigration consultant. Here is a Statement of Purpose that needs improvement:

${sop.generatedSop}

User Feedback:
${input.feedback}

${input.focusAreas && input.focusAreas.length > 0 ? `Focus on improving these areas: ${input.focusAreas.join(", ")}` : ""}

Please refine and improve this SOP based on the feedback. Maintain the same structure and key information, but enhance:
1. Clarity and coherence
2. Professional tone
3. Compelling narrative
4. Specific areas mentioned in the feedback

Provide the complete refined SOP.`;

        const response = await generateChatResponse({
          messages: [{ role: "user", parts: prompt }],
          systemInstruction: "You are an expert immigration consultant who refines and improves Statements of Purpose.",
          maxOutputTokens: 4096,
        });

        const refinedContent = response;
        const newVersion = (sop.version || 1) + 1;

        await updateSopGeneration(input.sopId, {
          generatedSop: refinedContent,
          version: newVersion,
          status: "revised",
        });

        return {
          content: refinedContent,
          version: newVersion,
        };
      }),



    // Delete SOP
    delete: protectedProcedure
      .input(z.object({ sopId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sop = await getSopGeneration(input.sopId);

        if (!sop || sop.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "SOP not found" });
        }

        await deleteSopGeneration(input.sopId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
