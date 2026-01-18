/**
 * Hijraah Agent System - Main Export
 *
 * Exports all agents, tools, and utilities for the multi-agent immigration assistant.
 */

// Types
export * from "./types";

// Orchestrator
export {
  routeToSpecialist,
  detectIntentFromKeywords,
  classifyIntentWithLLM,
  generateOrchestratorResponse,
  INTENT_TO_AGENT,
} from "./orchestrator";

// Specialists
export { runAssessmentSpecialist } from "./assessment-specialist";
export { runPreparationSpecialist } from "./preparation-specialist";
export { runSubmissionSpecialist } from "./submission-specialist";

// Tools
export {
  eligibilityTools,
  type EligibilityToolName,
} from "./tools/eligibility-tools";
export { documentTools, type DocumentToolName } from "./tools/document-tools";
export { submissionTools } from "./tools/submission-tools";
