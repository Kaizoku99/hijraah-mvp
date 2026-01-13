/**
 * Immigration Guides CMS Service
 * 
 * Handles CRUD operations for immigration guides and content management.
 * Supports bilingual content (English/Arabic) with versioning.
 */

import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { guides } from "../drizzle/schema";
import { generateChatResponse } from "./_core/gemini";

// Guide categories for filtering
export const GUIDE_CATEGORIES = [
  "express_entry",
  "study_permit",
  "work_permit",
  "family_sponsorship",
  "provincial_nominee",
  "documents",
  "fees",
  "timeline",
  "settlement",
  "general",
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

/**
 * Get all published guides
 */
export async function getPublishedGuides(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = options?.category
    ? and(eq(guides.isPublished, true), eq(guides.category, options.category))
    : eq(guides.isPublished, true);

  const results = await db
    .select()
    .from(guides)
    .where(conditions)
    .orderBy(desc(guides.publishedAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return results;
}

/**
 * Get all guides (for admin)
 */
export async function getAllGuides(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = options?.category ? eq(guides.category, options.category) : undefined;

  const results = await db
    .select()
    .from(guides)
    .where(conditions)
    .orderBy(desc(guides.updatedAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return results;
}

/**
 * Get a guide by slug
 */
export async function getGuideBySlug(slug: string, publishedOnly = true) {
  const db = await getDb();
  if (!db) return null;

  const conditions = publishedOnly
    ? and(eq(guides.slug, slug), eq(guides.isPublished, true))
    : eq(guides.slug, slug);

  const results = await db.select().from(guides).where(conditions).limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Get a guide by ID
 */
export async function getGuideById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(guides).where(eq(guides.id, id)).limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Create a new guide
 */
export async function createGuide(data: {
  slug: string;
  titleEn: string;
  titleAr?: string;
  contentEn: string;
  contentAr?: string;
  category: string;
  tags?: string[];
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
  isPublished?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Auto-translate if Arabic content not provided
  let titleAr = data.titleAr;
  let contentAr = data.contentAr;
  let metaDescriptionAr = data.metaDescriptionAr;

  if (!titleAr || !contentAr) {
    const translations = await translateGuideContent({
      titleEn: data.titleEn,
      contentEn: data.contentEn,
      metaDescriptionEn: data.metaDescriptionEn,
    });
    titleAr = titleAr || translations.titleAr;
    contentAr = contentAr || translations.contentAr;
    metaDescriptionAr = metaDescriptionAr || translations.metaDescriptionAr;
  }

  const [guide] = await db
    .insert(guides)
    .values({
      slug: data.slug,
      titleEn: data.titleEn,
      titleAr: titleAr || data.titleEn,
      contentEn: data.contentEn,
      contentAr: contentAr || data.contentEn,
      category: data.category,
      tags: data.tags || [],
      metaDescriptionEn: data.metaDescriptionEn,
      metaDescriptionAr: metaDescriptionAr,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
      version: 1,
    })
    .returning();

  return guide;
}

/**
 * Update a guide
 */
export async function updateGuide(
  id: number,
  data: Partial<{
    slug: string;
    titleEn: string;
    titleAr: string;
    contentEn: string;
    contentAr: string;
    category: string;
    tags: string[];
    metaDescriptionEn: string;
    metaDescriptionAr: string;
    isPublished: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current guide to increment version
  const current = await getGuideById(id);
  if (!current) throw new Error("Guide not found");

  const updateData: any = {
    ...data,
    updatedAt: new Date(),
    version: current.version + 1,
  };

  // Handle publish state change
  if (data.isPublished !== undefined) {
    if (data.isPublished && !current.isPublished) {
      updateData.publishedAt = new Date();
    }
  }

  const [updated] = await db
    .update(guides)
    .set(updateData)
    .where(eq(guides.id, id))
    .returning();

  return updated;
}

/**
 * Delete a guide
 */
export async function deleteGuide(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(guides).where(eq(guides.id, id));
  return { success: true };
}

/**
 * Publish/unpublish a guide
 */
export async function toggleGuidePublish(id: number, isPublished: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(guides)
    .set({
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(guides.id, id))
    .returning();

  return updated;
}

/**
 * Search guides
 */
export async function searchGuides(query: string, limit = 50, publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];

  const searchTerm = `%${query}%`;

  const baseCondition = sql`(
    ${guides.titleEn} ILIKE ${searchTerm} OR 
    ${guides.titleAr} ILIKE ${searchTerm} OR 
    ${guides.contentEn} ILIKE ${searchTerm} OR 
    ${guides.contentAr} ILIKE ${searchTerm}
  )`;

  const condition = publishedOnly
    ? and(baseCondition, eq(guides.isPublished, true))
    : baseCondition;

  return await db.select().from(guides).where(condition).orderBy(desc(guides.publishedAt)).limit(limit);
}

/**
 * Translate guide content using Gemini
 */
export async function translateGuideContent(content: {
  titleEn: string;
  contentEn: string;
  metaDescriptionEn?: string;
}): Promise<{
  titleAr: string;
  contentAr: string;
  metaDescriptionAr?: string;
}> {
  const prompt = `You are a professional translator specializing in immigration and legal content. 
Translate the following English content to Arabic. 

Maintain:
- Technical immigration terminology accuracy
- Professional tone appropriate for official guides
- Markdown formatting (headers, lists, links)
- Any specific visa/program names (keep official names)

Return ONLY a JSON object with the translated content, no additional text:

Content to translate:
Title: ${content.titleEn}

Content:
${content.contentEn}

${content.metaDescriptionEn ? `Meta Description: ${content.metaDescriptionEn}` : ""}

Response format:
{
  "titleAr": "translated title",
  "contentAr": "translated content with markdown preserved",
  "metaDescriptionAr": "translated meta description or null"
}`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        titleAr: parsed.titleAr || content.titleEn,
        contentAr: parsed.contentAr || content.contentEn,
        metaDescriptionAr: parsed.metaDescriptionAr,
      };
    }
  } catch (error) {
    console.error("Translation error:", error);
  }

  // Fallback: return English content if translation fails
  return {
    titleAr: content.titleEn,
    contentAr: content.contentEn,
    metaDescriptionAr: content.metaDescriptionEn,
  };
}

/**
 * Get guide categories with counts
 */
export async function getGuideCategoryCounts(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];

  const condition = publishedOnly ? eq(guides.isPublished, true) : undefined;

  const results = await db
    .select({
      category: guides.category,
      count: sql<number>`count(*)::int`,
    })
    .from(guides)
    .where(condition)
    .groupBy(guides.category);

  return results;
}
