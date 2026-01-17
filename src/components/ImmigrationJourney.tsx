// Re-export from modular structure for backwards compatibility
export {
  ImmigrationJourney,
  default,
  StepItem,
  SmartTipCard,
  PATHWAY_LABELS,
  DESTINATION_CONFIG,
  calculateOverallProgress,
  getCrsStatus,
} from "./immigration-journey";

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
} from "./immigration-journey";
