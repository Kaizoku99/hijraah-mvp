import { artifact } from '@ai-sdk-tools/artifacts';
import { z } from 'zod';

export const CRSScoreArtifact = artifact('crs-score', z.object({
    totalScore: z.number().default(0),
    breakdown: z.object({
        age: z.object({
            score: z.number().default(0),
            details: z.string().optional()
        }),
        education: z.object({
            score: z.number().default(0),
            details: z.string().optional()
        }),
        language: z.object({
            firstOfficial: z.number().default(0),
            secondOfficial: z.number().default(0),
            details: z.string().optional()
        }),
        experience: z.object({
            canadian: z.number().default(0),
            foreign: z.number().default(0),
            details: z.string().optional()
        }),
        spouse: z.object({
            score: z.number().default(0),
            details: z.string().optional()
        }).optional(),
        transferability: z.number().default(0),
        additional: z.number().default(0)
    }),
    status: z.enum(['calculating', 'complete', 'error']).default('calculating')
}));

export const ValidationArtifact = artifact('doc-validation', z.object({
    fileName: z.string(),
    fileType: z.string().optional(),
    checks: z.array(z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(['pending', 'checking', 'pass', 'fail', 'warning']),
        message: z.string().optional()
    })).default([]),
    overallStatus: z.enum(['processing', 'approved', 'rejected', 'review_required']).default('processing')
}));

export const ComparisonTableArtifact = artifact('comparison-table', z.object({
    title: z.string(),
    description: z.string().optional(),
    columns: z.array(z.object({
        key: z.string(),
        header: z.string()
    })),
    rows: z.array(z.record(z.string(), z.any())).default([]),
    status: z.enum(['generating', 'complete']).default('generating')
}));
