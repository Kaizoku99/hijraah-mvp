/**
 * Document & MENA Workflow Tools for Hijraah Agent System
 *
 * Wraps MENA-specific workflows (attestation, police clearance, embassy info)
 * as agent tools. Used by the Preparation Specialist agent.
 */

import { z } from "zod";
import { tool } from "ai";
import {
  getEmbassyInfo,
  getAttestationWorkflow,
  getPoliceClearanceWorkflow,
  getBankStatementRequirements,
  getTotalAttestationTime,
  getTotalAttestationCost,
  SUPPORTED_MENA_COUNTRIES,
  type EmbassyInfo,
  type AttestationStep,
} from "@/lib/mena-workflows";

// ============================================
// EMBASSY INFO TOOL
// ============================================

const EmbassyInfoInputSchema = z.object({
  sourceCountry: z
    .string()
    .describe(
      'MENA country where user is located (e.g., "UAE", "Egypt", "Saudi Arabia")'
    ),
  destinationCountry: z
    .string()
    .default("canada")
    .describe("Target immigration country (default: Canada)"),
});

export const getEmbassyInfoTool = tool({
  description: `Get embassy and VFS visa center information for a MENA country.
Use when user asks about embassy locations, VFS centers, appointment booking, or visa submission centers.
Returns detailed information including addresses, phone numbers, working hours, and appointment URLs.`,
  inputSchema: EmbassyInfoInputSchema,
  execute: async ({ sourceCountry, destinationCountry }) => {
    const embassies = getEmbassyInfo(sourceCountry, destinationCountry);

    if (embassies.length === 0) {
      return {
        type: "embassy-info" as const,
        data: {
          found: false,
          sourceCountry,
          destinationCountry,
          message: {
            en: `No embassy or VFS information found for ${sourceCountry} to ${destinationCountry}. Please check the official embassy website.`,
            ar: `لم يتم العثور على معلومات السفارة أو VFS من ${sourceCountry} إلى ${destinationCountry}. يرجى التحقق من الموقع الرسمي للسفارة.`,
          },
          embassies: [] as EmbassyInfo[],
        },
      };
    }

    return {
      type: "embassy-info" as const,
      data: {
        found: true,
        sourceCountry,
        destinationCountry,
        embassies,
        count: embassies.length,
      },
    };
  },
});

// ============================================
// ATTESTATION WORKFLOW TOOL
// ============================================

const AttestationWorkflowInputSchema = z.object({
  sourceCountry: z
    .string()
    .describe(
      'MENA country where documents need to be attested (e.g., "UAE", "Egypt")'
    ),
});

export const getAttestationWorkflowTool = tool({
  description: `Get document attestation workflow for a MENA country.
Use when user asks about document legalization, MOFA attestation, notarization process, or how to get documents attested.
Returns step-by-step process with authorities, estimated time, and costs.`,
  inputSchema: AttestationWorkflowInputSchema,
  execute: async ({ sourceCountry }) => {
    const steps = getAttestationWorkflow(sourceCountry);

    if (steps.length === 0) {
      return {
        type: "attestation-workflow" as const,
        data: {
          found: false,
          sourceCountry,
          message: {
            en: `Attestation workflow not found for ${sourceCountry}. Please contact your local MOFA for details.`,
            ar: `لم يتم العثور على عملية التصديق لـ ${sourceCountry}. يرجى الاتصال بوزارة الخارجية المحلية.`,
          },
          steps: [] as AttestationStep[],
          totalDays: 0,
          estimatedCost: "Unknown",
        },
      };
    }

    return {
      type: "attestation-workflow" as const,
      data: {
        found: true,
        sourceCountry,
        steps,
        totalDays: getTotalAttestationTime(steps),
        estimatedCost: getTotalAttestationCost(steps),
        stepCount: steps.length,
      },
    };
  },
});

// ============================================
// POLICE CLEARANCE TOOL
// ============================================

const PoliceClearanceInputSchema = z.object({
  sourceCountry: z
    .string()
    .describe(
      'MENA country where police clearance is needed (e.g., "UAE", "Saudi Arabia")'
    ),
});

export const getPoliceClearanceWorkflowTool = tool({
  description: `Get police clearance certificate (PCC) process for a MENA country.
Use when user asks about criminal record certificate, police clearance, good conduct certificate, or background check.
Returns step-by-step process including online/offline options, required documents, and processing times.`,
  inputSchema: PoliceClearanceInputSchema,
  execute: async ({ sourceCountry }) => {
    const steps = getPoliceClearanceWorkflow(sourceCountry);

    if (steps.length === 0) {
      return {
        type: "police-clearance" as const,
        data: {
          found: false,
          sourceCountry,
          message: {
            en: `Police clearance process not found for ${sourceCountry}. Please contact your local police authority.`,
            ar: `لم يتم العثور على عملية شهادة حسن السيرة لـ ${sourceCountry}. يرجى الاتصال بالشرطة المحلية.`,
          },
          steps: [] as AttestationStep[],
          totalDays: 0,
        },
      };
    }

    return {
      type: "police-clearance" as const,
      data: {
        found: true,
        sourceCountry,
        steps,
        totalDays: getTotalAttestationTime(steps),
        stepCount: steps.length,
      },
    };
  },
});

// ============================================
// BANK STATEMENT REQUIREMENTS TOOL
// ============================================

const BankStatementInputSchema = z.object({
  destination: z
    .enum(["canada_express_entry", "portugal_d7"])
    .describe("Immigration program for bank statement requirements"),
});

export const getBankStatementRequirementsTool = tool({
  description: `Get bank statement requirements for a specific immigration program.
Use when user asks about proof of funds, bank statement format, minimum balance, or financial requirements.
Returns minimum balance, statement period, and format requirements in both English and Arabic.`,
  inputSchema: BankStatementInputSchema,
  execute: async ({ destination }) => {
    const requirements = getBankStatementRequirements(destination);

    if (!requirements) {
      return {
        type: "bank-requirements" as const,
        data: {
          found: false,
          destination,
          message: {
            en: `Bank statement requirements not found for ${destination}.`,
            ar: `لم يتم العثور على متطلبات كشف الحساب البنكي لـ ${destination}.`,
          },
        },
      };
    }

    return {
      type: "bank-requirements" as const,
      data: {
        found: true,
        destination,
        requirements,
      },
    };
  },
});

// ============================================
// SUPPORTED COUNTRIES TOOL
// ============================================

export const getSupportedMENACountriesTool = tool({
  description: `Get list of supported MENA countries for immigration workflows.
Use when user asks what countries are supported or which MENA countries Hijraah covers.`,
  inputSchema: z.object({}),
  execute: async () => {
    return {
      type: "supported-countries" as const,
      data: {
        countries: SUPPORTED_MENA_COUNTRIES,
        count: SUPPORTED_MENA_COUNTRIES.length,
      },
    };
  },
});

// ============================================
// EXPORT ALL DOCUMENT TOOLS
// ============================================

export const documentTools = {
  getEmbassyInfo: getEmbassyInfoTool,
  getAttestationWorkflow: getAttestationWorkflowTool,
  getPoliceClearanceWorkflow: getPoliceClearanceWorkflowTool,
  getBankStatementRequirements: getBankStatementRequirementsTool,
  getSupportedMENACountries: getSupportedMENACountriesTool,
};

export type DocumentToolName = keyof typeof documentTools;
