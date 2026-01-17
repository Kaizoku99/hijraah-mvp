// Configuration constants for Immigration Journey

import type { DestinationConfig } from "./types";

export const PATHWAY_LABELS: Record<string, { en: string; ar: string }> = {
  // Canada
  express_entry: { en: "Express Entry", ar: "الدخول السريع" },
  study_permit: { en: "Study Permit", ar: "تصريح الدراسة" },
  family_sponsorship: { en: "Family Sponsorship", ar: "كفالة عائلية" },
  // Australia
  skilled_independent: { en: "Skilled Independent", ar: "المهارات المستقلة" },
  state_nominated: { en: "State Nominated", ar: "ترشيح الولاية" },
  study_visa: { en: "Student Visa", ar: "تأشيرة طالب" },
  // Portugal
  d2_independent_entrepreneur: { en: "D2 Entrepreneur", ar: "D2 رائد أعمال" },
  d7_passive_income: { en: "D7 Passive Income", ar: "D7 دخل سلبي" },
  d8_digital_nomad: { en: "D8 Digital Nomad", ar: "D8 رحالة رقمي" },
  d1_subordinate_work: { en: "D1 Employment", ar: "D1 عمل تابع" },
  job_seeker_pt: { en: "Job Seeker", ar: "باحث عن عمل" },
  // Generic
  other: { en: "Other", ar: "أخرى" },
};

export const DESTINATION_CONFIG: Record<string, DestinationConfig> = {
  canada: {
    flag: "🇨🇦",
    nameEn: "Canada",
    nameAr: "كندا",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  australia: {
    flag: "🇦🇺",
    nameEn: "Australia",
    nameAr: "أستراليا",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  portugal: {
    flag: "🇵🇹",
    nameEn: "Portugal",
    nameAr: "البرتغال",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  other: {
    flag: "🌍",
    nameEn: "Destination",
    nameAr: "الوجهة",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
} as const;
