/**
 * Eligibility Tools for Hijraah Agent System
 *
 * Wraps existing calculators (CRS, Portugal visa matcher) as agent tools.
 * These tools can be called by the Assessment Specialist agent.
 */

import { z } from "zod";
import { tool } from "ai";
import {
  calculateCRS,
  type CrsInput,
  type CrsResult,
} from "@/lib/crs-calculator";
import {
  matchVisas,
  checkD2Eligibility,
  checkD7Eligibility,
  checkD8Eligibility,
  type VisaMatcherInput,
  type D2EligibilityInput,
  type D7EligibilityInput,
  type D8EligibilityInput,
} from "@/lib/portugal-visa-matcher";

// ============================================
// CRS CALCULATOR TOOL
// ============================================

const CrsInputSchema = z.object({
  age: z.number().min(17).max(65).describe("Applicant age in years"),
  educationLevel: z
    .enum([
      "none",
      "high_school",
      "one_year",
      "two_year",
      "bachelor",
      "two_or_more",
      "master",
      "phd",
    ])
    .describe("Highest education level"),
  firstLanguageTest: z
    .object({
      speaking: z.number().min(0).max(12).describe("CLB level for speaking"),
      listening: z.number().min(0).max(12).describe("CLB level for listening"),
      reading: z.number().min(0).max(12).describe("CLB level for reading"),
      writing: z.number().min(0).max(12).describe("CLB level for writing"),
    })
    .describe("First official language test scores (CLB levels)"),
  secondLanguageTest: z
    .object({
      speaking: z.number().min(0).max(12),
      listening: z.number().min(0).max(12),
      reading: z.number().min(0).max(12),
      writing: z.number().min(0).max(12),
    })
    .optional()
    .describe("Second official language test scores (CLB levels)"),
  canadianWorkExperience: z
    .number()
    .min(0)
    .max(10)
    .describe("Years of Canadian work experience"),
  hasSpouse: z.boolean().describe("Whether applicant has a spouse/partner"),
  spouseEducation: z
    .enum([
      "none",
      "high_school",
      "one_year",
      "two_year",
      "bachelor",
      "two_or_more",
      "master",
      "phd",
    ])
    .optional()
    .describe("Spouse education level"),
  spouseLanguageTest: z
    .object({
      speaking: z.number().min(0).max(12),
      listening: z.number().min(0).max(12),
      reading: z.number().min(0).max(12),
      writing: z.number().min(0).max(12),
    })
    .optional()
    .describe("Spouse language test scores"),
  spouseCanadianWorkExperience: z
    .number()
    .optional()
    .describe("Spouse Canadian work experience in years"),
  foreignWorkExperience: z
    .number()
    .min(0)
    .max(10)
    .describe("Years of foreign work experience"),
  hasCertificateOfQualification: z
    .boolean()
    .describe("Has Canadian trade certificate"),
  hasCanadianSiblings: z
    .boolean()
    .describe("Has siblings who are Canadian citizens/PR"),
  hasFrenchLanguageSkills: z.boolean().describe("Has French language skills"),
  hasProvincialNomination: z
    .boolean()
    .describe("Has Provincial Nominee Program nomination"),
  hasValidJobOffer: z.boolean().describe("Has valid job offer in Canada"),
  jobOfferNOC: z
    .enum(["00", "0", "A", "B", "none"])
    .describe("NOC skill level of job offer"),
  hasCanadianEducation: z
    .boolean()
    .describe("Has education completed in Canada"),
  canadianEducationLevel: z
    .enum(["one_two_year", "three_year_plus", "master_phd"])
    .optional()
    .describe("Level of Canadian education"),
});

export const calculateCRSTool = tool({
  description: `Calculate Canada Express Entry CRS (Comprehensive Ranking System) score. 
Use this tool when a user wants to know their eligibility score for Express Entry, 
or when they provide information about their age, education, language scores, and work experience.
Returns a detailed breakdown with recommendations for improving their score.`,
  inputSchema: CrsInputSchema,
  execute: async input => {
    const result = calculateCRS(input as CrsInput);
    return {
      type: "crs-calculation" as const,
      data: result,
    };
  },
});

// ============================================
// PORTUGAL VISA MATCHER TOOL
// ============================================

const VisaMatcherInputSchema = z.object({
  hasPortugueseJobOffer: z
    .boolean()
    .describe("Has a job offer from a Portuguese employer"),
  isRemoteWorker: z
    .boolean()
    .describe("Works remotely for a non-Portuguese company"),
  hasPassiveIncome: z
    .boolean()
    .describe("Has passive income sources (pension, investments, etc.)"),
  planningBusiness: z
    .boolean()
    .describe("Plans to start a business or work as freelancer"),
  monthlyIncome: z.number().min(0).describe("Monthly income in EUR"),
  employerCountry: z
    .string()
    .optional()
    .describe("Country where employer is based"),
});

export const matchPortugalVisasTool = tool({
  description: `Match user to suitable Portugal visa types based on their situation.
Use this tool when a user is interested in Portugal immigration and wants to know 
which visa type (D1, D2, D7, D8, Job Seeker) is best for them.
Returns ranked recommendations with scores and reasons in both English and Arabic.`,
  inputSchema: VisaMatcherInputSchema,
  execute: async input => {
    const result = matchVisas(input as VisaMatcherInput);
    return {
      type: "portugal-visa-match" as const,
      data: result,
    };
  },
});

// ============================================
// PORTUGAL D2 ELIGIBILITY TOOL
// ============================================

const D2EligibilityInputSchema = z.object({
  employmentType: z
    .enum(["entrepreneur", "investor", "liberal_profession", "freelancer"])
    .describe("Type of self-employment"),
  hasInvestment: z.boolean().describe("Has investment in Portugal"),
  investmentAmount: z.number().optional().describe("Investment amount in EUR"),
  hasBusinessPlan: z.boolean().describe("Has viable business plan"),
  hasServiceContract: z.boolean().describe("Has service contract or proposal"),
  hasProfessionalQualification: z
    .boolean()
    .describe("Has professional qualifications"),
  hasFinancialMeansInPortugal: z
    .boolean()
    .describe("Can prove financial means in Portugal"),
  hasAccommodation: z.boolean().describe("Has accommodation proof in Portugal"),
  hasCriminalRecord: z.boolean().describe("Has criminal record"),
  hasHealthInsurance: z.boolean().describe("Has valid health insurance"),
});

export const checkD2EligibilityTool = tool({
  description: `Check eligibility for Portugal D2 Entrepreneur/Freelancer visa.
Use when user wants to start a business or work as freelancer in Portugal.
Returns detailed eligibility status with requirements breakdown.`,
  inputSchema: D2EligibilityInputSchema,
  execute: async input => {
    const result = checkD2Eligibility(input as D2EligibilityInput);
    return {
      type: "d2-eligibility" as const,
      data: result,
    };
  },
});

// ============================================
// PORTUGAL D7 ELIGIBILITY TOOL
// ============================================

const D7EligibilityInputSchema = z.object({
  incomeSource: z
    .enum([
      "pension",
      "rental_income",
      "investments",
      "dividends",
      "intellectual_property",
      "other_passive",
      "employment",
    ])
    .describe("Primary source of passive income"),
  monthlyIncome: z.number().min(0).describe("Monthly passive income in EUR"),
  adultDependents: z.number().min(0).describe("Number of adult dependents"),
  childDependents: z.number().min(0).describe("Number of child dependents"),
  hasIncomeDocumentation: z
    .boolean()
    .describe("Has documentation proving income"),
  hasAccommodation: z.boolean().describe("Has accommodation proof in Portugal"),
  hasCriminalRecord: z.boolean().describe("Has criminal record"),
  hasHealthInsurance: z.boolean().describe("Has valid health insurance"),
});

export const checkD7EligibilityTool = tool({
  description: `Check eligibility for Portugal D7 Passive Income visa.
Use when user has passive income (pension, investments, rental) and wants to retire in Portugal.
Returns detailed eligibility status with income requirements for dependents.`,
  inputSchema: D7EligibilityInputSchema,
  execute: async input => {
    const result = checkD7Eligibility(input as D7EligibilityInput);
    return {
      type: "d7-eligibility" as const,
      data: result,
    };
  },
});

// ============================================
// PORTUGAL D8 ELIGIBILITY TOOL
// ============================================

const D8EligibilityInputSchema = z.object({
  employmentStatus: z
    .enum([
      "remote_employee",
      "freelancer_international",
      "business_owner_remote",
    ])
    .describe("Current employment status for D8 Digital Nomad visa"),
  employerCountry: z.string().describe("Country where employer is based"),
  averageMonthlyIncome: z
    .number()
    .min(0)
    .describe("Average monthly income over last 3 months in EUR"),
  hasRemoteWorkContract: z.boolean().describe("Has remote work contract"),
  hasFiscalResidence: z.boolean().describe("Has proof of fiscal residence"),
  canWorkRemotely: z.boolean().describe("Can work remotely"),
  hasAccommodation: z.boolean().describe("Has accommodation proof in Portugal"),
  hasCriminalRecord: z.boolean().describe("Has criminal record"),
  hasHealthInsurance: z.boolean().describe("Has valid health insurance"),
  hasBankStatements: z
    .boolean()
    .describe("Has bank statements for last 3 months"),
});

export const checkD8EligibilityTool = tool({
  description: `Check eligibility for Portugal D8 Digital Nomad visa.
Use when user works remotely for a company outside Portugal and earns €3,680+/month.
Returns detailed eligibility status with income and documentation requirements.`,
  inputSchema: D8EligibilityInputSchema,
  execute: async input => {
    const result = checkD8Eligibility(input as D8EligibilityInput);
    return {
      type: "d8-eligibility" as const,
      data: result,
    };
  },
});

// ============================================
// EXPORT ALL ELIGIBILITY TOOLS
// ============================================

export const eligibilityTools = {
  calculateCRS: calculateCRSTool,
  matchPortugalVisas: matchPortugalVisasTool,
  checkD2Eligibility: checkD2EligibilityTool,
  checkD7Eligibility: checkD7EligibilityTool,
  checkD8Eligibility: checkD8EligibilityTool,
};

export type EligibilityToolName = keyof typeof eligibilityTools;
