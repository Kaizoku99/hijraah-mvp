export interface AustraliaPointsData {
    age: number;
    englishLevel: 'competent' | 'proficient' | 'superior';
    overseasExperience: 'less_than_3' | '3_to_5' | '5_to_8' | '8_plus';
    australianExperience: 'less_than_1' | '1_to_3' | '3_to_5' | '5_to_8' | '8_plus';
    educationLevel: 'diploma' | 'bachelor' | 'master' | 'phd' | 'recognized_qualification' | 'other';
    specialistEducation: boolean;
    australianStudy: boolean;
    professionalYear: boolean;
    credentialledCommunityLanguage: boolean;
    regionalStudy: boolean;
    partnerSkills: 'single' | 'partner_skilled' | 'partner_english' | 'partner_pr' | 'partner_no_points';
    nomination: 'none' | 'state_190' | 'regional_491';
}

export interface AustraliaPointsResult {
    totalScore: number;
    breakdown: {
        age: number;
        english: number;
        experience: number;
        education: number;
        specialistEducation: number;
        australianStudy: number;
        professionalYear: number;
        communityLanguage: number;
        regionalStudy: number;
        partner: number;
        nomination: number;
    };
}

export function calculateAustraliaPoints(data: AustraliaPointsData): AustraliaPointsResult {
    const breakdown = {
        age: 0,
        english: 0,
        experience: 0,
        education: 0,
        specialistEducation: 0,
        australianStudy: 0,
        professionalYear: 0,
        communityLanguage: 0,
        regionalStudy: 0,
        partner: 0,
        nomination: 0,
    };

    // 1. Age
    if (data.age >= 18 && data.age <= 24) breakdown.age = 25;
    else if (data.age >= 25 && data.age <= 32) breakdown.age = 30;
    else if (data.age >= 33 && data.age <= 39) breakdown.age = 25;
    else if (data.age >= 40 && data.age < 45) breakdown.age = 15;
    // 45+ is 0

    // 2. English
    if (data.englishLevel === 'proficient') breakdown.english = 10;
    else if (data.englishLevel === 'superior') breakdown.english = 20;

    // 3. Experience
    // Overseas
    let overseasPoints = 0;
    if (data.overseasExperience === '3_to_5') overseasPoints = 5;
    else if (data.overseasExperience === '5_to_8') overseasPoints = 10;
    else if (data.overseasExperience === '8_plus') overseasPoints = 15;

    // Australian
    let australianPoints = 0;
    if (data.australianExperience === '1_to_3') australianPoints = 5;
    else if (data.australianExperience === '3_to_5') australianPoints = 10;
    else if (data.australianExperience === '5_to_8') australianPoints = 15;
    else if (data.australianExperience === '8_plus') australianPoints = 20;

    // Combined Cap is 20
    breakdown.experience = Math.min(overseasPoints + australianPoints, 20);

    // 4. Education
    if (data.educationLevel === 'phd') breakdown.education = 20;
    else if (data.educationLevel === 'bachelor' || data.educationLevel === 'master') breakdown.education = 15;
    else if (data.educationLevel === 'diploma' || data.educationLevel === 'recognized_qualification') breakdown.education = 10;

    // 5. Specialist Education
    if (data.specialistEducation) breakdown.specialistEducation = 10;

    // 6. Australian Study
    if (data.australianStudy) breakdown.australianStudy = 5;

    // 7. Professional Year
    if (data.professionalYear) breakdown.professionalYear = 5;

    // 8. Community Language
    if (data.credentialledCommunityLanguage) breakdown.communityLanguage = 5;

    // 9. Regional Study
    if (data.regionalStudy) breakdown.regionalStudy = 5;

    // 10. Partner Skills
    if (data.partnerSkills === 'single' || data.partnerSkills === 'partner_skilled' || data.partnerSkills === 'partner_pr') {
        breakdown.partner = 10;
    } else if (data.partnerSkills === 'partner_english') {
        breakdown.partner = 5;
    }

    // 11. Nomination
    if (data.nomination === 'state_190') breakdown.nomination = 5;
    else if (data.nomination === 'regional_491') breakdown.nomination = 15;

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
        totalScore,
        breakdown
    };
}
