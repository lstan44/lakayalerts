/**
 * ASSERTIONS & EVIDENCE — what the system believes and why.
 *
 * Claim, EvidenceItem, Source, VerificationAction, ConfidenceScore
 */

import type {
  Channel,
  Compartmented,
  Confidence,
  GeoJSON,
  Language,
  Provenance,
  TimePrecision,
} from "./common.js";

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

export type ClaimType =
  | "incident_report"
  | "observation"
  | "tip"
  | "correction"
  | "corroboration"
  | "contradiction"
  | "status_update"
  | "request_for_help";

export type ClaimStatus =
  | "pending"
  | "under_review"
  | "assessed"
  | "retracted"
  | "spam";

export interface Claim extends Provenance {
  id: string;
  source_id: string;
  account_id?: string;
  channel: Channel;
  claim_type: ClaimType;
  content: string;
  structured_data?: Record<string, unknown>;
  geometry?: GeoJSON;
  place_id?: string;
  occurred_at?: string;
  occurred_at_precision?: TimePrecision;
  observed_at: string;
  language?: Language;
  anonymous: boolean;
  status: ClaimStatus;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// EvidenceItem
// ---------------------------------------------------------------------------

export type EvidenceType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "screenshot"
  | "sensor_reading"
  | "external_data"
  | "witness_statement"
  | "official_record";

export interface EvidenceItem extends Provenance, Compartmented {
  id: string;
  claim_id?: string;
  type: EvidenceType;
  storage_url: string;
  storage_path: string;
  mime_type: string;
  file_size?: number;
  original_filename?: string;
  metadata?: Record<string, unknown>;
  geometry?: GeoJSON;
  captured_at?: string;
  analysis?: Record<string, unknown>;
  integrity_hash: string; // SHA-256 at ingestion
}

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

export type SourceType =
  | "citizen"
  | "journalist"
  | "security_force"
  | "government_official"
  | "ngo"
  | "international_org"
  | "news_outlet"
  | "social_media_account"
  | "sensor"
  | "satellite"
  | "api_feed"
  | "anonymous"
  | "system";

/** NATO-style reliability rating */
export type ReliabilityRating =
  | "A" // completely reliable
  | "B" // usually reliable
  | "C" // fairly reliable
  | "D" // not usually reliable
  | "E" // unreliable
  | "F"; // reliability cannot be judged

export interface Source {
  id: string;
  type: SourceType;
  name?: string;
  account_id?: string;
  organization_id?: string;
  url?: string;
  trust_score: number; // 0–100
  total_claims: number;
  corroborated_claims: number;
  retracted_claims: number;
  reliability_rating: ReliabilityRating;
  status: "active" | "suspended" | "retired" | "blacklisted";
  created_at: string;
}

// ---------------------------------------------------------------------------
// VerificationAction
// ---------------------------------------------------------------------------

export type VerificationTargetType =
  | "claim"
  | "incident"
  | "observation"
  | "person"
  | "organization";

export type VerificationActionType =
  | "verify"
  | "dismiss"
  | "escalate"
  | "merge"
  | "split"
  | "retract"
  | "reclassify"
  | "upgrade_severity"
  | "downgrade_severity"
  | "request_more_info";

export interface VerificationAction {
  id: string;
  target_type: VerificationTargetType;
  target_id: string;
  action: VerificationActionType;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  rationale: string; // mandatory for audit
  evidence_ids?: string[];
  performed_by: string;
  performed_at: string;
  automated: boolean;
  model_run_id?: string;
}

// ---------------------------------------------------------------------------
// ConfidenceScore
// ---------------------------------------------------------------------------

export interface ConfidenceComponent {
  value: number | null;
  weight: number;
  detail: string;
}

export interface ConfidenceScore {
  id: string;
  target_type: string;
  target_id: string;
  score: Confidence;
  components: {
    source_trust: ConfidenceComponent;
    corroboration: ConfidenceComponent;
    ai_assessment: ConfidenceComponent;
    spatial_plausibility: ConfidenceComponent;
    temporal_plausibility: ConfidenceComponent;
    human_verification: ConfidenceComponent;
  };
  explanation: string;
  computed_at: string;
  model_version: string;
  supersedes_id?: string;
}
