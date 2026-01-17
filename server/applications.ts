import { eq, desc, and, gte, lte, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  immigrationApplications,
  applicationMilestones,
  deadlines,
  notifications,
  expressEntryDraws,
  InsertImmigrationApplication,
  InsertApplicationMilestone,
  InsertDeadline,
  InsertNotification,
  InsertExpressEntryDraw,
  ImmigrationApplication,
  ApplicationMilestone,
  Deadline,
  Notification,
  ExpressEntryDraw,
  MvpImmigrationPathway,
} from "../drizzle/schema";

// ============================================
// IMMIGRATION APPLICATIONS
// ============================================

export async function createApplication(
  application: InsertImmigrationApplication
): Promise<ImmigrationApplication | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .insert(immigrationApplications)
    .values(application)
    .returning();

  // Create default milestones based on pathway
  if (result[0]) {
    await createDefaultMilestones(result[0].id, result[0].immigrationPathway);
  }

  return result[0] || null;
}

export async function getUserApplications(
  userId: number
): Promise<ImmigrationApplication[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(immigrationApplications)
    .where(eq(immigrationApplications.userId, userId))
    .orderBy(desc(immigrationApplications.updatedAt));
}

export async function getApplication(
  applicationId: number
): Promise<ImmigrationApplication | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(immigrationApplications)
    .where(eq(immigrationApplications.id, applicationId))
    .limit(1);

  return result[0] || null;
}

export async function getActiveApplication(
  userId: number
): Promise<ImmigrationApplication | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(immigrationApplications)
    .where(
      and(
        eq(immigrationApplications.userId, userId),
        sql`${immigrationApplications.status} NOT IN ('approved', 'rejected')`
      )
    )
    .orderBy(desc(immigrationApplications.updatedAt))
    .limit(1);

  return result[0] || null;
}

export async function updateApplication(
  applicationId: number,
  updates: Partial<InsertImmigrationApplication>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(immigrationApplications)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(immigrationApplications.id, applicationId));
}

export async function deleteApplication(applicationId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(immigrationApplications)
    .where(eq(immigrationApplications.id, applicationId));
}

// ============================================
// APPLICATION MILESTONES
// ============================================

const CANADA_EXPRESS_ENTRY_MILESTONES = [
  {
    title: "Create Express Entry Profile",
    titleAr: "إنشاء ملف Express Entry",
    description: "Complete your Express Entry profile on the IRCC website",
    descriptionAr: "أكمل ملف Express Entry الخاص بك على موقع IRCC",
    order: 1,
  },
  {
    title: "Calculate CRS Score",
    titleAr: "حساب نقاط CRS",
    description: "Calculate your Comprehensive Ranking System score",
    descriptionAr: "احسب نقاط نظام الترتيب الشامل الخاصة بك",
    order: 2,
  },
  {
    title: "Language Test",
    titleAr: "اختبار اللغة",
    description: "Complete IELTS, CELPIP, or TEF language test",
    descriptionAr: "أكمل اختبار اللغة IELTS أو CELPIP أو TEF",
    order: 3,
  },
  {
    title: "Educational Credential Assessment",
    titleAr: "تقييم الشهادات التعليمية",
    description: "Get your foreign credentials assessed by a designated organization",
    descriptionAr: "احصل على تقييم شهاداتك من منظمة معتمدة",
    order: 4,
  },
  {
    title: "Gather Documents",
    titleAr: "جمع المستندات",
    description: "Collect all required documents for your application",
    descriptionAr: "اجمع جميع المستندات المطلوبة لطلبك",
    order: 5,
  },
  {
    title: "Wait for ITA",
    titleAr: "انتظار الدعوة للتقديم",
    description: "Wait for an Invitation to Apply based on draw results",
    descriptionAr: "انتظر دعوة للتقديم بناءً على نتائج السحب",
    order: 6,
  },
  {
    title: "Submit Application",
    titleAr: "تقديم الطلب",
    description: "Submit your permanent residence application",
    descriptionAr: "قدم طلب الإقامة الدائمة الخاص بك",
    order: 7,
  },
  {
    title: "Biometrics",
    titleAr: "البيانات البيومترية",
    description: "Complete biometrics collection at a designated location",
    descriptionAr: "أكمل جمع البيانات البيومترية في موقع معتمد",
    order: 8,
  },
  {
    title: "Medical Exam",
    titleAr: "الفحص الطبي",
    description: "Complete immigration medical examination",
    descriptionAr: "أكمل الفحص الطبي للهجرة",
    order: 9,
  },
  {
    title: "Wait for Decision",
    titleAr: "انتظار القرار",
    description: "Wait for IRCC to process your application",
    descriptionAr: "انتظر معالجة طلبك من قبل IRCC",
    order: 10,
  },
];

const PORTUGAL_D7_MILESTONES = [
  {
    title: "Gather Financial Documents",
    titleAr: "جمع المستندات المالية",
    description: "Prepare proof of passive income (pension, investments, rental income)",
    descriptionAr: "جهز إثبات الدخل السلبي (معاش، استثمارات، دخل إيجار)",
    order: 1,
  },
  {
    title: "Criminal Record Certificate",
    titleAr: "شهادة السجل الجنائي",
    description: "Obtain criminal record certificate from your country",
    descriptionAr: "احصل على شهادة السجل الجنائي من بلدك",
    order: 2,
  },
  {
    title: "Health Insurance",
    titleAr: "التأمين الصحي",
    description: "Arrange valid health insurance covering Portugal",
    descriptionAr: "احصل على تأمين صحي صالح يغطي البرتغال",
    order: 3,
  },
  {
    title: "Accommodation Proof",
    titleAr: "إثبات السكن",
    description: "Secure accommodation in Portugal (rental contract or property)",
    descriptionAr: "وثق السكن في البرتغال (عقد إيجار أو ملكية)",
    order: 4,
  },
  {
    title: "Schedule VFS Appointment",
    titleAr: "حجز موعد VFS",
    description: "Book visa application appointment at VFS or Portuguese consulate",
    descriptionAr: "احجز موعد طلب التأشيرة في VFS أو القنصلية البرتغالية",
    order: 5,
  },
  {
    title: "Submit Visa Application",
    titleAr: "تقديم طلب التأشيرة",
    description: "Submit all documents at your visa appointment",
    descriptionAr: "قدم جميع المستندات في موعد التأشيرة",
    order: 6,
  },
  {
    title: "Wait for Decision",
    titleAr: "انتظار القرار",
    description: "Wait for visa processing (usually 2-3 months)",
    descriptionAr: "انتظر معالجة التأشيرة (عادة 2-3 أشهر)",
    order: 7,
  },
  {
    title: "Travel to Portugal",
    titleAr: "السفر إلى البرتغال",
    description: "Enter Portugal within the visa validity period",
    descriptionAr: "ادخل البرتغال خلال فترة صلاحية التأشيرة",
    order: 8,
  },
  {
    title: "Apply for Residence Permit",
    titleAr: "التقدم لتصريح الإقامة",
    description: "Apply for residence permit at SEF within 4 months of arrival",
    descriptionAr: "تقدم لتصريح الإقامة في SEF خلال 4 أشهر من الوصول",
    order: 9,
  },
];

async function createDefaultMilestones(
  applicationId: number,
  pathway: MvpImmigrationPathway
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  let milestones: typeof CANADA_EXPRESS_ENTRY_MILESTONES = [];

  switch (pathway) {
    case "express_entry":
      milestones = CANADA_EXPRESS_ENTRY_MILESTONES;
      break;
    case "d7_passive_income":
    case "d8_digital_nomad":
    case "d2_independent_entrepreneur":
    case "d1_subordinate_work":
    case "job_seeker_pt":
      milestones = PORTUGAL_D7_MILESTONES;
      break;
    default:
      // Generic milestones for other pathways
      milestones = [
        {
          title: "Research Requirements",
          titleAr: "البحث عن المتطلبات",
          description: "Research the specific requirements for your immigration pathway",
          descriptionAr: "ابحث عن المتطلبات المحددة لمسار الهجرة الخاص بك",
          order: 1,
        },
        {
          title: "Gather Documents",
          titleAr: "جمع المستندات",
          description: "Collect all required documents",
          descriptionAr: "اجمع جميع المستندات المطلوبة",
          order: 2,
        },
        {
          title: "Submit Application",
          titleAr: "تقديم الطلب",
          description: "Submit your application",
          descriptionAr: "قدم طلبك",
          order: 3,
        },
        {
          title: "Wait for Decision",
          titleAr: "انتظار القرار",
          description: "Wait for application processing",
          descriptionAr: "انتظر معالجة الطلب",
          order: 4,
        },
      ];
  }

  const milestonesWithAppId = milestones.map((m) => ({
    applicationId,
    ...m,
  }));

  await db.insert(applicationMilestones).values(milestonesWithAppId);
}

export async function getApplicationMilestones(
  applicationId: number
): Promise<ApplicationMilestone[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(applicationMilestones)
    .where(eq(applicationMilestones.applicationId, applicationId))
    .orderBy(asc(applicationMilestones.order));
}

export async function updateMilestone(
  milestoneId: number,
  updates: Partial<InsertApplicationMilestone>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(applicationMilestones)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(applicationMilestones.id, milestoneId));
}

export async function completeMilestone(milestoneId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(applicationMilestones)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(applicationMilestones.id, milestoneId));
}

// ============================================
// DEADLINES
// ============================================

export async function createDeadline(
  deadline: InsertDeadline
): Promise<Deadline | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(deadlines).values(deadline).returning();
  return result[0] || null;
}

export async function getUserDeadlines(userId: number): Promise<Deadline[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(deadlines)
    .where(eq(deadlines.userId, userId))
    .orderBy(asc(deadlines.dueDate));
}

export async function getUpcomingDeadlines(
  userId: number,
  days: number = 30
): Promise<Deadline[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await db
    .select()
    .from(deadlines)
    .where(
      and(
        eq(deadlines.userId, userId),
        eq(deadlines.isCompleted, false),
        gte(deadlines.dueDate, now),
        lte(deadlines.dueDate, futureDate)
      )
    )
    .orderBy(asc(deadlines.dueDate));
}

export async function getOverdueDeadlines(userId: number): Promise<Deadline[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const now = new Date();

  return await db
    .select()
    .from(deadlines)
    .where(
      and(
        eq(deadlines.userId, userId),
        eq(deadlines.isCompleted, false),
        lte(deadlines.dueDate, now)
      )
    )
    .orderBy(asc(deadlines.dueDate));
}

export async function updateDeadline(
  deadlineId: number,
  updates: Partial<InsertDeadline>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(deadlines)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(deadlines.id, deadlineId));
}

export async function completeDeadline(deadlineId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(deadlines)
    .set({
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deadlines.id, deadlineId));
}

export async function deleteDeadline(deadlineId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(deadlines).where(eq(deadlines.id, deadlineId));
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(
  notification: InsertNotification
): Promise<Notification | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(notifications).values(notification).returning();
  return result[0] || null;
}

export async function getUserNotifications(
  userId: number,
  limit: number = 20
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(
  userId: number
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    )
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return Number(result[0]?.count) || 0;
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function deleteNotification(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

// ============================================
// EXPRESS ENTRY DRAWS
// ============================================

export async function createExpressEntryDraw(
  draw: InsertExpressEntryDraw
): Promise<ExpressEntryDraw | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(expressEntryDraws).values(draw).returning();
  return result[0] || null;
}

export async function getLatestExpressEntryDraws(
  limit: number = 10
): Promise<ExpressEntryDraw[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(expressEntryDraws)
    .orderBy(desc(expressEntryDraws.drawDate))
    .limit(limit);
}

export async function getExpressEntryDrawByNumber(
  drawNumber: number
): Promise<ExpressEntryDraw | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(expressEntryDraws)
    .where(eq(expressEntryDraws.drawNumber, drawNumber))
    .limit(1);

  return result[0] || null;
}

export async function getExpressEntryDrawsByType(
  drawType: string,
  limit: number = 20
): Promise<ExpressEntryDraw[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(expressEntryDraws)
    .where(eq(expressEntryDraws.drawType, drawType))
    .orderBy(desc(expressEntryDraws.drawDate))
    .limit(limit);
}

// Utility function to calculate if a CRS score would have been invited
export function wouldBeInvited(
  crsScore: number,
  draws: ExpressEntryDraw[]
): { invited: boolean; matchingDraws: ExpressEntryDraw[] } {
  const matchingDraws = draws.filter((draw) => crsScore >= draw.crsMinimum);
  return {
    invited: matchingDraws.length > 0,
    matchingDraws,
  };
}

// Get statistics about draws
export async function getDrawStatistics(): Promise<{
  averageCrs: number;
  lowestCrs: number;
  highestCrs: number;
  totalInvitations: number;
  drawCount: number;
} | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select({
      avgCrs: sql<number>`AVG(${expressEntryDraws.crsMinimum})`,
      minCrs: sql<number>`MIN(${expressEntryDraws.crsMinimum})`,
      maxCrs: sql<number>`MAX(${expressEntryDraws.crsMinimum})`,
      totalInvitations: sql<number>`SUM(${expressEntryDraws.invitationsIssued})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expressEntryDraws);

  if (!result[0]) return null;

  return {
    averageCrs: Math.round(Number(result[0].avgCrs) || 0),
    lowestCrs: Number(result[0].minCrs) || 0,
    highestCrs: Number(result[0].maxCrs) || 0,
    totalInvitations: Number(result[0].totalInvitations) || 0,
    drawCount: Number(result[0].count) || 0,
  };
}
