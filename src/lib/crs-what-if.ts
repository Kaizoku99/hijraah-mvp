/**
 * CRS "What-If" Scenario Planning
 * Helps users understand how improving different factors affects their CRS score
 */

import { calculateCRS, CrsInput, CrsResult } from "./crs-calculator";

export interface WhatIfScenario {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  pointsGain: number;
  difficulty: "easy" | "medium" | "hard";
  timelineMonths: number;
  category: "language" | "education" | "experience" | "other";
  apply: (input: CrsInput) => CrsInput;
}

export interface WhatIfResult {
  currentScore: number;
  scenarios: Array<{
    scenario: WhatIfScenario;
    newScore: number;
    pointsGain: number;
    isApplicable: boolean;
    reason?: string;
  }>;
  bestScenario: WhatIfScenario | null;
  combinedMaxScore: number;
}

/**
 * All available what-if scenarios
 */
export const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  // Language Improvements
  {
    id: "improve_ielts_one_band",
    titleEn: "Improve IELTS by 1 band (all sections)",
    titleAr: "تحسين IELTS بدرجة واحدة (جميع الأقسام)",
    descriptionEn: "Study English and retake IELTS to score 1 band higher in all sections",
    descriptionAr: "دراسة اللغة الإنجليزية وإعادة اختبار IELTS للحصول على درجة أعلى في جميع الأقسام",
    pointsGain: 0, // Calculated dynamically
    difficulty: "medium",
    timelineMonths: 3,
    category: "language",
    apply: (input) => ({
      ...input,
      firstLanguageTest: {
        speaking: Math.min(10, input.firstLanguageTest.speaking + 1),
        listening: Math.min(10, input.firstLanguageTest.listening + 1),
        reading: Math.min(10, input.firstLanguageTest.reading + 1),
        writing: Math.min(10, input.firstLanguageTest.writing + 1),
      },
    }),
  },
  {
    id: "reach_clb_9_all",
    titleEn: "Reach CLB 9 in all language skills",
    titleAr: "الوصول إلى CLB 9 في جميع المهارات اللغوية",
    descriptionEn: "Achieve CLB 9 (IELTS 7.0) in all sections for maximum language points",
    descriptionAr: "الوصول إلى CLB 9 (IELTS 7.0) في جميع الأقسام للحصول على أقصى نقاط اللغة",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 6,
    category: "language",
    apply: (input) => ({
      ...input,
      firstLanguageTest: {
        speaking: Math.max(input.firstLanguageTest.speaking, 9),
        listening: Math.max(input.firstLanguageTest.listening, 9),
        reading: Math.max(input.firstLanguageTest.reading, 9),
        writing: Math.max(input.firstLanguageTest.writing, 9),
      },
    }),
  },
  {
    id: "add_french_nclc_7",
    titleEn: "Learn French (NCLC 7 in all skills)",
    titleAr: "تعلم الفرنسية (NCLC 7 في جميع المهارات)",
    descriptionEn: "Learn French and achieve NCLC 7+ to get bilingual bonus points",
    descriptionAr: "تعلم اللغة الفرنسية وتحقيق NCLC 7+ للحصول على نقاط المكافأة ثنائية اللغة",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 12,
    category: "language",
    apply: (input) => ({
      ...input,
      secondLanguageTest: {
        speaking: 7,
        listening: 7,
        reading: 7,
        writing: 7,
      },
      hasFrenchLanguageSkills: true,
    }),
  },

  // Education Improvements
  {
    id: "upgrade_to_masters",
    titleEn: "Earn a Master's degree",
    titleAr: "الحصول على درجة الماجستير",
    descriptionEn: "Complete a Master's degree program to increase education points",
    descriptionAr: "إكمال برنامج الماجستير لزيادة نقاط التعليم",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 24,
    category: "education",
    apply: (input) => ({
      ...input,
      educationLevel: "master" as const,
    }),
  },
  {
    id: "canadian_one_year_diploma",
    titleEn: "Study 1-year program in Canada",
    titleAr: "دراسة برنامج لمدة سنة في كندا",
    descriptionEn: "Complete a 1-2 year credential in Canada for additional points",
    descriptionAr: "إكمال برنامج من 1-2 سنة في كندا للحصول على نقاط إضافية",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 12,
    category: "education",
    apply: (input) => ({
      ...input,
      hasCanadianEducation: true,
      canadianEducationLevel: "one_two_year" as const,
    }),
  },
  {
    id: "canadian_three_year_degree",
    titleEn: "Study 3+ year degree in Canada",
    titleAr: "دراسة درجة 3+ سنوات في كندا",
    descriptionEn: "Complete a 3+ year degree in Canada for maximum education bonus",
    descriptionAr: "إكمال درجة 3+ سنوات في كندا للحصول على أقصى مكافأة تعليمية",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 36,
    category: "education",
    apply: (input) => ({
      ...input,
      hasCanadianEducation: true,
      canadianEducationLevel: "three_year_plus" as const,
    }),
  },

  // Experience Improvements
  {
    id: "gain_one_year_canadian_experience",
    titleEn: "Gain 1 year Canadian work experience",
    titleAr: "اكتساب سنة من الخبرة العملية الكندية",
    descriptionEn: "Work in Canada on a work permit for 1 year",
    descriptionAr: "العمل في كندا بتصريح عمل لمدة سنة واحدة",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 12,
    category: "experience",
    apply: (input) => ({
      ...input,
      canadianWorkExperience: Math.max(input.canadianWorkExperience, 1),
    }),
  },
  {
    id: "gain_one_year_foreign_experience",
    titleEn: "Gain 1 more year of foreign work experience",
    titleAr: "اكتساب سنة إضافية من الخبرة الأجنبية",
    descriptionEn: "Continue working in your NOC code occupation for 1 more year",
    descriptionAr: "استمر في العمل في مهنة كود NOC الخاصة بك لمدة سنة إضافية",
    pointsGain: 0,
    difficulty: "easy",
    timelineMonths: 12,
    category: "experience",
    apply: (input) => ({
      ...input,
      foreignWorkExperience: Math.min(input.foreignWorkExperience + 1, 5),
    }),
  },

  // Other Improvements
  {
    id: "get_provincial_nomination",
    titleEn: "Get Provincial Nomination (PNP)",
    titleAr: "الحصول على ترشيح المقاطعة (PNP)",
    descriptionEn: "Apply for and receive a Provincial Nominee Program nomination (+600 points)",
    descriptionAr: "التقدم والحصول على ترشيح برنامج المرشح الإقليمي (+600 نقطة)",
    pointsGain: 600,
    difficulty: "hard",
    timelineMonths: 6,
    category: "other",
    apply: (input) => ({
      ...input,
      hasProvincialNomination: true,
    }),
  },
  {
    id: "get_job_offer_noc_0_A",
    titleEn: "Get job offer (NOC 0, A, or B)",
    titleAr: "الحصول على عرض عمل (NOC 0، A، أو B)",
    descriptionEn: "Secure a valid job offer from a Canadian employer in a skilled position",
    descriptionAr: "الحصول على عرض عمل صالح من صاحب عمل كندي في وظيفة ماهرة",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 3,
    category: "other",
    apply: (input) => ({
      ...input,
      hasValidJobOffer: true,
      jobOfferNOC: "A" as const,
    }),
  },
  {
    id: "trades_certificate",
    titleEn: "Get Certificate of Qualification in a trade",
    titleAr: "الحصول على شهادة المؤهل في حرفة",
    descriptionEn: "Obtain a Canadian certificate of qualification in a skilled trade",
    descriptionAr: "الحصول على شهادة مؤهل كندية في حرفة ماهرة",
    pointsGain: 0,
    difficulty: "hard",
    timelineMonths: 12,
    category: "other",
    apply: (input) => ({
      ...input,
      hasCertificateOfQualification: true,
    }),
  },
];

/**
 * Calculate what-if scenarios for a given CRS input
 */
export function calculateWhatIfScenarios(input: CrsInput): WhatIfResult {
  const currentResult = calculateCRS(input);
  const currentScore = currentResult.totalScore;

  const scenarioResults = WHAT_IF_SCENARIOS.map((scenario) => {
    // Check if scenario is applicable
    let isApplicable = true;
    let reason: string | undefined;

    // Check specific conditions
    if (scenario.id === "upgrade_to_masters" && input.educationLevel === "master") {
      isApplicable = false;
      reason = "Already has Master's degree";
    }
    if (scenario.id === "upgrade_to_masters" && input.educationLevel === "phd") {
      isApplicable = false;
      reason = "Already has PhD";
    }
    if (scenario.id === "get_provincial_nomination" && input.hasProvincialNomination) {
      isApplicable = false;
      reason = "Already has Provincial Nomination";
    }
    if (scenario.id === "get_job_offer_noc_0_A" && input.hasValidJobOffer) {
      isApplicable = false;
      reason = "Already has valid job offer";
    }
    if (scenario.id === "add_french_nclc_7" && input.hasFrenchLanguageSkills) {
      isApplicable = false;
      reason = "Already has French language skills";
    }
    if (scenario.id === "reach_clb_9_all") {
      const allAt9 = 
        input.firstLanguageTest.speaking >= 9 &&
        input.firstLanguageTest.listening >= 9 &&
        input.firstLanguageTest.reading >= 9 &&
        input.firstLanguageTest.writing >= 9;
      if (allAt9) {
        isApplicable = false;
        reason = "Already at CLB 9 in all skills";
      }
    }
    if (scenario.id === "canadian_one_year_diploma" && input.hasCanadianEducation) {
      isApplicable = false;
      reason = "Already has Canadian education";
    }
    if (scenario.id === "canadian_three_year_degree" && input.hasCanadianEducation) {
      isApplicable = false;
      reason = "Already has Canadian education";
    }
    if (scenario.id === "gain_one_year_canadian_experience" && input.canadianWorkExperience >= 5) {
      isApplicable = false;
      reason = "Already has maximum Canadian work experience points";
    }
    if (scenario.id === "gain_one_year_foreign_experience" && input.foreignWorkExperience >= 5) {
      isApplicable = false;
      reason = "Already has maximum foreign work experience points";
    }
    if (scenario.id === "trades_certificate" && input.hasCertificateOfQualification) {
      isApplicable = false;
      reason = "Already has Certificate of Qualification";
    }

    // Calculate new score
    let newScore = currentScore;
    let pointsGain = 0;

    if (isApplicable) {
      const modifiedInput = scenario.apply(input);
      const modifiedResult = calculateCRS(modifiedInput);
      newScore = modifiedResult.totalScore;
      pointsGain = newScore - currentScore;
    }

    return {
      scenario: {
        ...scenario,
        pointsGain, // Update with calculated points gain
      },
      newScore,
      pointsGain,
      isApplicable,
      reason,
    };
  });

  // Sort by points gain (descending) and filter applicable scenarios
  const applicableScenarios = scenarioResults
    .filter((r) => r.isApplicable && r.pointsGain > 0)
    .sort((a, b) => b.pointsGain - a.pointsGain);

  // Find the best scenario (excluding PNP since it's such a big jump)
  const bestNonPnpScenario = applicableScenarios.find(
    (r) => r.scenario.id !== "get_provincial_nomination"
  );

  // Calculate combined max score (applying all applicable improvements)
  let combinedInput = { ...input };
  for (const result of applicableScenarios) {
    if (result.scenario.id !== "get_provincial_nomination") {
      combinedInput = result.scenario.apply(combinedInput);
    }
  }
  const combinedResult = calculateCRS(combinedInput);
  const combinedMaxScore = combinedResult.totalScore;

  return {
    currentScore,
    scenarios: scenarioResults,
    bestScenario: bestNonPnpScenario?.scenario || null,
    combinedMaxScore,
  };
}

/**
 * Get prioritized recommendations based on what-if analysis
 */
export function getWhatIfRecommendations(
  result: WhatIfResult,
  targetScore: number = 480
): Array<{
  scenario: WhatIfScenario;
  priority: "high" | "medium" | "low";
  reason: string;
}> {
  const gap = targetScore - result.currentScore;
  const applicableScenarios = result.scenarios
    .filter((r) => r.isApplicable && r.pointsGain > 0)
    .sort((a, b) => {
      // Sort by efficiency (points / timeline)
      const efficiencyA = a.pointsGain / a.scenario.timelineMonths;
      const efficiencyB = b.pointsGain / b.scenario.timelineMonths;
      return efficiencyB - efficiencyA;
    });

  return applicableScenarios.slice(0, 5).map((r, index) => {
    let priority: "high" | "medium" | "low";
    let reason: string;

    if (r.pointsGain >= gap) {
      priority = "high";
      reason = `Could help you reach target score of ${targetScore}`;
    } else if (r.scenario.difficulty === "easy" || r.scenario.timelineMonths <= 6) {
      priority = "high";
      reason = `Quick win with relatively low effort`;
    } else if (r.pointsGain >= 20) {
      priority = "medium";
      reason = `Significant point boost of +${r.pointsGain}`;
    } else {
      priority = "low";
      reason = `Moderate improvement of +${r.pointsGain}`;
    }

    return {
      scenario: r.scenario,
      priority,
      reason,
    };
  });
}

/**
 * Calculate timeline estimate for immigration based on current score
 */
export interface TimelineEstimate {
  estimatedMonths: number;
  confidence: "high" | "medium" | "low";
  factors: string[];
  milestones: Array<{
    titleEn: string;
    titleAr: string;
    monthsFromNow: number;
  }>;
}

export function estimateTimeline(
  crsScore: number,
  pathway: string,
  hasProvincialNomination: boolean = false
): TimelineEstimate {
  // Base processing times (in months)
  const EXPRESS_ENTRY_PROCESSING = 6;
  const PNP_PROCESSING = 8;

  // Estimate wait time for ITA based on CRS score
  let itaWaitMonths: number;
  let confidence: "high" | "medium" | "low";

  if (hasProvincialNomination) {
    itaWaitMonths = 1; // PNP candidates usually get ITA quickly
    confidence = "high";
  } else if (crsScore >= 520) {
    itaWaitMonths = 1;
    confidence = "high";
  } else if (crsScore >= 480) {
    itaWaitMonths = 3;
    confidence = "medium";
  } else if (crsScore >= 450) {
    itaWaitMonths = 6;
    confidence = "medium";
  } else if (crsScore >= 420) {
    itaWaitMonths = 12;
    confidence = "low";
  } else {
    itaWaitMonths = 24;
    confidence = "low";
  }

  const factors: string[] = [];
  if (crsScore < 450) {
    factors.push("Score below recent cutoffs - consider score improvement");
  }
  if (hasProvincialNomination) {
    factors.push("Provincial nomination provides significant advantage");
  }

  const milestones = [
    {
      titleEn: "Receive ITA",
      titleAr: "استلام الدعوة للتقديم",
      monthsFromNow: itaWaitMonths,
    },
    {
      titleEn: "Submit application",
      titleAr: "تقديم الطلب",
      monthsFromNow: itaWaitMonths + 1,
    },
    {
      titleEn: "Application processing",
      titleAr: "معالجة الطلب",
      monthsFromNow: itaWaitMonths + EXPRESS_ENTRY_PROCESSING,
    },
    {
      titleEn: "Receive COPR",
      titleAr: "استلام تأكيد الإقامة الدائمة",
      monthsFromNow: itaWaitMonths + EXPRESS_ENTRY_PROCESSING + 1,
    },
  ];

  return {
    estimatedMonths: itaWaitMonths + EXPRESS_ENTRY_PROCESSING + 1,
    confidence,
    factors,
    milestones,
  };
}
