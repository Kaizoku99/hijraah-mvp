import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  pgEnum,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";

// ============================================
// MVP ENUMS (prefixed to avoid conflicts with parent project)
// ============================================

export const mvpDocumentStatusEnum = pgEnum("mvp_document_status", [
  "uploaded",
  "processing",
  "completed",
  "failed",
]);

export const mvpEducationLevelEnum = pgEnum("mvp_education_level", [
  "high_school",
  "bachelor",
  "master",
  "phd",
  "other",
]);

export const mvpImmigrationPathwayEnum = pgEnum("mvp_immigration_pathway", [
  "express_entry",
  "study_permit",
  "family_sponsorship",
  "other",
]);

export const mvpKnowledgeCategoryEnum = pgEnum("mvp_knowledge_category", [
  "express_entry",
  "study_permit",
  "work_permit",
  "family_sponsorship",
  "provincial_nominee",
  "documents",
  "fees",
  "timeline",
  "other",
]);

export const mvpLanguageEnum = pgEnum("mvp_language", ["ar", "en"]);

export const mvpLanguageProficiencyEnum = pgEnum("mvp_language_proficiency", [
  "none",
  "basic",
  "intermediate",
  "advanced",
  "native",
]);

export const mvpMaritalStatusEnum = pgEnum("mvp_marital_status", [
  "single",
  "married",
  "divorced",
  "widowed",
]);

export const mvpMessageRoleEnum = pgEnum("mvp_message_role", [
  "user",
  "assistant",
  "system",
]);

export const mvpRoleEnum = pgEnum("mvp_role", ["user", "admin"]);

export const mvpSenderTypeEnum = pgEnum("mvp_sender_type", ["user", "agent", "bot"]);

export const mvpSopStatusEnum = pgEnum("mvp_sop_status", [
  "draft",
  "generated",
  "revised",
  "final",
]);

export const mvpSubscriptionStatusEnum = pgEnum("mvp_subscription_status", [
  "active",
  "canceled",
  "expired",
]);

export const mvpSubscriptionTierEnum = pgEnum("mvp_subscription_tier", [
  "free",
  "essential",
  "premium",
  "vip",
]);

export const mvpTicketPriorityEnum = pgEnum("mvp_ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const mvpTicketStatusEnum = pgEnum("mvp_ticket_status", [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
]);

// ============================================
// MVP TABLES (prefixed to coexist with parent project)
// ============================================

// Users table - links to Supabase Auth
export const users = pgTable("mvp_users", {
  id: serial("id").primaryKey(),
  authId: uuid("auth_id").notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mvpRoleEnum("role").default("user").notNull(),
  subscriptionTier: mvpSubscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  subscriptionStatus: mvpSubscriptionStatusEnum("subscription_status")
    .default("active")
    .notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at", {
    withTimezone: true,
  }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  preferredLanguage: mvpLanguageEnum("preferred_language").default("ar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// User Profiles - extended immigration info
export const userProfiles = pgTable("mvp_user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  nationality: varchar("nationality", { length: 100 }),
  sourceCountry: varchar("source_country", { length: 100 }),
  currentCountry: varchar("current_country", { length: 100 }),
  maritalStatus: mvpMaritalStatusEnum("marital_status"),
  educationLevel: mvpEducationLevelEnum("education_level"),
  fieldOfStudy: varchar("field_of_study", { length: 255 }),
  yearsOfExperience: integer("years_of_experience"),
  currentOccupation: varchar("current_occupation", { length: 255 }),
  nocCode: varchar("noc_code", { length: 10 }),
  englishLevel: mvpLanguageProficiencyEnum("english_level"),
  frenchLevel: mvpLanguageProficiencyEnum("french_level"),
  ieltsScore: numeric("ielts_score", { precision: 3, scale: 1 }),
  tefScore: numeric("tef_score", { precision: 3, scale: 1 }),
  targetDestination: varchar("target_destination", { length: 100 })
    .default("Canada")
    .notNull(),
  immigrationPathway: mvpImmigrationPathwayEnum("immigration_pathway"),
  profileCompleteness: integer("profile_completeness").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Conversations for AI chat
export const conversations = pgTable("mvp_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  language: mvpLanguageEnum("language").default("ar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Messages within conversations
export const messages = pgTable("mvp_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: mvpMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// CRS Score Assessments
export const crsAssessments = pgTable("mvp_crs_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  educationLevel: varchar("education_level", { length: 100 }),
  canadianEducation: boolean("canadian_education").default(false),
  firstLanguageScore: json("first_language_score"),
  secondLanguageScore: json("second_language_score"),
  canadianWorkExperience: integer("canadian_work_experience"),
  foreignWorkExperience: integer("foreign_work_experience"),
  hasSpouse: boolean("has_spouse").default(false),
  spouseEducation: varchar("spouse_education", { length: 100 }),
  spouseLanguageScore: json("spouse_language_score"),
  spouseCanadianWorkExperience: integer("spouse_canadian_work_experience"),
  hasSiblingInCanada: boolean("has_sibling_in_canada").default(false),
  hasFrenchLanguageSkills: boolean("has_french_language_skills").default(false),
  hasProvincialNomination: boolean("has_provincial_nomination").default(false),
  hasJobOffer: boolean("has_job_offer").default(false),
  hasCanadianStudyExperience: boolean("has_canadian_study_experience").default(
    false
  ),
  totalScore: integer("total_score").notNull(),
  coreScore: integer("core_score"),
  spouseScore: integer("spouse_score"),
  skillTransferabilityScore: integer("skill_transferability_score"),
  additionalScore: integer("additional_score"),
  recommendations: json("recommendations"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Document Checklists
export const documentChecklists = pgTable("mvp_document_checklists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceCountry: varchar("source_country", { length: 100 }).notNull(),
  immigrationPathway: varchar("immigration_pathway", { length: 100 }).notNull(),
  items: json("items").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Documents (uploaded files)
export const documents = pgTable("mvp_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  checklistId: integer("checklist_id").references(() => documentChecklists.id, {
    onDelete: "set null",
  }),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  ocrProcessed: boolean("ocr_processed").default(false),
  ocrText: text("ocr_text"),
  translatedText: text("translated_text"),
  status: mvpDocumentStatusEnum("status").default("uploaded").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// SOP Generations
export const sopGenerations = pgTable("mvp_sop_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  background: text("background"),
  education: text("education"),
  workExperience: text("work_experience"),
  motivations: text("motivations"),
  goals: text("goals"),
  whyCanada: text("why_canada"),
  additionalInfo: text("additional_info"),
  generatedSop: text("generated_sop"),
  version: integer("version").default(1).notNull(),
  language: mvpLanguageEnum("language").default("en").notNull(),
  qualityScore: integer("quality_score"),
  suggestions: json("suggestions"),
  status: mvpSopStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Knowledge Base for RAG
export const knowledgeBase = pgTable("mvp_knowledge_base", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  category: mvpKnowledgeCategoryEnum("category").notNull(),
  sourceCountry: varchar("source_country", { length: 100 }),
  embedding: json("embedding"),
  sourceUrl: text("source_url"),
  lastVerified: timestamp("last_verified", { withTimezone: true }),
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Guides (CMS for immigration guides)
export const guides = pgTable("mvp_guides", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  titleEn: varchar("title_en", { length: 500 }).notNull(),
  titleAr: varchar("title_ar", { length: 500 }).notNull(),
  contentEn: text("content_en").notNull(),
  contentAr: text("content_ar").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags"),
  metaDescriptionEn: text("meta_description_en"),
  metaDescriptionAr: text("meta_description_ar"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  version: integer("version").default(1).notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Support Tickets (for WhatsApp integration)
export const supportTickets = pgTable("mvp_support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 500 }),
  status: mvpTicketStatusEnum("status").default("open").notNull(),
  priority: mvpTicketPriorityEnum("priority").default("medium").notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  whatsappConversationId: varchar("whatsapp_conversation_id", { length: 255 }),
  assignedToAgent: varchar("assigned_to_agent", { length: 255 }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Support Messages
export const supportMessages = pgTable("mvp_support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  senderType: mvpSenderTypeEnum("sender_type").notNull(),
  senderName: varchar("sender_name", { length: 255 }),
  content: text("content").notNull(),
  isAutomated: boolean("is_automated").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Usage Tracking
export const usageTracking = pgTable("mvp_usage_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  chatMessagesCount: integer("chat_messages_count").default(0).notNull(),
  sopGenerationsCount: integer("sop_generations_count").default(0).notNull(),
  documentUploadsCount: integer("document_uploads_count").default(0).notNull(),
  crsCalculationsCount: integer("crs_calculations_count").default(0).notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Working Memory for AI SDK memory (persistent AI scratchpad)
export const workingMemory = pgTable("mvp_working_memory", {
  id: text("id").primaryKey(),
  scope: text("scope").notNull(), // 'user' or 'chat'
  chatId: text("chat_id"),
  userId: text("user_id"),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// AI Memory Messages (for conversation history in memory provider)
export const memoryMessages = pgTable("mvp_memory_messages", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  userId: text("user_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type CrsAssessment = typeof crsAssessments.$inferSelect;
export type InsertCrsAssessment = typeof crsAssessments.$inferInsert;

export type DocumentChecklist = typeof documentChecklists.$inferSelect;
export type InsertDocumentChecklist = typeof documentChecklists.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type SopGeneration = typeof sopGenerations.$inferSelect;
export type InsertSopGeneration = typeof sopGenerations.$inferInsert;

export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseEntry = typeof knowledgeBase.$inferInsert;

export type Guide = typeof guides.$inferSelect;
export type InsertGuide = typeof guides.$inferInsert;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

export type WorkingMemory = typeof workingMemory.$inferSelect;
export type InsertWorkingMemory = typeof workingMemory.$inferInsert;

export type MemoryMessage = typeof memoryMessages.$inferSelect;
export type InsertMemoryMessage = typeof memoryMessages.$inferInsert;

// Export enum types for use in code
export type MvpDocumentStatus = typeof mvpDocumentStatusEnum.enumValues[number];
export type MvpEducationLevel = typeof mvpEducationLevelEnum.enumValues[number];
export type MvpImmigrationPathway = typeof mvpImmigrationPathwayEnum.enumValues[number];
export type MvpKnowledgeCategory = typeof mvpKnowledgeCategoryEnum.enumValues[number];
export type MvpLanguage = typeof mvpLanguageEnum.enumValues[number];
export type MvpLanguageProficiency = typeof mvpLanguageProficiencyEnum.enumValues[number];
export type MvpMaritalStatus = typeof mvpMaritalStatusEnum.enumValues[number];
export type MvpMessageRole = typeof mvpMessageRoleEnum.enumValues[number];
export type MvpRole = typeof mvpRoleEnum.enumValues[number];
export type MvpSenderType = typeof mvpSenderTypeEnum.enumValues[number];
export type MvpSopStatus = typeof mvpSopStatusEnum.enumValues[number];
export type MvpSubscriptionStatus = typeof mvpSubscriptionStatusEnum.enumValues[number];
export type MvpSubscriptionTier = typeof mvpSubscriptionTierEnum.enumValues[number];
export type MvpTicketPriority = typeof mvpTicketPriorityEnum.enumValues[number];
export type MvpTicketStatus = typeof mvpTicketStatusEnum.enumValues[number];
