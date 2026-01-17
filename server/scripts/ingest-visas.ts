import { createClient } from "@supabase/supabase-js";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env variables");
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// RAG Utilities (Simplified version of server/rag.ts logic)
async function generateEmbedding(text: string): Promise<number[]> {
    // Use Google for embeddings as per AI SDK availability
    const { embedding } = await import("ai").then(m => m.embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value: text
    }));
    return embedding;
}

// Entity Extraction Schema
const EntitySchema = z.object({
    entities: z.array(z.object({
        name: z.string().describe("Name of the entity, e.g., 'Subclass 189', 'IELTS Score 6.0', 'D8 Visa'"),
        type: z.enum(["VISA_TYPE", "REQUIREMENT", "COST", "PROGRAM", "ORGANIZATION", "CONCEPT"]).describe("Type of the entity"),
        // Changed to array of K/V pairs for robust Gemini schema generation
        properties: z.array(z.object({
            key: z.string(),
            value: z.string().or(z.number()).or(z.boolean())
        })).optional().describe("Key-value pairs of extracted details"),
        description: z.string().describe("Brief description of the entity in context")
    }))
});

async function extractEntities(text: string, context: string) {
    try {
        const { object } = await generateObject({
            model: google("gemini-3-flash-preview"), // High intelligence for extraction
            schema: EntitySchema,
            prompt: `Extract key immigration entities from the following text. 
      Context: ${context}.
      
      Focus on:
      - Visa Subclasses (e.g. "Subclass 189", "D7 Visa")
      - Specific Requirements (e.g. "IELTS 6.0", "65 Points", "€820/month")
      - Costs (e.g. "AUD 4910")
      - Organizations (e.g. "AIMA", "Home Affairs")
      
      Text:
      ${text}`
        });

        // Transform attributes back to object
        return object.entities.map(e => ({
            ...e,
            properties: e.properties
                ? e.properties.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                : {}
        }));
    } catch (error) {
        console.error("Entity extraction failed:", error);
        return [];
    }
}


async function ingestAustralia() {
    const filePath = path.join(__dirname, "../../australia_visa_firecrawl.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    console.log(`Processing Australia Data: ${data.visa_types.length} visa types found.`);

    for (const visa of data.visa_types) {
        console.log(`Processing Visa: ${visa.visa_name}`);

        const docTitle = `Australia Visa - ${visa.visa_name}`;

        // CHECK: Skip if document already exists AND (if it's a target visa) it has the keywords
        const { data: existingDoc } = await supabase
            .from("rag_documents")
            .select("id")
            .eq("metadata->>title", docTitle)
            .single();

        if (existingDoc) {
            const isTargetVisa = ["190", "491", "188", "888", "132", "489"].some(code => visa.visa_name.includes(code));

            if (isTargetVisa) {
                // For target visas, verify they have the keywords
                const { data: chunkData } = await supabase
                    .from("document_chunks_enhanced")
                    .select("text_content")
                    .eq("document_id", existingDoc.id)
                    .limit(1)
                    .single();

                const hasKeywords = chunkData?.text_content.includes("Keywords: State Sponsored");

                if (hasKeywords) {
                    console.log(`Skipping ${docTitle} - already exists AND has keywords.`);
                    continue;
                } else {
                    console.log(`Re-processing ${docTitle} - exists but MISSING keywords.`);
                    // Proceed to delete and re-ingest
                }
            } else {
                // For non-target visas, simple existence check is enough
                console.log(`Skipping ${docTitle} - already exists.`);
                continue;
            }
        }

        // CLEANUP: Remove existing document if it exists (only if we didn't skip above)
        const { error: deleteError } = await supabase
            .from("rag_documents")
            .delete()
            .eq("metadata->>title", docTitle);

        if (deleteError) console.warn(`Warning deleting old doc ${docTitle}:`, deleteError.message);

        // Create Document for THIS Visa
        const { data: docData, error: docError } = await supabase.from("rag_documents").insert({
            raw_text: `Full guide for ${visa.visa_name}`, // Placeholder or summary
            status: "processed",
            metadata: {
                title: docTitle,
                content_type: "application/json",
                source: "firecrawl",
                country: "Australia",
                language: "en",
                visa_subclass: visa.visa_name
            }
        }).select().single();

        if (docError) {
            console.error(`Error creating doc for ${visa.visa_name}:`, docError.message);
            continue;
        }

        const documentId = docData.id;

        // Detect State Sponsorship
        const isStateSponsored = ["190", "491", "188", "888", "132", "489"].some(code => visa.visa_name.includes(code));
        const tags = isStateSponsored ? "Keywords: State Sponsored, State Nomination, Government Support." : "";

        // Construct meaningful text chunks
        const chunks = [
            {
                content: `Visa: ${visa.visa_name}. ${tags} \nEligibility: ${visa.eligibility_requirements?.map((r: any) => r.value).join("\n")}`,
                context: `Eligibility requirements for ${visa.visa_name}`
            },
            {
                content: `Visa: ${visa.visa_name}. ${tags} \nFees: ${visa.application_fees?.map((f: any) => `${f.currency} ${f.amount_local} (USD ${f.amount_usd})`).join(", ")}`,
                context: `Application fees for ${visa.visa_name}`
            },
            {
                content: `Visa: ${visa.visa_name}. ${tags} \nProcessing Time: ${visa.processing_timelines}`,
                context: `Processing time for ${visa.visa_name}`
            }
        ];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk.content || chunk.content.length < 20) continue;

            // 1. Generate Embedding
            const embedding = await generateEmbedding(chunk.content);

            // 2. Extract Entities (Intelligent Step)
            const entities = await extractEntities(chunk.content, chunk.context);

            // 3. Save Chunk
            const { error: chunkError } = await supabase.from("document_chunks_enhanced").insert({
                document_id: documentId,
                chunk_index: i,
                text_content: chunk.content,
                embedding: embedding,
                language: "en"
            });

            if (chunkError) {
                console.error(`Error saving chunk for ${visa.visa_name}:`, chunkError);
                continue;
            }

            // 4. Save Entities
            if (entities.length > 0) {
                const entitiesToInsert = entities.map(e => ({
                    entity_type: e.type,
                    entity_name: e.name,
                    properties: e.properties,
                    embedding: embedding
                }));

                const { error: kgError } = await supabase.from("kg_entities").insert(entitiesToInsert);
                if (kgError) console.error("KG Insert Error:", kgError);
            }
        }
    }
}

async function ingestPortugal() {
    const filePath = path.join(__dirname, "../../portugal.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    console.log(`Processing Portugal Data: ${data.visa_types.length} visa types found.`);

    for (const visa of data.visa_types) {
        const docTitle = `Portugal Visa - ${visa.visa_name} (${visa.visa_subclass})`;
        console.log(`Processing Visa: ${docTitle}`);

        // CHECK: Skip if document already exists
        const { data: existingDoc } = await supabase
            .from("rag_documents")
            .select("id")
            .eq("metadata->>title", docTitle)
            .single();

        if (existingDoc) {
            console.log(`Skipping ${docTitle} - already exists.`);
            continue;
        }

        // CLEANUP: Remove existing document
        await supabase
            .from("rag_documents")
            .delete()
            .eq("metadata->>title", docTitle);

        // Create Document for THIS Visa
        const { data: docData, error: docError } = await supabase.from("rag_documents").insert({
            raw_text: `Full guide for ${visa.visa_name}`,
            status: "processed",
            metadata: {
                title: docTitle,
                content_type: "application/json",
                source: "internal",
                country: "Portugal",
                language: "en",
                visa_subclass: visa.visa_subclass
            }
        }).select().single();

        if (docError) {
            console.error(`Error creating doc for ${visa.visa_name}:`, docError.message);
            continue;
        }

        const documentId = docData.id;

        // Construct chunks
        const chunks = [
            {
                content: `Portugal Visa: ${visa.visa_name} (${visa.visa_subclass}). \nEligibility: ${visa.eligibility_requirements?.map((r: any) => `${r.category}: ${r.requirement}`).join("\n")}`,
                context: `Requirements for Portugal ${visa.visa_subclass} visa`
            },
            {
                content: `Portugal Visa: ${visa.visa_name} (${visa.visa_subclass}). \nFinancial Requirements: ${JSON.stringify(visa.eligibility_requirements?.filter((r: any) => r.category === 'Financial' || r.category === 'Means of Subsistence'))}`,
                context: `Financial requirements for Portugal ${visa.visa_subclass} visa`
            }
        ];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            // 1. Generate Embedding
            const embedding = await generateEmbedding(chunk.content);

            // 2. Extract Entities
            const entities = await extractEntities(chunk.content, chunk.context);

            // 3. Save Chunk
            await supabase.from("document_chunks_enhanced").insert({
                document_id: documentId,
                chunk_index: i,
                text_content: chunk.content,
                embedding: embedding,
                language: "en"
            });

            // 4. Save Entities
            if (entities.length > 0) {
                const entitiesToInsert = entities.map(e => ({
                    entity_type: e.type,
                    entity_name: e.name,
                    properties: e.properties,
                    embedding: embedding
                }));
                await supabase.from("kg_entities").insert(entitiesToInsert);
            }
        }
    }
}

async function main() {
    await ingestAustralia();
    await ingestPortugal();
    console.log("Ingestion Complete!");
}

main().catch(console.error);
