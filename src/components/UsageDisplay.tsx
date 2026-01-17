// Re-export from modular structure for backwards compatibility
export {
  UsageDisplay,
  default,
  UsageItem,
  TierBadge,
  SmartInsightCard,
  getCalculatorLabel,
  getUsageCategories,
  DEFAULT_USAGE_CATEGORIES,
  TIER_CONFIG,
  getUsageMetrics,
  getDaysRemaining,
  getUsageVelocity,
  willRunOut,
  getRecommendedUpgrade,
} from "./usage-display";

export type {
  UsageCategory,
  UsageStatus,
  SubscriptionTier,
  DestinationType,
  CategoryUsage,
  UsageData,
  SubscriptionStatus,
  UsageItemConfig,
  SmartInsight,
  TierConfigItem,
} from "./usage-display";
