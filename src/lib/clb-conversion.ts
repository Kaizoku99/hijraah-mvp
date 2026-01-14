export type LanguageTestType = "ielts" | "celpip" | "tef" | "tcf";

export interface TestScores {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

export interface ClbResult {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
}

export function convertToClb(testType: LanguageTestType, scores: TestScores): ClbResult {
    switch (testType) {
        case "ielts":
            return convertIeltsToClb(scores);
        case "celpip":
            return convertCelpipToClb(scores);
        case "tef":
            return convertTefToClb(scores);
        case "tcf":
            return convertTcfToClb(scores);
        default:
            return { speaking: 0, listening: 0, reading: 0, writing: 0 };
    }
}

function convertCelpipToClb(scores: TestScores): ClbResult {
    // CELPIP levels align perfectly with CLB
    const getClb = (score: number) => {
        if (score >= 10) return 10; // Cap at 10 for calculation purposes (usually max is 12 but CRS caps at CLB 10 for max points usually, but actually 10+ is grouped. We'll return nominal CLB)
        // Actually, let's return raw CLB up to 12 if they enter it, but our CRS calc caps at 10. 
        // Better to return the effective CLB
        return Math.min(Math.round(score), 12);
    }
    return {
        speaking: getClb(scores.speaking),
        listening: getClb(scores.listening),
        reading: getClb(scores.reading),
        writing: getClb(scores.writing)
    };
}

function convertIeltsToClb(scores: TestScores): ClbResult {
    // Source: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html

    const getListeningClb = (score: number) => {
        if (score >= 8.5) return 10;
        if (score >= 8.0) return 9;
        if (score >= 7.5) return 8;
        if (score >= 6.0) return 7;
        if (score >= 5.5) return 6;
        if (score >= 5.0) return 5;
        if (score >= 4.5) return 4;
        return 0; // Below CLB 4
    };

    const getReadingClb = (score: number) => {
        if (score >= 8.0) return 10;
        if (score >= 7.0) return 9;
        if (score >= 6.5) return 8;
        if (score >= 6.0) return 7;
        if (score >= 5.0) return 6;
        if (score >= 4.0) return 5;
        if (score >= 3.5) return 4;
        return 0;
    };

    const getSpeakingClb = (score: number) => {
        if (score >= 7.5) return 10;
        if (score >= 7.0) return 9;
        if (score >= 6.5) return 8;
        if (score >= 6.0) return 7;
        if (score >= 5.5) return 6;
        if (score >= 5.0) return 5;
        if (score >= 4.0) return 4;
        return 0;
    };

    const getWritingClb = (score: number) => {
        if (score >= 7.5) return 10;
        if (score >= 7.0) return 9;
        if (score >= 6.5) return 8;
        if (score >= 6.0) return 7;
        if (score >= 5.5) return 6;
        if (score >= 5.0) return 5;
        if (score >= 4.0) return 4;
        return 0;
    };

    return {
        listening: getListeningClb(scores.listening),
        reading: getReadingClb(scores.reading),
        speaking: getSpeakingClb(scores.speaking),
        writing: getWritingClb(scores.writing),
    };
}

function convertTefToClb(scores: TestScores): ClbResult {
    // TEF Canada
    // R/L/W/S mapping
    const getClb = (score: number, type: 'reading' | 'listening' | 'writing' | 'speaking') => {
        // Simplified Logic based on ranges. 
        // Need to be precise. 
        // Listening (Compréhension orale): 316-360 -> 10+
        // Reading (Compréhension écrite): 263-300 -> 10+ 
        // Etc.
        // For MVP, we might approximate if ranges are complex, but best to be accurate.
        // Implementing basic thresholds for high/med/low

        // This is complex to hardcode fully without a lookup table.
        // Let's implement full ranges for accuracy. (Based on OFFICIAL TEF-Canada charts)

        // Listening
        if (type === 'listening') {
            if (score >= 316) return 10;
            if (score >= 298) return 9;
            if (score >= 280) return 8;
            if (score >= 249) return 7;
            if (score >= 217) return 6;
            if (score >= 181) return 5;
            if (score >= 145) return 4;
            return 0;
        }
        // Reading
        if (type === 'reading') {
            if (score >= 263) return 10;
            if (score >= 248) return 9;
            if (score >= 233) return 8;
            if (score >= 207) return 7;
            if (score >= 181) return 6;
            if (score >= 151) return 5;
            if (score >= 121) return 4;
            return 0;
        }
        // Speaking
        if (type === 'speaking') {
            if (score >= 393) return 10;
            if (score >= 371) return 9;
            if (score >= 349) return 8;
            if (score >= 310) return 7;
            if (score >= 271) return 6;
            if (score >= 226) return 5;
            if (score >= 181) return 4;
            return 0;
        }
        // Writing
        if (type === 'writing') {
            if (score >= 393) return 10;
            if (score >= 371) return 9;
            if (score >= 349) return 8;
            if (score >= 310) return 7;
            if (score >= 271) return 6;
            if (score >= 226) return 5;
            if (score >= 181) return 4;
            return 0;
        }
        return 0;
    }

    return {
        listening: getClb(scores.listening, 'listening'),
        reading: getClb(scores.reading, 'reading'),
        speaking: getClb(scores.speaking, 'speaking'),
        writing: getClb(scores.writing, 'writing')
    };
}

function convertTcfToClb(scores: TestScores): ClbResult {
    // TCF Canada
    const getClb = (score: number, type: 'reading' | 'listening' | 'writing' | 'speaking') => {
        // Listening
        if (type === 'listening') {
            if (score >= 549) return 10;
            if (score >= 523) return 9;
            if (score >= 503) return 8;
            if (score >= 458) return 7;
            if (score >= 398) return 6;
            if (score >= 369) return 5;
            if (score >= 331) return 4;
            return 0;
        }
        // Reading
        if (type === 'reading') {
            if (score >= 549) return 10;
            if (score >= 524) return 9;
            if (score >= 499) return 8;
            if (score >= 453) return 7;
            if (score >= 406) return 6;
            if (score >= 375) return 5;
            if (score >= 342) return 4;
            return 0;
        }
        // Speaking
        if (type === 'speaking') {
            if (score >= 16) return 10; // Actually 16-20 scales
            if (score >= 14) return 9;
            if (score >= 12) return 8;
            if (score >= 10) return 7;
            if (score >= 7) return 6;
            if (score >= 6) return 5;
            if (score >= 4) return 4;
            return 0;
        }
        // Writing
        if (type === 'writing') {
            if (score >= 16) return 10;
            if (score >= 14) return 9;
            if (score >= 12) return 8;
            if (score >= 10) return 7;
            if (score >= 7) return 6;
            if (score >= 6) return 5;
            if (score >= 4) return 4;
            return 0;
        }
        return 0;
    }

    return {
        listening: getClb(scores.listening, 'listening'),
        reading: getClb(scores.reading, 'reading'),
        speaking: getClb(scores.speaking, 'speaking'),
        writing: getClb(scores.writing, 'writing')
    };
}
