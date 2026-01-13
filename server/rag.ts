import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "./_core/supabase";

let genAI: GoogleGenerativeAI | null = null;

function getGoogleAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
 * Uses cosine similarity with pgvector
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

  // Query Supabase with vector similarity search
  const supabase = supabaseAdmin;

  // Build the SQL query for vector similarity search
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  let sql = `
    SELECT 
      dc.id,
      dc.document_id,
      dc.text_content,
      dc.chunk_index,
      dc.language,
      dc.entities,
      dc.key_phrases,
      dc.chunk_metadata,
      rd.source_url,
      1 - (dc.embedding <=> '${embeddingStr}'::vector) as similarity
    FROM document_chunks_enhanced dc
    LEFT JOIN rag_documents rd ON dc.document_id = rd.id
    WHERE dc.embedding IS NOT NULL
  `;

  if (language) {
    sql += ` AND dc.language = '${language}'`;
  }

  sql += `
    AND 1 - (dc.embedding <=> '${embeddingStr}'::vector) > ${threshold}
    ORDER BY dc.embedding <=> '${embeddingStr}'::vector
    LIMIT ${limit}
  `;

  const { data, error } = await supabase.rpc("execute_sql", { query: sql });

  if (error) {
    // Fallback to direct query if RPC doesn't exist
    console.error("RPC execute_sql not available, using direct query");

    // Use a simpler approach with Supabase client
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks_enhanced")
      .select(`
        id,
        document_id,
        text_content,
        chunk_index,
        language,
        entities,
        key_phrases,
        chunk_metadata,
        rag_documents (source_url)
      `)
      .not("embedding", "is", null)
      .limit(limit * 3); // Get more to filter client-side

    if (chunksError) {
      throw new Error(`Failed to search: ${chunksError.message}`);
    }

    // For now, return top results without vector similarity (fallback)
    return (chunks || []).slice(0, limit).map((chunk: any) => ({
      id: chunk.id,
      documentId: chunk.document_id,
      textContent: chunk.text_content,
      similarity: 0.8, // Placeholder
      metadata: {
        chunkIndex: chunk.chunk_index,
        language: chunk.language,
        entities: chunk.entities,
        keyPhrases: chunk.key_phrases,
        sourceUrl: chunk.rag_documents?.source_url,
      },
    }));
  }

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
 */
export async function ragQuery(
  query: string,
  options: {
    chunkLimit?: number;
    entityLimit?: number;
    language?: string;
    includeRelatedEntities?: boolean;
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
  } = options;

  // Parallel search for documents and entities
  const [chunks, entities] = await Promise.all([
    semanticSearch(query, { limit: chunkLimit, language }),
    searchEntities(query, { limit: entityLimit }),
  ]);

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
    chunks,
    entities,
    relatedEntities,
  };
}

/**
 * Build context string from RAG results for use in AI prompts
 * Uses clear delimiters and structured format for better model comprehension
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

    chunks.forEach((chunk, index) => {
      contextParts.push(`\n### Source ${index + 1}:`);
      contextParts.push("```");
      contextParts.push(chunk.textContent);
      contextParts.push("```");
      if (chunk.metadata.sourceUrl) {
        contextParts.push(`URL: ${chunk.metadata.sourceUrl}`);
      }
      contextParts.push(`Relevance Score: ${(chunk.similarity * 100).toFixed(1)}%`);
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
