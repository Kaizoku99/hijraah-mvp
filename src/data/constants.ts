import { Globe, MapPin, Rocket, Target } from "lucide-react";

// MENA Countries (Middle East and North Africa) - comprehensive list
export const COUNTRIES = [
    // North Africa
    { value: "algeria", labelAr: "الجزائر", labelEn: "Algeria" },
    { value: "egypt", labelAr: "مصر", labelEn: "Egypt" },
    { value: "libya", labelAr: "ليبيا", labelEn: "Libya" },
    { value: "mauritania", labelAr: "موريتانيا", labelEn: "Mauritania" },
    { value: "morocco", labelAr: "المغرب", labelEn: "Morocco" },
    { value: "sudan", labelAr: "السودان", labelEn: "Sudan" },
    { value: "tunisia", labelAr: "تونس", labelEn: "Tunisia" },
    // Levant
    { value: "jordan", labelAr: "الأردن", labelEn: "Jordan" },
    { value: "lebanon", labelAr: "لبنان", labelEn: "Lebanon" },
    { value: "palestine", labelAr: "فلسطين", labelEn: "Palestine" },
    { value: "syria", labelAr: "سوريا", labelEn: "Syria" },
    // Gulf States
    { value: "bahrain", labelAr: "البحرين", labelEn: "Bahrain" },
    { value: "iraq", labelAr: "العراق", labelEn: "Iraq" },
    { value: "kuwait", labelAr: "الكويت", labelEn: "Kuwait" },
    { value: "oman", labelAr: "عُمان", labelEn: "Oman" },
    { value: "qatar", labelAr: "قطر", labelEn: "Qatar" },
    { value: "saudi_arabia", labelAr: "السعودية", labelEn: "Saudi Arabia" },
    { value: "uae", labelAr: "الإمارات", labelEn: "United Arab Emirates" },
    { value: "yemen", labelAr: "اليمن", labelEn: "Yemen" },
    // Other Arab Countries
    { value: "comoros", labelAr: "جزر القمر", labelEn: "Comoros" },
    { value: "djibouti", labelAr: "جيبوتي", labelEn: "Djibouti" },
    { value: "somalia", labelAr: "الصومال", labelEn: "Somalia" },
    { value: "iran", labelAr: "إيران", labelEn: "Iran" },
    // Common Destination Countries (for current residence)
    { value: "australia", labelAr: "أستراليا", labelEn: "Australia" },
    { value: "canada", labelAr: "كندا", labelEn: "Canada" },
    { value: "usa", labelAr: "الولايات المتحدة", labelEn: "United States" },
    { value: "uk", labelAr: "المملكة المتحدة", labelEn: "United Kingdom" },
    { value: "france", labelAr: "فرنسا", labelEn: "France" },
    { value: "germany", labelAr: "ألمانيا", labelEn: "Germany" },
    { value: "turkey", labelAr: "تركيا", labelEn: "Turkey" },
    { value: "malaysia", labelAr: "ماليزيا", labelEn: "Malaysia" },
    { value: "other", labelAr: "أخرى", labelEn: "Other" },
];

export const DESTINATIONS = [
    { value: "canada", labelAr: "كندا", labelEn: "Canada", icon: Globe, description: { ar: "نظام Express Entry", en: "Express Entry System" } },
    { value: "australia", labelAr: "أستراليا", labelEn: "Australia", icon: Globe, description: { ar: "نظام SkillSelect", en: "SkillSelect System" } },
    { value: "portugal", labelAr: "البرتغال", labelEn: "Portugal", icon: Globe, description: { ar: "تأشيرات D2, D7, D8", en: "D2, D7, D8 Visas" } },
];

export const PATHWAYS = [
    { value: "express_entry", labelAr: "Express Entry", labelEn: "Express Entry", icon: Rocket, description: { ar: "للعمال المهرة", en: "For skilled workers" } },
    { value: "study_permit", labelAr: "تصريح دراسة", labelEn: "Study Permit", icon: Target, description: { ar: "للطلاب", en: "For students" } },
    { value: "family_sponsorship", labelAr: "كفالة عائلية", labelEn: "Family Sponsorship", icon: Globe, description: { ar: "لم الشمل العائلي", en: "Family reunification" } },
    { value: "other", labelAr: "أخرى", labelEn: "Other", icon: MapPin, description: { ar: "مسارات أخرى", en: "Other pathways" } },
];

export const AUSTRALIA_PATHWAYS = [
    { value: "skilled_independent", labelAr: "هجرة الكفاءات (189)", labelEn: "Skilled Independent (189)", icon: Rocket, description: { ar: "نقاط مستقلة", en: "Points-based independent" } },
    { value: "state_nominated", labelAr: "ترشيح الولاية (190)", labelEn: "State Nominated (190)", icon: MapPin, description: { ar: "برعاية ولاية", en: "State sponsored" } },
    { value: "study_visa", labelAr: "تأشيرة طالب (500)", labelEn: "Student Visa (500)", icon: Target, description: { ar: "للدراسة", en: "For studying" } },
    { value: "other", labelAr: "أخرى", labelEn: "Other", icon: Globe, description: { ar: "مسارات أخرى", en: "Other pathways" } },
];

export const PORTUGAL_PATHWAYS = [
    { value: "d2_independent_entrepreneur", labelAr: "D2 - رائد أعمال", labelEn: "D2 - Entrepreneur", icon: Rocket, description: { ar: "للعاملين المستقلين ورواد الأعمال", en: "For freelancers and entrepreneurs" } },
    { value: "d7_passive_income", labelAr: "D7 - دخل سلبي", labelEn: "D7 - Passive Income", icon: Target, description: { ar: "للمتقاعدين وأصحاب الدخل السلبي", en: "For retirees and passive income earners" } },
    { value: "d8_digital_nomad", labelAr: "D8 - رحالة رقمي", labelEn: "D8 - Digital Nomad", icon: MapPin, description: { ar: "للعاملين عن بُعد", en: "For remote workers" } },
    { value: "d1_subordinate_work", labelAr: "D1 - عمل تابع", labelEn: "D1 - Subordinate Work", icon: Globe, description: { ar: "لمن لديهم عرض عمل", en: "For those with a job offer" } },
    { value: "job_seeker_pt", labelAr: "تأشيرة البحث عن عمل", labelEn: "Job Seeker Visa", icon: Globe, description: { ar: "للبحث عن عمل", en: "To search for employment" } },
];

export const ENGLISH_LEVELS = [
    { value: "basic", labelAr: "مبتدئ", labelEn: "Beginner" },
    { value: "intermediate", labelAr: "متوسط", labelEn: "Intermediate" },
    { value: "advanced", labelAr: "متقدم", labelEn: "Advanced" },
    { value: "native", labelAr: "طلاقة", labelEn: "Fluent/Native" },
];
