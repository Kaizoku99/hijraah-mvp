// Barrel exports for Immigration Journey components
export { ImmigrationJourney, default } from "./ImmigrationJourney";
export { StepItem } from "./StepItem";
export { SmartTipCard } from "./SmartTipCard";

// Export types
export type {
  TargetDestination,
  ImmigrationPathway,
  CrsScoreData,
  ImmigrationJourneyProps,
  JourneyStep,
  SmartTip,
  CrsStatus,
  CrsStatusResult,
  DestinationConfig,
} from "./types";

// Export config
export { PATHWAY_LABELS, DESTINATION_CONFIG } from "./config";

// Export utils
export { calculateOverallProgress, getCrsStatus } from "./utils";
