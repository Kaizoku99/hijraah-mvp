
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import { expressEntryDraws } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

interface RawDraw {
    draw_number: number;
    draw_date: string;
    program_category: string;
    invitations_issued: number;
    minimum_crs_score: number;
    tie_breaking_rule: string | null;
    notes: string | null;
}

interface RawData {
    express_entry_draws: RawDraw[];
}

async function seedDraws() {
    const db = await getDb();
    if (!db) {
        console.error('Failed to connect to database');
        process.exit(1);
    }

    const jsonPath = path.join(process.cwd(), 'EXpressEntryDraws.json');
    console.log(`Reading seed data from ${jsonPath}...`);

    try {
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const data: RawData = JSON.parse(fileContent);
        const draws = data.express_entry_draws;

        console.log(`Found ${draws.length} draws to process.`);

        let successCount = 0;
        let errorCount = 0;

        for (const draw of draws) {
            try {
                // Parse tie_breaking_rule safely
                let tieBreakingRule: Date | null = null;
                if (draw.tie_breaking_rule) {
                    // Remove " at " and " UTC" to make it more standardized if needed, 
                    // but new Date() usually handles "Month Day, Year at HH:MM:SS UTC" reasonably well in Node
                    // Let's try direct parsing first, and if it fails (NaN), leave it null or log warning
                    const parsed = new Date(draw.tie_breaking_rule.replace(' at ', ' '));
                    if (!isNaN(parsed.getTime())) {
                        tieBreakingRule = parsed;
                    } else {
                        // Try another format or fallback
                        // Example format in JSON: "June 10, 2025 at 15:59:25 UTC"
                        console.warn(`Could not parse date for draw ${draw.draw_number}: ${draw.tie_breaking_rule}`);
                    }
                }

                await db.insert(expressEntryDraws).values({
                    drawNumber: draw.draw_number,
                    drawDate: new Date(draw.draw_date),
                    drawType: draw.program_category,
                    invitationsIssued: draw.invitations_issued,
                    crsMinimum: draw.minimum_crs_score,
                    tieBreakingRule: tieBreakingRule,
                    notes: draw.notes,
                    metadata: {
                        source: 'official_seed_v1',
                        imported_at: new Date().toISOString()
                    }
                }).onConflictDoUpdate({
                    target: expressEntryDraws.drawNumber,
                    set: {
                        drawDate: new Date(draw.draw_date),
                        drawType: draw.program_category,
                        invitationsIssued: draw.invitations_issued,
                        crsMinimum: draw.minimum_crs_score,
                        tieBreakingRule: tieBreakingRule,
                        notes: draw.notes,
                        // Don't overwrite metadata if it exists, or maybe merge it? 
                        // For now, let's just update the main fields.
                    }
                });

                successCount++;
                if (successCount % 50 === 0) {
                    console.log(`Processed ${successCount} draws...`);
                }

            } catch (err) {
                console.error(`Error processing draw ${draw.draw_number}:`, err);
                errorCount++;
            }
        }

        console.log('Seeding completed!');
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Error reading or parsing seed file:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seedDraws();
