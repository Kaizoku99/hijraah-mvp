// Types & Interfaces for Immigration Journey components

export type TargetDestination =
  | "canada"
  | "australia"
  | "portugal"
  | "other"
  | null;

export type ImmigrationPathway =
  // Canada
  | "express_entry"
  | "study_permit"
  | "family_sponsorship"
  // Australia
  | "skilled_independent"
  | "state_nominated"
  | "study_visa"
  // Portugal
  | "d2_independent_entrepreneur"
  | "d7_passive_income"
  | "d8_digital_nomad"
  | "d1_subordinate_work"
  | "job_seeker_pt"
  // Generic
  | "other"
  | null;

export interface CrsScoreData {
  totalScore: number;
  calculatedAt?: string;
}

export interface ImmigrationJourneyProps {
  // Core progress data
  profileCompletion: number;
  hasCrsScore: boolean;
  crsScore?: number | null;
  documentsUploaded: number;
  totalDocuments: number;

  // User context
  targetDestination?: TargetDestination;
  immigrationPathway?: ImmigrationPathway;

  // Profile details for smart tips
  educationLevel?: string | null;
  yearsOfExperience?: number | null;
  englishLevel?: string | null;
  frenchLevel?: string | null;
  hasJobOffer?: boolean;
  hasProvincialNomination?: boolean;

  // Optional callbacks
  onStepClick?: (stepId: string) => void;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  link: string;
  linkText: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  tip?: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface SmartTip {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  type: "info" | "success" | "warning" | "action";
  link?: string;
  linkText?: string;
}

export type CrsStatus = 
  | "excellent"
  | "good"
  | "competitive"
  | "needs_improvement"
  | "unknown";

export interface CrsStatusResult {
  status: CrsStatus;
  messageEn: string;
  messageAr: string;
  color: string;
}

export interface DestinationConfig {
  flag: string;
  nameEn: string;
  nameAr: string;
  color: string;
  bgColor: string;
}
