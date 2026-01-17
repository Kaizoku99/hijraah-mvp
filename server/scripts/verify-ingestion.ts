import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
    console.log("Verifying Ingestion...");

    // 1. Check Documents
    const { count: docCount, error: docError } = await supabase
        .from("rag_documents") // Correct table
        .select("*", { count: "exact", head: true })
        .or("metadata->>source.eq.firecrawl,metadata->>source.eq.internal"); // Check both sources

    if (docError) console.error("Error checking documents:", docError);
    else console.log(`rag_documents Found (Firecrawl/Internal): ${docCount}`);

    // 2. Check Entities
    const { count: kgCount, error: kgError } = await supabase
        .from("kg_entities")
        .select("*", { count: "exact", head: true });

    if (kgError) console.error("Error checking KG entities:", kgError);
    else console.log(`KG Entities Found: ${kgCount}`);

    // 3. Sample Check
    const { data: chunks, error: chunkError } = await supabase
        .from("document_chunks_enhanced")
        .select("chunk_metadata") // Correct column name
        .limit(1);

    if (chunkError) console.error("Error checking chunks:", chunkError);
    else console.log("Sample Chunk Metadata:", chunks?.[0]?.chunk_metadata);
}

verify().catch(console.error);
