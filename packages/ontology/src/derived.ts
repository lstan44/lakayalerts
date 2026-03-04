/**
 * DERIVED INTELLIGENCE — products of analysis, clearly labeled.
 *
 * Pattern, Situation, DerivedInsight, ModelRun, Explanation, Alert
 */

import type {
  Compartmented,
  Confidence,
  GeoJSON,
  Language,
  Provenance,
  Severity,
} from "./common.js";

// ---------------------------------------------------------------------------
// Pattern
// ---------------------------------------------------------------------------

export type PatternType =
  | "spatial_cluster"
  | "temporal_spike"
  | "movement_pattern"
  | "correlation"
  | "absence"
  | "escalation"
  | "seasonal"
  | "network"
  | "custom";

export type PatternStatus =
  | "emerging"
  | "active"
  | "stable"
  | "declining"
  | "expired"
  | "dismissed";

export interface Pattern extends Provenance, Compartmented {
  id: string;
  type: PatternType;
  title: string;
  description: string;
  geometry?: GeoJSON;
  place_ids?: string[];
  signal_ids: string[];
  signal_count: number;
  time_window_start: string;
  time_window_end: string;
  confidence: Confidence;
  severity: Severity;
  status: PatternStatus;
  model_run_id?: string;
}

// ---------------------------------------------------------------------------
// Situation
// ---------------------------------------------------------------------------

export type SituationCategory =
  | "security_crisis"
  | "humanitarian_emergency"
  | "natural_disaster"
  | "civil_unrest"
  | "infrastructure_crisis"
  | "public_health"
  | "political_event"
  | "other";

export type SituationStatus =
  | "emerging"
  | "active"
  | "stabilizing"
  | "resolved"
  | "monitoring";

export interface Situation extends Provenance, Compartmented {
  id: string;
  title: string;
  description: string;
  category: SituationCategory;
  geometry?: GeoJSON;
  place_ids?: string[];
  status: SituationStatus;
  severity: Severity;
  started_at: string;
  resolved_at?: string;
  pattern_ids?: string[];
  incident_count: number;
  claim_count: number;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// DerivedInsight
// ---------------------------------------------------------------------------

export type InsightType =
  | "hotspot"
  | "risk_zone"
  | "trend"
  | "network_inference"
  | "prediction"
  | "anomaly_explanation"
  | "impact_assessment"
  | "correlation_finding";

export type TimeHorizon =
  | "current"
  | "next_24h"
  | "next_7d"
  | "next_30d";

export interface DerivedInsight extends Compartmented {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  geometry?: GeoJSON;
  place_ids?: string[];
  time_horizon?: TimeHorizon;
  confidence: Confidence;
  model_run_id: string;
  input_ids: Record<string, string[]>; // { claims: [...], incidents: [...] }
  created_at: string;
  expires_at?: string;
}

// ---------------------------------------------------------------------------
// ModelRun
// ---------------------------------------------------------------------------

export type ModelRunStatus = "completed" | "failed" | "partial";

export type ModelTrigger =
  | "scheduled"
  | "threshold"
  | "analyst_request"
  | "system_event";

export interface ModelRun {
  id: string;
  model_name: string;
  model_version: string;
  parameters: Record<string, unknown>;
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  status: ModelRunStatus;
  triggered_by: ModelTrigger;
  triggered_by_account?: string;
}

// ---------------------------------------------------------------------------
// Explanation
// ---------------------------------------------------------------------------

export type ExplanationFormat = "text" | "markdown" | "structured";

export interface Explanation {
  id: string;
  target_type: string;
  target_id: string;
  content: string;
  format: ExplanationFormat;
  language: Language;
  model_run_id?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export type AlertType =
  | "zone_alert"
  | "breaking"
  | "escalation"
  | "safety_advisory"
  | "all_clear"
  | "system";

export type AlertChannel =
  | "in_app"
  | "push"
  | "sms"
  | "email"
  | "public_web";

export type AlertStatus =
  | "draft"
  | "pending_approval"
  | "sent"
  | "expired"
  | "retracted";

export interface Alert extends Provenance {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  severity: Severity;
  geometry?: GeoJSON;
  place_ids?: string[];
  situation_id?: string;
  channels: AlertChannel[];
  audience_roles?: string[];
  audience_compartments?: string[];
  approved_by?: string;
  sent_at?: string;
  expires_at?: string;
  status: AlertStatus;
}
