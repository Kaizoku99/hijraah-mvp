import { tool } from 'ai';
import { z } from 'zod';

// CRS Score Calculation Tool
export const calculateCRSTool = tool({
    description: 'Calculate CRS score based on user details. Use this when the user asks to calculate their score or provides their details for assessment.',
    inputSchema: z.object({
        age: z.number().describe('Age of the applicant'),
        educationLevel: z.string().describe('Highest level of education'),
        languageScores: z.object({
            speaking: z.number(),
            writing: z.number(),
            reading: z.number(),
            listening: z.number()
        }).describe('IELTS or CELPIP scores'),
        experienceYears: z.number().describe('Years of work experience'),
    }),
    execute: async ({ age, educationLevel, experienceYears }) => {
        // Calculate scores
        let ageScore = 0;
        if (age >= 20 && age <= 29) ageScore = 110;
        else if (age === 30) ageScore = 105;
        else if (age >= 31 && age <= 35) ageScore = 99;
        else ageScore = 80;

        let eduScore = 135;
        if (educationLevel.toLowerCase().includes('master')) eduScore = 135;
        else if (educationLevel.toLowerCase().includes('bachelor')) eduScore = 120;
        else if (educationLevel.toLowerCase().includes('diploma')) eduScore = 98;

        const langScore = 120; // Simplified
        const expScore = Math.min(experienceYears * 10, 50);
        const total = ageScore + eduScore + langScore + expScore;

        return {
            type: 'crs-score',
            data: {
                totalScore: total,
                breakdown: {
                    age: { score: ageScore, details: `${age} years old` },
                    education: { score: eduScore, details: educationLevel },
                    language: { firstOfficial: langScore, secondOfficial: 0, details: 'CLB 9+' },
                    experience: { canadian: 0, foreign: expScore, details: `${experienceYears} years` },
                    transferability: 50,
                    additional: 0
                },
                status: 'complete'
            }
        };
    },
});

// Document Validation Tool
export const validateDocumentTool = tool({
    description: 'Validate an uploaded document.',
    inputSchema: z.object({
        fileName: z.string(),
        fileContent: z.string().optional().describe('Text content if available'),
    }),
    execute: async ({ fileName }) => {
        // Simulate validation checks
        const checks = [
            { id: '1', label: 'File Integrity', status: 'pass' as const },
            { id: '2', label: 'Document Type', status: 'pass' as const, message: 'Passport detected' },
            { id: '3', label: 'Expiration Date', status: 'pass' as const, message: 'Valid until 2030' }
        ];

        return {
            type: 'doc-validation',
            data: {
                fileName,
                checks,
                overallStatus: 'approved'
            }
        };
    }
});

// Comparison Table Tool
export const generateComparisonTool = tool({
    description: 'Compare two or more immigration items (programs, cities, etc) in a table.',
    inputSchema: z.object({
        topic: z.string(),
        items: z.array(z.string()),
    }),
    execute: async ({ topic, items }) => {
        const columns = [
            { key: 'feature', header: 'Feature' },
            ...items.map(item => ({ key: item.toLowerCase().replace(/\s/g, '_'), header: item }))
        ];

        const features = ['Eligibility', 'Processing Time', 'Cost', 'Pros', 'Cons'];
        const rows: Record<string, string>[] = features.map(feature => {
            const row: Record<string, string> = { feature };
            items.forEach(item => {
                row[item.toLowerCase().replace(/\s/g, '_')] = `Details for ${item} - ${feature}`;
            });
            return row;
        });

        return {
            type: 'comparison-table',
            data: {
                title: `Comparison: ${topic}`,
                columns,
                rows,
                status: 'complete'
            }
        };
    }
});
