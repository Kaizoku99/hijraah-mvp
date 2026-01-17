// Types for Application Tracker components

export type ApplicationStatus = 
  | "not_started"
  | "researching"
  | "preparing_documents"
  | "language_testing"
  | "submitting"
  | "waiting_decision"
  | "approved"
  | "rejected"
  | "on_hold";

export type MilestoneStatus = 
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked";

export type DeadlineType = 
  | "document_expiry"
  | "application_window"
  | "test_validity"
  | "medical_exam"
  | "biometrics"
  | "interview"
  | "submission"
  | "custom";

export type NotificationType = 
  | "deadline_reminder"
  | "draw_result"
  | "policy_change"
  | "document_expiry"
  | "milestone_completed"
  | "application_update"
  | "tip";

export interface Application {
  id: number;
  userId: number;
  targetDestination: string;
  immigrationPathway: string;
  status: ApplicationStatus;
  applicationNumber?: string | null;
  submissionDate?: Date | null;
  expectedDecisionDate?: Date | null;
  decisionDate?: Date | null;
  notes?: string | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: number;
  applicationId: number;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  status: MilestoneStatus;
  order: number;
  dueDate?: Date | null;
  completedAt?: Date | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deadline {
  id: number;
  userId: number;
  applicationId?: number | null;
  documentId?: number | null;
  type: DeadlineType;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  dueDate: Date;
  reminderDays?: number[] | null;
  isCompleted: boolean;
  completedAt?: Date | null;
  isRecurring: boolean;
  recurringIntervalMonths?: number | null;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  titleAr?: string | null;
  message: string;
  messageAr?: string | null;
  link?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  metadata?: unknown;
  createdAt: Date;
}

export interface ExpressEntryDraw {
  id: number;
  drawNumber: number;
  drawDate: Date;
  drawType: string;
  invitationsIssued: number;
  crsMinimum: number;
  tieBreakingRule?: Date | null;
  notes?: string | null;
  metadata?: unknown;
  createdAt: Date;
}

export interface DashboardSummary {
  application: Application | null;
  milestones: Milestone[];
  upcomingDeadlines: Deadline[];
  overdueDeadlines: Deadline[];
  unreadNotificationCount: number;
  latestDraws: ExpressEntryDraw[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

// Status display configurations
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, {
  labelEn: string;
  labelAr: string;
  color: string;
  bgColor: string;
}> = {
  not_started: {
    labelEn: "Not Started",
    labelAr: "لم يبدأ",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  researching: {
    labelEn: "Researching",
    labelAr: "قيد البحث",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  preparing_documents: {
    labelEn: "Preparing Documents",
    labelAr: "تحضير المستندات",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  language_testing: {
    labelEn: "Language Testing",
    labelAr: "اختبار اللغة",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  submitting: {
    labelEn: "Submitting",
    labelAr: "قيد التقديم",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  waiting_decision: {
    labelEn: "Waiting for Decision",
    labelAr: "في انتظار القرار",
    color: "text-cyan-500",
    bgColor: "bg-cyan-100",
  },
  approved: {
    labelEn: "Approved",
    labelAr: "تمت الموافقة",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  rejected: {
    labelEn: "Rejected",
    labelAr: "مرفوض",
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
  on_hold: {
    labelEn: "On Hold",
    labelAr: "معلق",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
};

export const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, {
  labelEn: string;
  labelAr: string;
  color: string;
  icon: string;
}> = {
  pending: {
    labelEn: "Pending",
    labelAr: "معلق",
    color: "text-gray-400",
    icon: "circle",
  },
  in_progress: {
    labelEn: "In Progress",
    labelAr: "قيد التنفيذ",
    color: "text-blue-500",
    icon: "loader",
  },
  completed: {
    labelEn: "Completed",
    labelAr: "مكتمل",
    color: "text-green-500",
    icon: "check-circle",
  },
  skipped: {
    labelEn: "Skipped",
    labelAr: "تم تخطيه",
    color: "text-gray-400",
    icon: "skip-forward",
  },
  blocked: {
    labelEn: "Blocked",
    labelAr: "محظور",
    color: "text-red-500",
    icon: "x-circle",
  },
};

export const DEADLINE_TYPE_CONFIG: Record<DeadlineType, {
  labelEn: string;
  labelAr: string;
  icon: string;
  color: string;
}> = {
  document_expiry: {
    labelEn: "Document Expiry",
    labelAr: "انتهاء صلاحية المستند",
    icon: "file-x",
    color: "text-red-500",
  },
  application_window: {
    labelEn: "Application Window",
    labelAr: "نافذة التقديم",
    icon: "calendar",
    color: "text-blue-500",
  },
  test_validity: {
    labelEn: "Test Validity",
    labelAr: "صلاحية الاختبار",
    icon: "clipboard-check",
    color: "text-purple-500",
  },
  medical_exam: {
    labelEn: "Medical Exam",
    labelAr: "الفحص الطبي",
    icon: "heart-pulse",
    color: "text-pink-500",
  },
  biometrics: {
    labelEn: "Biometrics",
    labelAr: "البيانات البيومترية",
    icon: "fingerprint",
    color: "text-cyan-500",
  },
  interview: {
    labelEn: "Interview",
    labelAr: "المقابلة",
    icon: "video",
    color: "text-green-500",
  },
  submission: {
    labelEn: "Submission",
    labelAr: "التقديم",
    icon: "send",
    color: "text-orange-500",
  },
  custom: {
    labelEn: "Custom",
    labelAr: "مخصص",
    icon: "flag",
    color: "text-gray-500",
  },
};
