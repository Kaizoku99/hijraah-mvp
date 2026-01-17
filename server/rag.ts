import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "./_core/supabase";
import { rerank } from "ai";
import { cohere } from "@ai-sdk/cohere";

let genAI: GoogleGenerativeAI | null = null;

import { env } from "./_core/env";

function getGoogleAI() {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || 'no-key-provided';

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

/**
 * Generate embeddings using Google's text-embedding-004 model
 * Returns 768-dimensional vectors
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGoogleAI();
  const embeddingModel = ai.getGenerativeModel({ model: "text-embedding-004" });

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const ai = getGoogleAI();
  const embeddingModel = ai.getGenerativeModel({ model: "text-embedding-004" });

  const results = await Promise.all(
    texts.map((text) => embeddingModel.embedContent(text))
  );

  return results.map((result) => result.embedding.values);
}

export interface RagSearchResult {
  id: string;
  documentId: string;
  textContent: string;
  similarity: number;
  metadata: {
    chunkIndex: number;
    language: string;
    entities?: any[];
    keyPhrases?: any[];
    sourceUrl?: string;
  };
}

export interface KgEntity {
  id: string;
  entityType: string;
  entityName: string;
  displayName: string | null;
  properties: Record<string, any>;
  confidenceScore: number;
}

export interface KgRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  properties: Record<string, any>;
  strength: number;
}

/**
 * Perform semantic search using vector similarity
 * Uses cosine similarity with pgvector via dedicated RPC function
 */
export async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    language?: string;
  } = {}
): Promise<RagSearchResult[]> {
  const { limit = 5, threshold = 0.5, language } = options;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Query Supabase with vector similarity search using dedicated RPC function
  const supabase = supabaseAdmin;

  // Use the match_document_chunks RPC function for proper vector similarity
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_language: language || null,
  });

  if (error) {
    console.error("[RAG] Vector search RPC failed:", error.message);
    throw new Error(`Failed to search: ${error.message}`);
  }

  console.log(`[RAG] Vector search found ${data?.length || 0} results above threshold ${threshold}`);

  return (data || []).map((row: any) => ({
    id: row.id,
    documentId: row.document_id,
    textContent: row.text_content,
    similarity: row.similarity,
    metadata: {
      chunkIndex: row.chunk_index,
      language: row.language,
      entities: row.entities,
      keyPhrases: row.key_phrases,
      sourceUrl: row.source_url,
    },
  }));
}

/**
 * Search knowledge graph entities
 */
export async function searchEntities(
  query: string,
  options: {
    entityTypes?: string[];
    limit?: number;
  } = {}
): Promise<KgEntity[]> {
  const { entityTypes, limit = 10 } = options;
  const supabase = supabaseAdmin;

  let queryBuilder = supabase
    .from("kg_entities")
    .select("*")
    .eq("is_active", true)
    .ilike("entity_name", `%${query}%`)
    .order("confidence_score", { ascending: false })
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    queryBuilder = queryBuilder.in("entity_type", entityTypes);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to search entities: ${error.message}`);
  }

  return (data || []).map((entity: any) => ({
    id: entity.id,
    entityType: entity.entity_type,
    entityName: entity.entity_name,
    displayName: entity.display_name,
    properties: entity.properties,
    confidenceScore: entity.confidence_score,
  }));
}

/**
 * Get related entities through knowledge graph relationships
 */
export async function getRelatedEntities(
  entityId: string,
  options: {
    relationshipTypes?: string[];
    limit?: number;
  } = {}
): Promise<{ entity: KgEntity; relationship: KgRelationship }[]> {
  const { relationshipTypes, limit = 10 } = options;
  const supabase = supabaseAdmin;

  // Get relationships where entity is source or target
  let queryBuilder = supabase
    .from("kg_relationships")
    .select(`
      *,
      source_entity:kg_entities!kg_relationships_source_entity_id_fkey(*),
      target_entity:kg_entities!kg_relationships_target_entity_id_fkey(*)
    `)
    .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    .order("strength", { ascending: false })
    .limit(limit);

  if (relationshipTypes && relationshipTypes.length > 0) {
    queryBuilder = queryBuilder.in("relationship_type", relationshipTypes);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to get related entities: ${error.message}`);
  }

  return (data || []).map((rel: any) => {
    const relatedEntity =
      rel.source_entity_id === entityId ? rel.target_entity : rel.source_entity;

    return {
      entity: {
        id: relatedEntity.id,
        entityType: relatedEntity.entity_type,
        entityName: relatedEntity.entity_name,
        displayName: relatedEntity.display_name,
        properties: relatedEntity.properties,
        confidenceScore: relatedEntity.confidence_score,
      },
      relationship: {
        id: rel.id,
        sourceEntityId: rel.source_entity_id,
        targetEntityId: rel.target_entity_id,
        relationshipType: rel.relationship_type,
        properties: rel.properties,
        strength: rel.strength,
      },
    };
  });
}

/**
 * Combined RAG + Knowledge Graph query
 * Returns relevant document chunks and related knowledge graph entities
 * Now includes optional re-ranking using Cohere for improved relevance
 */
export async function ragQuery(
  query: string,
  options: {
    chunkLimit?: number;
    entityLimit?: number;
    language?: string;
    includeRelatedEntities?: boolean;
    enableReranking?: boolean; // Enable Cohere re-ranking (default: true if API key is configured)
    oversampleFactor?: number; // How many extra results to fetch for re-ranking (default: 3)
  } = {}
): Promise<{
  chunks: RagSearchResult[];
  entities: KgEntity[];
  relatedEntities?: { entity: KgEntity; relationship: KgRelationship }[];
}> {
  const {
    chunkLimit = 5,
    entityLimit = 5,
    language,
    includeRelatedEntities = true,
    enableReranking = true,
    oversampleFactor = 3,
  } = options;

  // Determine if we should use re-ranking
  const shouldRerank = enableReranking && isCohereConfigured();
  
  // Fetch more results initially if re-ranking is enabled (oversampling strategy)
  const searchLimit = shouldRerank ? chunkLimit * oversampleFactor : chunkLimit;
  const searchThreshold = shouldRerank ? 0.3 : 0.5; // Lower threshold when oversampling

  // Parallel search for documents and entities
  const [chunks, entities] = await Promise.all([
    semanticSearch(query, { 
      limit: searchLimit, 
      threshold: searchThreshold,
      language 
    }),
    searchEntities(query, { limit: entityLimit }),
  ]);

  // Re-rank the chunks if enabled
  const finalChunks = shouldRerank 
    ? await rerankResults(query, chunks, chunkLimit)
    : chunks;

  // Get related entities if requested and we found matching entities
  let relatedEntities: { entity: KgEntity; relationship: KgRelationship }[] = [];
  if (includeRelatedEntities && entities.length > 0) {
    const relatedPromises = entities
      .slice(0, 3)
      .map((entity) => getRelatedEntities(entity.id, { limit: 5 }));
    const relatedResults = await Promise.all(relatedPromises);
    relatedEntities = relatedResults.flat();
  }

  return {
    chunks: finalChunks,
    entities,
    relatedEntities,
  };
}

/**
 * Build context string from RAG results for use in AI prompts
 * Uses clear delimiters and structured format for better model comprehension
 * Supports both vector similarity and re-ranked scores
 */
export function buildRagContext(
  results: {
    chunks: RagSearchResult[];
    entities: KgEntity[];
  },
  language: "en" | "ar" = "en"
): string {
  const { chunks, entities } = results;

  if (chunks.length === 0 && entities.length === 0) {
    return "";
  }

  const contextParts: string[] = [];

  // Clear section header
  const mainHeader = language === "ar"
    ? "---\n<KNOWLEDGE_BASE>\nاستخدم المعلومات التالية للإجابة على سؤال المستخدم. إذا كانت المعلومات غير كافية، قل ذلك صراحة.\n"
    : "---\n<KNOWLEDGE_BASE>\nUse the following information to answer the user's question. If the information is insufficient, explicitly state so.\n";
  contextParts.push(mainHeader);

  // Add document chunks with clear structure
  if (chunks.length > 0) {
    const header =
      language === "ar" ? "## المعلومات ذات الصلة:" : "## Relevant Information:";
    contextParts.push(header);

    // Sort chunks by score (highest first) - they should already be sorted, but ensure it
    const sortedChunks = [...chunks].sort((a, b) => b.similarity - a.similarity);

    sortedChunks.forEach((chunk, index) => {
      contextParts.push(`\n### Source ${index + 1}:`);
      contextParts.push("```");
      contextParts.push(chunk.textContent);
      contextParts.push("```");
      if (chunk.metadata.sourceUrl) {
        contextParts.push(`URL: ${chunk.metadata.sourceUrl}`);
      }
      // Format relevance score - Cohere scores are typically 0-1, vector similarity can vary
      const scoreLabel = language === "ar" ? "درجة الصلة" : "Relevance Score";
      const score = chunk.similarity > 1 ? chunk.similarity : chunk.similarity * 100;
      contextParts.push(`${scoreLabel}: ${score.toFixed(1)}%`);
    });
  }

  // Add knowledge graph entities with clear structure
  if (entities.length > 0) {
    const header =
      language === "ar"
        ? "\n## الكيانات المعرفية ذات الصلة:"
        : "\n## Related Knowledge Graph Entities:";
    contextParts.push(header);

    entities.forEach((entity) => {
      const name = entity.displayName || entity.entityName;
      const type = entity.entityType.replace(/_/g, " ").toLowerCase();
      contextParts.push(`\n- **${name}** (${type})`);

      if (entity.properties && Object.keys(entity.properties).length > 0) {
        const propsStr = Object.entries(entity.properties)
          .filter(([_, value]) => value !== null && value !== undefined)
          .map(([key, value]) => `  - ${key}: ${value}`)
          .join("\n");
        if (propsStr) {
          contextParts.push(propsStr);
        }
      }
    });
  }

  // Close the knowledge base section
  contextParts.push("\n</KNOWLEDGE_BASE>\n---");

  // Add usage instruction
  const instruction = language === "ar"
    ? "\n**تعليمات**: أجب على سؤال المستخدم بناءً على المعلومات أعلاه. إذا لم تجد المعلومة في قاعدة البيانات، استخدم معرفتك العامة مع التنويه بذلك."
    : "\n**Instructions**: Answer the user's question based on the information above. If the information is not found in the knowledge base, use your general knowledge but indicate this clearly.";
  contextParts.push(instruction);

  return contextParts.join("\n");
}

/**
 * Add a document to the RAG knowledge base
 */
export async function addDocument(
  content: string,
  metadata: {
    sourceUrl?: string;
    title?: string;
    category?: string;
    language?: string;
  } = {}
): Promise<string> {
  const supabase = supabaseAdmin;

  // Create the document
  const { data: doc, error: docError } = await supabase
    .from("rag_documents")
    .insert({
      source_url: metadata.sourceUrl,
      raw_text: content,
      status: "processing",
      metadata: {
        title: metadata.title,
        category: metadata.category,
      },
    })
    .select()
    .single();

  if (docError) {
    throw new Error(`Failed to create document: ${docError.message}`);
  }

  // Chunk the content
  const chunks = chunkText(content);

  // Generate embeddings for chunks
  const embeddings = await generateBatchEmbeddings(chunks);

  // Store chunks with embeddings
  const chunkInserts = chunks.map((text, index) => ({
    document_id: doc.id,
    chunk_index: index,
    text_content: text,
    embedding: embeddings[index],
    language: metadata.language || "en",
  }));

  const { error: chunkError } = await supabase
    .from("document_chunks_enhanced")
    .insert(chunkInserts);

  if (chunkError) {
    throw new Error(`Failed to store chunks: ${chunkError.message}`);
  }

  // Update document status
  await supabase
    .from("rag_documents")
    .update({ status: "processed" })
    .eq("id", doc.id);

  return doc.id;
}

/**
 * Simple text chunking strategy
 * Splits by paragraphs and ensures chunks don't exceed max size
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Check if Cohere API key is configured
 */
function isCohereConfigured(): boolean {
  return !!env.COHERE_API_KEY;
}

/**
 * Re-rank search results using Cohere's reranking model
 * Improves relevance by using a cross-encoder model to re-score results
 * @param query - The user's search query
 * @param results - Array of RAG search results to re-rank
 * @param topN - Number of top results to return (default: same as input length)
 * @returns Re-ranked results sorted by relevance score
 */
export async function rerankResults(
  query: string,
  results: RagSearchResult[],
  topN?: number
): Promise<RagSearchResult[]> {
  // Skip re-ranking if no results or Cohere not configured
  if (results.length === 0) {
    return results;
  }

  if (!isCohereConfigured()) {
    console.log("[RAG] Cohere API key not configured, skipping re-ranking");
    return results;
  }

  try {
    const documents = results.map((r) => r.textContent);
    const effectiveTopN = topN ?? results.length;

    const { ranking } = await rerank({
      model: cohere.reranking("rerank-v3.5"),
      documents,
      query,
      topN: effectiveTopN,
    });

    // Map the ranking back to RagSearchResult objects
    const rerankedResults: RagSearchResult[] = ranking.map((item) => {
      const originalResult = results[item.originalIndex];
      return {
        ...originalResult,
        // Update similarity score with the rerank score (normalized)
        similarity: item.score,
      };
    });

    console.log(
      `[RAG] Re-ranked ${results.length} results, returning top ${effectiveTopN}`
    );

    return rerankedResults;
  } catch (error) {
    console.error("[RAG] Re-ranking failed, returning original results:", error);
    // Gracefully fall back to original results
    return results;
  }
}

/**
 * Enhanced RAG query with re-ranking
 * 1. First performs semantic search to get initial candidates (oversampling)
 * 2. Then re-ranks using Cohere's cross-encoder for better relevance
 * 3. Returns top results after re-ranking
 */
export async function ragQueryWithReranking(
  query: string,
  options: {
    chunkLimit?: number;
    entityLimit?: number;
    language?: string;
    includeRelatedEntities?: boolean;
    oversampleFactor?: number; // How many more results to fetch before re-ranking
  } = {}
): Promise<{
  chunks: RagSearchResult[];
  entities: KgEntity[];
  relatedEntities?: { entity: KgEntity; relationship: KgRelationship }[];
}> {
  const {
    chunkLimit = 5,
    entityLimit = 5,
    language,
    includeRelatedEntities = true,
    oversampleFactor = 3, // Fetch 3x more results, then re-rank to get top N
  } = options;

  // Fetch more results initially for re-ranking (oversampling)
  const oversampledLimit = isCohereConfigured()
    ? chunkLimit * oversampleFactor
    : chunkLimit;

  // Parallel search for documents and entities
  const [chunks, entities] = await Promise.all([
    semanticSearch(query, {
      limit: oversampledLimit,
      threshold: 0.3, // Lower threshold when oversampling
      language,
    }),
    searchEntities(query, { limit: entityLimit }),
  ]);

  // Re-rank the chunks using Cohere
  const rerankedChunks = await rerankResults(query, chunks, chunkLimit);

  // Get related entities if requested and we found matching entities
  let relatedEntities: { entity: KgEntity; relationship: KgRelationship }[] = [];
  if (includeRelatedEntities && entities.length > 0) {
    const relatedPromises = entities
      .slice(0, 3)
      .map((entity) => getRelatedEntities(entity.id, { limit: 5 }));
    const relatedResults = await Promise.all(relatedPromises);
    relatedEntities = relatedResults.flat();
  }

  return {
    chunks: rerankedChunks,
    entities,
    relatedEntities,
  };
}

/**
 * Add entity to knowledge graph
 */
export async function addEntity(
  entityType: string,
  entityName: string,
  properties: Record<string, any> = {},
  options: {
    displayName?: string;
    confidenceScore?: number;
    sourceReferences?: string[];
  } = {}
): Promise<string> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("kg_entities")
    .insert({
      entity_type: entityType,
      entity_name: entityName,
      display_name: options.displayName,
      properties,
      confidence_score: options.confidenceScore ?? 1.0,
      source_references: options.sourceReferences ?? [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add entity: ${error.message}`);
  }

  return data.id;
}

/**
 * Add relationship to knowledge graph
 */
export async function addRelationship(
  sourceEntityId: string,
  targetEntityId: string,
  relationshipType: string,
  properties: Record<string, any> = {},
  strength: number = 1.0
): Promise<string> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("kg_relationships")
    .insert({
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      relationship_type: relationshipType,
      properties,
      strength,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add relationship: ${error.message}`);
  }

  return data.id;
}
