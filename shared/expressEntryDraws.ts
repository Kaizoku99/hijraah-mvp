/**
 * Recent Express Entry Draw Data
 * Source: IRCC official draw results
 * Updated: January 2026
 */

export interface ExpressEntryDraw {
  date: string;
  program: string;
  programAr: string;
  cutoff: number;
  invitations: number;
}

// Recent Express Entry draws (last 10 draws as of January 2026)
// In production, this would be fetched from an API or database
export const RECENT_DRAWS: ExpressEntryDraw[] = [
  {
    date: "2026-01-08",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 524,
    invitations: 5500,
  },
  {
    date: "2025-12-18",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 519,
    invitations: 6000,
  },
  {
    date: "2025-12-04",
    program: "French language proficiency",
    programAr: "إتقان اللغة الفرنسية",
    cutoff: 336,
    invitations: 2000,
  },
  {
    date: "2025-11-27",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 522,
    invitations: 5750,
  },
  {
    date: "2025-11-13",
    program: "STEM occupations",
    programAr: "مهن العلوم والتكنولوجيا",
    cutoff: 481,
    invitations: 4500,
  },
  {
    date: "2025-10-30",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 518,
    invitations: 5500,
  },
  {
    date: "2025-10-16",
    program: "Healthcare occupations",
    programAr: "المهن الصحية",
    cutoff: 422,
    invitations: 3000,
  },
  {
    date: "2025-10-02",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 515,
    invitations: 5250,
  },
  {
    date: "2025-09-18",
    program: "Provincial Nominee Program",
    programAr: "برنامج ترشيح المقاطعات",
    cutoff: 732,
    invitations: 1500,
  },
  {
    date: "2025-09-04",
    program: "All programs",
    programAr: "جميع البرامج",
    cutoff: 512,
    invitations: 5000,
  },
];

/**
 * Get the average cutoff for "All programs" draws
 */
export function getAverageAllProgramsCutoff(): number {
  const allProgramsDraws = RECENT_DRAWS.filter(
    (d) => d.program === "All programs"
  );
  const sum = allProgramsDraws.reduce((acc, d) => acc + d.cutoff, 0);
  return Math.round(sum / allProgramsDraws.length);
}

/**
 * Get the lowest cutoff for "All programs" draws
 */
export function getLowestAllProgramsCutoff(): number {
  const allProgramsDraws = RECENT_DRAWS.filter(
    (d) => d.program === "All programs"
  );
  return Math.min(...allProgramsDraws.map((d) => d.cutoff));
}

/**
 * Get the most recent "All programs" draw
 */
export function getMostRecentAllProgramsDraw(): ExpressEntryDraw | undefined {
  return RECENT_DRAWS.find((d) => d.program === "All programs");
}

/**
 * Analyze user's CRS score against recent draws
 */
export function analyzeScoreAgainstDraws(score: number) {
  const allProgramsDraws = RECENT_DRAWS.filter(
    (d) => d.program === "All programs"
  );
  const avgCutoff = getAverageAllProgramsCutoff();
  const lowestCutoff = getLowestAllProgramsCutoff();
  const mostRecent = getMostRecentAllProgramsDraw();

  const qualifiedDraws = RECENT_DRAWS.filter((d) => score >= d.cutoff);
  const qualifiedAllPrograms = allProgramsDraws.filter((d) => score >= d.cutoff);

  let status: "excellent" | "good" | "competitive" | "needs_improvement";
  let pointsNeeded = 0;

  if (score >= avgCutoff + 20) {
    status = "excellent";
  } else if (score >= avgCutoff) {
    status = "good";
  } else if (score >= lowestCutoff) {
    status = "competitive";
  } else {
    status = "needs_improvement";
    pointsNeeded = lowestCutoff - score;
  }

  return {
    status,
    avgCutoff,
    lowestCutoff,
    mostRecentDraw: mostRecent,
    qualifiedDrawsCount: qualifiedDraws.length,
    qualifiedAllProgramsCount: qualifiedAllPrograms.length,
    totalDraws: RECENT_DRAWS.length,
    totalAllProgramsDraws: allProgramsDraws.length,
    pointsNeeded,
    pointsAboveAvg: score - avgCutoff,
  };
}
