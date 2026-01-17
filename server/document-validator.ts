/**
 * AI-Powered Document Validation and Cross-Document Checking
 * Phase 2.2: Enhanced document processing capabilities
 */

import { generateChatResponse } from "./_core/gemini";

export interface DocumentField {
  name: string;
  value: string;
  confidence: number;
  location?: string; // Page/section reference
}

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  field: string;
  message: string;
  messageAr: string;
  suggestion?: string;
  suggestionAr?: string;
}

export interface DocumentValidation {
  isValid: boolean;
  completeness: number; // 0-100
  issues: ValidationIssue[];
  extractedFields: DocumentField[];
  documentType: string;
  expiryDate?: Date;
  issueDate?: Date;
}

export interface CrossDocumentCheck {
  isConsistent: boolean;
  inconsistencies: Array<{
    field: string;
    documents: Array<{
      documentType: string;
      value: string;
    }>;
    message: string;
    messageAr: string;
  }>;
  suggestions: string[];
}

// Required fields by document type
const DOCUMENT_REQUIREMENTS: Record<string, string[]> = {
  passport: [
    "full_name",
    "passport_number",
    "nationality",
    "date_of_birth",
    "issue_date",
    "expiry_date",
    "place_of_birth",
    "gender",
  ],
  ielts_results: [
    "full_name",
    "test_date",
    "trf_number",
    "listening_score",
    "reading_score",
    "writing_score",
    "speaking_score",
    "overall_score",
  ],
  eca_report: [
    "full_name",
    "date_of_birth",
    "report_number",
    "foreign_credential",
    "canadian_equivalency",
    "issue_date",
    "status",
  ],
  police_clearance: [
    "full_name",
    "date_of_birth",
    "issue_date",
    "issuing_authority",
    "result",
    "certificate_number",
  ],
  employment_reference: [
    "employee_name",
    "employer_name",
    "job_title",
    "noc_code",
    "start_date",
    "end_date",
    "duties",
    "salary",
    "contact_info",
  ],
  bank_statement: [
    "account_holder_name",
    "account_number",
    "bank_name",
    "statement_date",
    "opening_balance",
    "closing_balance",
    "currency",
  ],
  medical_exam: [
    "full_name",
    "date_of_birth",
    "exam_date",
    "panel_physician",
    "result",
    "expiry_date",
  ],
};

/**
 * Validate a single document for completeness and accuracy
 */
export async function validateDocument(
  ocrText: string,
  documentType: string
): Promise<DocumentValidation> {
  const requiredFields = DOCUMENT_REQUIREMENTS[documentType] || [];
  
  const prompt = `You are an expert immigration document validator. Analyze the following OCR-extracted text from a ${documentType.replace(/_/g, " ")} document.

Document Text:
---
${ocrText}
---

Instructions:
1. Extract all identifiable fields from the document
2. Check if the document appears complete and valid
3. Identify any missing required fields for this document type
4. Flag any potential issues (expired dates, unclear text, missing signatures, etc.)
5. Detect any formatting or validity issues

Required fields for ${documentType}:
${requiredFields.map((f, i) => `${i + 1}. ${f.replace(/_/g, " ")}`).join("\n")}

Respond in this exact JSON format:
{
  "extractedFields": [
    {"name": "field_name", "value": "extracted_value", "confidence": 0.95}
  ],
  "documentType": "${documentType}",
  "issues": [
    {"type": "error|warning|info", "field": "field_name", "message": "English message", "messageAr": "Arabic message", "suggestion": "Fix suggestion", "suggestionAr": "Arabic suggestion"}
  ],
  "expiryDate": "YYYY-MM-DD or null",
  "issueDate": "YYYY-MM-DD or null",
  "completeness": 85
}

Important:
- Confidence should be between 0 and 1
- Completeness should be 0-100 based on how many required fields are present and valid
- Check dates for validity (not expired, logical order)
- Mark issues as "error" for critical problems, "warning" for potential issues, "info" for suggestions`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      systemInstruction: "You are an expert document validator. Always respond with valid JSON.",
      temperature: 0.1,
      maxOutputTokens: 2048,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse validation response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Check for document expiry
    if (result.expiryDate) {
      const expiryDate = new Date(result.expiryDate);
      const now = new Date();
      if (expiryDate < now) {
        result.issues.push({
          type: "error",
          field: "expiry_date",
          message: "This document has expired",
          messageAr: "انتهت صلاحية هذا المستند",
          suggestion: "Please obtain a renewed document",
          suggestionAr: "يرجى الحصول على مستند متجدد",
        });
      } else if (expiryDate < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        result.issues.push({
          type: "warning",
          field: "expiry_date",
          message: "This document will expire within 90 days",
          messageAr: "سينتهي هذا المستند خلال 90 يومًا",
          suggestion: "Consider renewing before submitting your application",
          suggestionAr: "فكر في التجديد قبل تقديم طلبك",
        });
      }
    }

    return {
      isValid: result.issues.filter((i: any) => i.type === "error").length === 0,
      completeness: result.completeness || 0,
      issues: result.issues || [],
      extractedFields: result.extractedFields || [],
      documentType: result.documentType || documentType,
      expiryDate: result.expiryDate ? new Date(result.expiryDate) : undefined,
      issueDate: result.issueDate ? new Date(result.issueDate) : undefined,
    };
  } catch (error) {
    console.error("Document validation error:", error);
    return {
      isValid: false,
      completeness: 0,
      issues: [
        {
          type: "error",
          field: "general",
          message: "Failed to validate document. Please ensure the image is clear and readable.",
          messageAr: "فشل التحقق من المستند. يرجى التأكد من أن الصورة واضحة ومقروءة.",
        },
      ],
      extractedFields: [],
      documentType,
    };
  }
}

/**
 * Check consistency across multiple documents
 */
export async function checkCrossDocumentConsistency(
  documents: Array<{
    type: string;
    ocrText: string;
    validation?: DocumentValidation;
  }>
): Promise<CrossDocumentCheck> {
  if (documents.length < 2) {
    return {
      isConsistent: true,
      inconsistencies: [],
      suggestions: [],
    };
  }

  // Build document summary for comparison
  const documentSummaries = documents.map((doc) => ({
    type: doc.type,
    fields: doc.validation?.extractedFields || [],
  }));

  const prompt = `You are an immigration document consistency checker. Compare the following documents and identify any inconsistencies that could cause application problems.

Documents to compare:
${documents
  .map(
    (doc, i) => `
Document ${i + 1} (${doc.type.replace(/_/g, " ")}):
---
${doc.ocrText.substring(0, 2000)}${doc.ocrText.length > 2000 ? "... [truncated]" : ""}
---
`
  )
  .join("\n")}

Check for inconsistencies in:
1. Name spelling (exact match required across all documents)
2. Date of birth
3. Passport number (if referenced)
4. Address consistency
5. Employment dates that should align
6. Credential details that should match

Respond in this exact JSON format:
{
  "isConsistent": true/false,
  "inconsistencies": [
    {
      "field": "field_name",
      "documents": [
        {"documentType": "type1", "value": "value1"},
        {"documentType": "type2", "value": "value2"}
      ],
      "message": "Description of inconsistency",
      "messageAr": "وصف التناقض"
    }
  ],
  "suggestions": [
    "Suggestion to fix issues"
  ]
}`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      systemInstruction: "You are an expert at detecting document inconsistencies. Always respond with valid JSON.",
      temperature: 0.1,
      maxOutputTokens: 2048,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse consistency check response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      isConsistent: result.isConsistent ?? true,
      inconsistencies: result.inconsistencies || [],
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("Cross-document check error:", error);
    return {
      isConsistent: true,
      inconsistencies: [],
      suggestions: ["Unable to perform consistency check. Please manually review your documents."],
    };
  }
}

/**
 * Detect document type from OCR text
 */
export async function detectDocumentType(ocrText: string): Promise<{
  documentType: string;
  confidence: number;
  suggestedCategory: string;
}> {
  const prompt = `Analyze the following OCR-extracted text and identify what type of immigration document this is.

Document Text:
---
${ocrText.substring(0, 3000)}
---

Common document types:
- passport: Passport or travel document
- ielts_results: IELTS test results (TRF)
- eca_report: Educational Credential Assessment
- police_clearance: Police clearance/background check certificate
- employment_reference: Employment letter or reference
- bank_statement: Bank account statement
- medical_exam: Immigration medical examination results
- degree_certificate: University degree or diploma
- transcript: Academic transcript
- marriage_certificate: Marriage certificate
- birth_certificate: Birth certificate
- id_card: National ID card
- other: Cannot determine

Respond in JSON format:
{
  "documentType": "type_name",
  "confidence": 0.95,
  "suggestedCategory": "documents|identity|education|employment|financial|medical"
}`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      systemInstruction: "You are a document classification expert. Respond only with JSON.",
      temperature: 0.1,
      maxOutputTokens: 256,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse document type response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Document type detection error:", error);
    return {
      documentType: "other",
      confidence: 0,
      suggestedCategory: "documents",
    };
  }
}

/**
 * Extract specific data from a document for form auto-fill
 */
export async function extractFormData(
  ocrText: string,
  targetFields: string[]
): Promise<Record<string, string | null>> {
  const prompt = `Extract the following specific fields from this document text. Return null for any field that cannot be found.

Document Text:
---
${ocrText}
---

Fields to extract:
${targetFields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Respond in JSON format with field names as keys:
{
  "${targetFields[0]}": "extracted_value or null",
  ...
}

Important:
- Use exact values from the document
- Return null if a field is not found
- For dates, use YYYY-MM-DD format
- For names, use the exact spelling from the document`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      systemInstruction: "You are a data extraction specialist. Respond only with valid JSON.",
      temperature: 0.1,
      maxOutputTokens: 1024,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse extraction response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Form data extraction error:", error);
    return targetFields.reduce((acc, field) => {
      acc[field] = null;
      return acc;
    }, {} as Record<string, string | null>);
  }
}

/**
 * Generate translation certification guidance
 */
export async function getTranslationCertificationGuidance(
  documentType: string,
  sourceCountry: string,
  targetDestination: string
): Promise<{
  requiresCertifiedTranslation: boolean;
  guidance: string;
  guidanceAr: string;
  acceptedCertifiers: string[];
  estimatedCost: string;
}> {
  const prompt = `Provide guidance on translation certification requirements for immigration.

Document Type: ${documentType.replace(/_/g, " ")}
Source Country: ${sourceCountry}
Target Destination: ${targetDestination} (immigration)

Provide:
1. Whether certified translation is required
2. Specific guidance for this document type
3. Who can certify translations (IRCC requirements if Canada)
4. Estimated cost range

Respond in JSON:
{
  "requiresCertifiedTranslation": true/false,
  "guidance": "English guidance text",
  "guidanceAr": "Arabic guidance text",
  "acceptedCertifiers": ["Certified translator", "Notarized", etc.],
  "estimatedCost": "$X - $Y USD"
}`;

  try {
    const response = await generateChatResponse({
      messages: [{ role: "user", content: prompt } as any],
      systemInstruction: "You are an immigration document expert. Respond only with valid JSON.",
      temperature: 0.2,
      maxOutputTokens: 512,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse guidance response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Translation guidance error:", error);
    return {
      requiresCertifiedTranslation: true,
      guidance: "Please consult official immigration guidelines for translation requirements.",
      guidanceAr: "يرجى الرجوع إلى إرشادات الهجرة الرسمية لمتطلبات الترجمة.",
      acceptedCertifiers: ["Certified translator"],
      estimatedCost: "Varies by document",
    };
  }
}
