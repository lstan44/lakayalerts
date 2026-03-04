/**
 * @citadel/ontology
 *
 * The Citadel world model — TypeScript types derived from ONTOLOGY.md.
 *
 * 25 object types, 76 relationship types, 6 categories.
 * Every object carries provenance, time semantics, and access control.
 */

// Common primitives
export type {
  Temporal,
  TimePrecision,
  ValidityWindow,
  SourceMethod,
  Provenance,
  Confidence,
  Severity,
  Compartmented,
  GeoJSON,
  Language,
  Channel,
} from "./common.js";

// Entities
export type {
  Person,
  PersonIdentifier,
  PersonStatus,
  IdentifierType,
  Organization,
  OrgType,
  OrgStatus,
  Place,
  PlaceType,
  Asset,
  AssetType,
  AssetStatus,
  Infrastructure,
  InfraType,
  InfraStatus,
  Account,
  AccountRole,
  AccountStatus,
  AccountPreferences,
  VerificationLevel,
  TrustScoreComponents,
} from "./entities.js";

// Events
export type {
  Incident,
  IncidentCategory,
  IncidentStatus,
  Observation,
  ObservationType,
  Significance,
  Communication,
  CommType,
  CommMedium,
  Sentiment,
  Movement,
  MovementType,
  ServiceRequest,
  ServiceType,
  Urgency,
  ServiceStatus,
  Disruption,
  DisruptionType,
  DisruptionCause,
  DisruptionSeverity,
  DisasterImpact,
  DisasterType,
  ImpactType,
} from "./events.js";

// Assertions & Evidence
export type {
  Claim,
  ClaimType,
  ClaimStatus,
  EvidenceItem,
  EvidenceType,
  Source,
  SourceType,
  ReliabilityRating,
  VerificationAction,
  VerificationTargetType,
  VerificationActionType,
  ConfidenceScore,
  ConfidenceComponent,
} from "./assertions.js";

// Derived Intelligence
export type {
  Pattern,
  PatternType,
  PatternStatus,
  Situation,
  SituationCategory,
  SituationStatus,
  DerivedInsight,
  InsightType,
  TimeHorizon,
  ModelRun,
  ModelRunStatus,
  ModelTrigger,
  Explanation,
  ExplanationFormat,
  Alert,
  AlertType,
  AlertChannel,
  AlertStatus,
} from "./derived.js";

// Operational
export type {
  Case,
  CaseType,
  CaseStatus,
  Priority,
  Task,
  TaskType,
  TaskStatus,
  Briefing,
  BriefingType,
  BriefingGeneration,
  BriefingStatus,
  ResponseAction,
  ResponseType,
  ResponseStatus,
  Effectiveness,
} from "./operational.js";

// Access Control & Audit
export type {
  Policy,
  PolicyType,
  PolicyEffect,
  Role,
  DataSensitivity,
  Compartment,
  Classification,
  Purpose,
  AuditEntry,
  AuditAction,
} from "./access.js";

// Relationships
export type {
  Relationship,
  RelationshipType,
  PersonPersonRel,
  PersonOrgRel,
  PersonPlaceRel,
  PersonAssetRel,
  PersonEventRel,
  OrgOrgRel,
  OrgPlaceRel,
  OrgEventRel,
  OrgAssetRel,
  PlacePlaceRel,
  PlaceInfraRel,
  EventEventRel,
  ClaimRel,
  EvidenceRel,
  DerivedRel,
} from "./relationships.js";
