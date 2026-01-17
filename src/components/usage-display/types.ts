// Types & Interfaces for Usage Display components

export type UsageCategory = "chat" | "crs" | "sop" | "document";
export type UsageStatus = "ok" | "warning" | "critical" | "unlimited";
export type SubscriptionTier = "free" | "essential" | "premium" | "vip";
export type DestinationType =
  | "canada"
  | "australia"
  | "portugal"
  | "other"
  | null
  | undefined;

export interface CategoryUsage {
  used: number;
  limit: number | "unlimited" | string;
  remaining: number | "unlimited" | string;
}

export interface UsageData {
  chat: CategoryUsage;
  crs: CategoryUsage;
  sop: CategoryUsage;
  document: CategoryUsage;
  periodStart: Date;
  periodEnd: Date;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  expiresAt?: Date | null;
}

export interface UsageItemConfig {
  id: UsageCategory;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelAr: string;
  colorClass: string;
  bgClass: string;
  description?: { en: string; ar: string };
}

export interface SmartInsight {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  type: "info" | "warning" | "success" | "action";
  action?: { href: string; text: string };
}

export interface TierConfigItem {
  nameEn: string;
  nameAr: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}
