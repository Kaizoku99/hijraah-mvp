/**
 * Portugal Visa Matcher - Scoring algorithms and eligibility logic
 */

import {
  PortugalVisaType,
  PORTUGAL_VISAS,
  D8_MINIMUM_INCOME_EUR,
  PORTUGAL_MINIMUM_WAGE_EUR,
  calculateD7RequiredIncome,
  EligibilityStatus,
  D2EmploymentType,
  D7IncomeSource,
  D8EmploymentStatus,
} from './portugal-constants';

// ============================================
// INPUT TYPES
// ============================================

export interface VisaMatcherInput {
  // Employment situation
  hasPortugueseJobOffer: boolean;
  isRemoteWorker: boolean;
  hasPassiveIncome: boolean;
  planningBusiness: boolean;

  // Income
  monthlyIncome: number;

  // Additional context
  employerCountry?: string;
  incomeSource?: D7IncomeSource;
}

export interface D2EligibilityInput {
  employmentType: D2EmploymentType;
  hasInvestment: boolean;
  investmentAmount?: number;
  hasBusinessPlan: boolean;
  hasServiceContract: boolean;
  hasProfessionalQualification: boolean;
  hasFinancialMeansInPortugal: boolean;
  hasAccommodation: boolean;
  hasCriminalRecord: boolean;
  hasHealthInsurance: boolean;
}

export interface D7EligibilityInput {
  incomeSource: D7IncomeSource;
  monthlyIncome: number;
  adultDependents: number;
  childDependents: number;
  hasIncomeDocumentation: boolean;
  hasAccommodation: boolean;
  hasCriminalRecord: boolean;
  hasHealthInsurance: boolean;
}

export interface D8EligibilityInput {
  employmentStatus: D8EmploymentStatus;
  employerCountry: string;
  averageMonthlyIncome: number; // Average of last 3 months
  hasRemoteWorkContract: boolean;
  hasFiscalResidence: boolean;
  canWorkRemotely: boolean;
  hasAccommodation: boolean;
  hasCriminalRecord: boolean;
  hasHealthInsurance: boolean;
  hasBankStatements: boolean;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface VisaRecommendation {
  visaType: PortugalVisaType;
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  reasons: { en: string; ar: string }[];
  warnings?: { en: string; ar: string }[];
}

export interface EligibilityResult {
  status: EligibilityStatus;
  score: number; // 0-100
  meetsMandatoryRequirements: boolean;
  breakdown: {
    category: string;
    met: boolean;
    details: { en: string; ar: string };
  }[];
  missingRequirements: { en: string; ar: string }[];
  recommendations: { en: string; ar: string }[];
}

// ============================================
// VISA MATCHER LOGIC
// ============================================

export function matchVisas(input: VisaMatcherInput): VisaRecommendation[] {
  const recommendations: VisaRecommendation[] = [];

  // D1 - Portuguese job offer
  if (input.hasPortugueseJobOffer) {
    recommendations.push({
      visaType: 'd1',
      score: 95,
      confidence: 'high',
      reasons: [
        {
          en: 'You have a job offer from a Portuguese employer',
          ar: 'لديك عرض عمل من صاحب عمل برتغالي',
        },
      ],
    });
  }

  // D8 - Digital Nomad
  if (input.isRemoteWorker && input.employerCountry !== 'portugal') {
    const meetsIncome = input.monthlyIncome >= D8_MINIMUM_INCOME_EUR;
    const score = meetsIncome ? 90 : 60;

    recommendations.push({
      visaType: 'd8',
      score,
      confidence: meetsIncome ? 'high' : 'medium',
      reasons: [
        {
          en: 'You work remotely for a non-Portuguese company',
          ar: 'تعمل عن بُعد لشركة غير برتغالية',
        },
        meetsIncome
          ? {
            en: `Your income (€${input.monthlyIncome.toLocaleString()}) meets the €${D8_MINIMUM_INCOME_EUR.toLocaleString()}/month requirement`,
            ar: `دخلك (${input.monthlyIncome.toLocaleString()}€) يفي بمتطلبات ${D8_MINIMUM_INCOME_EUR.toLocaleString()}€/شهر`,
          }
          : {
            en: `Your income (€${input.monthlyIncome.toLocaleString()}) is below the €${D8_MINIMUM_INCOME_EUR.toLocaleString()}/month requirement`,
            ar: `دخلك (${input.monthlyIncome.toLocaleString()}€) أقل من متطلبات ${D8_MINIMUM_INCOME_EUR.toLocaleString()}€/شهر`,
          },
      ],
      warnings: meetsIncome
        ? undefined
        : [
          {
            en: `You need €${(D8_MINIMUM_INCOME_EUR - input.monthlyIncome).toLocaleString()} more monthly income`,
            ar: `تحتاج ${(D8_MINIMUM_INCOME_EUR - input.monthlyIncome).toLocaleString()}€ إضافية شهرياً`,
          },
        ],
    });
  }

  // D7 - Passive Income
  if (input.hasPassiveIncome || (!input.isRemoteWorker && !input.hasPortugueseJobOffer && !input.planningBusiness)) {
    const meetsIncome = input.monthlyIncome >= PORTUGAL_MINIMUM_WAGE_EUR;
    const score = meetsIncome ? 85 : 50;

    recommendations.push({
      visaType: 'd7',
      score,
      confidence: meetsIncome ? 'high' : 'low',
      reasons: [
        input.hasPassiveIncome
          ? {
            en: 'You have passive income sources',
            ar: 'لديك مصادر دخل سلبي',
          }
          : {
            en: 'D7 visa allows you to live in Portugal with passive income',
            ar: 'تأشيرة D7 تتيح لك العيش في البرتغال بدخل سلبي',
          },
        meetsIncome
          ? {
            en: `Your income (€${input.monthlyIncome.toLocaleString()}) meets the minimum €${PORTUGAL_MINIMUM_WAGE_EUR}/month`,
            ar: `دخلك (${input.monthlyIncome.toLocaleString()}€) يفي بالحد الأدنى ${PORTUGAL_MINIMUM_WAGE_EUR}€/شهر`,
          }
          : {
            en: `Minimum income required: €${PORTUGAL_MINIMUM_WAGE_EUR}/month`,
            ar: `الحد الأدنى للدخل المطلوب: ${PORTUGAL_MINIMUM_WAGE_EUR}€/شهر`,
          },
      ],
    });
  }

  // D2 - Entrepreneur/Freelancer
  if (input.planningBusiness || (input.isRemoteWorker && input.employerCountry === 'portugal')) {
    recommendations.push({
      visaType: 'd2',
      score: 75,
      confidence: 'medium',
      reasons: [
        {
          en: 'You plan to start a business or work as a freelancer in Portugal',
          ar: 'تخطط لبدء عمل تجاري أو العمل كمستقل في البرتغال',
        },
        {
          en: 'Requires a viable business plan or service contracts',
          ar: 'يتطلب خطة عمل قابلة للتطبيق أو عقود خدمات',
        },
      ],
    });
  }

  // Job Seeker - fallback option
  if (!input.hasPortugueseJobOffer && input.monthlyIncome < PORTUGAL_MINIMUM_WAGE_EUR) {
    recommendations.push({
      visaType: 'job_seeker',
      score: 40,
      confidence: 'low',
      reasons: [
        {
          en: 'Allows you to search for employment in Portugal for up to 120 days',
          ar: 'يتيح لك البحث عن عمل في البرتغال لمدة تصل إلى 120 يوماً',
        },
        {
          en: 'Note: Regime recently changed - verify current requirements',
          ar: 'ملاحظة: تغير النظام مؤخراً - تحقق من المتطلبات الحالية',
        },
      ],
      warnings: [
        {
          en: 'Job seeker visa has limited validity and recent policy changes',
          ar: 'تأشيرة البحث عن عمل لها صلاحية محدودة وتغييرات سياسية حديثة',
        },
      ],
    });
  }

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

// ============================================
// D2 ELIGIBILITY CHECKER
// ============================================

export function checkD2Eligibility(input: D2EligibilityInput): EligibilityResult {
  const breakdown: EligibilityResult['breakdown'] = [];
  const missingRequirements: { en: string; ar: string }[] = [];
  const recommendations: { en: string; ar: string }[] = [];
  let score = 0;
  let mandatoryMet = true;

  // Business plan or Investment (MANDATORY - one of them)
  const hasBusinessOrInvestment = input.hasBusinessPlan || input.hasInvestment;
  breakdown.push({
    category: 'Business Plan / Investment',
    met: hasBusinessOrInvestment,
    details: hasBusinessOrInvestment
      ? {
        en: input.hasInvestment
          ? `Investment proof available (€${input.investmentAmount?.toLocaleString() || 'N/A'})`
          : 'Business plan available',
        ar: input.hasInvestment
          ? `إثبات الاستثمار متوفر (${input.investmentAmount?.toLocaleString() || 'غير محدد'}€)`
          : 'خطة العمل متوفرة',
      }
      : {
        en: 'Missing: Business plan OR investment proof required',
        ar: 'مفقود: خطة العمل أو إثبات الاستثمار مطلوب',
      },
  });
  if (hasBusinessOrInvestment) score += 30;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'You must have either a viable business plan OR proof of executed investment in Portugal',
      ar: 'يجب أن يكون لديك إما خطة عمل قابلة للتطبيق أو إثبات استثمار منفذ في البرتغال',
    });
  }

  // Service contract for liberal professions
  if (input.employmentType === 'liberal_profession') {
    breakdown.push({
      category: 'Service Contract',
      met: input.hasServiceContract,
      details: input.hasServiceContract
        ? {
          en: 'Service contract or proposal available',
          ar: 'عقد الخدمات أو العرض متوفر',
        }
        : {
          en: 'Service contract recommended for liberal professions',
          ar: 'عقد الخدمات موصى به للمهن الحرة',
        },
    });
    if (input.hasServiceContract) score += 15;
    else {
      recommendations.push({
        en: 'For liberal professions, having a service contract or proposal strengthens your application',
        ar: 'للمهن الحرة، وجود عقد خدمات أو عرض يقوي طلبك',
      });
    }
  }

  // Professional qualification
  if (input.hasProfessionalQualification) {
    score += 10;
    breakdown.push({
      category: 'Professional Qualification',
      met: true,
      details: {
        en: 'Professional qualification documents available',
        ar: 'وثائق المؤهلات المهنية متوفرة',
      },
    });
  }

  // Financial means in Portugal
  breakdown.push({
    category: 'Financial Means in Portugal',
    met: input.hasFinancialMeansInPortugal,
    details: input.hasFinancialMeansInPortugal
      ? {
        en: 'Proof of financial means available',
        ar: 'إثبات الموارد المالية متوفر',
      }
      : {
        en: 'Proof of financial means required',
        ar: 'إثبات الموارد المالية مطلوب',
      },
  });
  if (input.hasFinancialMeansInPortugal) score += 15;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Proof of financial means available in Portugal is required',
      ar: 'إثبات الموارد المالية المتاحة في البرتغال مطلوب',
    });
  }

  // Accommodation
  breakdown.push({
    category: 'Accommodation',
    met: input.hasAccommodation,
    details: input.hasAccommodation
      ? { en: 'Accommodation proof available', ar: 'إثبات السكن متوفر' }
      : { en: 'Accommodation proof required', ar: 'إثبات السكن مطلوب' },
  });
  if (input.hasAccommodation) score += 10;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Proof of accommodation in Portugal is required',
      ar: 'إثبات السكن في البرتغال مطلوب',
    });
  }

  // Criminal record check
  breakdown.push({
    category: 'Criminal Record',
    met: !input.hasCriminalRecord,
    details: !input.hasCriminalRecord
      ? { en: 'No criminal record', ar: 'لا يوجد سجل جنائي' }
      : { en: 'Criminal record may affect application', ar: 'السجل الجنائي قد يؤثر على الطلب' },
  });
  if (!input.hasCriminalRecord) score += 10;
  else {
    recommendations.push({
      en: 'A criminal record may complicate your application - consult with an immigration lawyer',
      ar: 'السجل الجنائي قد يعقد طلبك - استشر محامي هجرة',
    });
  }

  // Health insurance
  breakdown.push({
    category: 'Health Insurance',
    met: input.hasHealthInsurance,
    details: input.hasHealthInsurance
      ? { en: 'Health insurance available', ar: 'التأمين الصحي متوفر' }
      : { en: 'Health insurance required', ar: 'التأمين الصحي مطلوب' },
  });
  if (input.hasHealthInsurance) score += 10;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Valid travel/health insurance is required',
      ar: 'تأمين سفر/صحي صالح مطلوب',
    });
  }

  // Determine status
  let status: EligibilityStatus;
  if (mandatoryMet && score >= 70) {
    status = 'eligible';
  } else if (mandatoryMet && score >= 50) {
    status = 'likely_eligible';
  } else if (score >= 30) {
    status = 'needs_more_info';
  } else {
    status = 'not_eligible';
  }

  return {
    status,
    score,
    meetsMandatoryRequirements: mandatoryMet,
    breakdown,
    missingRequirements,
    recommendations,
  };
}

// ============================================
// D7 ELIGIBILITY CHECKER
// ============================================

export function checkD7Eligibility(input: D7EligibilityInput): EligibilityResult {
  const breakdown: EligibilityResult['breakdown'] = [];
  const missingRequirements: { en: string; ar: string }[] = [];
  const recommendations: { en: string; ar: string }[] = [];
  let score = 0;
  let mandatoryMet = true;

  // Calculate required income
  const requiredIncome = calculateD7RequiredIncome(input.adultDependents, input.childDependents);
  const meetsIncomeRequirement = input.monthlyIncome >= requiredIncome;

  // Income requirement (MANDATORY)
  breakdown.push({
    category: 'Monthly Income',
    met: meetsIncomeRequirement,
    details: meetsIncomeRequirement
      ? {
        en: `Your income (€${input.monthlyIncome.toLocaleString()}) meets the required €${requiredIncome.toLocaleString()}/month`,
        ar: `دخلك (${input.monthlyIncome.toLocaleString()}€) يفي بالمطلوب ${requiredIncome.toLocaleString()}€/شهر`,
      }
      : {
        en: `Your income (€${input.monthlyIncome.toLocaleString()}) is below the required €${requiredIncome.toLocaleString()}/month (gap: €${(requiredIncome - input.monthlyIncome).toLocaleString()})`,
        ar: `دخلك (${input.monthlyIncome.toLocaleString()}€) أقل من المطلوب ${requiredIncome.toLocaleString()}€/شهر (الفجوة: ${(requiredIncome - input.monthlyIncome).toLocaleString()}€)`,
      },
  });

  if (meetsIncomeRequirement) {
    score += 40;
  } else {
    mandatoryMet = false;
    missingRequirements.push({
      en: `You need €${(requiredIncome - input.monthlyIncome).toLocaleString()} more monthly passive income`,
      ar: `تحتاج ${(requiredIncome - input.monthlyIncome).toLocaleString()}€ إضافية من الدخل السلبي الشهري`,
    });
  }

  // Income must be PASSIVE
  const passiveIncomeSources: D7IncomeSource[] = ['pension', 'rental_income', 'investments', 'dividends', 'intellectual_property', 'other_passive'];
  const isPassiveIncome = passiveIncomeSources.includes(input.incomeSource);

  breakdown.push({
    category: 'Passive Income Type',
    met: isPassiveIncome,
    details: {
      en: `Income source: ${input.incomeSource.replace(/_/g, ' ')}`,
      ar: `مصدر الدخل: ${input.incomeSource === 'pension' ? 'معاش تقاعدي' : input.incomeSource === 'rental_income' ? 'دخل إيجاري' : input.incomeSource === 'investments' ? 'استثمارات' : input.incomeSource === 'dividends' ? 'أرباح أسهم' : 'أخرى'}`,
    },
  });
  if (isPassiveIncome) score += 15;

  // Income documentation
  breakdown.push({
    category: 'Income Documentation',
    met: input.hasIncomeDocumentation,
    details: input.hasIncomeDocumentation
      ? { en: 'Income documentation available', ar: 'وثائق الدخل متوفرة' }
      : { en: 'Income documentation required', ar: 'وثائق الدخل مطلوبة' },
  });
  if (input.hasIncomeDocumentation) score += 15;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Documentation proving your passive income is required (bank statements, pension certificate, etc.)',
      ar: 'مطلوب وثائق تثبت دخلك السلبي (كشوف حساب بنكية، شهادة تقاعد، إلخ)',
    });
  }

  // Accommodation
  breakdown.push({
    category: 'Accommodation',
    met: input.hasAccommodation,
    details: input.hasAccommodation
      ? { en: 'Accommodation proof available', ar: 'إثبات السكن متوفر' }
      : { en: 'Accommodation proof required', ar: 'إثبات السكن مطلوب' },
  });
  if (input.hasAccommodation) score += 10;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Proof of accommodation in Portugal is required',
      ar: 'إثبات السكن في البرتغال مطلوب',
    });
  }

  // Criminal record
  breakdown.push({
    category: 'Criminal Record',
    met: !input.hasCriminalRecord,
    details: !input.hasCriminalRecord
      ? { en: 'No criminal record', ar: 'لا يوجد سجل جنائي' }
      : { en: 'Criminal record may affect application', ar: 'السجل الجنائي قد يؤثر على الطلب' },
  });
  if (!input.hasCriminalRecord) score += 10;

  // Health insurance
  breakdown.push({
    category: 'Health Insurance',
    met: input.hasHealthInsurance,
    details: input.hasHealthInsurance
      ? { en: 'Health insurance available', ar: 'التأمين الصحي متوفر' }
      : { en: 'Health insurance required', ar: 'التأمين الصحي مطلوب' },
  });
  if (input.hasHealthInsurance) score += 10;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Valid travel/health insurance is required',
      ar: 'تأمين سفر/صحي صالح مطلوب',
    });
  }

  // Recommendations
  if (input.incomeSource === 'pension') {
    recommendations.push({
      en: 'As a pensioner, ensure you have official pension statements translated and apostilled',
      ar: 'كمتقاعد، تأكد من وجود كشوف المعاش الرسمية مترجمة ومصدقة',
    });
  }

  // Determine status
  let status: EligibilityStatus;
  if (mandatoryMet && score >= 70) {
    status = 'eligible';
  } else if (mandatoryMet && score >= 50) {
    status = 'likely_eligible';
  } else if (score >= 30) {
    status = 'needs_more_info';
  } else {
    status = 'not_eligible';
  }

  return {
    status,
    score,
    meetsMandatoryRequirements: mandatoryMet,
    breakdown,
    missingRequirements,
    recommendations,
  };
}

// ============================================
// D8 ELIGIBILITY CHECKER
// ============================================

export function checkD8Eligibility(input: D8EligibilityInput): EligibilityResult {
  const breakdown: EligibilityResult['breakdown'] = [];
  const missingRequirements: { en: string; ar: string }[] = [];
  const recommendations: { en: string; ar: string }[] = [];
  let score = 0;
  let mandatoryMet = true;

  // Income requirement (MANDATORY) - 4x minimum wage
  const meetsIncomeRequirement = input.averageMonthlyIncome >= D8_MINIMUM_INCOME_EUR;
  const incomeGap = D8_MINIMUM_INCOME_EUR - input.averageMonthlyIncome;

  breakdown.push({
    category: 'Monthly Income (3-month average)',
    met: meetsIncomeRequirement,
    details: meetsIncomeRequirement
      ? {
        en: `Your average income (€${input.averageMonthlyIncome.toLocaleString()}) meets the €${D8_MINIMUM_INCOME_EUR.toLocaleString()}/month requirement`,
        ar: `متوسط دخلك (${input.averageMonthlyIncome.toLocaleString()}€) يفي بمتطلبات ${D8_MINIMUM_INCOME_EUR.toLocaleString()}€/شهر`,
      }
      : {
        en: `Your income (€${input.averageMonthlyIncome.toLocaleString()}) is €${incomeGap.toLocaleString()} below the required €${D8_MINIMUM_INCOME_EUR.toLocaleString()}/month`,
        ar: `دخلك (${input.averageMonthlyIncome.toLocaleString()}€) أقل بـ ${incomeGap.toLocaleString()}€ من المطلوب ${D8_MINIMUM_INCOME_EUR.toLocaleString()}€/شهر`,
      },
  });

  if (meetsIncomeRequirement) {
    score += 35;
  } else {
    mandatoryMet = false;
    missingRequirements.push({
      en: `You need €${incomeGap.toLocaleString()} more monthly income to qualify for the D8 visa`,
      ar: `تحتاج ${incomeGap.toLocaleString()}€ إضافية شهرياً للتأهل لتأشيرة D8`,
    });
    recommendations.push({
      en: 'Consider the D7 visa if your income is above €920/month but below €3,680/month',
      ar: 'فكر في تأشيرة D7 إذا كان دخلك أعلى من 920€/شهر ولكن أقل من 3,680€/شهر',
    });
  }

  // Employer must be outside Portugal (MANDATORY)
  const hasEmployerCountry = input.employerCountry.trim().length > 0;
  const employerOutsidePortugal = hasEmployerCountry && input.employerCountry.toLowerCase() !== 'portugal' && input.employerCountry.toLowerCase() !== 'pt';

  breakdown.push({
    category: 'Employer Location',
    met: employerOutsidePortugal,
    details: employerOutsidePortugal
      ? {
        en: `Employer is based in ${input.employerCountry} (outside Portugal)`,
        ar: `صاحب العمل موجود في ${input.employerCountry} (خارج البرتغال)`,
      }
      : {
        en: 'D8 visa requires employer to be outside Portugal',
        ar: 'تأشيرة D8 تتطلب أن يكون صاحب العمل خارج البرتغال',
      },
  });

  if (employerOutsidePortugal) {
    score += 20;
  } else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Your employer must be based outside Portugal for the D8 visa',
      ar: 'يجب أن يكون صاحب عملك خارج البرتغال لتأشيرة D8',
    });
    recommendations.push({
      en: 'If your employer is in Portugal, consider the D1 (Subordinate Work) visa instead',
      ar: 'إذا كان صاحب عملك في البرتغال، فكر في تأشيرة D1 (العمل التابع) بدلاً من ذلك',
    });
  }

  // Remote work contract
  breakdown.push({
    category: 'Remote Work Contract',
    met: input.hasRemoteWorkContract,
    details: input.hasRemoteWorkContract
      ? { en: 'Remote work contract/proof available', ar: 'عقد/إثبات العمل عن بُعد متوفر' }
      : { en: 'Remote work contract required', ar: 'عقد العمل عن بُعد مطلوب' },
  });
  if (input.hasRemoteWorkContract) score += 15;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'You need a work contract or proof of remote service provision',
      ar: 'تحتاج عقد عمل أو إثبات تقديم خدمات عن بُعد',
    });
  }

  // Bank statements (3 months)
  breakdown.push({
    category: 'Bank Statements (3 months)',
    met: input.hasBankStatements,
    details: input.hasBankStatements
      ? { en: 'Bank statements for last 3 months available', ar: 'كشوف الحساب البنكية لآخر 3 أشهر متوفرة' }
      : { en: 'Bank statements for last 3 months required', ar: 'كشوف الحساب البنكية لآخر 3 أشهر مطلوبة' },
  });
  if (input.hasBankStatements) score += 10;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Bank statements for the last 3 months showing your income are required',
      ar: 'كشوف الحساب البنكية لآخر 3 أشهر توضح دخلك مطلوبة',
    });
  }

  // Fiscal residence
  breakdown.push({
    category: 'Fiscal Residence Proof',
    met: input.hasFiscalResidence,
    details: input.hasFiscalResidence
      ? { en: 'Fiscal residence proof available', ar: 'إثبات الإقامة الضريبية متوفر' }
      : { en: 'Fiscal residence proof required', ar: 'إثبات الإقامة الضريبية مطلوب' },
  });
  if (input.hasFiscalResidence) score += 5;
  else {
    missingRequirements.push({
      en: 'Proof of fiscal residence in your current country is required',
      ar: 'إثبات الإقامة الضريبية في بلدك الحالي مطلوب',
    });
  }

  // Accommodation
  breakdown.push({
    category: 'Accommodation',
    met: input.hasAccommodation,
    details: input.hasAccommodation
      ? { en: 'Accommodation proof available', ar: 'إثبات السكن متوفر' }
      : { en: 'Accommodation proof required', ar: 'إثبات السكن مطلوب' },
  });
  if (input.hasAccommodation) score += 5;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Proof of accommodation in Portugal is required',
      ar: 'إثبات السكن في البرتغال مطلوب',
    });
  }

  // Criminal record
  breakdown.push({
    category: 'Criminal Record',
    met: !input.hasCriminalRecord,
    details: !input.hasCriminalRecord
      ? { en: 'No criminal record', ar: 'لا يوجد سجل جنائي' }
      : { en: 'Criminal record may affect application', ar: 'السجل الجنائي قد يؤثر على الطلب' },
  });
  if (!input.hasCriminalRecord) score += 5;

  // Health insurance
  breakdown.push({
    category: 'Health Insurance',
    met: input.hasHealthInsurance,
    details: input.hasHealthInsurance
      ? { en: 'Health insurance available', ar: 'التأمين الصحي متوفر' }
      : { en: 'Health insurance required', ar: 'التأمين الصحي مطلوب' },
  });
  if (input.hasHealthInsurance) score += 5;
  else {
    mandatoryMet = false;
    missingRequirements.push({
      en: 'Valid travel/health insurance is required',
      ar: 'تأمين سفر/صحي صالح مطلوب',
    });
  }

  // Bonus info
  if (meetsIncomeRequirement && employerOutsidePortugal) {
    recommendations.push({
      en: 'D8 visa holders can also work for Portuguese entities, offering flexibility',
      ar: 'حاملو تأشيرة D8 يمكنهم أيضاً العمل لجهات برتغالية، مما يوفر مرونة',
    });
  }

  // Determine status
  let status: EligibilityStatus;
  if (mandatoryMet && score >= 70) {
    status = 'eligible';
  } else if (mandatoryMet && score >= 50) {
    status = 'likely_eligible';
  } else if (score >= 30) {
    status = 'needs_more_info';
  } else {
    status = 'not_eligible';
  }

  return {
    status,
    score,
    meetsMandatoryRequirements: mandatoryMet,
    breakdown,
    missingRequirements,
    recommendations,
  };
}
