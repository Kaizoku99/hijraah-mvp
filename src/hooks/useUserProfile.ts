'use client'

import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/actions/profile'
import { queryKeys } from '@/lib/query-keys'

export type TargetDestination = 'canada' | 'australia' | 'portugal' | 'other'

export interface UserProfileData {
  id: number
  userId: number
  nationality?: string | null
  sourceCountry?: string | null
  currentCountry?: string | null
  educationLevel?: string | null
  fieldOfStudy?: string | null
  yearsOfExperience?: number | null
  currentOccupation?: string | null
  targetDestination?: string | null
  immigrationPathway?: string | null
  // Add other fields as needed
}

/**
 * Hook to fetch and provide user profile data.
 * Returns the user's target destination and profile info for context-aware UI.
 */
export function useUserProfile() {
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Normalize target destination to lowercase for comparison
  const rawDestination = profile?.targetDestination?.toLowerCase() || 'canada'

  // Map to known destinations
  const targetDestination: TargetDestination =
    rawDestination === 'australia' ? 'australia' :
      rawDestination === 'portugal' ? 'portugal' :
        rawDestination === 'canada' ? 'canada' : 'other'

  return {
    profile,
    targetDestination,
    immigrationPathway: profile?.immigrationPathway || null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Destination-specific configuration for UI elements
 */
export const destinationConfig = {
  canada: {
    nameEn: 'Canada',
    nameAr: 'كندا',
    flag: '🇨🇦',
    categories: [
      { id: 'express_entry', labelEn: 'Express Entry', labelAr: 'الدخول السريع' },
      { id: 'crs', labelEn: 'CRS Score', labelAr: 'نقاط CRS' },
      { id: 'study_permit', labelEn: 'Study Permit', labelAr: 'تصريح الدراسة' },
      { id: 'pnp', labelEn: 'Provincial Nominee', labelAr: 'الترشيح الإقليمي' },
      { id: 'documents', labelEn: 'Documents', labelAr: 'المستندات' },
    ],
    suggestionsEn: [
      { text: 'How can I calculate my CRS score?', icon: 'calculator' },
      { text: 'What documents do I need for Express Entry?', icon: 'file' },
      { text: 'How can I improve my Express Entry score?', icon: 'sparkles' },
      { text: 'What are the Provincial Nominee Programs?', icon: 'globe' },
    ],
    suggestionsAr: [
      { text: 'كيف يمكنني حساب نقاط CRS الخاصة بي؟', icon: 'calculator' },
      { text: 'ما هي المستندات المطلوبة للتقديم على Express Entry؟', icon: 'file' },
      { text: 'كيف يمكنني تحسين نقاطي في Express Entry؟', icon: 'sparkles' },
      { text: 'ما هي برامج الترشيح الإقليمي؟', icon: 'globe' },
    ],
  },
  australia: {
    nameEn: 'Australia',
    nameAr: 'أستراليا',
    flag: '🇦🇺',
    categories: [
      { id: 'skillselect', labelEn: 'SkillSelect', labelAr: 'سكيل سيليكت' },
      { id: 'points', labelEn: 'Points Test', labelAr: 'اختبار النقاط' },
      { id: 'skilled_visa', labelEn: 'Skilled Visa', labelAr: 'تأشيرة المهارات' },
      { id: 'state_sponsored', labelEn: 'State Sponsored', labelAr: 'رعاية الولاية' },
      { id: 'documents', labelEn: 'Documents', labelAr: 'المستندات' },
    ],
    suggestionsEn: [
      { text: 'How does the Australian points system work?', icon: 'calculator' },
      { text: 'What is the SkillSelect process?', icon: 'file' },
      { text: 'What are state-sponsored visa options?', icon: 'globe' },
      { text: 'How can I improve my Australia points score?', icon: 'sparkles' },
    ],
    suggestionsAr: [
      { text: 'كيف يعمل نظام النقاط الأسترالي؟', icon: 'calculator' },
      { text: 'ما هي عملية سكيل سيليكت؟', icon: 'file' },
      { text: 'ما هي خيارات تأشيرة رعاية الولاية؟', icon: 'globe' },
      { text: 'كيف يمكنني تحسين نقاطي لأستراليا؟', icon: 'sparkles' },
    ],
  },
  portugal: {
    nameEn: 'Portugal',
    nameAr: 'البرتغال',
    flag: '🇵🇹',
    categories: [
      { id: 'd7', labelEn: 'D7 Passive Income', labelAr: 'D7 الدخل السلبي' },
      { id: 'd2', labelEn: 'D2 Entrepreneur', labelAr: 'D2 رواد الأعمال' },
      { id: 'd8', labelEn: 'D8 Digital Nomad', labelAr: 'D8 الرحالة الرقمي' },
      { id: 'job_seeker', labelEn: 'Job Seeker', labelAr: 'باحث عن عمل' },
      { id: 'documents', labelEn: 'Documents', labelAr: 'المستندات' },
    ],
    suggestionsEn: [
      { text: 'What is the D7 passive income visa?', icon: 'calculator' },
      { text: 'How to apply for the D2 entrepreneur visa?', icon: 'file' },
      { text: 'What are the D8 digital nomad requirements?', icon: 'globe' },
      { text: 'Which Portugal visa is right for me?', icon: 'sparkles' },
    ],
    suggestionsAr: [
      { text: 'ما هي تأشيرة D7 للدخل السلبي؟', icon: 'calculator' },
      { text: 'كيف أتقدم لتأشيرة D2 لرواد الأعمال؟', icon: 'file' },
      { text: 'ما هي متطلبات تأشيرة D8 للرحالة الرقمي؟', icon: 'globe' },
      { text: 'أي تأشيرة برتغالية مناسبة لي؟', icon: 'sparkles' },
    ],
  },
  other: {
    nameEn: 'Immigration',
    nameAr: 'الهجرة',
    flag: '🌍',
    categories: [
      { id: 'immigration', labelEn: 'Immigration', labelAr: 'الهجرة' },
      { id: 'documents', labelEn: 'Documents', labelAr: 'المستندات' },
      { id: 'visa', labelEn: 'Visa Options', labelAr: 'خيارات التأشيرة' },
      { id: 'general', labelEn: 'General', labelAr: 'عام' },
    ],
    suggestionsEn: [
      { text: 'What immigration options are available to me?', icon: 'globe' },
      { text: 'How do I choose the right country?', icon: 'calculator' },
      { text: 'What documents do I need?', icon: 'file' },
      { text: 'How can I improve my immigration chances?', icon: 'sparkles' },
    ],
    suggestionsAr: [
      { text: 'ما هي خيارات الهجرة المتاحة لي؟', icon: 'globe' },
      { text: 'كيف أختار البلد المناسب؟', icon: 'calculator' },
      { text: 'ما المستندات التي أحتاجها؟', icon: 'file' },
      { text: 'كيف يمكنني تحسين فرصي في الهجرة؟', icon: 'sparkles' },
    ],
  },
} as const

export type DestinationConfig = typeof destinationConfig
