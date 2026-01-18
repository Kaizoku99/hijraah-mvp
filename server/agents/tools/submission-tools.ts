/**
 * Submission Tools for Hijraah Immigration Platform
 *
 * Tools for the Submission Specialist agent:
 * - SOP Generator: Generates Statement of Purpose drafts
 * - Fee Calculator: Calculates application fees for various pathways
 */

import { tool } from "ai";
import { z } from "zod";

// ============================================
// FEE DATA
// ============================================

interface FeeItem {
  category:
    | "government"
    | "biometrics"
    | "medical"
    | "translation"
    | "attestation"
    | "courier"
    | "other";
  name: { en: string; ar: string };
  amount: number;
  currency: string;
  required: boolean;
  notes?: string;
}

const CANADA_EXPRESS_ENTRY_FEES: FeeItem[] = [
  {
    category: "government",
    name: {
      en: "IRCC Application Fee (Principal)",
      ar: "رسوم طلب IRCC (الرئيسي)",
    },
    amount: 1365,
    currency: "CAD",
    required: true,
  },
  {
    category: "government",
    name: {
      en: "Right of Permanent Residence Fee",
      ar: "رسوم حق الإقامة الدائمة",
    },
    amount: 515,
    currency: "CAD",
    required: true,
  },
  {
    category: "biometrics",
    name: { en: "Biometrics Fee", ar: "رسوم البيومتري" },
    amount: 85,
    currency: "CAD",
    required: true,
  },
  {
    category: "medical",
    name: {
      en: "Medical Exam (Panel Physician)",
      ar: "الفحص الطبي (طبيب معتمد)",
    },
    amount: 250,
    currency: "CAD",
    required: true,
    notes: "Varies by country - approximate",
  },
  {
    category: "translation",
    name: {
      en: "Document Translation (Estimated)",
      ar: "ترجمة المستندات (تقديري)",
    },
    amount: 300,
    currency: "CAD",
    required: false,
    notes: "Depends on number of documents",
  },
  {
    category: "other",
    name: {
      en: "ECA (Educational Credential Assessment)",
      ar: "تقييم الشهادات التعليمية (ECA)",
    },
    amount: 200,
    currency: "CAD",
    required: true,
  },
  {
    category: "other",
    name: {
      en: "Language Test (IELTS/CELPIP)",
      ar: "اختبار اللغة (IELTS/CELPIP)",
    },
    amount: 350,
    currency: "CAD",
    required: true,
  },
];

const PORTUGAL_D7_FEES: FeeItem[] = [
  {
    category: "government",
    name: { en: "Visa Application Fee", ar: "رسوم طلب التأشيرة" },
    amount: 90,
    currency: "EUR",
    required: true,
  },
  {
    category: "government",
    name: { en: "Residence Permit Fee", ar: "رسوم تصريح الإقامة" },
    amount: 320,
    currency: "EUR",
    required: true,
  },
  {
    category: "medical",
    name: { en: "Travel Insurance (1 year)", ar: "تأمين السفر (سنة واحدة)" },
    amount: 400,
    currency: "EUR",
    required: true,
  },
  {
    category: "attestation",
    name: {
      en: "Document Apostille (Estimated)",
      ar: "تصديق المستندات (تقديري)",
    },
    amount: 150,
    currency: "EUR",
    required: true,
    notes: "Depends on source country",
  },
  {
    category: "translation",
    name: { en: "Certified Translations", ar: "الترجمات المعتمدة" },
    amount: 250,
    currency: "EUR",
    required: true,
  },
  {
    category: "other",
    name: { en: "NIF Tax Number Application", ar: "طلب رقم NIF الضريبي" },
    amount: 50,
    currency: "EUR",
    required: true,
  },
];

const PORTUGAL_D2_FEES: FeeItem[] = [
  {
    category: "government",
    name: { en: "Visa Application Fee", ar: "رسوم طلب التأشيرة" },
    amount: 90,
    currency: "EUR",
    required: true,
  },
  {
    category: "government",
    name: { en: "Residence Permit Fee", ar: "رسوم تصريح الإقامة" },
    amount: 320,
    currency: "EUR",
    required: true,
  },
  {
    category: "government",
    name: {
      en: "Business Registration (Estimated)",
      ar: "تسجيل الأعمال (تقديري)",
    },
    amount: 500,
    currency: "EUR",
    required: true,
  },
  {
    category: "medical",
    name: { en: "Travel Insurance (1 year)", ar: "تأمين السفر (سنة واحدة)" },
    amount: 400,
    currency: "EUR",
    required: true,
  },
  {
    category: "attestation",
    name: { en: "Document Apostille", ar: "تصديق المستندات" },
    amount: 150,
    currency: "EUR",
    required: true,
  },
  {
    category: "translation",
    name: { en: "Certified Translations", ar: "الترجمات المعتمدة" },
    amount: 300,
    currency: "EUR",
    required: true,
  },
  {
    category: "other",
    name: { en: "NIF Tax Number", ar: "رقم NIF الضريبي" },
    amount: 50,
    currency: "EUR",
    required: true,
  },
  {
    category: "other",
    name: { en: "Legal/Accounting Setup", ar: "الإعداد القانوني/المحاسبي" },
    amount: 1000,
    currency: "EUR",
    required: false,
    notes: "Recommended for business setup",
  },
];

// Exchange rates (approximate)
const EXCHANGE_RATES = {
  CAD_TO_USD: 0.74,
  EUR_TO_USD: 1.08,
  EUR_TO_CAD: 1.46,
};

// ============================================
// SOP TEMPLATES
// ============================================

interface SOPSection {
  title: string;
  guidelines: { en: string; ar: string };
  sampleContent?: { en: string; ar: string };
}

const EXPRESS_ENTRY_SOP_SECTIONS: SOPSection[] = [
  {
    title: "Introduction & Background",
    guidelines: {
      en: "Introduce yourself, your current situation, and why you're seeking permanent residence in Canada. Mention your nationality and current location.",
      ar: "قدم نفسك، وضعك الحالي، ولماذا تسعى للإقامة الدائمة في كندا. اذكر جنسيتك وموقعك الحالي.",
    },
  },
  {
    title: "Education & Qualifications",
    guidelines: {
      en: "Detail your educational background, degrees, certifications, and how they align with your career goals in Canada.",
      ar: "فصّل خلفيتك التعليمية، الشهادات، والتأهيلات، وكيف تتوافق مع أهدافك المهنية في كندا.",
    },
  },
  {
    title: "Work Experience & Skills",
    guidelines: {
      en: "Describe your professional experience, key achievements, and transferable skills that make you a valuable addition to Canada's workforce.",
      ar: "صف خبرتك المهنية، الإنجازات الرئيسية، والمهارات القابلة للنقل التي تجعلك إضافة قيمة للقوى العاملة الكندية.",
    },
  },
  {
    title: "Why Canada",
    guidelines: {
      en: "Explain your specific reasons for choosing Canada. Mention career opportunities, quality of life, and how your skills can contribute to the Canadian economy.",
      ar: "اشرح أسبابك المحددة لاختيار كندا. اذكر الفرص المهنية، جودة الحياة، وكيف يمكن لمهاراتك المساهمة في الاقتصاد الكندي.",
    },
  },
  {
    title: "Settlement Plans",
    guidelines: {
      en: "Describe your plans for settling in Canada - target province/city, employment prospects, and how you'll integrate into Canadian society.",
      ar: "صف خططك للاستقرار في كندا - المقاطعة/المدينة المستهدفة، احتمالات العمل، وكيف ستندمج في المجتمع الكندي.",
    },
  },
];

const PORTUGAL_D7_SOP_SECTIONS: SOPSection[] = [
  {
    title: "Personal Introduction",
    guidelines: {
      en: "Introduce yourself, your nationality, and your current financial situation that qualifies you for the D7 passive income visa.",
      ar: "قدم نفسك، جنسيتك، ووضعك المالي الحالي الذي يؤهلك لتأشيرة D7 للدخل السلبي.",
    },
  },
  {
    title: "Income Sources",
    guidelines: {
      en: "Detail your passive income sources: pensions, investments, rental income, dividends. Provide specific monthly/annual figures.",
      ar: "فصّل مصادر دخلك السلبي: المعاشات، الاستثمارات، دخل الإيجار، الأرباح. قدم أرقامًا شهرية/سنوية محددة.",
    },
  },
  {
    title: "Ties to Portugal",
    guidelines: {
      en: "Explain any existing connections to Portugal - previous visits, language learning, cultural interest, or planned accommodation.",
      ar: "اشرح أي روابط حالية بالبرتغال - زيارات سابقة، تعلم اللغة، اهتمام ثقافي، أو سكن مخطط.",
    },
  },
  {
    title: "Integration Plans",
    guidelines: {
      en: "Describe how you plan to integrate into Portuguese society - learning Portuguese, engaging with local community, respecting local customs.",
      ar: "صف كيف تخطط للاندماج في المجتمع البرتغالي - تعلم البرتغالية، التفاعل مع المجتمع المحلي، احترام العادات المحلية.",
    },
  },
];

const PORTUGAL_D2_SOP_SECTIONS: SOPSection[] = [
  {
    title: "Entrepreneur Introduction",
    guidelines: {
      en: "Introduce yourself as an entrepreneur, your background, and your business experience.",
      ar: "قدم نفسك كرائد أعمال، خلفيتك، وخبرتك في الأعمال.",
    },
  },
  {
    title: "Business Concept",
    guidelines: {
      en: "Explain your business idea, the problem it solves, target market, and unique value proposition for Portugal.",
      ar: "اشرح فكرة عملك، المشكلة التي يحلها، السوق المستهدف، والقيمة الفريدة للبرتغال.",
    },
  },
  {
    title: "Business Plan Summary",
    guidelines: {
      en: "Provide a brief overview of your business plan: financial projections, investment amount, expected revenue, and job creation potential.",
      ar: "قدم نظرة عامة موجزة عن خطة عملك: التوقعات المالية، مبلغ الاستثمار، الإيرادات المتوقعة، وإمكانية خلق فرص العمل.",
    },
  },
  {
    title: "Contribution to Portugal",
    guidelines: {
      en: "Explain how your business will benefit Portugal's economy - job creation, innovation, tax contribution, or addressing local needs.",
      ar: "اشرح كيف سيستفيد عملك اقتصاد البرتغال - خلق الوظائف، الابتكار، المساهمة الضريبية، أو تلبية الاحتياجات المحلية.",
    },
  },
  {
    title: "Implementation Timeline",
    guidelines: {
      en: "Outline your timeline for establishing the business in Portugal - registration, hiring, launch, and growth phases.",
      ar: "حدد جدولك الزمني لإنشاء العمل في البرتغال - التسجيل، التوظيف، الإطلاق، ومراحل النمو.",
    },
  },
];

// ============================================
// TOOLS
// ============================================

// ============================================
// TOOL INPUT SCHEMAS
// ============================================

const FeeCalculatorInputSchema = z.object({
  pathway: z
    .enum(["canada_express_entry", "portugal_d7", "portugal_d2", "portugal_d8"])
    .describe("The immigration pathway to calculate fees for"),
  includeOptional: z
    .boolean()
    .default(false)
    .describe("Whether to include optional fees in the calculation"),
});

const SopGeneratorInputSchema = z.object({
  pathway: z
    .enum(["canada_express_entry", "portugal_d7", "portugal_d2", "portugal_d8"])
    .describe("The immigration pathway for the SOP"),
  language: z
    .enum(["en", "ar"])
    .default("en")
    .describe("Language for the guidelines"),
  userProfile: z
    .object({
      name: z.string().optional(),
      nationality: z.string().optional(),
      occupation: z.string().optional(),
      education: z.string().optional(),
      experience: z.number().optional(),
    })
    .optional()
    .describe("User profile data to personalize the SOP"),
});

type FeeCalculatorInput = z.infer<typeof FeeCalculatorInputSchema>;
type SopGeneratorInput = z.infer<typeof SopGeneratorInputSchema>;

// ============================================
// TOOLS
// ============================================

/**
 * Fee Calculator Tool
 * Calculates total application fees for a given immigration pathway
 */
export const feeCalculatorTool = tool({
  description:
    "Calculate total application fees for an immigration pathway. Provides itemized breakdown and total in multiple currencies.",
  inputSchema: FeeCalculatorInputSchema,
  execute: async (input: FeeCalculatorInput) => {
    const { pathway, includeOptional } = input;
    let fees: FeeItem[];
    let destination: string;
    let pathwayName: string;

    switch (pathway) {
      case "canada_express_entry":
        fees = CANADA_EXPRESS_ENTRY_FEES;
        destination = "Canada";
        pathwayName = "Express Entry";
        break;
      case "portugal_d7":
        fees = PORTUGAL_D7_FEES;
        destination = "Portugal";
        pathwayName = "D7 Passive Income Visa";
        break;
      case "portugal_d2":
        fees = PORTUGAL_D2_FEES;
        destination = "Portugal";
        pathwayName = "D2 Entrepreneur Visa";
        break;
      case "portugal_d8":
        // D8 is similar to D7 with slight variations
        fees = PORTUGAL_D7_FEES;
        destination = "Portugal";
        pathwayName = "D8 Digital Nomad Visa";
        break;
      default:
        return { error: "Unknown pathway" };
    }

    // Filter fees based on includeOptional
    const applicableFees = includeOptional
      ? fees
      : fees.filter(f => f.required);

    // Calculate totals
    let totalCAD = 0;
    let totalUSD = 0;

    for (const fee of applicableFees) {
      if (fee.currency === "CAD") {
        totalCAD += fee.amount;
        totalUSD += fee.amount * EXCHANGE_RATES.CAD_TO_USD;
      } else if (fee.currency === "EUR") {
        totalCAD += fee.amount * EXCHANGE_RATES.EUR_TO_CAD;
        totalUSD += fee.amount * EXCHANGE_RATES.EUR_TO_USD;
      }
    }

    return {
      pathway: pathwayName,
      destination,
      items: applicableFees,
      subtotal: applicableFees.reduce((sum, f) => sum + f.amount, 0),
      totalCAD: Math.round(totalCAD),
      totalUSD: Math.round(totalUSD),
      disclaimer:
        "Fees are approximate and subject to change. Check official sources for current rates.",
      status: "complete" as const,
    };
  },
});

/**
 * SOP Structure Generator Tool
 * Generates a Statement of Purpose structure with section guidelines
 */
export const sopGeneratorTool = tool({
  description:
    "Generate a Statement of Purpose (SOP) structure with section guidelines for a specific immigration pathway.",
  inputSchema: SopGeneratorInputSchema,
  execute: async (input: SopGeneratorInput) => {
    const { pathway, language, userProfile } = input;
    let sections: SOPSection[];
    let pathwayName: string;
    let destination: string;

    switch (pathway) {
      case "canada_express_entry":
        sections = EXPRESS_ENTRY_SOP_SECTIONS;
        pathwayName = "Express Entry";
        destination = "Canada";
        break;
      case "portugal_d7":
        sections = PORTUGAL_D7_SOP_SECTIONS;
        pathwayName = "D7 Passive Income Visa";
        destination = "Portugal";
        break;
      case "portugal_d2":
        sections = PORTUGAL_D2_SOP_SECTIONS;
        pathwayName = "D2 Entrepreneur Visa";
        destination = "Portugal";
        break;
      case "portugal_d8":
        sections = PORTUGAL_D7_SOP_SECTIONS; // Similar to D7
        pathwayName = "D8 Digital Nomad Visa";
        destination = "Portugal";
        break;
      default:
        return { error: "Unknown pathway" };
    }

    // Build sections with word count targets
    const targetWordCount = pathway.startsWith("portugal") ? 400 : 500;
    const wordsPerSection = Math.round(targetWordCount / sections.length);

    const lang = language as "en" | "ar";

    const formattedSections = sections.map(section => ({
      title: section.title,
      content: section.guidelines[lang],
      wordCount: wordsPerSection,
      suggestions: userProfile
        ? [
            lang === "en"
              ? `Mention your experience as ${userProfile.occupation || "a professional"}`
              : `اذكر خبرتك ك${userProfile.occupation || "محترف"}`,
          ]
        : undefined,
    }));

    return {
      pathway: pathwayName,
      destination,
      sections: formattedSections,
      totalWordCount: 0,
      targetWordCount,
      completionPercentage: 0,
      status: "complete" as const,
      tips: [
        lang === "en"
          ? "Keep the tone professional but personal"
          : "حافظ على نبرة مهنية لكن شخصية",
        lang === "en"
          ? "Use specific examples and numbers where possible"
          : "استخدم أمثلة وأرقام محددة حيثما أمكن",
        lang === "en"
          ? "Proofread for grammar and spelling"
          : "راجع القواعد النحوية والإملائية",
      ],
    };
  },
});

// Export all tools
export const submissionTools = {
  feeCalculator: feeCalculatorTool,
  sopGenerator: sopGeneratorTool,
};
