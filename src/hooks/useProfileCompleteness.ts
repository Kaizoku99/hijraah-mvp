
import { useMemo } from 'react';

interface ProfileData {
    dateOfBirth?: string | Date | null;
    nationality?: string | null;
    sourceCountry?: string | null;
    currentCountry?: string | null;
    maritalStatus?: string | null;
    educationLevel?: string | null;
    fieldOfStudy?: string | null;
    yearsOfExperience?: number | string | null;
    currentOccupation?: string | null;
    nocCode?: string | null;
    englishLevel?: string | null;
    frenchLevel?: string | null;
    ieltsScore?: string | null;
    tefScore?: string | null;
    targetDestination?: string | null;
    immigrationPathway?: string | null;
    [key: string]: any;
}

export const useProfileCompleteness = (formData: ProfileData | null | undefined, language: string) => {
    return useMemo(() => {
        if (!formData) return { percentage: 0, missing: [] };

        let totalScore = 0;
        const missing: string[] = [];

        // 1. Basic (10%)
        const basicFields = [
            { key: 'dateOfBirth', label: language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth' },
            { key: 'nationality', label: language === 'ar' ? 'الجنسية' : 'Nationality' },
            { key: 'currentCountry', label: language === 'ar' ? 'بلد الإقامة' : 'Current Country' },
            { key: 'maritalStatus', label: language === 'ar' ? 'الحالة الاجتماعية' : 'Marital Status' }
        ];

        const basicFilled = basicFields.filter(f => formData[f.key]).length;
        if (basicFilled < basicFields.length) {
            basicFields.forEach(f => {
                if (!formData[f.key]) missing.push(f.label);
            });
        }
        const basicScore = (basicFilled / basicFields.length) * 10;
        totalScore += basicScore;

        // 2. Education (30%)
        let eduScore = 0;
        const hasEduLevel = !!formData.educationLevel;

        if (!hasEduLevel) {
            missing.push(language === 'ar' ? 'المستوى التعليمي' : 'Education Level');
        } else {
            eduScore += 15; // Half of 30
            // Check field of study
            if (formData.educationLevel !== 'high_school' && formData.educationLevel !== 'other') {
                if (formData.fieldOfStudy) {
                    eduScore += 15;
                } else {
                    missing.push(language === 'ar' ? 'مجال الدراسة' : 'Field of Study');
                }
            } else {
                // If high school, field of study might not be relevant, give full points
                eduScore += 15;
            }
        }
        totalScore += eduScore;

        // 3. Work (30%)
        let workCurrentPoints = 0;

        // Years of Exp
        if (formData.yearsOfExperience) workCurrentPoints += 10;
        else missing.push(language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience');

        // Occupation
        if (formData.currentOccupation) workCurrentPoints += 10;
        else missing.push(language === 'ar' ? 'المهنة الحالية' : 'Current Occupation');

        // NOC Code - Only if Canada
        if (formData.targetDestination === 'canada') {
            if (formData.nocCode) workCurrentPoints += 10;
            else missing.push(language === 'ar' ? 'رمز NOC' : 'NOC Code');
        } else {
            // If not Canada, distribute points
            workCurrentPoints = 0;
            if (formData.yearsOfExperience) workCurrentPoints += 15;
            if (formData.currentOccupation) workCurrentPoints += 15;
        }
        totalScore += workCurrentPoints;


        // 4. Language (30%)
        // English (15%)
        let langScore = 0;
        if (!formData.englishLevel) {
            missing.push(language === 'ar' ? 'مستوى الإنجليزية' : 'English Level');
        } else {
            if (formData.englishLevel === 'none') {
                langScore += 15; // Full English score for saying "None"
            } else {
                // Has level
                langScore += 7.5;
                if (formData.ieltsScore) {
                    langScore += 7.5;
                } else {
                    missing.push(language === 'ar' ? 'درجة IELTS' : 'IELTS Score');
                }
            }
        }

        // French (15%)
        if (!formData.frenchLevel) {
            missing.push(language === 'ar' ? 'مستوى الفرنسية' : 'French Level');
        } else {
            if (formData.frenchLevel === 'none') {
                langScore += 15;
            } else {
                langScore += 7.5;
                if (formData.tefScore) {
                    langScore += 7.5;
                } else {
                    missing.push(language === 'ar' ? 'درجة TEF' : 'TEF Score');
                }
            }
        }
        totalScore += langScore;

        // Goals check (doesn't affect score to match user expectation of 100% without it being critical part of "profile data" in some contexts, but let's include it in missing for guidance)
        if (!formData.immigrationPathway) {
            missing.push(language === 'ar' ? 'مسار الهجرة' : 'Immigration Pathway');
        }

        return {
            percentage: Math.min(100, Math.round(totalScore)),
            missing
        };
    }, [formData, language]);
};
