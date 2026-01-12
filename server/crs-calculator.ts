/**
 * CRS (Comprehensive Ranking System) Calculator for Express Entry
 * Based on official IRCC scoring criteria
 */

export interface CrsInput {
  // Core Human Capital Factors
  age: number;
  educationLevel: "none" | "high_school" | "one_year" | "two_year" | "bachelor" | "two_or_more" | "master" | "phd";
  firstLanguageTest: {
    speaking: number; // CLB level 0-10+
    listening: number;
    reading: number;
    writing: number;
  };
  secondLanguageTest?: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  canadianWorkExperience: number; // years: 0, 1, 2, 3, 4, 5+
  
  // Spouse factors (if applicable)
  hasSpouse: boolean;
  spouseEducation?: "none" | "high_school" | "one_year" | "two_year" | "bachelor" | "two_or_more" | "master" | "phd";
  spouseLanguageTest?: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  spouseCanadianWorkExperience?: number; // years
  
  // Skill Transferability
  foreignWorkExperience: number; // years: 0, 1, 2, 3+
  
  // Additional points
  hasCertificateOfQualification: boolean;
  hasCanadianSiblings: boolean;
  hasFrenchLanguageSkills: boolean;
  hasProvincialNomination: boolean;
  hasValidJobOffer: boolean;
  jobOfferNOC: "00" | "0" | "A" | "B" | "none"; // NOC skill level
  hasCanadianEducation: boolean;
  canadianEducationLevel?: "one_two_year" | "three_year_plus" | "master_phd";
}

export interface CrsResult {
  totalScore: number;
  breakdown: {
    coreHumanCapital: number;
    spouseFactors: number;
    skillTransferability: number;
    additionalPoints: number;
  };
  details: {
    age: number;
    education: number;
    firstLanguage: number;
    secondLanguage: number;
    canadianWork: number;
    spouseEducation: number;
    spouseLanguage: number;
    spouseWork: number;
    skillTransfer: number;
    certificate: number;
    siblings: number;
    french: number;
    nomination: number;
    jobOffer: number;
    canadianEducation: number;
  };
  recommendations: string[];
}

// Age points (with spouse)
const AGE_POINTS_WITH_SPOUSE: Record<number, number> = {
  17: 0, 18: 90, 19: 95, 20: 100, 21: 105, 22: 110, 23: 110, 24: 110,
  25: 110, 26: 110, 27: 110, 28: 110, 29: 110, 30: 105, 31: 99,
  32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61,
  39: 55, 40: 50, 41: 39, 42: 28, 43: 17, 44: 6, 45: 0,
};

// Age points (without spouse)
const AGE_POINTS_NO_SPOUSE: Record<number, number> = {
  17: 0, 18: 99, 19: 105, 20: 110, 21: 115, 22: 120, 23: 120, 24: 120,
  25: 120, 26: 120, 27: 120, 28: 120, 29: 120, 30: 115, 31: 109,
  32: 103, 33: 97, 34: 91, 35: 85, 36: 79, 37: 73, 38: 67,
  39: 61, 40: 55, 41: 43, 42: 31, 43: 19, 44: 7, 45: 0,
};

// Education points
const EDUCATION_POINTS_WITH_SPOUSE: Record<string, number> = {
  none: 0,
  high_school: 28,
  one_year: 84,
  two_year: 91,
  bachelor: 112,
  two_or_more: 119,
  master: 126,
  phd: 140,
};

const EDUCATION_POINTS_NO_SPOUSE: Record<string, number> = {
  none: 0,
  high_school: 30,
  one_year: 90,
  two_year: 98,
  bachelor: 120,
  two_or_more: 128,
  master: 135,
  phd: 150,
};

// First official language points (per skill, max 136 with spouse, 160 without)
const LANGUAGE_POINTS_PER_SKILL_WITH_SPOUSE: Record<number, number> = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1, 7: 3, 8: 5, 9: 6, 10: 6,
};

const LANGUAGE_POINTS_PER_SKILL_NO_SPOUSE: Record<number, number> = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1, 7: 3, 8: 6, 9: 7, 10: 8,
};

// Canadian work experience points
const CANADIAN_WORK_WITH_SPOUSE: Record<number, number> = {
  0: 0, 1: 35, 2: 46, 3: 56, 4: 63, 5: 70,
};

const CANADIAN_WORK_NO_SPOUSE: Record<number, number> = {
  0: 0, 1: 40, 2: 53, 3: 64, 4: 72, 5: 80,
};

// Spouse education points
const SPOUSE_EDUCATION_POINTS: Record<string, number> = {
  none: 0,
  high_school: 2,
  one_year: 6,
  two_year: 7,
  bachelor: 8,
  two_or_more: 9,
  master: 10,
  phd: 10,
};

export function calculateCRS(input: CrsInput): CrsResult {
  const details = {
    age: 0,
    education: 0,
    firstLanguage: 0,
    secondLanguage: 0,
    canadianWork: 0,
    spouseEducation: 0,
    spouseLanguage: 0,
    spouseWork: 0,
    skillTransfer: 0,
    certificate: 0,
    siblings: 0,
    french: 0,
    nomination: 0,
    jobOffer: 0,
    canadianEducation: 0,
  };

  const recommendations: string[] = [];

  // A. Core Human Capital Factors (max 500 with spouse, 600 without)
  
  // 1. Age
  const agePoints = input.hasSpouse
    ? (AGE_POINTS_WITH_SPOUSE[Math.min(input.age, 45)] || 0)
    : (AGE_POINTS_NO_SPOUSE[Math.min(input.age, 45)] || 0);
  details.age = agePoints;

  if (input.age > 29 && input.age < 35) {
    recommendations.push("Your age is in the optimal range for CRS points");
  } else if (input.age >= 35) {
    recommendations.push("Consider applying soon as age points decrease after 29");
  }

  // 2. Education
  const educationPoints = input.hasSpouse
    ? EDUCATION_POINTS_WITH_SPOUSE[input.educationLevel]
    : EDUCATION_POINTS_NO_SPOUSE[input.educationLevel];
  details.education = educationPoints;

  if (input.educationLevel === "bachelor" || input.educationLevel === "two_year") {
    recommendations.push("Consider pursuing a Master's degree to gain additional CRS points");
  }

  // 3. First Official Language
  const firstLangPerSkill = input.hasSpouse
    ? LANGUAGE_POINTS_PER_SKILL_WITH_SPOUSE
    : LANGUAGE_POINTS_PER_SKILL_NO_SPOUSE;
  
  const firstLanguagePoints =
    firstLangPerSkill[Math.min(input.firstLanguageTest.speaking, 10)] +
    firstLangPerSkill[Math.min(input.firstLanguageTest.listening, 10)] +
    firstLangPerSkill[Math.min(input.firstLanguageTest.reading, 10)] +
    firstLangPerSkill[Math.min(input.firstLanguageTest.writing, 10)];
  details.firstLanguage = firstLanguagePoints;

  const avgFirstLang = (
    input.firstLanguageTest.speaking +
    input.firstLanguageTest.listening +
    input.firstLanguageTest.reading +
    input.firstLanguageTest.writing
  ) / 4;

  if (avgFirstLang < 9) {
    recommendations.push("Improve your English/French test scores - aim for CLB 9+ in all skills");
  }

  // 4. Second Official Language (max 24 points)
  let secondLanguagePoints = 0;
  if (input.secondLanguageTest) {
    const hasAllClb5 = Object.values(input.secondLanguageTest).every(score => score >= 5);
    if (hasAllClb5) {
      secondLanguagePoints = 24;
    }
  }
  details.secondLanguage = secondLanguagePoints;

  if (!input.secondLanguageTest || secondLanguagePoints === 0) {
    recommendations.push("Learn French to CLB 5+ level to gain 24 additional points");
  }

  // 5. Canadian Work Experience
  const canadianWorkYears = Math.min(input.canadianWorkExperience, 5);
  const canadianWorkPoints = input.hasSpouse
    ? CANADIAN_WORK_WITH_SPOUSE[canadianWorkYears]
    : CANADIAN_WORK_NO_SPOUSE[canadianWorkYears];
  details.canadianWork = canadianWorkPoints;

  const coreHumanCapital = agePoints + educationPoints + firstLanguagePoints + secondLanguagePoints + canadianWorkPoints;

  // B. Spouse Factors (max 40 if applicable)
  let spouseFactors = 0;

  if (input.hasSpouse) {
    // Spouse education (max 10)
    if (input.spouseEducation) {
      details.spouseEducation = SPOUSE_EDUCATION_POINTS[input.spouseEducation];
      spouseFactors += details.spouseEducation;
    }

    // Spouse language (max 20)
    if (input.spouseLanguageTest) {
      const hasAllClb5 = Object.values(input.spouseLanguageTest).every(score => score >= 5);
      const hasAllClb7 = Object.values(input.spouseLanguageTest).every(score => score >= 7);
      const hasAllClb9 = Object.values(input.spouseLanguageTest).every(score => score >= 9);
      
      if (hasAllClb9) {
        details.spouseLanguage = 20;
      } else if (hasAllClb7) {
        details.spouseLanguage = 10;
      } else if (hasAllClb5) {
        details.spouseLanguage = 5;
      }
      spouseFactors += details.spouseLanguage;
    }

    // Spouse Canadian work (max 10)
    if (input.spouseCanadianWorkExperience) {
      const years = Math.min(input.spouseCanadianWorkExperience, 5);
      if (years >= 5) details.spouseWork = 10;
      else if (years >= 4) details.spouseWork = 9;
      else if (years >= 3) details.spouseWork = 8;
      else if (years >= 2) details.spouseWork = 7;
      else if (years >= 1) details.spouseWork = 5;
      spouseFactors += details.spouseWork;
    }

    if (spouseFactors < 40) {
      recommendations.push("Your spouse can contribute up to 40 points - consider improving their credentials");
    }
  }

  // C. Skill Transferability Factors (max 100)
  let skillTransfer = 0;

  // Education + Language combination (max 50)
  if (avgFirstLang >= 7 && input.educationLevel !== "none" && input.educationLevel !== "high_school") {
    if (input.educationLevel === "phd" || input.educationLevel === "master") {
      skillTransfer += 50;
    } else if (input.educationLevel === "bachelor" || input.educationLevel === "two_or_more") {
      skillTransfer += 25;
    } else {
      skillTransfer += 13;
    }
  }

  // Foreign work + Language (max 50)
  const foreignYears = Math.min(input.foreignWorkExperience, 3);
  if (avgFirstLang >= 7 && foreignYears > 0) {
    if (foreignYears >= 3) {
      skillTransfer += 50;
    } else if (foreignYears >= 2) {
      skillTransfer += 25;
    } else {
      skillTransfer += 13;
    }
  }

  // Cap at 100
  skillTransfer = Math.min(skillTransfer, 100);
  details.skillTransfer = skillTransfer;

  if (skillTransfer < 100) {
    recommendations.push("Gain more foreign work experience to maximize skill transferability points");
  }

  // D. Additional Points (max 600)
  let additionalPoints = 0;

  // Provincial Nomination (600 points)
  if (input.hasProvincialNomination) {
    details.nomination = 600;
    additionalPoints += 600;
  } else {
    recommendations.push("Consider applying for Provincial Nominee Program (PNP) for 600 additional points");
  }

  // Valid Job Offer
  if (input.hasValidJobOffer) {
    if (input.jobOfferNOC === "00") {
      details.jobOffer = 200;
      additionalPoints += 200;
    } else if (input.jobOfferNOC === "0" || input.jobOfferNOC === "A" || input.jobOfferNOC === "B") {
      details.jobOffer = 50;
      additionalPoints += 50;
    }
  }

  // Canadian Education
  if (input.hasCanadianEducation && input.canadianEducationLevel) {
    if (input.canadianEducationLevel === "master_phd") {
      details.canadianEducation = 30;
      additionalPoints += 30;
    } else if (input.canadianEducationLevel === "three_year_plus") {
      details.canadianEducation = 15;
      additionalPoints += 15;
    } else {
      details.canadianEducation = 15;
      additionalPoints += 15;
    }
  }

  // Certificate of Qualification (50 points)
  if (input.hasCertificateOfQualification) {
    details.certificate = 50;
    additionalPoints += 50;
  }

  // Canadian Siblings (15 points)
  if (input.hasCanadianSiblings) {
    details.siblings = 15;
    additionalPoints += 15;
  }

  // French Language Skills (bonus points)
  if (input.hasFrenchLanguageSkills) {
    details.french = 50; // Simplified - actual calculation is more complex
    additionalPoints += 50;
  }

  const totalScore = coreHumanCapital + spouseFactors + skillTransfer + additionalPoints;

  // Add score-based recommendations
  if (totalScore < 450) {
    recommendations.push("Your score is below the typical cutoff. Focus on improving language scores and gaining work experience");
  } else if (totalScore >= 450 && totalScore < 470) {
    recommendations.push("Your score is competitive. Monitor draw cutoffs and consider PNP options");
  } else if (totalScore >= 470) {
    recommendations.push("Excellent score! You have a strong chance in upcoming Express Entry draws");
  }

  return {
    totalScore,
    breakdown: {
      coreHumanCapital,
      spouseFactors,
      skillTransferability: skillTransfer,
      additionalPoints,
    },
    details,
    recommendations,
  };
}
