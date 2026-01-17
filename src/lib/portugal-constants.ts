/**
 * Portugal Visa Constants and Requirements
 * Based on official data from vistos.mne.gov.pt
 */

// Portuguese minimum wage (2024/2025)
export const PORTUGAL_MINIMUM_WAGE_EUR = 920;

// D8 Digital Nomad income requirement (4x minimum wage)
export const D8_MINIMUM_INCOME_EUR = PORTUGAL_MINIMUM_WAGE_EUR * 4; // 3680 EUR

// D7 income requirements for dependents
export const D7_INCOME_REQUIREMENTS = {
  mainApplicant: PORTUGAL_MINIMUM_WAGE_EUR, // 100% of minimum wage
  firstAdultDependent: PORTUGAL_MINIMUM_WAGE_EUR * 0.5, // 50% = 460 EUR
  childDependent: PORTUGAL_MINIMUM_WAGE_EUR * 0.3, // 30% = 276 EUR
};

// Visa Types
export type PortugalVisaType = 'd1' | 'd2' | 'd7' | 'd8' | 'job_seeker';

export interface PortugalVisaInfo {
  code: PortugalVisaType;
  name: {
    en: string;
    ar: string;
  };
  fullName: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  duration: string;
  processingTime: string;
  fee: {
    amount: number;
    currency: string;
  };
  isPathToPR: boolean;
  minAge: number;
}

export const PORTUGAL_VISAS: Record<PortugalVisaType, PortugalVisaInfo> = {
  d1: {
    code: 'd1',
    name: {
      en: 'D1 - Subordinate Work',
      ar: 'D1 - العمل التابع',
    },
    fullName: {
      en: 'Residency Visa for Subordinate Work',
      ar: 'تأشيرة الإقامة للعمل التابع',
    },
    description: {
      en: 'For those with a job offer from a Portuguese employer',
      ar: 'لمن لديهم عرض عمل من صاحب عمل برتغالي',
    },
    duration: '4 months initial, leads to 2-year residence permit',
    processingTime: '60 days',
    fee: { amount: 110, currency: 'EUR' },
    isPathToPR: true,
    minAge: 18,
  },
  d2: {
    code: 'd2',
    name: {
      en: 'D2 - Entrepreneur',
      ar: 'D2 - رائد أعمال',
    },
    fullName: {
      en: 'Residency Visa for Independent Work or Migrant Entrepreneurs',
      ar: 'تأشيرة الإقامة للعمل المستقل أو رواد الأعمال',
    },
    description: {
      en: 'For freelancers, business owners, and entrepreneurs planning to work in Portugal',
      ar: 'للعاملين المستقلين وأصحاب الأعمال ورواد الأعمال',
    },
    duration: '4 months initial, leads to 2-year residence permit',
    processingTime: '60 days',
    fee: { amount: 110, currency: 'EUR' },
    isPathToPR: true,
    minAge: 18,
  },
  d7: {
    code: 'd7',
    name: {
      en: 'D7 - Passive Income',
      ar: 'D7 - دخل سلبي',
    },
    fullName: {
      en: 'Residency Visa for Retirement, Religious Purposes, or Passive Income',
      ar: 'تأشيرة الإقامة للتقاعد أو الدخل السلبي',
    },
    description: {
      en: 'For retirees and those with stable passive income (pension, investments, rental)',
      ar: 'للمتقاعدين وأصحاب الدخل السلبي المستقر',
    },
    duration: '4 months initial, leads to 2-year residence permit',
    processingTime: '60 days',
    fee: { amount: 110, currency: 'EUR' },
    isPathToPR: true,
    minAge: 18,
  },
  d8: {
    code: 'd8',
    name: {
      en: 'D8 - Digital Nomad',
      ar: 'D8 - رحالة رقمي',
    },
    fullName: {
      en: 'Residency Visa for Digital Nomads (Remote Work)',
      ar: 'تأشيرة الإقامة للرحالة الرقميين (العمل عن بُعد)',
    },
    description: {
      en: 'For remote workers employed by companies outside Portugal',
      ar: 'للعاملين عن بُعد لشركات خارج البرتغال',
    },
    duration: '4 months initial, leads to 2-year residence permit',
    processingTime: '60 days',
    fee: { amount: 110, currency: 'EUR' },
    isPathToPR: true,
    minAge: 18,
  },
  job_seeker: {
    code: 'job_seeker',
    name: {
      en: 'Job Seeker Visa',
      ar: 'تأشيرة البحث عن عمل',
    },
    fullName: {
      en: 'Job Seeker Visa',
      ar: 'تأشيرة البحث عن عمل',
    },
    description: {
      en: 'For those looking to find employment in Portugal',
      ar: 'للباحثين عن عمل في البرتغال',
    },
    duration: '120 days, extendable by 60 days',
    processingTime: '60 days',
    fee: { amount: 75, currency: 'EUR' },
    isPathToPR: true,
    minAge: 18,
  },
};

// Employment types for D2 visa
export type D2EmploymentType = 'freelancer' | 'business_owner' | 'investor' | 'liberal_profession';

export const D2_EMPLOYMENT_TYPES: Record<D2EmploymentType, { en: string; ar: string }> = {
  freelancer: {
    en: 'Freelancer / Self-employed',
    ar: 'عامل حر / عمل مستقل',
  },
  business_owner: {
    en: 'Business Owner',
    ar: 'صاحب عمل',
  },
  investor: {
    en: 'Investor',
    ar: 'مستثمر',
  },
  liberal_profession: {
    en: 'Liberal Profession (Doctor, Lawyer, etc.)',
    ar: 'مهنة حرة (طبيب، محامي، إلخ)',
  },
};

// Income source types for D7 visa
export type D7IncomeSource = 'pension' | 'rental_income' | 'investments' | 'dividends' | 'intellectual_property' | 'other_passive';

export const D7_INCOME_SOURCES: Record<D7IncomeSource, { en: string; ar: string }> = {
  pension: {
    en: 'Pension',
    ar: 'معاش تقاعدي',
  },
  rental_income: {
    en: 'Rental Income',
    ar: 'دخل إيجاري',
  },
  investments: {
    en: 'Investment Returns',
    ar: 'عوائد استثمارية',
  },
  dividends: {
    en: 'Dividends',
    ar: 'أرباح أسهم',
  },
  intellectual_property: {
    en: 'Intellectual Property Royalties',
    ar: 'حقوق الملكية الفكرية',
  },
  other_passive: {
    en: 'Other Passive Income',
    ar: 'دخل سلبي آخر',
  },
};

// Employment status for D8 visa
export type D8EmploymentStatus = 'remote_employee' | 'freelancer_international' | 'business_owner_remote';

export const D8_EMPLOYMENT_STATUSES: Record<D8EmploymentStatus, { en: string; ar: string }> = {
  remote_employee: {
    en: 'Remote Employee (non-PT employer)',
    ar: 'موظف عن بُعد (شركة خارج البرتغال)',
  },
  freelancer_international: {
    en: 'International Freelancer',
    ar: 'عامل حر دولي',
  },
  business_owner_remote: {
    en: 'Remote Business Owner',
    ar: 'صاحب عمل عن بُعد',
  },
};

// Eligibility status types
export type EligibilityStatus = 'eligible' | 'likely_eligible' | 'needs_more_info' | 'not_eligible';

export const ELIGIBILITY_STATUSES: Record<EligibilityStatus, { en: string; ar: string; color: string }> = {
  eligible: {
    en: 'Eligible',
    ar: 'مؤهل',
    color: 'green',
  },
  likely_eligible: {
    en: 'Likely Eligible',
    ar: 'مؤهل على الأرجح',
    color: 'emerald',
  },
  needs_more_info: {
    en: 'Needs More Information',
    ar: 'يحتاج مزيد من المعلومات',
    color: 'amber',
  },
  not_eligible: {
    en: 'Not Eligible',
    ar: 'غير مؤهل',
    color: 'red',
  },
};

// Required documents per visa type
export interface DocumentRequirement {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  isMandatory: boolean;
}

export const COMMON_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'visa_application_form',
    name: {
      en: 'National Visa application form, filled and signed',
      ar: 'نموذج طلب التأشيرة الوطنية، مملوء وموقع',
    },
    isMandatory: true,
  },
  {
    id: 'photos',
    name: {
      en: '2 recent passport-type photos',
      ar: '2 صور حديثة بحجم جواز السفر',
    },
    isMandatory: true,
  },
  {
    id: 'passport',
    name: {
      en: 'Passport valid for 3 months after estimated return date',
      ar: 'جواز سفر صالح لمدة 3 أشهر بعد تاريخ العودة المتوقع',
    },
    isMandatory: true,
  },
  {
    id: 'travel_insurance',
    name: {
      en: 'Valid travel insurance (medical, urgent assistance, repatriation)',
      ar: 'تأمين سفر صالح (طبي، مساعدة طارئة، إعادة للوطن)',
    },
    isMandatory: true,
  },
  {
    id: 'criminal_record',
    name: {
      en: 'Criminal record certificate (Apostilled/Legalized)',
      ar: 'شهادة السجل الجنائي (مصدقة/موثقة)',
    },
    isMandatory: true,
  },
  {
    id: 'financial_proof',
    name: {
      en: 'Proof of financial resources (means of subsistence)',
      ar: 'إثبات الموارد المالية (وسائل العيش)',
    },
    isMandatory: true,
  },
  {
    id: 'accommodation_proof',
    name: {
      en: 'Proof of accommodation in Portugal',
      ar: 'إثبات السكن في البرتغال',
    },
    isMandatory: true,
  },
];

export const D1_SPECIFIC_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'work_contract',
    name: {
      en: 'Work contract, work promise, or demonstration of interest',
      ar: 'عقد عمل أو وعد بالعمل أو إثبات اهتمام',
    },
    isMandatory: true,
  },
];

export const D2_SPECIFIC_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'investment_proof',
    name: {
      en: 'Investment proof or Business Plan',
      ar: 'إثبات الاستثمار أو خطة العمل',
    },
    isMandatory: true,
  },
  {
    id: 'professional_competence',
    name: {
      en: 'Declaration of professional competence (if applicable)',
      ar: 'إعلان الكفاءة المهنية (إن وجد)',
    },
    isMandatory: false,
  },
  {
    id: 'service_contract',
    name: {
      en: 'Contract or proposal for service provision',
      ar: 'عقد أو عرض لتقديم الخدمات',
    },
    description: {
      en: 'Required for liberal professions',
      ar: 'مطلوب للمهن الحرة',
    },
    isMandatory: false,
  },
];

export const D7_SPECIFIC_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'income_certificate',
    name: {
      en: 'Document certifying retirement amount or passive income sources',
      ar: 'وثيقة تثبت مبلغ التقاعد أو مصادر الدخل السلبي',
    },
    isMandatory: true,
  },
  {
    id: 'bank_statements_d7',
    name: {
      en: 'Bank statements showing regular income deposits',
      ar: 'كشوف حساب بنكية تظهر إيداعات الدخل المنتظمة',
    },
    isMandatory: true,
  },
];

export const D8_SPECIFIC_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'remote_work_contract',
    name: {
      en: 'Work contract or proof of remote service provision',
      ar: 'عقد عمل أو إثبات تقديم خدمات عن بُعد',
    },
    isMandatory: true,
  },
  {
    id: 'bank_statements_3months',
    name: {
      en: 'Bank statements for the last 3 months',
      ar: 'كشوف حساب بنكية لآخر 3 أشهر',
    },
    isMandatory: true,
  },
  {
    id: 'fiscal_residence_proof',
    name: {
      en: 'Proof of fiscal residence',
      ar: 'إثبات الإقامة الضريبية',
    },
    isMandatory: true,
  },
];

export const JOB_SEEKER_SPECIFIC_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'iefp_registration',
    name: {
      en: 'Declaration of expression of interest for job seeking (IEFP registration)',
      ar: 'إعلان الاهتمام بالبحث عن عمل (تسجيل IEFP)',
    },
    isMandatory: true,
  },
];

// Get all documents for a specific visa type
export function getDocumentsForVisa(visaType: PortugalVisaType): DocumentRequirement[] {
  const specificDocs: Record<PortugalVisaType, DocumentRequirement[]> = {
    d1: D1_SPECIFIC_DOCUMENTS,
    d2: D2_SPECIFIC_DOCUMENTS,
    d7: D7_SPECIFIC_DOCUMENTS,
    d8: D8_SPECIFIC_DOCUMENTS,
    job_seeker: JOB_SEEKER_SPECIFIC_DOCUMENTS,
  };

  return [...COMMON_DOCUMENTS, ...specificDocs[visaType]];
}

// Policy flags / Important notices
export const PORTUGAL_POLICY_FLAGS = [
  {
    title: {
      en: 'New European Entry/Exit System (EES)',
      ar: 'نظام الدخول/الخروج الأوروبي الجديد (EES)',
    },
    description: {
      en: 'Implemented October 12, 2025',
      ar: 'تم تطبيقه في 12 أكتوبر 2025',
    },
    type: 'info' as const,
  },
  {
    title: {
      en: 'Residence visas without AIMA appointment',
      ar: 'تأشيرات الإقامة بدون موعد AIMA',
    },
    description: {
      en: 'Since October 2024, residence visas are issued without separate AIMA appointment',
      ar: 'منذ أكتوبر 2024، تصدر تأشيرات الإقامة بدون موعد منفصل مع AIMA',
    },
    type: 'success' as const,
  },
  {
    title: {
      en: 'Job Seeker visa regime changed',
      ar: 'تغيير نظام تأشيرة البحث عن عمل',
    },
    description: {
      en: 'Appointments after October 23, 2025 cancelled - check latest MFA updates',
      ar: 'تم إلغاء المواعيد بعد 23 أكتوبر 2025 - تحقق من آخر تحديثات الوزارة',
    },
    type: 'warning' as const,
  },
];

// Contact information
export const PORTUGAL_CONTACT_INFO = {
  authority: {
    name: {
      en: 'Ministry of Foreign Affairs (MFA) / AIMA',
      ar: 'وزارة الخارجية / وكالة التكامل والهجرة واللجوء',
    },
    fullName: {
      en: 'Agência para a Integração, Migrações e Asilo',
      ar: 'وكالة التكامل والهجرة واللجوء',
    },
  },
  website: 'https://vistos.mne.gov.pt',
  email: 'geral@aima.gov.pt',
  phone: '+351 217 115 000',
  address: 'Avenida Panorâmica de Monsanto, 1449-005 Lisboa',
};

// Helper function to calculate D7 required income
export function calculateD7RequiredIncome(
  adultDependents: number,
  childDependents: number
): number {
  const base = D7_INCOME_REQUIREMENTS.mainApplicant;
  const adultExtra = adultDependents * D7_INCOME_REQUIREMENTS.firstAdultDependent;
  const childExtra = childDependents * D7_INCOME_REQUIREMENTS.childDependent;
  return Math.ceil(base + adultExtra + childExtra);
}

// Helper function to check D8 income eligibility
export function checkD8IncomeEligibility(monthlyIncome: number): {
  eligible: boolean;
  gap: number;
  message: { en: string; ar: string };
} {
  const required = D8_MINIMUM_INCOME_EUR;
  const eligible = monthlyIncome >= required;
  const gap = eligible ? 0 : required - monthlyIncome;

  return {
    eligible,
    gap,
    message: eligible
      ? {
          en: `Your income of €${monthlyIncome.toLocaleString()} meets the requirement of €${required.toLocaleString()}/month`,
          ar: `دخلك البالغ ${monthlyIncome.toLocaleString()}€ يفي بمتطلبات ${required.toLocaleString()}€/شهر`,
        }
      : {
          en: `You need €${gap.toLocaleString()} more monthly income to qualify (current: €${monthlyIncome.toLocaleString()}, required: €${required.toLocaleString()})`,
          ar: `تحتاج ${gap.toLocaleString()}€ إضافية شهرياً للتأهل (الحالي: ${monthlyIncome.toLocaleString()}€، المطلوب: ${required.toLocaleString()}€)`,
        },
  };
}
