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

export function generateDocumentChecklist(
  sourceCountry: string,
  immigrationPathway: string
): ChecklistItem[] {
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

  // Country-specific documents
  const countrySpecificDocs = getCountrySpecificDocuments(sourceCountry);
  baseDocuments.push(...countrySpecificDocs);

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
