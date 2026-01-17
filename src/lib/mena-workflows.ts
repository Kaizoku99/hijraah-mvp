/**
 * MENA-Specific Immigration Workflows
 * Phase 2.3: Deep specialization for MENA countries
 * 
 * Provides embassy information, attestation workflows, and country-specific guidance
 */

export interface EmbassyInfo {
  country: string;
  city: string;
  type: "embassy" | "consulate" | "vfs" | "visa_center";
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  phone?: string;
  email?: string;
  website?: string;
  workingHours?: string;
  appointmentUrl?: string;
  notes?: string;
  notesAr?: string;
}

export interface AttestationStep {
  order: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  authority: string;
  authorityAr: string;
  estimatedDays: number;
  estimatedCost: string;
  requiredDocuments: string[];
  tips?: string[];
  tipsAr?: string[];
}

export interface CountryWorkflow {
  country: string;
  countryAr: string;
  attestationSteps: AttestationStep[];
  policeClearanceProcess: AttestationStep[];
  bankStatementRequirements: {
    minimumBalance: string;
    statementPeriod: string;
    formatRequirements: string[];
    formatRequirementsAr: string[];
  };
  embassies: Record<string, EmbassyInfo[]>; // By destination country
}

// ============================================
// CANADIAN EMBASSY/VFS LOCATIONS
// ============================================

export const CANADA_VFS_LOCATIONS: Record<string, EmbassyInfo[]> = {
  uae: [
    {
      country: "UAE",
      city: "Dubai",
      type: "vfs",
      name: "VFS Global Canada Visa Application Centre - Dubai",
      nameAr: "مركز طلبات التأشيرة الكندية VFS - دبي",
      address: "Wafi Mall, Level 2, Sheikh Rashid Road, Dubai",
      addressAr: "وافي مول، الطابق الثاني، شارع الشيخ راشد، دبي",
      phone: "+971-4-205-1333",
      website: "https://visa.vfsglobal.com/are/en/can",
      appointmentUrl: "https://visa.vfsglobal.com/are/en/can/book-an-appointment",
      workingHours: "Sun-Thu: 8:00 AM - 3:00 PM",
    },
    {
      country: "UAE",
      city: "Abu Dhabi",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "9th Floor, West Tower, Abu Dhabi Mall, Abu Dhabi",
      addressAr: "الطابق التاسع، البرج الغربي، أبوظبي مول، أبوظبي",
      phone: "+971-2-694-0300",
      email: "abudh@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-uae.html",
      workingHours: "Sun-Thu: 7:30 AM - 4:30 PM",
    },
  ],
  saudi_arabia: [
    {
      country: "Saudi Arabia",
      city: "Riyadh",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "Diplomatic Quarter, Riyadh",
      addressAr: "الحي الدبلوماسي، الرياض",
      phone: "+966-11-488-2288",
      email: "riyad@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-saudi-arabia.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
    {
      country: "Saudi Arabia",
      city: "Jeddah",
      type: "vfs",
      name: "VFS Global Canada Visa Application Centre - Jeddah",
      nameAr: "مركز طلبات التأشيرة الكندية VFS - جدة",
      address: "Al Rawdah District, Tahlia Street, Jeddah",
      addressAr: "حي الروضة، شارع التحلية، جدة",
      website: "https://visa.vfsglobal.com/sau/en/can",
      appointmentUrl: "https://visa.vfsglobal.com/sau/en/can/book-an-appointment",
      workingHours: "Sun-Thu: 9:00 AM - 4:00 PM",
    },
  ],
  egypt: [
    {
      country: "Egypt",
      city: "Cairo",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "26 Kamel El Shenawy Street, Garden City, Cairo",
      addressAr: "26 شارع كامل الشناوي، جاردن سيتي، القاهرة",
      phone: "+20-2-2461-2200",
      email: "cairo@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-egypt.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
    {
      country: "Egypt",
      city: "Cairo",
      type: "vfs",
      name: "VFS Global Canada Visa Application Centre - Cairo",
      nameAr: "مركز طلبات التأشيرة الكندية VFS - القاهرة",
      address: "3rd Floor, 5 Ibn Kathir Street, beside Golia, El Dokki, Cairo",
      addressAr: "الطابق الثالث، 5 شارع ابن كثير، بجوار جوليا، الدقي، القاهرة",
      website: "https://visa.vfsglobal.com/egy/en/can",
      appointmentUrl: "https://visa.vfsglobal.com/egy/en/can/book-an-appointment",
      workingHours: "Sun-Thu: 9:00 AM - 3:00 PM",
    },
  ],
  jordan: [
    {
      country: "Jordan",
      city: "Amman",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "Abdoun, Amman",
      addressAr: "عبدون، عمان",
      phone: "+962-6-590-1500",
      email: "amman@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-jordan.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
  ],
  lebanon: [
    {
      country: "Lebanon",
      city: "Beirut",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "Coolrite Building, 43 Jal El Dib Highway, Beirut",
      addressAr: "مبنى كولرايت، 43 طريق جل الديب السريع، بيروت",
      phone: "+961-4-726-700",
      email: "berut@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-lebanon.html",
      workingHours: "Mon-Fri: 8:00 AM - 4:30 PM",
      notes: "Services may be limited due to security situation",
      notesAr: "قد تكون الخدمات محدودة بسبب الوضع الأمني",
    },
  ],
  morocco: [
    {
      country: "Morocco",
      city: "Rabat",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "66 Mehdi Ben Barka Avenue, Souissi, Rabat",
      addressAr: "66 شارع المهدي بن بركة، السويسي، الرباط",
      phone: "+212-537-68-7400",
      email: "rabat@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-morocco.html",
      workingHours: "Mon-Fri: 8:00 AM - 4:30 PM",
    },
    {
      country: "Morocco",
      city: "Casablanca",
      type: "vfs",
      name: "VFS Global Canada Visa Application Centre - Casablanca",
      nameAr: "مركز طلبات التأشيرة الكندية VFS - الدار البيضاء",
      address: "Boulevard Moulay Rachid, Casablanca",
      addressAr: "شارع مولاي رشيد، الدار البيضاء",
      website: "https://visa.vfsglobal.com/mar/en/can",
      appointmentUrl: "https://visa.vfsglobal.com/mar/en/can/book-an-appointment",
      workingHours: "Mon-Fri: 9:00 AM - 4:00 PM",
    },
  ],
  tunisia: [
    {
      country: "Tunisia",
      city: "Tunis",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "3 Rue du Sénégal, Place de l'Afrique, Tunis",
      addressAr: "3 شارع السنغال، ساحة أفريقيا، تونس",
      phone: "+216-71-104-000",
      email: "tunis@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-tunisia.html",
      workingHours: "Mon-Fri: 8:00 AM - 4:30 PM",
    },
  ],
  algeria: [
    {
      country: "Algeria",
      city: "Algiers",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "18 Mustapha Khalef Street, Ben Aknoun, Algiers",
      addressAr: "18 شارع مصطفى خالف، بن عكنون، الجزائر",
      phone: "+213-770-08-3000",
      email: "alger@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-algeria.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
  ],
  kuwait: [
    {
      country: "Kuwait",
      city: "Kuwait City",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "Block 4, Diplomatic Area, Kuwait City",
      addressAr: "البلوك 4، المنطقة الدبلوماسية، مدينة الكويت",
      phone: "+965-2256-3025",
      email: "kwait@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-kuwait.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
  ],
  qatar: [
    {
      country: "Qatar",
      city: "Doha",
      type: "embassy",
      name: "Embassy of Canada",
      nameAr: "سفارة كندا",
      address: "Tornado Tower, 30th and 31st Floors, West Bay, Doha",
      addressAr: "برج تورنادو، الطابق 30 و 31، الخليج الغربي، الدوحة",
      phone: "+974-4419-9000",
      email: "doha@international.gc.ca",
      website: "https://www.canada.ca/en/embassy-qatar.html",
      workingHours: "Sun-Thu: 8:00 AM - 4:30 PM",
    },
  ],
};

// ============================================
// ATTESTATION WORKFLOWS BY COUNTRY
// ============================================

export const ATTESTATION_WORKFLOWS: Record<string, AttestationStep[]> = {
  uae: [
    {
      order: 1,
      titleEn: "Notarization",
      titleAr: "التصديق من كاتب العدل",
      descriptionEn: "Get documents notarized by a UAE Notary Public",
      descriptionAr: "قم بتصديق المستندات من كاتب العدل في الإمارات",
      authority: "UAE Notary Public",
      authorityAr: "كاتب العدل الإماراتي",
      estimatedDays: 1,
      estimatedCost: "AED 50-200",
      requiredDocuments: ["Original document", "Copy of Emirates ID"],
      tips: ["Many typing centers offer notarization services", "Courts have notary offices"],
      tipsAr: ["العديد من مراكز الطباعة تقدم خدمات التصديق", "المحاكم لديها مكاتب كاتب العدل"],
    },
    {
      order: 2,
      titleEn: "Ministry of Foreign Affairs (MOFA)",
      titleAr: "وزارة الخارجية والتعاون الدولي",
      descriptionEn: "Authenticate documents at MOFA",
      descriptionAr: "توثيق المستندات في وزارة الخارجية",
      authority: "UAE Ministry of Foreign Affairs",
      authorityAr: "وزارة الخارجية الإماراتية",
      estimatedDays: 2,
      estimatedCost: "AED 150",
      requiredDocuments: ["Notarized document", "Application form"],
      tips: ["Online application available via UAE PASS", "Express service available for additional fee"],
      tipsAr: ["التقديم الإلكتروني متاح عبر UAE PASS", "خدمة سريعة متاحة برسوم إضافية"],
    },
    {
      order: 3,
      titleEn: "Embassy/Consulate Legalization",
      titleAr: "تصديق السفارة/القنصلية",
      descriptionEn: "Legalize at the destination country's embassy",
      descriptionAr: "التصديق في سفارة بلد الوجهة",
      authority: "Canadian Embassy",
      authorityAr: "السفارة الكندية",
      estimatedDays: 5,
      estimatedCost: "CAD 30-50",
      requiredDocuments: ["MOFA attested document", "Passport copy", "Application form"],
    },
  ],
  saudi_arabia: [
    {
      order: 1,
      titleEn: "Chamber of Commerce Attestation",
      titleAr: "تصديق الغرفة التجارية",
      descriptionEn: "For commercial documents, attest at Chamber of Commerce",
      descriptionAr: "للمستندات التجارية، التصديق من الغرفة التجارية",
      authority: "Saudi Chamber of Commerce",
      authorityAr: "الغرفة التجارية السعودية",
      estimatedDays: 1,
      estimatedCost: "SAR 50-100",
      requiredDocuments: ["Original document", "Company letter"],
    },
    {
      order: 2,
      titleEn: "Ministry of Foreign Affairs",
      titleAr: "وزارة الخارجية",
      descriptionEn: "Authenticate at Saudi MOFA",
      descriptionAr: "التصديق من وزارة الخارجية السعودية",
      authority: "Saudi MOFA",
      authorityAr: "وزارة الخارجية السعودية",
      estimatedDays: 3,
      estimatedCost: "SAR 30",
      requiredDocuments: ["Attested document", "Passport copy"],
      tips: ["Apply online via MOFA e-services", "Same-day service in Riyadh"],
      tipsAr: ["التقديم الإلكتروني عبر خدمات الوزارة", "خدمة في نفس اليوم في الرياض"],
    },
  ],
  egypt: [
    {
      order: 1,
      titleEn: "Authentication Office (Foreign Ministry)",
      titleAr: "مكتب التصديقات (وزارة الخارجية)",
      descriptionEn: "Authenticate documents at the Egyptian Foreign Ministry",
      descriptionAr: "تصديق المستندات من وزارة الخارجية المصرية",
      authority: "Egyptian Ministry of Foreign Affairs",
      authorityAr: "وزارة الخارجية المصرية",
      estimatedDays: 2,
      estimatedCost: "EGP 100-200",
      requiredDocuments: ["Original document", "Copy of National ID"],
      tips: ["Located in Tahrir Square area", "Go early to avoid long queues"],
      tipsAr: ["يقع في منطقة ميدان التحرير", "اذهب مبكرًا لتجنب الطوابير الطويلة"],
    },
  ],
  jordan: [
    {
      order: 1,
      titleEn: "Ministry of Justice Notarization",
      titleAr: "تصديق وزارة العدل",
      descriptionEn: "Notarize documents at Ministry of Justice",
      descriptionAr: "تصديق المستندات من وزارة العدل",
      authority: "Jordanian Ministry of Justice",
      authorityAr: "وزارة العدل الأردنية",
      estimatedDays: 1,
      estimatedCost: "JOD 10-30",
      requiredDocuments: ["Original document", "National ID copy"],
    },
    {
      order: 2,
      titleEn: "Ministry of Foreign Affairs",
      titleAr: "وزارة الخارجية",
      descriptionEn: "Authenticate at Jordanian MOFA",
      descriptionAr: "التصديق من وزارة الخارجية الأردنية",
      authority: "Jordanian MOFA",
      authorityAr: "وزارة الخارجية الأردنية",
      estimatedDays: 2,
      estimatedCost: "JOD 15",
      requiredDocuments: ["Notarized document", "Passport copy"],
    },
  ],
};

// ============================================
// POLICE CLEARANCE PROCESSES
// ============================================

export const POLICE_CLEARANCE_WORKFLOWS: Record<string, AttestationStep[]> = {
  uae: [
    {
      order: 1,
      titleEn: "Apply Online via UAE PASS",
      titleAr: "التقديم عبر الإنترنت عبر UAE PASS",
      descriptionEn: "Submit application through ICA or local police app",
      descriptionAr: "تقديم الطلب عبر تطبيق الهيئة الاتحادية للهوية أو الشرطة المحلية",
      authority: "Federal Authority for Identity & Citizenship (ICA)",
      authorityAr: "الهيئة الاتحادية للهوية والجنسية",
      estimatedDays: 3,
      estimatedCost: "AED 200-300",
      requiredDocuments: ["Emirates ID", "Passport", "Photo"],
      tips: ["Apply via ICA app for UAE-wide clearance", "Dubai residents can use Dubai Police app"],
      tipsAr: ["التقديم عبر تطبيق ICA للحصول على شهادة على مستوى الإمارات", "سكان دبي يمكنهم استخدام تطبيق شرطة دبي"],
    },
    {
      order: 2,
      titleEn: "Pick Up Certificate",
      titleAr: "استلام الشهادة",
      descriptionEn: "Collect physical certificate if required",
      descriptionAr: "استلام الشهادة الورقية إذا لزم الأمر",
      authority: "Police Station",
      authorityAr: "مركز الشرطة",
      estimatedDays: 1,
      estimatedCost: "Free",
      requiredDocuments: ["Application receipt", "Emirates ID"],
    },
    {
      order: 3,
      titleEn: "MOFA Attestation",
      titleAr: "تصديق وزارة الخارجية",
      descriptionEn: "Get police clearance attested at MOFA",
      descriptionAr: "تصديق شهادة حسن السيرة من وزارة الخارجية",
      authority: "UAE MOFA",
      authorityAr: "وزارة الخارجية الإماراتية",
      estimatedDays: 2,
      estimatedCost: "AED 150",
      requiredDocuments: ["Police clearance certificate", "Passport copy"],
    },
  ],
  egypt: [
    {
      order: 1,
      titleEn: "Apply at Police Records Office",
      titleAr: "التقديم في مكتب السجلات الجنائية",
      descriptionEn: "Apply at the Criminal Records Administration",
      descriptionAr: "التقديم في إدارة السجلات الجنائية",
      authority: "Ministry of Interior",
      authorityAr: "وزارة الداخلية",
      estimatedDays: 7,
      estimatedCost: "EGP 50-100",
      requiredDocuments: ["National ID", "Photos (4x6)", "Application form"],
      tips: ["Main office in Abbasiya, Cairo", "Allow extra time during holidays"],
      tipsAr: ["المكتب الرئيسي في العباسية، القاهرة", "اترك وقتًا إضافيًا خلال الإجازات"],
    },
  ],
  saudi_arabia: [
    {
      order: 1,
      titleEn: "Apply via Absher",
      titleAr: "التقديم عبر أبشر",
      descriptionEn: "Apply online through Absher platform",
      descriptionAr: "التقديم عبر الإنترنت من خلال منصة أبشر",
      authority: "Ministry of Interior",
      authorityAr: "وزارة الداخلية",
      estimatedDays: 3,
      estimatedCost: "SAR 100",
      requiredDocuments: ["Absher account", "Iqama/National ID", "Photo"],
      tips: ["Digital certificate available immediately", "Physical copy can be picked up from police station"],
      tipsAr: ["الشهادة الرقمية متاحة فورًا", "يمكن استلام النسخة الورقية من مركز الشرطة"],
    },
  ],
};

// ============================================
// BANK STATEMENT REQUIREMENTS
// ============================================

export const BANK_STATEMENT_REQUIREMENTS: Record<string, {
  minimumBalance: string;
  statementPeriod: string;
  formatRequirements: string[];
  formatRequirementsAr: string[];
}> = {
  canada_express_entry: {
    minimumBalance: "CAD 13,757 (single), +CAD 3,706 per family member",
    statementPeriod: "Last 6 months",
    formatRequirements: [
      "Must be on bank letterhead",
      "Must show account holder name matching passport",
      "Must include account number",
      "Must show available balance",
      "Must be dated within 30 days of application",
      "Official bank stamp required",
    ],
    formatRequirementsAr: [
      "يجب أن يكون على ورقة رسمية من البنك",
      "يجب أن يظهر اسم صاحب الحساب مطابقًا لجواز السفر",
      "يجب أن يتضمن رقم الحساب",
      "يجب أن يظهر الرصيد المتاح",
      "يجب أن يكون مؤرخًا خلال 30 يومًا من التقديم",
      "ختم البنك الرسمي مطلوب",
    ],
  },
  portugal_d7: {
    minimumBalance: "EUR 9,120/year (single), 50% for spouse, 30% for child",
    statementPeriod: "Last 3-6 months",
    formatRequirements: [
      "Must show regular income deposits",
      "Apostille required for non-EU documents",
      "Translation to Portuguese may be required",
      "Must demonstrate ongoing passive income",
    ],
    formatRequirementsAr: [
      "يجب أن يظهر إيداعات دخل منتظمة",
      "الأبوستيل مطلوب للمستندات من خارج الاتحاد الأوروبي",
      "قد تكون الترجمة إلى البرتغالية مطلوبة",
      "يجب إثبات الدخل السلبي المستمر",
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getEmbassyInfo(
  sourceCountry: string,
  destinationCountry: string = "canada"
): EmbassyInfo[] {
  const normalizedSource = sourceCountry.toLowerCase().replace(/\s+/g, "_");
  
  if (destinationCountry.toLowerCase() === "canada") {
    return CANADA_VFS_LOCATIONS[normalizedSource] || [];
  }
  
  return [];
}

export function getAttestationWorkflow(sourceCountry: string): AttestationStep[] {
  const normalized = sourceCountry.toLowerCase().replace(/\s+/g, "_");
  return ATTESTATION_WORKFLOWS[normalized] || [];
}

export function getPoliceClearanceWorkflow(sourceCountry: string): AttestationStep[] {
  const normalized = sourceCountry.toLowerCase().replace(/\s+/g, "_");
  return POLICE_CLEARANCE_WORKFLOWS[normalized] || [];
}

export function getBankStatementRequirements(
  destination: string
): typeof BANK_STATEMENT_REQUIREMENTS[keyof typeof BANK_STATEMENT_REQUIREMENTS] | null {
  const normalized = destination.toLowerCase().replace(/\s+/g, "_");
  return BANK_STATEMENT_REQUIREMENTS[normalized] || null;
}

export function getTotalAttestationTime(steps: AttestationStep[]): number {
  return steps.reduce((total, step) => total + step.estimatedDays, 0);
}

export function getTotalAttestationCost(steps: AttestationStep[]): string {
  // This is simplified - in reality you'd parse and sum the costs
  return `${steps.length * 50}-${steps.length * 200} USD (approximate)`;
}

// List of supported MENA countries
export const SUPPORTED_MENA_COUNTRIES = [
  { code: "uae", nameEn: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة" },
  { code: "saudi_arabia", nameEn: "Saudi Arabia", nameAr: "المملكة العربية السعودية" },
  { code: "egypt", nameEn: "Egypt", nameAr: "مصر" },
  { code: "jordan", nameEn: "Jordan", nameAr: "الأردن" },
  { code: "lebanon", nameEn: "Lebanon", nameAr: "لبنان" },
  { code: "morocco", nameEn: "Morocco", nameAr: "المغرب" },
  { code: "tunisia", nameEn: "Tunisia", nameAr: "تونس" },
  { code: "algeria", nameEn: "Algeria", nameAr: "الجزائر" },
  { code: "kuwait", nameEn: "Kuwait", nameAr: "الكويت" },
  { code: "qatar", nameEn: "Qatar", nameAr: "قطر" },
  { code: "bahrain", nameEn: "Bahrain", nameAr: "البحرين" },
  { code: "oman", nameEn: "Oman", nameAr: "عُمان" },
  { code: "iraq", nameEn: "Iraq", nameAr: "العراق" },
  { code: "syria", nameEn: "Syria", nameAr: "سوريا" },
  { code: "palestine", nameEn: "Palestine", nameAr: "فلسطين" },
  { code: "yemen", nameEn: "Yemen", nameAr: "اليمن" },
  { code: "libya", nameEn: "Libya", nameAr: "ليبيا" },
  { code: "sudan", nameEn: "Sudan", nameAr: "السودان" },
];
