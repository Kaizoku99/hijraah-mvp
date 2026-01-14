'use client'

import React, { createContext, useContext, useState, useEffect } from "react"

export type Language = "ar" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.chat": "AI Assistant",
    "nav.calculator": "CRS Calculator",
    "nav.documents": "Documents",
    "nav.sop": "SOP Writer",
    "nav.guides": "Guides",
    "nav.support": "Support",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    "nav.login": "Login",

    // Home page
    "home.hero.title": "Your AI-Powered Immigration Partner",
    "home.hero.subtitle": "Get expert guidance for immigrating to Canada with our AI assistant, designed specifically for Arabic-speaking communities.",
    "home.hero.cta": "Get Started for Free",
    "home.hero.secondary": "Learn More",

    // Features
    "features.chat.title": "AI Immigration Assistant",
    "features.chat.description": "Chat with our AI assistant in Arabic or English for personalized immigration guidance.",
    "features.calculator.title": "CRS Score Calculator",
    "features.calculator.description": "Calculate your Express Entry score and get improvement recommendations.",
    "features.documents.title": "Document Checklist",
    "features.documents.description": "Get a personalized checklist based on your country and immigration pathway.",
    "features.sop.title": "SOP Writer",
    "features.sop.description": "Generate professional Statement of Purpose with AI assistance.",

    // Pricing
    "pricing.title": "Choose Your Plan",
    "pricing.free": "Free",
    "pricing.essential": "Essential",
    "pricing.premium": "Premium",
    "pricing.vip": "VIP",
    "pricing.perMonth": "/month",
    "pricing.oneTime": "one-time",
    "pricing.selectPlan": "Select Plan",
    "pricing.currentPlan": "Current Plan",

    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.continue": "Continue",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.close": "Close",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.download": "Download",
    "common.upload": "Upload",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.view": "View",
    "common.language": "Language",
    "common.send": "Send",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.progress": "Your Progress",
    "dashboard.nextSteps": "Next Steps",
    "dashboard.documents": "Documents",
    "dashboard.crsScore": "CRS Score",
    "dashboard.timeline": "Timeline",

    // Chat
    "chat.title": "AI Immigration Assistant",
    "chat.placeholder": "Ask me anything about immigrating to Canada...",
    "chat.newChat": "New Chat",
    "chat.history": "Chat History",

    // Calculator
    "calculator.title": "CRS Score Calculator",
    "calculator.subtitle": "Calculate your Comprehensive Ranking System score for Express Entry",
    "calculator.yourScore": "Your Score",
    "calculator.calculate": "Calculate Score",
    "calculator.recommendations": "Recommendations",

    // Documents
    "documents.title": "Document Checklist",
    "documents.upload": "Upload Document",
    "documents.status.uploaded": "Uploaded",
    "documents.status.processing": "Processing",
    "documents.status.completed": "Completed",
    "documents.status.failed": "Failed",

    // SOP
    "sop.title": "Statement of Purpose Writer",
    "sop.generate": "Generate SOP",
    "sop.revise": "Revise",
    "sop.export": "Export PDF",

    // Profile
    "profile.title": "Profile",
    "profile.personalInfo": "Personal Information",
    "profile.education": "Education",
    "profile.workExperience": "Work Experience",
    "profile.languageSkills": "Language Skills",
    "profile.subscription": "Subscription",

    // Auth
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.signOut": "Sign Out",
    "auth.welcome": "Welcome to Hijraah",
  },
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.dashboard": "لوحة التحكم",
    "nav.chat": "المساعد الذكي",
    "nav.calculator": "حاسبة النقاط",
    "nav.documents": "المستندات",
    "nav.sop": "كتابة خطاب النوايا",
    "nav.guides": "الأدلة",
    "nav.support": "الدعم",
    "nav.profile": "الملف الشخصي",
    "nav.logout": "تسجيل الخروج",
    "nav.login": "تسجيل الدخول",

    // Home page
    "home.hero.title": "شريكك في الهجرة بتقنية الذكاء الاصطناعي",
    "home.hero.subtitle": "احصل على إرشادات الخبراء للهجرة إلى كندا مع مساعدنا الذكي، المصمم خصيصًا للمجتمعات الناطقة بالعربية.",
    "home.hero.cta": "ابدأ مجانًا",
    "home.hero.secondary": "اعرف المزيد",

    // Features
    "features.chat.title": "المساعد الذكي للهجرة",
    "features.chat.description": "تحدث مع مساعدنا الذكي بالعربية أو الإنجليزية للحصول على إرشادات مخصصة للهجرة.",
    "features.calculator.title": "حاسبة نقاط CRS",
    "features.calculator.description": "احسب نقاطك في نظام الدخول السريع واحصل على توصيات للتحسين.",
    "features.documents.title": "قائمة المستندات",
    "features.documents.description": "احصل على قائمة مخصصة بناءً على بلدك ومسار الهجرة الخاص بك.",
    "features.sop.title": "كاتب خطاب النوايا",
    "features.sop.description": "أنشئ خطاب نوايا احترافي بمساعدة الذكاء الاصطناعي.",

    // Pricing
    "pricing.title": "اختر خطتك",
    "pricing.free": "مجاني",
    "pricing.essential": "أساسي",
    "pricing.premium": "مميز",
    "pricing.vip": "في آي بي",
    "pricing.perMonth": "/شهر",
    "pricing.oneTime": "دفعة واحدة",
    "pricing.selectPlan": "اختر الخطة",
    "pricing.currentPlan": "الخطة الحالية",

    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.continue": "متابعة",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.submit": "إرسال",
    "common.close": "إغلاق",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.download": "تحميل",
    "common.upload": "رفع",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.sort": "ترتيب",
    "common.view": "عرض",
    "common.language": "اللغة",
    "common.send": "إرسال",

    // Dashboard
    "dashboard.welcome": "مرحبًا بعودتك",
    "dashboard.progress": "تقدمك",
    "dashboard.nextSteps": "الخطوات التالية",
    "dashboard.documents": "المستندات",
    "dashboard.crsScore": "نقاط CRS",
    "dashboard.timeline": "الجدول الزمني",

    // Chat
    "chat.title": "المساعد الذكي للهجرة",
    "chat.placeholder": "اسألني أي شيء عن الهجرة إلى كندا...",
    "chat.newChat": "محادثة جديدة",
    "chat.history": "سجل المحادثات",

    // Calculator
    "calculator.title": "حاسبة نقاط CRS",
    "calculator.subtitle": "احسب نقاطك في نظام التصنيف الشامل للدخول السريع",
    "calculator.yourScore": "نقاطك",
    "calculator.calculate": "احسب النقاط",
    "calculator.recommendations": "التوصيات",

    // Documents
    "documents.title": "قائمة المستندات",
    "documents.upload": "رفع مستند",
    "documents.status.uploaded": "تم الرفع",
    "documents.status.processing": "قيد المعالجة",
    "documents.status.completed": "مكتمل",
    "documents.status.failed": "فشل",

    // SOP
    "sop.title": "كاتب خطاب النوايا",
    "sop.generate": "إنشاء خطاب النوايا",
    "sop.revise": "مراجعة",
    "sop.export": "تصدير PDF",

    // Profile
    "profile.title": "الملف الشخصي",
    "profile.personalInfo": "المعلومات الشخصية",
    "profile.education": "التعليم",
    "profile.workExperience": "الخبرة العملية",
    "profile.languageSkills": "المهارات اللغوية",
    "profile.subscription": "الاشتراك",

    // Auth
    "auth.signIn": "تسجيل الدخول",
    "auth.signUp": "إنشاء حساب",
    "auth.signOut": "تسجيل الخروج",
    "auth.welcome": "مرحبًا بك في هجرة",
  },
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("ar")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage on client side
    const stored = localStorage.getItem("hijraah-language")
    if (stored === "ar" || stored === "en") {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("hijraah-language", lang)
    // Update HTML dir and lang attributes
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const dir = language === "ar" ? "rtl" : "ltr"

  // Set initial direction on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = dir
      document.documentElement.lang = language
    }
  }, [dir, language, mounted])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
