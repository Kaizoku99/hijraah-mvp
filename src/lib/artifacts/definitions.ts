import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const CRSScoreArtifact = artifact(
  "crs-score",
  z.object({
    totalScore: z.number().default(0),
    breakdown: z.object({
      age: z.object({
        score: z.number().default(0),
        details: z.string().optional(),
      }),
      education: z.object({
        score: z.number().default(0),
        details: z.string().optional(),
      }),
      language: z.object({
        firstOfficial: z.number().default(0),
        secondOfficial: z.number().default(0),
        details: z.string().optional(),
      }),
      experience: z.object({
        canadian: z.number().default(0),
        foreign: z.number().default(0),
        details: z.string().optional(),
      }),
      spouse: z
        .object({
          score: z.number().default(0),
          details: z.string().optional(),
        })
        .optional(),
      transferability: z.number().default(0),
      additional: z.number().default(0),
    }),
    status: z.enum(["calculating", "complete", "error"]).default("calculating"),
  })
);

export const ValidationArtifact = artifact(
  "doc-validation",
  z.object({
    fileName: z.string(),
    fileType: z.string().optional(),
    checks: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          status: z.enum(["pending", "checking", "pass", "fail", "warning"]),
          message: z.string().optional(),
        })
      )
      .default([]),
    overallStatus: z
      .enum(["processing", "approved", "rejected", "review_required"])
      .default("processing"),
  })
);

export const ComparisonTableArtifact = artifact(
  "comparison-table",
  z.object({
    title: z.string(),
    description: z.string().optional(),
    columns: z.array(
      z.object({
        key: z.string(),
        header: z.string(),
      })
    ),
    rows: z.array(z.record(z.string(), z.any())).default([]),
    status: z.enum(["generating", "complete"]).default("generating"),
  })
);

// ============================================
// AGENT-SPECIFIC ARTIFACTS
// ============================================

/**
 * Portugal Visa Match Result Artifact
 * Used by Assessment Specialist for Portugal pathway eligibility
 */
export const PortugalVisaMatchArtifact = artifact(
  "portugal-visa-match",
  z.object({
    eligibleVisas: z
      .array(
        z.object({
          visaType: z.enum(["D2", "D7", "D8", "Golden Visa", "Student Visa"]),
          name: z.object({ en: z.string(), ar: z.string() }),
          eligibility: z.enum(["eligible", "likely", "maybe", "not_eligible"]),
          score: z.number().min(0).max(100),
          requirements: z.array(
            z.object({
              requirement: z.string(),
              met: z.boolean(),
              details: z.string().optional(),
            })
          ),
          timeline: z.string().optional(),
          fees: z.string().optional(),
        })
      )
      .default([]),
    recommendation: z.string().optional(),
    status: z.enum(["analyzing", "complete", "error"]).default("analyzing"),
  })
);

/**
 * Attestation Workflow Artifact
 * Used by Preparation Specialist for MENA document attestation workflows
 */
export const AttestationWorkflowArtifact = artifact(
  "attestation-workflow",
  z.object({
    country: z.string(),
    documentType: z.string(),
    steps: z
      .array(
        z.object({
          order: z.number(),
          title: z.object({ en: z.string(), ar: z.string() }),
          description: z.object({ en: z.string(), ar: z.string() }),
          location: z.string().optional(),
          estimatedTime: z.string().optional(),
          estimatedCost: z.string().optional(),
          tips: z.array(z.string()).optional(),
          completed: z.boolean().default(false),
        })
      )
      .default([]),
    totalEstimatedTime: z.string().optional(),
    totalEstimatedCost: z.string().optional(),
    status: z.enum(["loading", "complete", "error"]).default("loading"),
  })
);

/**
 * Fee Calculator Artifact
 * Used by Submission Specialist for application fee breakdowns
 */
export const FeeCalculatorArtifact = artifact(
  "fee-calculator",
  z.object({
    pathway: z.string(),
    destination: z.string(),
    items: z
      .array(
        z.object({
          category: z.enum([
            "government",
            "biometrics",
            "medical",
            "translation",
            "attestation",
            "courier",
            "other",
          ]),
          name: z.object({ en: z.string(), ar: z.string() }),
          amount: z.number(),
          currency: z.string().default("CAD"),
          required: z.boolean().default(true),
          notes: z.string().optional(),
        })
      )
      .default([]),
    subtotal: z.number().default(0),
    totalCAD: z.number().default(0),
    totalUSD: z.number().default(0),
    disclaimer: z.string().optional(),
    status: z.enum(["calculating", "complete", "error"]).default("calculating"),
  })
);

/**
 * SOP Generator Artifact
 * Used by Submission Specialist for Statement of Purpose drafts
 */
export const SOPGeneratorArtifact = artifact(
  "sop-generator",
  z.object({
    pathway: z.string(),
    destination: z.string(),
    sections: z
      .array(
        z.object({
          title: z.string(),
          content: z.string(),
          wordCount: z.number().default(0),
          suggestions: z.array(z.string()).optional(),
        })
      )
      .default([]),
    totalWordCount: z.number().default(0),
    targetWordCount: z.number().default(500),
    completionPercentage: z.number().default(0),
    status: z.enum(["drafting", "complete", "error"]).default("drafting"),
  })
);
