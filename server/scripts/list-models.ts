import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY key not found in .env files");
    process.exit(1);
}

// Ensure key doesn't have spaces or issues (common copy-paste error) by checking length or format
// But for now just use it.

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Gemini Models:");
            console.log("---------------------------");
            // Filter for 'generateContent' capable models usually, but listing all is safer
            const geminiModels = data.models.filter((m: any) => m.name.includes("gemini"));
            geminiModels.forEach((m: any) => {
                console.log(`ID: ${m.name.replace('models/', '')}`);
                console.log(`Name: ${m.displayName}`);
                console.log(`Capabilities: ${m.supportedGenerationMethods.join(', ')}`);
                console.log("---");
            });

            console.log("\n✅ Available Embedding Models:");
            console.log("---------------------------");
            const embedModels = data.models.filter((m: any) => m.name.includes("embedding"));
            embedModels.forEach((m: any) => {
                console.log(`ID: ${m.name.replace('models/', '')}`);
                console.log(`Name: ${m.displayName}`);
                console.log("---");
            });

        } else {
            console.error("Failed to list models:", data);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
