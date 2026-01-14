import { generateChatResponse } from "./_core/gemini";

/**
 * Document classification result from AI analysis
 */
export interface DocumentClassification {
    documentType: string;
    confidence: number;
    extractedData: {
        name?: string;
        nationality?: string;
        dateOfBirth?: string;
        expiryDate?: string;
        documentNumber?: string;
        issuingCountry?: string;
    };
    validationResult: {
        isValid: boolean;
        errors: string[];
    };
    identityVerification: {
        nameMatches: boolean;
        extractedName: string | null;
        profileName: string | null;
        matchConfidence: number;
    };
}

/**
 * Maps checklist item IDs to possible document types that match them
 */
const CHECKLIST_DOCUMENT_MAP: Record<string, string[]> = {
    passport: ["passport", "travel_document"],
    birth_certificate: ["birth_certificate"],
    police_clearance: ["police_clearance", "good_conduct_certificate", "criminal_record_check"],
    language_test: ["ielts", "toefl", "celpip", "tef", "language_test"],
    education_diploma: ["diploma", "degree", "certificate", "transcript"],
    eca_report: ["eca", "wes_report", "credential_assessment"],
    work_reference_letters: ["reference_letter", "employment_letter", "work_experience_letter"],
    pay_stubs: ["pay_stub", "salary_slip", "payslip"],
    national_id: ["national_id", "emirates_id", "civil_id", "identity_card"],
    military_service: ["military_service", "military_certificate"],
    family_book: ["family_book", "family_registration"],
    acceptance_letter: ["acceptance_letter", "admission_letter"],
    proof_of_funds: ["bank_statement", "proof_of_funds", "financial_statement"],
};

/**
 * Document types that require expiry date validation
 */
const EXPIRY_REQUIRED_TYPES = ["passport", "national_id", "emirates_id", "civil_id", "identity_card"];

/**
 * Document types that require identity verification (name matching)
 */
const IDENTITY_CHECK_TYPES = ["passport", "national_id", "emirates_id", "civil_id", "identity_card", "birth_certificate"];

/**
 * Normalize a name for comparison (lowercase, remove diacritics, split into parts)
 */
function normalizeName(name: string): string[] {
    if (!name) return [];
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z\s]/g, "") // Keep only letters and spaces
        .split(/\s+/)
        .filter(part => part.length > 1); // Filter out single letters
}

/**
 * Calculate name match confidence between document name and profile name
 * Returns value between 0 and 1
 */
function calculateNameMatch(documentName: string | null | undefined, profileName: string | null | undefined): { matches: boolean; confidence: number } {
    if (!documentName || !profileName) {
        return { matches: false, confidence: 0 };
    }

    const docParts = normalizeName(documentName);
    const profileParts = normalizeName(profileName);

    if (docParts.length === 0 || profileParts.length === 0) {
        return { matches: false, confidence: 0 };
    }

    // Count matching name parts
    let matchCount = 0;
    for (const docPart of docParts) {
        if (profileParts.some(pp => pp === docPart || pp.includes(docPart) || docPart.includes(pp))) {
            matchCount++;
        }
    }

    // Calculate confidence based on how many parts match
    const confidence = matchCount / Math.max(docParts.length, profileParts.length);

    // Consider it a match if at least 2 parts match OR confidence > 50%
    const matches = matchCount >= 2 || confidence > 0.5;

    console.log(`[NameMatch] Document: "${documentName}" vs Profile: "${profileName}" => Parts matched: ${matchCount}/${Math.max(docParts.length, profileParts.length)}, Confidence: ${(confidence * 100).toFixed(0)}%, Match: ${matches}`);

    return { matches, confidence };
}

/**
 * Classify a document from OCR text using Gemini AI
 */
export async function classifyDocument(
    ocrText: string,
    userChecklistItems?: string[],
    userProfileName?: string | null
): Promise<DocumentClassification> {
    const knownDocTypes = Object.values(CHECKLIST_DOCUMENT_MAP).flat();

    const prompt = `You are a document classification expert. Analyze the following OCR-extracted text from a scanned document and classify it.

OCR TEXT:
---
${ocrText.substring(0, 3000)}
---

INSTRUCTIONS:
1. Identify the document type from this list: ${knownDocTypes.join(", ")}
2. Extract key data fields if present
3. Check if expiry date is valid (must be > 6 months from today: ${new Date().toISOString().split('T')[0]})

Respond in this exact JSON format (no markdown, just pure JSON):
{
  "documentType": "the_document_type",
  "confidence": 0.95,
  "extractedData": {
    "name": "extracted name or null",
    "nationality": "extracted nationality or null",
    "dateOfBirth": "YYYY-MM-DD or null",
    "expiryDate": "YYYY-MM-DD or null",
    "documentNumber": "extracted number or null",
    "issuingCountry": "country code or null"
  },
  "isExpired": false,
  "expiryError": null
}`;

    try {
        const response = await generateChatResponse({
            messages: [{ role: "user", content: prompt }],
            systemInstruction: "You are a document classification AI. Respond only with valid JSON, no markdown formatting.",
            temperature: 0.1,
            maxOutputTokens: 1024,
        });

        // Parse AI response
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleanedResponse);

        // Validate expiry if required
        const errors: string[] = [];
        let isValid = true;

        if (EXPIRY_REQUIRED_TYPES.includes(parsed.documentType)) {
            if (parsed.extractedData?.expiryDate) {
                const expiry = new Date(parsed.extractedData.expiryDate);
                const sixMonthsFromNow = new Date();
                sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

                if (expiry < new Date()) {
                    errors.push("Document has expired");
                    isValid = false;
                } else if (expiry < sixMonthsFromNow) {
                    errors.push("Document expires within 6 months");
                    isValid = false;
                }
            } else {
                errors.push("Could not extract expiry date");
                isValid = false;
            }
        }

        // Identity verification for applicable document types
        let identityVerification = {
            nameMatches: false,
            extractedName: parsed.extractedData?.name || null,
            profileName: userProfileName || null,
            matchConfidence: 0,
        };

        if (IDENTITY_CHECK_TYPES.includes(parsed.documentType) && parsed.extractedData?.name) {
            const nameMatch = calculateNameMatch(parsed.extractedData.name, userProfileName);
            identityVerification = {
                nameMatches: nameMatch.matches,
                extractedName: parsed.extractedData.name,
                profileName: userProfileName || null,
                matchConfidence: nameMatch.confidence,
            };

            if (!nameMatch.matches) {
                errors.push("Document name does not match your profile");
                isValid = false;
            }
        }

        return {
            documentType: parsed.documentType || "unknown",
            confidence: parsed.confidence || 0.5,
            extractedData: parsed.extractedData || {},
            validationResult: {
                isValid,
                errors,
            },
            identityVerification,
        };
    } catch (error) {
        console.error("[DocumentClassifier] Classification error:", error);
        return {
            documentType: "unknown",
            confidence: 0,
            extractedData: {},
            validationResult: {
                isValid: false,
                errors: ["Failed to classify document"],
            },
            identityVerification: {
                nameMatches: false,
                extractedName: null,
                profileName: userProfileName || null,
                matchConfidence: 0,
            },
        };
    }
}

/**
 * Find matching checklist item ID for a classified document type
 */
export function findMatchingChecklistItem(
    documentType: string,
    userChecklistItemIds: string[]
): string | null {
    for (const [checklistId, matchingTypes] of Object.entries(CHECKLIST_DOCUMENT_MAP)) {
        if (matchingTypes.includes(documentType)) {
            // Check if user has this item in their checklist
            const matchingItem = userChecklistItemIds.find(
                (id) => id === checklistId || id.startsWith(`${checklistId}_`)
            );
            if (matchingItem) {
                return matchingItem;
            }
        }
    }
    return null;
}
