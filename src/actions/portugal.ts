'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './auth'
import {
  createPortugalAssessment,
  getUserPortugalAssessments,
  getLatestPortugalAssessment as getLatestAssessment,
  getPortugalAssessmentByVisaType as getAssessmentByVisaType,
} from '@/../server/db'
import { EligibilityResult } from '@/lib/portugal-visa-matcher'
import { PortugalVisaType } from '@/lib/portugal-constants'

// Input types for each visa checker
export interface D2AssessmentInput {
  employmentType: string
  hasInvestment: boolean
  investmentAmount?: number
  hasBusinessPlan: boolean
  hasServiceContract: boolean
  hasProfessionalQualification: boolean
  hasFinancialMeansInPortugal: boolean
  hasAccommodation: boolean
  hasCriminalRecord: boolean
  hasHealthInsurance: boolean
}

export interface D7AssessmentInput {
  incomeSource: string
  monthlyIncome: number
  adultDependents: number
  childDependents: number
  hasIncomeDocumentation: boolean
  hasAccommodation: boolean
  hasCriminalRecord: boolean
  hasHealthInsurance: boolean
}

export interface D8AssessmentInput {
  employmentStatus: string
  employerCountry: string
  averageMonthlyIncome: number
  hasRemoteWorkContract: boolean
  hasFiscalResidence: boolean
  canWorkRemotely: boolean
  hasAccommodation: boolean
  hasCriminalRecord: boolean
  hasHealthInsurance: boolean
  hasBankStatements: boolean
}

type AssessmentInput = D2AssessmentInput | D7AssessmentInput | D8AssessmentInput

interface SavePortugalAssessmentParams {
  visaType: PortugalVisaType
  input: AssessmentInput
  result: EligibilityResult
}

export async function savePortugalAssessment({
  visaType,
  input,
  result,
}: SavePortugalAssessmentParams) {
  const user = await getAuthenticatedUser()

  // Extract common and visa-specific fields from input
  const baseData = {
    userId: user.id,
    visaType,
    eligibilityStatus: result.status,
    breakdown: result.breakdown,
    recommendations: result.recommendations,
    missingRequirements: result.missingRequirements,
    hasAccommodation: 'hasAccommodation' in input ? input.hasAccommodation : false,
    hasCriminalRecord: 'hasCriminalRecord' in input ? input.hasCriminalRecord : false,
    hasHealthInsurance: 'hasHealthInsurance' in input ? input.hasHealthInsurance : false,
  }

  // Extract visa-specific fields
  let specificData = {}

  if (visaType === 'd2') {
    const d2Input = input as D2AssessmentInput
    specificData = {
      employmentType: d2Input.employmentType,
      hasBusinessPlan: d2Input.hasBusinessPlan,
      hasInvestmentProof: d2Input.hasInvestment,
      investmentAmount: d2Input.investmentAmount?.toString(),
    }
  } else if (visaType === 'd7') {
    const d7Input = input as D7AssessmentInput
    specificData = {
      incomeSource: d7Input.incomeSource,
      monthlyIncome: d7Input.monthlyIncome.toString(),
      dependentsCount: d7Input.adultDependents + d7Input.childDependents,
    }
  } else if (visaType === 'd8') {
    const d8Input = input as D8AssessmentInput
    specificData = {
      incomeSource: 'remote_work',
      monthlyIncome: d8Input.averageMonthlyIncome.toString(),
      hasRemoteContract: d8Input.hasRemoteWorkContract,
      employerCountry: d8Input.employerCountry,
    }
  }

  const insertData = {
    ...baseData,
    ...specificData,
  }

  const assessmentId = await createPortugalAssessment(insertData)

  revalidatePath('/calculator')
  revalidatePath('/dashboard')

  return { success: true, assessmentId }
}

export async function getPortugalAssessments() {
  const user = await getAuthenticatedUser()
  return getUserPortugalAssessments(user.id)
}

export async function getLatestPortugalAssessment() {
  const user = await getAuthenticatedUser()
  return getLatestAssessment(user.id)
}

export async function getPortugalAssessmentByVisaType(visaType: PortugalVisaType) {
  const user = await getAuthenticatedUser()
  return getAssessmentByVisaType(user.id, visaType)
}
