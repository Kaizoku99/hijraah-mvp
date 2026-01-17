'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import { ActionError } from '@/lib/action-client'
import {
    createApplication,
    getUserApplications,
    getApplication,
    getActiveApplication,
    updateApplication,
    deleteApplication,
    getApplicationMilestones,
    updateMilestone,
    completeMilestone,
    createDeadline,
    getUserDeadlines,
    getUpcomingDeadlines,
    getOverdueDeadlines,
    updateDeadline,
    completeDeadline,
    deleteDeadline,
    createNotification,
    getUserNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getLatestExpressEntryDraws,
    getDrawStatistics,
    wouldBeInvited,
} from '@/../server/applications'
import type { 
    MvpApplicationStatus, 
    MvpMilestoneStatus, 
    MvpDeadlineType,
    MvpNotificationType,
    MvpImmigrationPathway 
} from '@/../drizzle/schema'

// ============================================
// SCHEMAS
// ============================================

const CreateApplicationSchema = z.object({
    targetDestination: z.string().min(1),
    immigrationPathway: z.enum([
        'express_entry', 'study_permit', 'family_sponsorship',
        'skilled_independent', 'state_nominated', 'study_visa',
        'd1_subordinate_work', 'd2_independent_entrepreneur', 
        'd7_passive_income', 'd8_digital_nomad', 'job_seeker_pt',
        'other'
    ]),
    notes: z.string().optional(),
})

const UpdateApplicationSchema = z.object({
    applicationId: z.number(),
    status: z.enum([
        'not_started', 'researching', 'preparing_documents',
        'language_testing', 'submitting', 'waiting_decision',
        'approved', 'rejected', 'on_hold'
    ]).optional(),
    applicationNumber: z.string().optional(),
    submissionDate: z.string().optional(),
    expectedDecisionDate: z.string().optional(),
    notes: z.string().optional(),
})

const UpdateMilestoneSchema = z.object({
    milestoneId: z.number(),
    status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'blocked']).optional(),
    dueDate: z.string().optional(),
})

const CreateDeadlineSchema = z.object({
    applicationId: z.number().optional(),
    documentId: z.number().optional(),
    type: z.enum([
        'document_expiry', 'application_window', 'test_validity',
        'medical_exam', 'biometrics', 'interview', 'submission', 'custom'
    ]),
    title: z.string().min(1),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    dueDate: z.string(),
    reminderDays: z.array(z.number()).optional(),
})

const UpdateDeadlineSchema = z.object({
    deadlineId: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    isCompleted: z.boolean().optional(),
})

// ============================================
// APPLICATION ACTIONS
// ============================================

export async function createApplicationAction(input: z.infer<typeof CreateApplicationSchema>) {
    const user = await getAuthenticatedUser()
    const validated = CreateApplicationSchema.parse(input)

    const application = await createApplication({
        userId: user.id,
        targetDestination: validated.targetDestination,
        immigrationPathway: validated.immigrationPathway as MvpImmigrationPathway,
        notes: validated.notes,
    })

    if (!application) {
        throw new ActionError('Failed to create application')
    }

    // Create a welcome notification
    await createNotification({
        userId: user.id,
        type: 'application_update',
        title: 'Application Created',
        titleAr: 'تم إنشاء الطلب',
        message: `Your ${validated.targetDestination} immigration application has been created. Start by completing your profile and gathering documents.`,
        messageAr: `تم إنشاء طلب الهجرة الخاص بك إلى ${validated.targetDestination}. ابدأ بإكمال ملفك الشخصي وجمع المستندات.`,
        link: '/dashboard',
    })

    revalidatePath('/dashboard')
    revalidatePath('/applications')

    return { success: true, applicationId: application.id }
}

export async function getApplicationsAction() {
    const user = await getAuthenticatedUser()
    return getUserApplications(user.id)
}

export async function getApplicationAction(applicationId: number) {
    const user = await getAuthenticatedUser()
    const application = await getApplication(applicationId)

    if (!application || application.userId !== user.id) {
        throw new ActionError('Application not found')
    }

    return application
}

export async function getActiveApplicationAction() {
    const user = await getAuthenticatedUser()
    return getActiveApplication(user.id)
}

export async function updateApplicationAction(input: z.infer<typeof UpdateApplicationSchema>) {
    const user = await getAuthenticatedUser()
    const validated = UpdateApplicationSchema.parse(input)

    const application = await getApplication(validated.applicationId)
    if (!application || application.userId !== user.id) {
        throw new ActionError('Application not found')
    }

    const updates: Record<string, unknown> = {}
    if (validated.status) updates.status = validated.status
    if (validated.applicationNumber !== undefined) updates.applicationNumber = validated.applicationNumber
    if (validated.submissionDate) updates.submissionDate = new Date(validated.submissionDate)
    if (validated.expectedDecisionDate) updates.expectedDecisionDate = new Date(validated.expectedDecisionDate)
    if (validated.notes !== undefined) updates.notes = validated.notes

    await updateApplication(validated.applicationId, updates)

    // Send notification for significant status changes
    if (validated.status && ['approved', 'rejected', 'waiting_decision'].includes(validated.status)) {
        const statusMessages: Record<string, { en: string; ar: string }> = {
            approved: { 
                en: 'Congratulations! Your application has been approved!', 
                ar: 'تهانينا! تمت الموافقة على طلبك!' 
            },
            rejected: { 
                en: 'Your application status has been updated to rejected.', 
                ar: 'تم تحديث حالة طلبك إلى مرفوض.' 
            },
            waiting_decision: { 
                en: 'Your application is now awaiting a decision.', 
                ar: 'طلبك الآن في انتظار القرار.' 
            },
        }

        const message = statusMessages[validated.status]
        if (message) {
            await createNotification({
                userId: user.id,
                type: 'application_update',
                title: 'Application Status Update',
                titleAr: 'تحديث حالة الطلب',
                message: message.en,
                messageAr: message.ar,
                link: '/dashboard',
            })
        }
    }

    revalidatePath('/dashboard')
    revalidatePath('/applications')

    return { success: true }
}

export async function deleteApplicationAction(applicationId: number) {
    const user = await getAuthenticatedUser()
    const application = await getApplication(applicationId)

    if (!application || application.userId !== user.id) {
        throw new ActionError('Application not found')
    }

    await deleteApplication(applicationId)

    revalidatePath('/dashboard')
    revalidatePath('/applications')

    return { success: true }
}

// ============================================
// MILESTONE ACTIONS
// ============================================

export async function getMilestonesAction(applicationId: number) {
    const user = await getAuthenticatedUser()
    const application = await getApplication(applicationId)

    if (!application || application.userId !== user.id) {
        throw new ActionError('Application not found')
    }

    return getApplicationMilestones(applicationId)
}

export async function updateMilestoneAction(input: z.infer<typeof UpdateMilestoneSchema>) {
    const user = await getAuthenticatedUser()
    const validated = UpdateMilestoneSchema.parse(input)

    // Note: In production, you'd verify the milestone belongs to user's application
    const updates: Record<string, unknown> = {}
    if (validated.status) updates.status = validated.status
    if (validated.dueDate) updates.dueDate = new Date(validated.dueDate)

    await updateMilestone(validated.milestoneId, updates)

    revalidatePath('/dashboard')

    return { success: true }
}

export async function completeMilestoneAction(milestoneId: number) {
    await getAuthenticatedUser()
    
    await completeMilestone(milestoneId)

    revalidatePath('/dashboard')

    return { success: true }
}

// ============================================
// DEADLINE ACTIONS
// ============================================

export async function createDeadlineAction(input: z.infer<typeof CreateDeadlineSchema>) {
    const user = await getAuthenticatedUser()
    const validated = CreateDeadlineSchema.parse(input)

    const deadline = await createDeadline({
        userId: user.id,
        applicationId: validated.applicationId,
        documentId: validated.documentId,
        type: validated.type as MvpDeadlineType,
        title: validated.title,
        titleAr: validated.titleAr,
        description: validated.description,
        descriptionAr: validated.descriptionAr,
        dueDate: new Date(validated.dueDate),
        reminderDays: validated.reminderDays || [30, 14, 7, 1],
    })

    if (!deadline) {
        throw new ActionError('Failed to create deadline')
    }

    revalidatePath('/dashboard')

    return { success: true, deadlineId: deadline.id }
}

export async function getDeadlinesAction() {
    const user = await getAuthenticatedUser()
    return getUserDeadlines(user.id)
}

export async function getUpcomingDeadlinesAction(days: number = 30) {
    const user = await getAuthenticatedUser()
    return getUpcomingDeadlines(user.id, days)
}

export async function getOverdueDeadlinesAction() {
    const user = await getAuthenticatedUser()
    return getOverdueDeadlines(user.id)
}

export async function updateDeadlineAction(input: z.infer<typeof UpdateDeadlineSchema>) {
    const user = await getAuthenticatedUser()
    const validated = UpdateDeadlineSchema.parse(input)

    const updates: Record<string, unknown> = {}
    if (validated.title) updates.title = validated.title
    if (validated.description) updates.description = validated.description
    if (validated.dueDate) updates.dueDate = new Date(validated.dueDate)
    if (validated.isCompleted !== undefined) {
        updates.isCompleted = validated.isCompleted
        if (validated.isCompleted) {
            updates.completedAt = new Date()
        }
    }

    await updateDeadline(validated.deadlineId, updates)

    revalidatePath('/dashboard')

    return { success: true }
}

export async function completeDeadlineAction(deadlineId: number) {
    await getAuthenticatedUser()
    
    await completeDeadline(deadlineId)

    revalidatePath('/dashboard')

    return { success: true }
}

export async function deleteDeadlineAction(deadlineId: number) {
    await getAuthenticatedUser()
    
    await deleteDeadline(deadlineId)

    revalidatePath('/dashboard')

    return { success: true }
}

// ============================================
// NOTIFICATION ACTIONS
// ============================================

export async function getNotificationsAction(limit: number = 20) {
    const user = await getAuthenticatedUser()
    return getUserNotifications(user.id, limit)
}

export async function getUnreadNotificationsAction() {
    const user = await getAuthenticatedUser()
    return getUnreadNotifications(user.id)
}

export async function getUnreadNotificationCountAction() {
    const user = await getAuthenticatedUser()
    return getUnreadNotificationCount(user.id)
}

export async function markNotificationAsReadAction(notificationId: number) {
    await getAuthenticatedUser()
    
    await markNotificationAsRead(notificationId)

    return { success: true }
}

export async function markAllNotificationsAsReadAction() {
    const user = await getAuthenticatedUser()
    
    await markAllNotificationsAsRead(user.id)

    return { success: true }
}

// ============================================
// EXPRESS ENTRY DRAWS ACTIONS
// ============================================

export async function getLatestDrawsAction(limit: number = 10) {
    return getLatestExpressEntryDraws(limit)
}

export async function getDrawStatisticsAction() {
    return getDrawStatistics()
}

export async function checkCrsScoreAction(crsScore: number) {
    const draws = await getLatestExpressEntryDraws(20)
    return wouldBeInvited(crsScore, draws)
}

// ============================================
// DASHBOARD SUMMARY ACTION
// ============================================

export async function getDashboardSummaryAction() {
    const user = await getAuthenticatedUser()

    const [
        activeApplication,
        upcomingDeadlines,
        overdueDeadlines,
        unreadCount,
        latestDraws,
    ] = await Promise.all([
        getActiveApplication(user.id),
        getUpcomingDeadlines(user.id, 30),
        getOverdueDeadlines(user.id),
        getUnreadNotificationCount(user.id),
        getLatestExpressEntryDraws(5),
    ])

    let milestones: Awaited<ReturnType<typeof getApplicationMilestones>> = []
    if (activeApplication) {
        milestones = await getApplicationMilestones(activeApplication.id)
    }

    const completedMilestones = milestones.filter(m => m.status === 'completed').length
    const totalMilestones = milestones.length
    const progressPercentage = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0

    return {
        application: activeApplication,
        milestones,
        upcomingDeadlines,
        overdueDeadlines,
        unreadNotificationCount: unreadCount,
        latestDraws,
        progress: {
            completed: completedMilestones,
            total: totalMilestones,
            percentage: progressPercentage,
        },
    }
}
