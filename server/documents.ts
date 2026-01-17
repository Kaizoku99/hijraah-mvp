import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  documentChecklists,
  DocumentChecklist,
  InsertDocumentChecklist,
  documents,
  Document,
  InsertDocument,
} from "../drizzle/schema";

// Document checklist functions
export async function createDocumentChecklist(checklist: InsertDocumentChecklist): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result: any = await db.insert(documentChecklists).values(checklist);
  const id = result[0]?.insertId || result.insertId;
  return Number(id);
}

export async function getUserDocumentChecklists(userId: number): Promise<DocumentChecklist[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(documentChecklists)
    .where(eq(documentChecklists.userId, userId));
}

export async function getDocumentChecklist(checklistId: number): Promise<DocumentChecklist | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(documentChecklists)
    .where(eq(documentChecklists.id, checklistId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateDocumentChecklist(checklistId: number, updates: Partial<InsertDocumentChecklist>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(documentChecklists)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(documentChecklists.id, checklistId));
}

export async function deleteDocumentChecklist(checklistId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(documentChecklists).where(eq(documentChecklists.id, checklistId));
}

/**
 * Mark a specific checklist item as verified based on document type
 */
export async function markChecklistItemVerified(
  userId: number,
  documentItemId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get user's checklists
  const checklists = await db
    .select()
    .from(documentChecklists)
    .where(eq(documentChecklists.userId, userId));

  if (checklists.length === 0) {
    console.log(`[Checklist] No checklists found for user ${userId}`);
    return false;
  }

  // Update the matching item in each checklist
  let updated = false;
  for (const checklist of checklists) {
    const items = checklist.items as ChecklistItem[];
    const itemIndex = items.findIndex(
      (item) => item.id === documentItemId || item.id.startsWith(`${documentItemId}_`)
    );

    if (itemIndex !== -1 && items[itemIndex].status !== "verified") {
      items[itemIndex].status = "verified";

      await db
        .update(documentChecklists)
        .set({ items: items, updatedAt: new Date() })
        .where(eq(documentChecklists.id, checklist.id));

      console.log(`[Checklist] Marked item "${items[itemIndex].title}" as verified for user ${userId}`);
      updated = true;
    }
  }

  return updated;
}

// Document functions
export async function createDocument(document: InsertDocument): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result: any = await db.insert(documents).values(document);
  const id = result[0]?.insertId || result.insertId;
  return Number(id);
}

export async function getUserDocuments(userId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));
}

export async function getChecklistDocuments(checklistId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(documents)
    .where(eq(documents.checklistId, checklistId));
}

export async function getDocument(documentId: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateDocument(documentId: number, updates: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(documents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(documents.id, documentId));
}

export async function deleteDocument(documentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(documents).where(eq(documents.id, documentId));
}

// Country-specific document checklist templates
export interface ChecklistItem {
  id: string;
  documentType: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  required: boolean;
  status: "pending" | "uploaded" | "verified" | "rejected";
  notes?: string;
  countrySpecific?: boolean;
}

// Helper function to get Arabic country names
function getCountryNameAr(countryCode: string): string {
  const countryNamesAr: Record<string, string> = {
    // GCC Countries
    uae: "الإمارات",
    saudi_arabia: "السعودية",
    qatar: "قطر",
    kuwait: "الكويت",
    bahrain: "البحرين",
    oman: "عُمان",
    // North Africa
    algeria: "الجزائر",
    egypt: "مصر",
    libya: "ليبيا",
    mauritania: "موريتانيا",
    morocco: "المغرب",
    sudan: "السودان",
    tunisia: "تونس",
    // Levant
    jordan: "الأردن",
    lebanon: "لبنان",
    palestine: "فلسطين",
    syria: "سوريا",
    iraq: "العراق",
    // Other
    yemen: "اليمن",
    iran: "إيران",
    turkey: "تركيا",
    malaysia: "ماليزيا",
    uk: "المملكة المتحدة",
    usa: "الولايات المتحدة",
    canada: "كندا",
    australia: "أستراليا",
    germany: "ألمانيا",
    france: "فرنسا",
  };

  return countryNamesAr[countryCode.toLowerCase()] || countryCode;
}

// Portugal-specific document generation
export function generatePortugalDocumentChecklist(
  visaType: string
): ChecklistItem[] {
  // Common documents for all Portugal visas
  const commonDocuments: ChecklistItem[] = [
    {
      id: "pt_visa_application",
      documentType: "visa_application",
      title: "National Visa Application Form",
      titleAr: "نموذج طلب التأشيرة الوطنية",
      description: "Filled and signed national visa application form",
      descriptionAr: "نموذج طلب التأشيرة الوطنية مملوء وموقع",
      required: true,
      status: "pending",
    },
    {
      id: "pt_photos",
      documentType: "photos",
      title: "Passport Photos (2)",
      titleAr: "صور جواز السفر (2)",
      description: "Two recent passport-type photos",
      descriptionAr: "صورتان حديثتان بحجم جواز السفر",
      required: true,
      status: "pending",
    },
    {
      id: "pt_passport",
      documentType: "passport",
      title: "Valid Passport",
      titleAr: "جواز سفر ساري",
      description: "Passport valid for at least 3 months after expected return",
      descriptionAr: "جواز سفر صالح لمدة 3 أشهر بعد تاريخ العودة المتوقع",
      required: true,
      status: "pending",
    },
    {
      id: "pt_travel_insurance",
      documentType: "travel_insurance",
      title: "Travel Insurance",
      titleAr: "تأمين السفر",
      description: "Medical, urgent assistance, and repatriation coverage",
      descriptionAr: "تغطية طبية ومساعدة طارئة وإعادة للوطن",
      required: true,
      status: "pending",
    },
    {
      id: "pt_criminal_record",
      documentType: "police_clearance",
      title: "Criminal Record Certificate",
      titleAr: "شهادة السجل الجنائي",
      description: "Apostilled/legalized criminal record certificate",
      descriptionAr: "شهادة السجل الجنائي مصدقة/موثقة بالأبوستيل",
      required: true,
      status: "pending",
    },
    {
      id: "pt_financial_proof",
      documentType: "proof_of_funds",
      title: "Proof of Financial Resources",
      titleAr: "إثبات الموارد المالية",
      description: "Bank statements or proof of means of subsistence",
      descriptionAr: "كشوف حساب بنكية أو إثبات وسائل العيش",
      required: true,
      status: "pending",
    },
    {
      id: "pt_accommodation",
      documentType: "accommodation_proof",
      title: "Proof of Accommodation",
      titleAr: "إثبات السكن",
      description: "Rental contract, hotel booking, or property deed in Portugal",
      descriptionAr: "عقد إيجار، حجز فندقي، أو صك ملكية في البرتغال",
      required: true,
      status: "pending",
    },
  ];

  // Visa-specific documents
  const visaSpecificDocs: Record<string, ChecklistItem[]> = {
    d1_subordinate_work: [
      {
        id: "pt_d1_work_contract",
        documentType: "work_contract",
        title: "Work Contract or Promise",
        titleAr: "عقد عمل أو وعد بالعمل",
        description: "Work contract, work promise, or demonstration of interest from Portuguese employer",
        descriptionAr: "عقد عمل أو وعد بالعمل أو إثبات اهتمام من صاحب عمل برتغالي",
        required: true,
        status: "pending",
      },
    ],
    d2_independent_entrepreneur: [
      {
        id: "pt_d2_investment_proof",
        documentType: "investment_proof",
        title: "Investment Proof or Business Plan",
        titleAr: "إثبات الاستثمار أو خطة العمل",
        description: "Proof of executed investment in Portugal OR viable business plan",
        descriptionAr: "إثبات استثمار منفذ في البرتغال أو خطة عمل قابلة للتطبيق",
        required: true,
        status: "pending",
      },
      {
        id: "pt_d2_professional_competence",
        documentType: "professional_competence",
        title: "Professional Competence Declaration",
        titleAr: "إعلان الكفاءة المهنية",
        description: "Declaration of professional competence (if applicable)",
        descriptionAr: "إعلان الكفاءة المهنية (إن وجد)",
        required: false,
        status: "pending",
      },
      {
        id: "pt_d2_service_contract",
        documentType: "service_contract",
        title: "Service Contract/Proposal",
        titleAr: "عقد/عرض خدمات",
        description: "Contract or proposal for service provision (for liberal professions)",
        descriptionAr: "عقد أو عرض لتقديم الخدمات (للمهن الحرة)",
        required: false,
        status: "pending",
      },
    ],
    d7_passive_income: [
      {
        id: "pt_d7_income_certificate",
        documentType: "income_certificate",
        title: "Passive Income Certificate",
        titleAr: "شهادة الدخل السلبي",
        description: "Document certifying retirement amount or passive income sources",
        descriptionAr: "وثيقة تثبت مبلغ التقاعد أو مصادر الدخل السلبي",
        required: true,
        status: "pending",
      },
      {
        id: "pt_d7_bank_statements",
        documentType: "bank_statements",
        title: "Bank Statements (Income Proof)",
        titleAr: "كشوف حساب بنكية (إثبات الدخل)",
        description: "Bank statements showing regular passive income deposits",
        descriptionAr: "كشوف حساب بنكية تظهر إيداعات الدخل السلبي المنتظمة",
        required: true,
        status: "pending",
      },
    ],
    d8_digital_nomad: [
      {
        id: "pt_d8_remote_contract",
        documentType: "remote_work_contract",
        title: "Remote Work Contract",
        titleAr: "عقد العمل عن بُعد",
        description: "Work contract or proof of remote service provision",
        descriptionAr: "عقد عمل أو إثبات تقديم خدمات عن بُعد",
        required: true,
        status: "pending",
      },
      {
        id: "pt_d8_bank_statements",
        documentType: "bank_statements",
        title: "Bank Statements (3 Months)",
        titleAr: "كشوف حساب بنكية (3 أشهر)",
        description: "Bank statements for the last 3 months showing income",
        descriptionAr: "كشوف حساب بنكية لآخر 3 أشهر توضح الدخل",
        required: true,
        status: "pending",
      },
      {
        id: "pt_d8_fiscal_residence",
        documentType: "fiscal_residence",
        title: "Fiscal Residence Proof",
        titleAr: "إثبات الإقامة الضريبية",
        description: "Proof of fiscal residence in your current country",
        descriptionAr: "إثبات الإقامة الضريبية في بلدك الحالي",
        required: true,
        status: "pending",
      },
    ],
    job_seeker_pt: [
      {
        id: "pt_job_seeker_iefp",
        documentType: "iefp_registration",
        title: "IEFP Registration Declaration",
        titleAr: "إعلان تسجيل IEFP",
        description: "Declaration of expression of interest for job seeking (IEFP registration)",
        descriptionAr: "إعلان الاهتمام بالبحث عن عمل (تسجيل IEFP)",
        required: true,
        status: "pending",
      },
    ],
  };

  const specificDocs = visaSpecificDocs[visaType] || [];
  return [...commonDocuments, ...specificDocs];
}

export function generateDocumentChecklist(
  sourceCountry: string,
  immigrationPathway: string,
  currentCountry?: string
): ChecklistItem[] {
  // Check if this is a Portugal visa pathway
  const portugalPathways = ['d1_subordinate_work', 'd2_independent_entrepreneur', 'd7_passive_income', 'd8_digital_nomad', 'job_seeker_pt'];
  if (portugalPathways.includes(immigrationPathway)) {
    const portugalDocs = generatePortugalDocumentChecklist(immigrationPathway);

    // Add residence-specific documents for Portugal pathways too
    // Add residence-specific documents if different from nationality
    if (currentCountry && currentCountry.toLowerCase() !== sourceCountry.toLowerCase()) {
      const residenceDocs = getResidenceCountryDocuments(currentCountry);
      if (residenceDocs.length > 0) {
        portugalDocs.push(...residenceDocs);
      }
    }

    return portugalDocs;
  }

  const baseDocuments: ChecklistItem[] = [
    {
      id: "passport",
      documentType: "passport",
      title: "Valid Passport",
      titleAr: "جواز سفر ساري",
      description: "A valid passport with at least 6 months validity",
      descriptionAr: "جواز سفر ساري المفعول لمدة 6 أشهر على الأقل",
      required: true,
      status: "pending",
    },
    {
      id: "birth_certificate",
      documentType: "birth_certificate",
      title: "Birth Certificate",
      titleAr: "شهادة الميلاد",
      description: "Official birth certificate with translation if not in English/French",
      descriptionAr: "شهادة ميلاد رسمية مع ترجمة معتمدة إذا لم تكن بالإنجليزية/الفرنسية",
      required: true,
      status: "pending",
    },
    {
      id: "police_clearance",
      documentType: "police_clearance",
      title: "Police Clearance Certificate",
      titleAr: "شهادة حسن السيرة والسلوك",
      description: "Police clearance from all countries lived in for 6+ months since age 18",
      descriptionAr: "شهادة حسن سيرة وسلوك من جميع الدول التي عشت فيها لأكثر من 6 أشهر منذ سن 18",
      required: true,
      status: "pending",
    },
    {
      id: "language_test",
      documentType: "language_test",
      title: "Language Test Results",
      titleAr: "نتائج اختبار اللغة",
      description: "IELTS, CELPIP, or TEF test results (must be less than 2 years old)",
      descriptionAr: "نتائج اختبار IELTS أو CELPIP أو TEF (يجب أن تكون أقل من سنتين)",
      required: true,
      status: "pending",
    },
  ];

  // Add education documents
  baseDocuments.push({
    id: "education_diploma",
    documentType: "education_diploma",
    title: "Educational Diplomas/Degrees",
    titleAr: "الشهادات والدرجات العلمية",
    description: "All diplomas, degrees, and certificates with official transcripts",
    descriptionAr: "جميع الشهادات والدرجات العلمية مع كشوف الدرجات الرسمية",
    required: true,
    status: "pending",
  });

  baseDocuments.push({
    id: "eca_report",
    documentType: "eca_report",
    title: "Educational Credential Assessment (ECA)",
    titleAr: "تقييم الشهادات التعليمية (ECA)",
    description: "ECA report from designated organization (WES, IQAS, ICAS, etc.)",
    descriptionAr: "تقرير تقييم الشهادات من منظمة معتمدة (WES، IQAS، ICAS، إلخ)",
    required: true,
    status: "pending",
  });

  // Add work experience documents
  if (immigrationPathway === "express_entry") {
    baseDocuments.push({
      id: "work_reference_letters",
      documentType: "work_reference_letters",
      title: "Employment Reference Letters",
      titleAr: "خطابات التوصية من العمل",
      description: "Reference letters from all employers with job duties, dates, and salary",
      descriptionAr: "خطابات توصية من جميع أصحاب العمل تتضمن المهام والتواريخ والراتب",
      required: true,
      status: "pending",
    });

    baseDocuments.push({
      id: "pay_stubs",
      documentType: "pay_stubs",
      title: "Pay Stubs/Salary Slips",
      titleAr: "قسائم الراتب",
      description: "Recent pay stubs or salary slips from current/previous employers",
      descriptionAr: "قسائم الراتب الحديثة من أصحاب العمل الحاليين/السابقين",
      required: false,
      status: "pending",
    });
  }


  // Australia Specific Pathways
  if (["skilled_independent", "state_nominated", "study_visa"].includes(immigrationPathway)) {
    baseDocuments.push({
      id: "skills_assessment",
      documentType: "skills_assessment",
      title: "Skills Assessment Result",
      titleAr: "نتيجة تقييم المهارات",
      description: "Positive skills assessment from a relevant assessing authority",
      descriptionAr: "تقييم مهارات إيجابي من جهة تقييم معتمدة",
      required: true,
      status: "pending",
    });

    if (immigrationPathway === "state_nominated") {
      baseDocuments.push({
        id: "state_nomination",
        documentType: "state_nomination",
        title: "State Nomination Approval",
        titleAr: "موافقة ترشيح الولاية",
        description: "Nomination approval from an Australian state or territory",
        descriptionAr: "موافقة الترشيح من ولاية أو إقليم أسترالي",
        required: true,
        status: "pending",
      });
    }

    if (immigrationPathway === "study_visa") {
      baseDocuments.push({
        id: "coe",
        documentType: "coe",
        title: "Confirmation of Enrolment (CoE)",
        titleAr: "تأكيد التسجيل (CoE)",
        description: "Official CoE from an Australian education provider",
        descriptionAr: "تأكيد التسجيل الرسمي من مؤسسة تعليمية أسترالية",
        required: true,
        status: "pending",
      });

      baseDocuments.push({
        id: "oshc",
        documentType: "oshc",
        title: "Overseas Student Health Cover (OSHC)",
        titleAr: "تأمين صحي للطلاب الدوليين",
        description: "Proof of OSHC insurance for the duration of your stay",
        descriptionAr: "إثبات التأمين الصحي طوال فترة إقامتك",
        required: true,
        status: "pending",
      });
    }
  }

  // Country-specific documents (based on nationality/source country)
  const countrySpecificDocs = getCountrySpecificDocuments(sourceCountry);
  if (countrySpecificDocs.length > 0) {
    baseDocuments.push(...countrySpecificDocs);
  }

  // Residence-specific documents (based on current country of residence)
  // Add residence-specific documents if different from nationality
  if (currentCountry && currentCountry.toLowerCase() !== sourceCountry.toLowerCase()) {
    const residenceDocs = getResidenceCountryDocuments(currentCountry);
    if (residenceDocs.length > 0) {
      baseDocuments.push(...residenceDocs);
    }
  }

  // Pathway-specific documents
  if (immigrationPathway === "study_permit") {
    baseDocuments.push({
      id: "acceptance_letter",
      documentType: "acceptance_letter",
      title: "Letter of Acceptance from DLI",
      titleAr: "خطاب القبول من مؤسسة تعليمية معتمدة",
      description: "Official acceptance letter from a Designated Learning Institution",
      descriptionAr: "خطاب قبول رسمي من مؤسسة تعليمية معتمدة في كندا",
      required: true,
      status: "pending",
    });

    baseDocuments.push({
      id: "proof_of_funds",
      documentType: "proof_of_funds",
      title: "Proof of Financial Support",
      titleAr: "إثبات الدعم المالي",
      description: "Bank statements showing sufficient funds for tuition and living expenses",
      descriptionAr: "كشوف حسابات بنكية تثبت توفر الأموال الكافية للرسوم الدراسية والمعيشة",
      required: true,
      status: "pending",
    });
  }

  return baseDocuments;
}

/**
 * Get documents specific to the user's country of RESIDENCE (where they currently live)
 * This is different from nationality - e.g., an Egyptian living in UAE needs Emirates ID
 */
function getResidenceCountryDocuments(residenceCountry: string): ChecklistItem[] {
  const residenceDocs: Record<string, ChecklistItem[]> = {
    // Gulf Cooperation Council (GCC) Countries
    uae: [
      {
        id: "emirates_id",
        documentType: "residence_id",
        title: "Emirates ID",
        titleAr: "الهوية الإماراتية",
        description: "Copy of valid Emirates ID (front and back)",
        descriptionAr: "نسخة من الهوية الإماراتية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "uae_residence_visa",
        documentType: "residence_visa",
        title: "UAE Residence Visa",
        titleAr: "تأشيرة الإقامة الإماراتية",
        description: "Copy of valid UAE residence visa page in passport",
        descriptionAr: "نسخة من صفحة تأشيرة الإقامة الإماراتية في جواز السفر",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "uae_labor_contract",
        documentType: "labor_contract",
        title: "UAE Labor Contract / Employment Proof",
        titleAr: "عقد العمل الإماراتي / إثبات التوظيف",
        description: "Ministry of Labor attested employment contract or salary certificate",
        descriptionAr: "عقد عمل مصدق من وزارة العمل أو شهادة راتب",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    saudi_arabia: [
      {
        id: "iqama",
        documentType: "residence_id",
        title: "Iqama (Residence Permit)",
        titleAr: "الإقامة (هوية المقيم)",
        description: "Copy of valid Saudi Iqama (front and back)",
        descriptionAr: "نسخة من الإقامة السعودية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "ksa_exit_reentry",
        documentType: "exit_reentry",
        title: "Exit/Re-entry Visa (if applicable)",
        titleAr: "تأشيرة الخروج والعودة (إن وجدت)",
        description: "Valid exit/re-entry visa if traveling during application",
        descriptionAr: "تأشيرة خروج وعودة سارية إذا كنت مسافراً أثناء التقديم",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "ksa_employment_letter",
        documentType: "employment_letter",
        title: "Saudi Employment Letter",
        titleAr: "خطاب العمل السعودي",
        description: "Letter from Saudi employer confirming employment and salary",
        descriptionAr: "خطاب من صاحب العمل السعودي يؤكد التوظيف والراتب",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    qatar: [
      {
        id: "qatar_qid",
        documentType: "residence_id",
        title: "Qatar ID (QID)",
        titleAr: "الهوية القطرية",
        description: "Copy of valid Qatar ID card (front and back)",
        descriptionAr: "نسخة من بطاقة الهوية القطرية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "qatar_residence_permit",
        documentType: "residence_visa",
        title: "Qatar Residence Permit",
        titleAr: "تصريح الإقامة القطري",
        description: "Copy of valid Qatar residence permit",
        descriptionAr: "نسخة من تصريح الإقامة القطري ساري المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    kuwait: [
      {
        id: "kuwait_civil_id",
        documentType: "residence_id",
        title: "Kuwait Civil ID",
        titleAr: "البطاقة المدنية الكويتية",
        description: "Copy of valid Kuwait Civil ID (front and back)",
        descriptionAr: "نسخة من البطاقة المدنية الكويتية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "kuwait_residence_stamp",
        documentType: "residence_visa",
        title: "Kuwait Residence Stamp/Visa",
        titleAr: "إقامة/تأشيرة الكويت",
        description: "Copy of valid Kuwait residence stamp in passport",
        descriptionAr: "نسخة من ختم الإقامة الكويتية في جواز السفر",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    bahrain: [
      {
        id: "bahrain_cpr",
        documentType: "residence_id",
        title: "Bahrain CPR (Central Population Registry)",
        titleAr: "بطاقة السجل السكاني البحرينية",
        description: "Copy of valid Bahrain CPR card (front and back)",
        descriptionAr: "نسخة من بطاقة السجل السكاني البحرينية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "bahrain_residence_visa",
        documentType: "residence_visa",
        title: "Bahrain Residence Visa",
        titleAr: "تأشيرة الإقامة البحرينية",
        description: "Copy of valid Bahrain residence visa",
        descriptionAr: "نسخة من تأشيرة الإقامة البحرينية سارية المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    oman: [
      {
        id: "oman_resident_card",
        documentType: "residence_id",
        title: "Oman Resident Card",
        titleAr: "بطاقة المقيم العمانية",
        description: "Copy of valid Oman resident card (front and back)",
        descriptionAr: "نسخة من بطاقة المقيم العمانية سارية المفعول (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "oman_residence_visa",
        documentType: "residence_visa",
        title: "Oman Residence Visa",
        titleAr: "تأشيرة الإقامة العمانية",
        description: "Copy of valid Oman residence visa in passport",
        descriptionAr: "نسخة من تأشيرة الإقامة العمانية في جواز السفر",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    // Other common residence countries for MENA applicants
    turkey: [
      {
        id: "turkey_ikamet",
        documentType: "residence_id",
        title: "Turkish Residence Permit (Ikamet)",
        titleAr: "تصريح الإقامة التركي (إقامت)",
        description: "Copy of valid Turkish residence permit card",
        descriptionAr: "نسخة من بطاقة تصريح الإقامة التركية سارية المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "turkey_kimlik",
        documentType: "tax_id",
        title: "Turkish Tax ID (Vergi Kimlik)",
        titleAr: "الرقم الضريبي التركي",
        description: "Turkish tax identification number",
        descriptionAr: "رقم التعريف الضريبي التركي",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    malaysia: [
      {
        id: "malaysia_visa",
        documentType: "residence_visa",
        title: "Malaysian Visa/Pass",
        titleAr: "تأشيرة/تصريح ماليزيا",
        description: "Copy of valid Malaysian student/work/dependant pass",
        descriptionAr: "نسخة من تأشيرة طالب/عمل/معال ماليزية سارية المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    uk: [
      {
        id: "uk_brp",
        documentType: "residence_id",
        title: "UK Biometric Residence Permit (BRP)",
        titleAr: "تصريح الإقامة البيومتري البريطاني",
        description: "Copy of valid UK BRP card (front and back)",
        descriptionAr: "نسخة من بطاقة تصريح الإقامة البيومتري البريطاني (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    germany: [
      {
        id: "germany_aufenthaltstitel",
        documentType: "residence_id",
        title: "German Residence Permit (Aufenthaltstitel)",
        titleAr: "تصريح الإقامة الألماني",
        description: "Copy of valid German residence permit card",
        descriptionAr: "نسخة من بطاقة تصريح الإقامة الألمانية سارية المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    france: [
      {
        id: "france_titre_sejour",
        documentType: "residence_id",
        title: "French Residence Permit (Titre de Séjour)",
        titleAr: "تصريح الإقامة الفرنسي",
        description: "Copy of valid French residence permit",
        descriptionAr: "نسخة من تصريح الإقامة الفرنسي ساري المفعول",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    usa: [
      {
        id: "usa_visa_stamp",
        documentType: "residence_visa",
        title: "US Visa Stamp",
        titleAr: "ختم التأشيرة الأمريكية",
        description: "Copy of valid US visa stamp in passport",
        descriptionAr: "نسخة من ختم التأشيرة الأمريكية في جواز السفر",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "usa_i94",
        documentType: "arrival_record",
        title: "US I-94 Arrival/Departure Record",
        titleAr: "سجل الوصول/المغادرة الأمريكي I-94",
        description: "Copy of most recent I-94 arrival record",
        descriptionAr: "نسخة من آخر سجل وصول I-94",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    canada: [
      {
        id: "canada_pr_card",
        documentType: "residence_id",
        title: "Canadian PR Card or Work/Study Permit",
        titleAr: "بطاقة الإقامة الدائمة الكندية أو تصريح العمل/الدراسة",
        description: "Copy of valid Canadian PR card, work permit, or study permit",
        descriptionAr: "نسخة من بطاقة الإقامة الدائمة أو تصريح العمل/الدراسة الكندي",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    australia: [
      {
        id: "australia_visa_grant",
        documentType: "residence_visa",
        title: "Australian Visa Grant Notice",
        titleAr: "إشعار منح التأشيرة الأسترالية",
        description: "Copy of Australian visa grant notification",
        descriptionAr: "نسخة من إشعار منح التأشيرة الأسترالية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    // MENA countries (for those residing in their home country but still need specific docs)
    iraq: [
      {
        id: "iraq_residence_card",
        documentType: "residence_id",
        title: "Iraqi Civil Status ID",
        titleAr: "هوية الأحوال المدنية العراقية",
        description: "Copy of Iraqi civil status identification card",
        descriptionAr: "نسخة من بطاقة هوية الأحوال المدنية العراقية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    iran: [
      {
        id: "iran_melli_card",
        documentType: "residence_id",
        title: "Iranian National ID Card (Melli Card)",
        titleAr: "بطاقة الهوية الإيرانية",
        description: "Copy of Iranian Melli card (national identity card)",
        descriptionAr: "نسخة من بطاقة ملي الإيرانية (بطاقة الهوية الوطنية)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "iran_shenasnameh",
        documentType: "birth_certificate",
        title: "Iranian Birth Certificate (Shenasnameh)",
        titleAr: "شناسنامه (دفتر العائلة الإيراني)",
        description: "Copy of Iranian Shenasnameh (identity booklet)",
        descriptionAr: "نسخة من الشناسنامه (دفتر الهوية الإيراني)",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    algeria: [
      {
        id: "algeria_national_id",
        documentType: "residence_id",
        title: "Algerian National ID Card",
        titleAr: "بطاقة التعريف الوطنية الجزائرية",
        description: "Copy of Algerian national identity card",
        descriptionAr: "نسخة من بطاقة التعريف الوطنية الجزائرية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    libya: [
      {
        id: "libya_national_id",
        documentType: "residence_id",
        title: "Libyan National ID",
        titleAr: "الرقم الوطني الليبي",
        description: "Copy of Libyan national identification document",
        descriptionAr: "نسخة من وثيقة الرقم الوطني الليبي",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    yemen: [
      {
        id: "yemen_national_id",
        documentType: "residence_id",
        title: "Yemeni National ID",
        titleAr: "البطاقة الشخصية اليمنية",
        description: "Copy of Yemeni national identity card",
        descriptionAr: "نسخة من البطاقة الشخصية اليمنية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    palestine: [
      {
        id: "palestine_hawiyya",
        documentType: "residence_id",
        title: "Palestinian ID (Hawiyya)",
        titleAr: "الهوية الفلسطينية",
        description: "Copy of Palestinian identity card (green or orange)",
        descriptionAr: "نسخة من بطاقة الهوية الفلسطينية (الخضراء أو البرتقالية)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    sudan: [
      {
        id: "sudan_residence_id",
        documentType: "residence_id",
        title: "Sudanese National ID / Residence Card",
        titleAr: "الهوية السودانية / بطاقة الإقامة",
        description: "Copy of Sudanese national ID or residence card for foreigners",
        descriptionAr: "نسخة من الهوية السودانية أو بطاقة الإقامة للأجانب",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "sudan_police_clearance",
        documentType: "police_clearance",
        title: "Sudan Police Clearance Certificate",
        titleAr: "شهادة حسن السيرة والسلوك السودانية",
        description: "Police clearance certificate from Sudan (شهادة الحالة الجنائية)",
        descriptionAr: "شهادة الحالة الجنائية من السودان",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    jordan: [
      {
        id: "jordan_residence_card",
        documentType: "residence_id",
        title: "Jordanian Residence Card (for non-citizens)",
        titleAr: "بطاقة الإقامة الأردنية (لغير المواطنين)",
        description: "Copy of Jordanian residence card or national ID if citizen",
        descriptionAr: "نسخة من بطاقة الإقامة الأردنية أو الهوية الوطنية للمواطنين",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "jordan_work_permit",
        documentType: "work_permit",
        title: "Jordan Work Permit (if applicable)",
        titleAr: "تصريح العمل الأردني (إن وجد)",
        description: "Valid work permit issued by Jordanian Ministry of Labor",
        descriptionAr: "تصريح عمل ساري من وزارة العمل الأردنية",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "jordan_security_clearance",
        documentType: "security_clearance",
        title: "Jordan Security Clearance",
        titleAr: "براءة الذمة الأمنية الأردنية",
        description: "Security clearance certificate (عدم محكومية) from Jordan",
        descriptionAr: "شهادة عدم محكومية من الأردن",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    lebanon: [
      {
        id: "lebanon_residence_permit",
        documentType: "residence_id",
        title: "Lebanese Residence Permit / ID",
        titleAr: "تصريح الإقامة اللبناني / الهوية",
        description: "Copy of Lebanese residence permit or national ID for citizens",
        descriptionAr: "نسخة من تصريح الإقامة اللبناني أو الهوية الوطنية للمواطنين",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "lebanon_civil_record",
        documentType: "civil_record",
        title: "Lebanon Individual Civil Record (إخراج قيد)",
        titleAr: "إخراج قيد فردي لبناني",
        description: "Recent individual civil record extract from Lebanon",
        descriptionAr: "إخراج قيد فردي حديث من لبنان",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "lebanon_work_permit",
        documentType: "work_permit",
        title: "Lebanon Work Permit (for non-citizens)",
        titleAr: "إجازة العمل اللبنانية (لغير المواطنين)",
        description: "Valid work permit from Lebanese Ministry of Labor",
        descriptionAr: "إجازة عمل سارية من وزارة العمل اللبنانية",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    egypt: [
      {
        id: "egypt_residence_card",
        documentType: "residence_id",
        title: "Egyptian National ID / Residence Card",
        titleAr: "الرقم القومي المصري / بطاقة الإقامة",
        description: "Copy of Egyptian national ID or residence card for foreigners",
        descriptionAr: "نسخة من الرقم القومي المصري أو بطاقة الإقامة للأجانب",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "egypt_work_permit",
        documentType: "work_permit",
        title: "Egypt Work Permit (for non-citizens)",
        titleAr: "تصريح العمل المصري (لغير المواطنين)",
        description: "Valid work permit from Egyptian Ministry of Manpower",
        descriptionAr: "تصريح عمل ساري من وزارة القوى العاملة المصرية",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "egypt_police_clearance",
        documentType: "police_clearance",
        title: "Egypt Police Clearance (فيش وتشبيه)",
        titleAr: "الفيش والتشبيه المصري",
        description: "Police clearance certificate (فيش وتشبيه) from Egypt",
        descriptionAr: "شهادة الفيش والتشبيه من مصر",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
  };

  return residenceDocs[residenceCountry.toLowerCase()] || [];
}

/**
 * Get documents specific to the user's nationality/source country
 */
function getCountrySpecificDocuments(sourceCountry: string): ChecklistItem[] {
  const countryDocs: Record<string, ChecklistItem[]> = {
    tunisia: [
      {
        id: "national_id_tunisia",
        documentType: "national_id",
        title: "Tunisian National ID Card (CIN)",
        titleAr: "بطاقة التعريف الوطنية التونسية",
        description: "Copy of your Tunisian national identity card (both sides)",
        descriptionAr: "نسخة من بطاقة التعريف الوطنية التونسية (الوجهين)",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "military_service_tunisia",
        documentType: "military_service",
        title: "Military Service Certificate",
        titleAr: "شهادة الخدمة العسكرية",
        description: "Certificate of completion or exemption from military service (for males)",
        descriptionAr: "شهادة إتمام أو إعفاء من الخدمة العسكرية (للذكور)",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    jordan: [
      {
        id: "national_id_jordan",
        documentType: "national_id",
        title: "Jordanian National ID",
        titleAr: "الهوية الوطنية الأردنية",
        description: "Copy of your Jordanian national identity card",
        descriptionAr: "نسخة من بطاقة الهوية الوطنية الأردنية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "family_book_jordan",
        documentType: "family_book",
        title: "Family Registration Book",
        titleAr: "دفتر العائلة",
        description: "Copy of the family registration book (دفتر العائلة)",
        descriptionAr: "نسخة من دفتر العائلة",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    lebanon: [
      {
        id: "national_id_lebanon",
        documentType: "national_id",
        title: "Lebanese National ID",
        titleAr: "الهوية اللبنانية",
        description: "Copy of your Lebanese national identity card",
        descriptionAr: "نسخة من بطاقة الهوية اللبنانية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "individual_civil_record",
        documentType: "civil_record",
        title: "Individual Civil Record (إخراج قيد)",
        titleAr: "إخراج قيد فردي",
        description: "Recent individual civil record extract (إخراج قيد فردي)",
        descriptionAr: "إخراج قيد فردي حديث",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    morocco: [
      {
        id: "national_id_morocco",
        documentType: "national_id",
        title: "Moroccan National ID (CNIE)",
        titleAr: "البطاقة الوطنية المغربية",
        description: "Copy of your Moroccan national identity card",
        descriptionAr: "نسخة من البطاقة الوطنية للتعريف المغربية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    egypt: [
      {
        id: "national_id_egypt",
        documentType: "national_id",
        title: "Egyptian National ID",
        titleAr: "بطاقة الرقم القومي المصرية",
        description: "Copy of your Egyptian national identity card",
        descriptionAr: "نسخة من بطاقة الرقم القومي المصرية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "military_service_egypt",
        documentType: "military_service",
        title: "Military Service Certificate",
        titleAr: "شهادة الموقف من التجنيد",
        description: "Certificate showing military service status (for males)",
        descriptionAr: "شهادة الموقف من التجنيد (للذكور)",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
    sudan: [
      {
        id: "national_id_sudan",
        documentType: "national_id",
        title: "Sudanese National ID",
        titleAr: "بطاقة الهوية السودانية",
        description: "Copy of your Sudanese national identity card",
        descriptionAr: "نسخة من بطاقة الهوية السودانية",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
    ],
    syria: [
      {
        id: "national_id_syria",
        documentType: "national_id",
        title: "Syrian National ID",
        titleAr: "الهوية السورية",
        description: "Copy of your Syrian national identity card or family registration document",
        descriptionAr: "نسخة من بطاقة الهوية السورية أو دفتر العائلة",
        required: true,
        status: "pending",
        countrySpecific: true,
      },
      {
        id: "refugee_status_syria",
        documentType: "refugee_status",
        title: "Refugee Status Documentation (if applicable)",
        titleAr: "وثائق وضع اللاجئ (إن وجدت)",
        description: "UNHCR refugee registration or asylum documentation if applicable",
        descriptionAr: "وثيقة تسجيل اللاجئ من المفوضية أو وثائق اللجوء إن وجدت",
        required: false,
        status: "pending",
        countrySpecific: true,
      },
    ],
  };

  return countryDocs[sourceCountry.toLowerCase()] || [];
}
