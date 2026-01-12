import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Subscription info
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "essential", "premium", "vip"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "expired"]).default("active").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  // User preferences
  preferredLanguage: mysqlEnum("preferredLanguage", ["ar", "en"]).default("ar").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles with immigration-specific information
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Personal information
  dateOfBirth: timestamp("dateOfBirth"),
  nationality: varchar("nationality", { length: 100 }),
  sourceCountry: varchar("sourceCountry", { length: 100 }), // Tunisia, Jordan, Lebanon, Morocco, etc.
  currentCountry: varchar("currentCountry", { length: 100 }),
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed"]),
  
  // Education
  educationLevel: mysqlEnum("educationLevel", ["high_school", "bachelor", "master", "phd", "other"]),
  fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
  
  // Work experience
  yearsOfExperience: int("yearsOfExperience"),
  currentOccupation: varchar("currentOccupation", { length: 255 }),
  nocCode: varchar("nocCode", { length: 10 }), // National Occupational Classification code
  
  // Language proficiency
  englishLevel: mysqlEnum("englishLevel", ["none", "basic", "intermediate", "advanced", "native"]),
  frenchLevel: mysqlEnum("frenchLevel", ["none", "basic", "intermediate", "advanced", "native"]),
  ieltsScore: decimal("ieltsScore", { precision: 3, scale: 1 }),
  tefScore: decimal("tefScore", { precision: 3, scale: 1 }),
  
  // Immigration goals
  targetDestination: varchar("targetDestination", { length: 100 }).default("Canada").notNull(),
  immigrationPathway: mysqlEnum("immigrationPathway", ["express_entry", "study_permit", "family_sponsorship", "other"]),
  
  // Profile completion
  profileCompleteness: int("profileCompleteness").default(0).notNull(), // 0-100%
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Chat conversations
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  language: mysqlEnum("language", ["ar", "en"]).default("ar").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Chat messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * CRS (Comprehensive Ranking System) assessments
 */
export const crsAssessments = mysqlTable("crs_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Core factors
  age: int("age"),
  educationLevel: varchar("educationLevel", { length: 100 }),
  canadianEducation: boolean("canadianEducation").default(false),
  firstLanguageScore: json("firstLanguageScore"), // {listening, reading, writing, speaking}
  secondLanguageScore: json("secondLanguageScore"),
  canadianWorkExperience: int("canadianWorkExperience"), // years
  foreignWorkExperience: int("foreignWorkExperience"), // years
  
  // Spouse factors (if applicable)
  hasSpouse: boolean("hasSpouse").default(false),
  spouseEducation: varchar("spouseEducation", { length: 100 }),
  spouseLanguageScore: json("spouseLanguageScore"),
  spouseCanadianWorkExperience: int("spouseCanadianWorkExperience"),
  
  // Additional factors
  hasSiblingInCanada: boolean("hasSiblingInCanada").default(false),
  hasFrenchLanguageSkills: boolean("hasFrenchLanguageSkills").default(false),
  hasProvincialNomination: boolean("hasProvincialNomination").default(false),
  hasJobOffer: boolean("hasJobOffer").default(false),
  hasCanadianStudyExperience: boolean("hasCanadianStudyExperience").default(false),
  
  // Calculated scores
  totalScore: int("totalScore").notNull(),
  coreScore: int("coreScore"),
  spouseScore: int("spouseScore"),
  skillTransferabilityScore: int("skillTransferabilityScore"),
  additionalScore: int("additionalScore"),
  
  // Recommendations
  recommendations: json("recommendations"), // Array of improvement suggestions
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrsAssessment = typeof crsAssessments.$inferSelect;
export type InsertCrsAssessment = typeof crsAssessments.$inferInsert;

/**
 * Document checklists
 */
export const documentChecklists = mysqlTable("document_checklists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceCountry: varchar("sourceCountry", { length: 100 }).notNull(),
  immigrationPathway: varchar("immigrationPathway", { length: 100 }).notNull(),
  items: json("items").notNull(), // Array of checklist items with status
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentChecklist = typeof documentChecklists.$inferSelect;
export type InsertDocumentChecklist = typeof documentChecklists.$inferInsert;

/**
 * User documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  checklistId: int("checklistId").references(() => documentChecklists.id, { onDelete: "set null" }),
  
  documentType: varchar("documentType", { length: 100 }).notNull(), // passport, degree, transcript, etc.
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // bytes
  
  // OCR and translation
  ocrProcessed: boolean("ocrProcessed").default(false),
  ocrText: text("ocrText"),
  translatedText: text("translatedText"),
  
  status: mysqlEnum("status", ["uploaded", "processing", "completed", "failed"]).default("uploaded").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Statement of Purpose (SOP) generations
 */
export const sopGenerations = mysqlTable("sop_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // User input
  background: text("background"),
  education: text("education"),
  workExperience: text("workExperience"),
  motivations: text("motivations"),
  goals: text("goals"),
  whyCanada: text("whyCanada"),
  additionalInfo: text("additionalInfo"),
  
  // Generated content
  generatedSop: text("generatedSop"),
  version: int("version").default(1).notNull(),
  language: mysqlEnum("language", ["ar", "en"]).default("en").notNull(),
  
  // Quality metrics
  qualityScore: int("qualityScore"), // 0-100
  suggestions: json("suggestions"), // Array of improvement suggestions
  
  status: mysqlEnum("status", ["draft", "generated", "revised", "final"]).default("draft").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SopGeneration = typeof sopGenerations.$inferSelect;
export type InsertSopGeneration = typeof sopGenerations.$inferInsert;

/**
 * Immigration knowledge base (for RAG)
 */
export const knowledgeBase = mysqlTable("knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  contentAr: text("contentAr"), // Arabic translation
  
  category: mysqlEnum("category", [
    "express_entry",
    "study_permit",
    "work_permit",
    "family_sponsorship",
    "provincial_nominee",
    "documents",
    "fees",
    "timeline",
    "other"
  ]).notNull(),
  
  sourceCountry: varchar("sourceCountry", { length: 100 }), // Specific to a country, or null for general
  
  // For semantic search
  embedding: json("embedding"), // Vector embedding from Google embeddings
  
  // Metadata
  sourceUrl: text("sourceUrl"),
  lastVerified: timestamp("lastVerified"),
  version: int("version").default(1).notNull(),
  
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Immigration guides and content
 */
export const guides = mysqlTable("guides", {
  id: int("id").autoincrement().primaryKey(),
  
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  titleEn: varchar("titleEn", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }).notNull(),
  contentEn: text("contentEn").notNull(),
  contentAr: text("contentAr").notNull(),
  
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags"), // Array of tags
  
  // SEO
  metaDescriptionEn: text("metaDescriptionEn"),
  metaDescriptionAr: text("metaDescriptionAr"),
  
  // Publishing
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  
  // Versioning
  version: int("version").default(1).notNull(),
  lastReviewedAt: timestamp("lastReviewedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guide = typeof guides.$inferSelect;
export type InsertGuide = typeof guides.$inferInsert;

/**
 * Support tickets (WhatsApp integration)
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  subject: varchar("subject", { length: 500 }),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  
  // WhatsApp info
  whatsappNumber: varchar("whatsappNumber", { length: 50 }),
  whatsappConversationId: varchar("whatsappConversationId", { length: 255 }),
  
  // Assignment
  assignedToAgent: varchar("assignedToAgent", { length: 255 }),
  
  lastMessageAt: timestamp("lastMessageAt"),
  resolvedAt: timestamp("resolvedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support messages
 */
export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  
  senderType: mysqlEnum("senderType", ["user", "agent", "bot"]).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  content: text("content").notNull(),
  
  // For automated responses
  isAutomated: boolean("isAutomated").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Usage tracking for free tier limits
 */
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Monthly counters (reset each month)
  chatMessagesCount: int("chatMessagesCount").default(0).notNull(),
  sopGenerationsCount: int("sopGenerationsCount").default(0).notNull(),
  documentUploadsCount: int("documentUploadsCount").default(0).notNull(),
  crsCalculationsCount: int("crsCalculationsCount").default(0).notNull(),
  
  // Tracking period
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;
