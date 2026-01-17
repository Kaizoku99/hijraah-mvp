'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import { invalidateUserChat } from '@/lib/cache'
import {
    createConversation,
    getUserConversations,
    getConversation,
    updateConversationTitle,
    deleteConversation as dbDeleteConversation,
    createMessage,
    getConversationMessages,
} from '@/server/db'
import {
    getUserDocumentChecklists,
    getUserDocuments,
} from '@/../server/documents'
import { getSubscriptionStatus } from '@/server/stripe'
import { checkUsageLimit, incrementUsage } from '@/server/usage'
import { generateChatResponse, GeminiMessage, generateChatTitle } from '@/server/_core/gemini'
import { ragQuery, buildRagContext } from '@/server/rag'
import { getWorkingMemory, addMemoryToChat } from '@/lib/memory'
import { extractProfileData } from '@/server/ai/profile-extraction'
import {
    getUserById,
    getUserProfile,
    createUserProfile,
    updateUserProfile,
    updateUserBasicInfo,
} from '@/server/db'

// Schemas
const CreateConversationSchema = z.object({
    title: z.string().optional(),
    language: z.enum(['ar', 'en']).default('ar'),
})

const SendMessageSchema = z.object({
    conversationId: z.number(),
    content: z.string(),
})

const ConversationIdSchema = z.object({
    conversationId: z.number(),
})

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>

// Note: We don't cache conversations anymore to avoid stale title issues
// The cache tag mismatch was causing titles not to update
async function getCachedConversations(userId: number) {
    return getUserConversations(userId)
}

/**
 * List all conversations for the current user
 */
export async function listConversations() {
    const user = await getAuthenticatedUser()
    return getCachedConversations(user.id)
}

/**
 * Get a specific conversation with messages
 * Note: No caching to ensure fresh titles and messages
 */
async function getConversationData(conversationId: number) {
    const conversation = await getConversation(conversationId)
    if (!conversation) return null

    const messages = await getConversationMessages(conversationId)

    return {
        conversation,
        messages
    }
}

export async function getConversationWithMessages(input: z.infer<typeof ConversationIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ConversationIdSchema.parse(input)

    const data = await getConversationData(validated.conversationId)

    if (!data || !data.conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }

    if (data.conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    return data
}

/**
 * Create a new conversation
 */
export async function createNewConversation(input: CreateConversationInput) {
    const user = await getAuthenticatedUser()
    const validated = CreateConversationSchema.parse(input)

    const conversationId = await createConversation({
        userId: user.id,
        title: validated.title,
        language: validated.language,
    })

    invalidateUserChat(user.id)
    revalidatePath('/chat')

    return { conversationId }
}

/**
 * Send a message and get AI response
 */
export async function sendMessage(input: SendMessageInput) {
    const user = await getAuthenticatedUser()
    const validated = SendMessageSchema.parse(input)

    // Check usage limits
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    const usageCheck = await checkUsageLimit(
        user.id,
        subscriptionStatus?.tier || 'free',
        'chat'
    )

    if (!usageCheck.allowed) {
        throw new ActionError(
            "You've reached your monthly chat limit. Upgrade to Essential ($29/month) for unlimited messages.",
            'USAGE_LIMIT'
        )
    }

    // Verify conversation belongs to user
    const conversation = await getConversation(validated.conversationId)
    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }
    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    // Save user message
    await createMessage({
        conversationId: validated.conversationId,
        role: 'user',
        content: validated.content,
    })

    // Parallelize data fetching
    const [history, ragContext, userProfile, userChecklists, userDocuments] = await Promise.all([
        getConversationMessages(validated.conversationId),
        (async () => {
            try {
                const ragResults = await ragQuery(validated.content, {
                    chunkLimit: 3,
                    entityLimit: 3,
                    language: conversation.language || 'en',
                    includeRelatedEntities: false,
                });
                return buildRagContext(
                    { chunks: ragResults.chunks, entities: ragResults.entities },
                    (conversation.language as 'en' | 'ar') || 'en'
                );
            } catch (error) {
                console.error('RAG query failed, continuing without context:', error);
                return '';
            }
        })(),
        getUserProfile(user.id).catch(err => {
            console.error('Profile fetch failed:', err);
            return null;
        }),
        getUserDocumentChecklists(user.id).catch(err => {
            console.error('Checklists fetch failed:', err);
            return [];
        }),
        getUserDocuments(user.id).catch(err => {
            console.error('Documents fetch failed:', err);
            return [];
        })
    ]);

    // Convert to Gemini format
    const geminiMessages: GeminiMessage[] = history
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            id: msg.id.toString(),
        }))

    // System instruction
    // Determine context based on profile
    const targetDest = userProfile?.targetDestination?.toLowerCase() || 'canada'
    
    // Destination-specific context
    const destinationContext: Record<string, { nameAr: string, nameEn: string, contextAr: string, contextEn: string }> = {
        canada: {
            nameAr: 'كندا',
            nameEn: 'Canada',
            contextAr: 'أنظمة Express Entry و Study Permit والهجرة الإقليمية',
            contextEn: 'Express Entry, Study Permits, and Provincial Nominee Programs',
        },
        australia: {
            nameAr: 'أستراليا',
            nameEn: 'Australia',
            contextAr: 'نظام SkillSelect وتأشيرات العمل والدراسة',
            contextEn: 'SkillSelect system, work and study visas',
        },
        portugal: {
            nameAr: 'البرتغال',
            nameEn: 'Portugal',
            contextAr: 'تأشيرات D2 (رواد الأعمال), D7 (الدخل السلبي), D8 (الرحالة الرقميين), وتأشيرة البحث عن عمل',
            contextEn: 'D2 (Entrepreneur), D7 (Passive Income), D8 (Digital Nomad) visas, and Job Seeker Visa',
        },
    }
    
    const destConfig = destinationContext[targetDest] || destinationContext.canada
    const countryNameAr = destConfig.nameAr
    const countryNameEn = destConfig.nameEn

    // System instruction with MENA Cultural Context
    const baseSystemInstruction = conversation.language === 'ar'
        ? `أنت "هجرة" - مستشارك الذكي للهجرة إلى ${countryNameAr}، متخصص في مساعدة المتقدمين من منطقة الشرق الأوسط وشمال أفريقيا (MENA).
        
        معرفتك المتخصصة لـ${countryNameAr}:
        - ${destConfig.contextAr}
        
        قدراتك المتعلقة بالمستندات:
        - لديك إمكانية الوصول إلى مستندات المستخدم وقوائم المتطلبات.
        - يمكنك مراجعة حالة المستندات (مرفوعة/معلقة) وتقديم نصائح مخصصة.
        - عند السؤال عن المستندات، راجع قائمة المستندات أدناه وقدم إرشادات محددة.
        - ساعد في التحقق من اكتمال المستندات وأي متطلبات ناقصة.
        
        سياقك الثقافي ومعرفتك:
        - تفهم التحديات الشائعة للمتقدمين عربياً (مثل معادلة الشهادات, إثبات القدرة المالية, المخاوف الأمنية).
        - أنت مشجع، إيجابي، وواقعي. الهجرة رحلة طويلة، وأنت هنا لتبسيطها.
        - عند الحديث عن دول المصدر الشائعة (الإمارات, السعودية, مصر, الأردن, لبنان, الجزائر, المغرب, السودان, إيران), قدم نصائح مخصصة إذا أمكن.
        - استخدم لغة عربية فصحى مبسطة وودودة.
        
        في نهاية إجابتك، اقترح دائماً 3 أسئلة متابعة قصيرة ذات صلة بصيغة مصفوفة JSON داخل وسوم <suggestions>، مثال:
        <suggestions>["كيفية التقديم؟", "ما هي التكلفة؟", "المستندات المطلوبة"]</suggestions>`
        : `You are "Hijraah" - a specialized AI immigration assistant helping people from the MENA region (Middle East & North Africa) immigrate to ${countryNameEn}.
        
        Your specialized knowledge for ${countryNameEn}:
        - ${destConfig.contextEn}
        
        Your Document Capabilities:
        - You have access to the user's uploaded documents and requirement checklists.
        - You can review document status (uploaded/pending) and provide tailored advice.
        - When asked about documents, reference the document list below and give specific guidance.
        - Help verify document completeness and identify any missing requirements.
        
        Your Context & Persona:
        - You understand common challenges for MENA applicants (e.g., degree equivalency, proof of funds, visa processing times in local embassies).
        - Be encouraging, positive, yet realistic. Immigration is a marathon, not a sprint.
        - When relevant, consider context for common source countries like UAE, KSA, Egypt, Jordan, Lebanon, Algeria, Morocco, Sudan, Iran.
        - Use clear, professional, and supportive language.
        
        At the end of your response, ALWAYS suggest 3 short, relevant follow-up questions formatted as a JSON array inside <suggestions> tags, e.g.:
        <suggestions>["How to apply?", "What is the cost?", "Required documents"]</suggestions>`

    let finalSystemInstructionPart = baseSystemInstruction

    if (ragContext) {
        finalSystemInstructionPart += `\n\n${ragContext}`
    } else {
        const fallbackWarning = conversation.language === 'ar'
            ? "\n\nتنبيه: لم يتم العثور على معلومات محددة في قاعدة البيانات لهذا السؤال. أجب بناءً على معرفتك العامة، ولكن اذكر بوضوح أن هذه المعلومات قد لا تكون محدثة تماماً ويجب التحقق منها من المصادر الرسمية."
            : "\n\nNOTE: No specific information found in the knowledge base for this question. Provide an answer based on your general knowledge, but explicitly warn the user that this information might not be fully up-to-date and they should verify with official sources."
        finalSystemInstructionPart += fallbackWarning
    }

    const systemInstruction = finalSystemInstructionPart

    // Fetch Working Memory (persistent AI scratchpad)
    let memoryContext = ''
    try {
        const workingMem = await getWorkingMemory(user.id.toString())
        if (workingMem) {
            memoryContext = `\n\nUser Context & Working Memory:\n${workingMem}`
        }
    } catch (error) {
        console.error('Working memory fetch failed:', error)
    }

    // Use fetched profile for explicit context (Stronger signal than memory)
    let profileContext = ''
    if (userProfile) {
        profileContext = `\n\nUser Profile Information (Verified):\n` +
            `- Name: ${user.name || 'Unknown'}\n` +
            `- Nationality: ${userProfile.nationality || 'Unknown'}\n` +
            `- Current Country: ${userProfile.currentCountry || 'Unknown'}\n` +
            `- Source Country: ${userProfile.sourceCountry || 'Unknown'}\n` +
            `- Education Level: ${userProfile.educationLevel || 'Unknown'}\n` +
            `- Field of Study: ${userProfile.fieldOfStudy || 'Unknown'}\n` +
            `- Work Experience: ${userProfile.yearsOfExperience || '0'} years\n` +
            `- Current Occupation: ${userProfile.currentOccupation || 'Unknown'}\n` +
            `- Target Destination: ${userProfile.targetDestination || 'Canada'}\n` +
            `- Immigration Pathway: ${userProfile.immigrationPathway || 'Unknown'}\n`
    }

    // Build document context for AI to reference user's uploaded documents
    let documentContext = ''
    if (userChecklists && userChecklists.length > 0) {
        const isArabic = conversation.language === 'ar'
        
        documentContext = isArabic
            ? `\n\n📋 مستندات المستخدم ومتطلباته:\n`
            : `\n\n📋 User's Documents & Requirements:\n`
        
        for (const checklist of userChecklists) {
            const items = checklist.items as any[]
            if (!items || !Array.isArray(items)) continue
            
            const pathwayLabel = checklist.immigrationPathway || 'Unknown'
            const sourceLabel = checklist.sourceCountry || 'Unknown'
            
            documentContext += isArabic
                ? `\nقائمة المستندات (${pathwayLabel} - من ${sourceLabel}):\n`
                : `\nDocument Checklist (${pathwayLabel} - from ${sourceLabel}):\n`
            
            // Group items by status
            const pending = items.filter((item: any) => item.status === 'pending')
            const uploaded = items.filter((item: any) => item.status === 'uploaded' || item.status === 'completed' || item.status === 'verified')
            
            if (uploaded.length > 0) {
                documentContext += isArabic ? `  ✅ المستندات المرفوعة (${uploaded.length}):\n` : `  ✅ Uploaded Documents (${uploaded.length}):\n`
                for (const item of uploaded) {
                    const title = isArabic ? (item.titleAr || item.title) : item.title
                    const desc = isArabic ? (item.descriptionAr || item.description) : item.description
                    documentContext += `    - ${title}${item.required ? (isArabic ? ' (مطلوب)' : ' (Required)') : ''}\n`
                    if (desc) documentContext += `      ${desc}\n`
                }
            }
            
            if (pending.length > 0) {
                documentContext += isArabic ? `  ⏳ المستندات المعلقة (${pending.length}):\n` : `  ⏳ Pending Documents (${pending.length}):\n`
                for (const item of pending) {
                    const title = isArabic ? (item.titleAr || item.title) : item.title
                    const desc = isArabic ? (item.descriptionAr || item.description) : item.description
                    documentContext += `    - ${title}${item.required ? (isArabic ? ' (مطلوب)' : ' (Required)') : ''}\n`
                    if (desc) documentContext += `      ${desc}\n`
                }
            }
            
            // Summary
            const completionRate = items.length > 0 ? Math.round((uploaded.length / items.length) * 100) : 0
            documentContext += isArabic
                ? `  📊 نسبة الاكتمال: ${completionRate}% (${uploaded.length}/${items.length})\n`
                : `  📊 Completion: ${completionRate}% (${uploaded.length}/${items.length})\n`
        }
        
        // Add uploaded files info
        if (userDocuments && userDocuments.length > 0) {
            documentContext += isArabic
                ? `\n📁 الملفات المرفوعة:\n`
                : `\n📁 Uploaded Files:\n`
            
            for (const doc of userDocuments) {
                const uploadDate = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown'
                documentContext += `  - ${doc.fileName} (${doc.documentType}) - ${isArabic ? 'رفع في' : 'Uploaded'}: ${uploadDate}\n`
                
                // Include OCR text if available (useful for AI to analyze document content)
                if (doc.ocrText) {
                    const truncatedText = doc.ocrText.length > 500 ? doc.ocrText.substring(0, 500) + '...' : doc.ocrText
                    documentContext += isArabic
                        ? `    📝 محتوى المستند (ملخص): ${truncatedText}\n`
                        : `    📝 Document Content (Summary): ${truncatedText}\n`
                }
            }
        }
        
        // Add helpful instruction for AI
        documentContext += isArabic
            ? `\n💡 يمكنك مساعدة المستخدم في: مراجعة المستندات، التحقق من الاكتمال، اقتراح المستندات الناقصة، أو الإجابة عن أي استفسارات حول متطلبات المستندات.\n`
            : `\n💡 You can help the user with: reviewing documents, checking completeness, suggesting missing documents, or answering questions about document requirements.\n`
    }

    const finalSystemInstruction = systemInstruction + profileContext + documentContext + memoryContext

    // Generate AI response
    const aiResponse = await generateChatResponse({
        messages: geminiMessages,
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
    })

    // Save AI response
    await createMessage({
        conversationId: validated.conversationId,
        role: 'assistant',
        content: aiResponse,
    })

    // Track usage
    await incrementUsage(user.id, 'chat')

    // Add to Memory (Async)
    // We don't await this to keep the UI snappy, or we can use waitUntil if available (Next.js specific)
    // For now, we await it but wrapped in try-catch to not break flow
    // Background tasks: Memory & Profile Update
    // Background tasks: Memory, Profile Update, & Title Generation
    try {
        const tasks: Promise<any>[] = [
            addMemoryToChat(
                user.id.toString(),
                validated.conversationId.toString(),
                [
                    { role: 'user', content: validated.content },
                    { role: 'assistant', content: aiResponse },
                ]
            ),
            (async () => {
                try {
                    const [currentUser, currentProfile] = await Promise.all([
                        getUserById(user.id),
                        getUserProfile(user.id),
                    ])

                    // Combine for context
                    const combinedProfile = {
                        name: currentUser?.name,
                        ...currentProfile,
                    }

                    const extracted = await extractProfileData(validated.content, combinedProfile)

                    if (extracted && Object.keys(extracted).length > 0) {
                        const profileUpdates: any = {}
                        let hasProfileUpdates = false

                        // Handle Basic Info (Name)
                        if (extracted.name && !currentUser?.name) {
                            await updateUserBasicInfo(user.id, { name: extracted.name })
                        }

                        // Handle Profile Fields (Only update if missing)
                        const profileFields = [
                            'nationality',
                            'currentCountry',
                            'sourceCountry',
                            'education',
                            'workExperience',
                        ]

                        for (const key of profileFields) {
                            // @ts-ignore - dynamic key access
                            if (extracted[key] && (!currentProfile || !currentProfile[key])) {
                                // @ts-ignore
                                profileUpdates[key] = extracted[key]
                                hasProfileUpdates = true
                            }
                        }

                        if (hasProfileUpdates) {
                            if (!currentProfile) {
                                await createUserProfile({ userId: user.id, ...profileUpdates })
                            } else {
                                await updateUserProfile(user.id, profileUpdates)
                            }
                            revalidatePath('/profile')
                        }
                    }
                } catch (err) {
                    console.error('Profile extraction error:', err)
                }
            })(),
        ];

        // Generate AI-powered title for new conversations
        const needsTitle = !conversation.title ||
            conversation.title === 'New Conversation' ||
            conversation.title === 'New Chat' ||
            conversation.title === 'محادثة جديدة' ||
            conversation.title.length < 3;

        if (needsTitle) {
            tasks.push((async () => {
                try {
                    const generatedTitle = await generateChatTitle(
                        validated.content,
                        (conversation.language as 'ar' | 'en') || 'en'
                    )
                    await updateConversationTitle(validated.conversationId, generatedTitle)
                    console.log(`[Chat] Generated title: "${generatedTitle}" for conversation ${validated.conversationId}`)
                } catch (err) {
                    console.error('Title generation failed:', err)
                    // Fallback to truncated content
                    await updateConversationTitle(
                        validated.conversationId,
                        validated.content.substring(0, 50)
                    )
                }
            })());
        }

        await Promise.allSettled(tasks);
    } catch (error) {
        console.error('Background tasks failed:', error)
    }

    invalidateUserChat(user.id)
    revalidatePath('/chat')

    return { content: aiResponse }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(input: z.infer<typeof ConversationIdSchema>) {
    const user = await getAuthenticatedUser()
    const validated = ConversationIdSchema.parse(input)

    const conversation = await getConversation(validated.conversationId)
    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }
    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    await dbDeleteConversation(validated.conversationId)

    invalidateUserChat(user.id)
    revalidatePath('/chat')

    return { success: true as const }
}

const UpdateConversationTitleSchema = z.object({
    conversationId: z.number(),
    title: z.string().min(1).max(100),
})

/**
 * Update conversation title
 */
export async function updateConversationTitleAction(input: z.infer<typeof UpdateConversationTitleSchema>) {
    const user = await getAuthenticatedUser()
    const validated = UpdateConversationTitleSchema.parse(input)

    const conversation = await getConversation(validated.conversationId)
    if (!conversation) {
        throw new ActionError('Conversation not found', 'NOT_FOUND')
    }
    if (conversation.userId !== user.id) {
        throw new ActionError('Access denied', 'FORBIDDEN')
    }

    await updateConversationTitle(validated.conversationId, validated.title)

    invalidateUserChat(user.id)
    revalidatePath('/chat')

    return { success: true }
}
