/**
 * EVENTS — things that happen in the world.
 *
 * Incident, Observation, Communication, Movement,
 * ServiceRequest, Disruption, DisasterImpact
 */

import type {
  Confidence,
  Compartmented,
  GeoJSON,
  Language,
  Provenance,
  Severity,
  TimePrecision,
} from "./common.js";

// ---------------------------------------------------------------------------
// Incident
// ---------------------------------------------------------------------------

export type IncidentCategory =
  | "security"
  | "infrastructure"
  | "health"
  | "environment"
  | "economic"
  | "social"
  | "disaster";

export type IncidentStatus =
  | "reported"
  | "confirmed"
  | "ongoing"
  | "resolved"
  | "retracted";

export interface Incident extends Provenance, Compartmented {
  id: string;
  type: string; // from extensible taxonomy (e.g. "security/shooting")
  category: IncidentCategory;
  title: string;
  description?: string;
  geometry: GeoJSON;
  place_id?: string;
  occurred_at: string;
  occurred_at_precision: TimePrecision;
  severity: Severity;
  status: IncidentStatus;
  confidence: Confidence;
  claim_count: number;
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

export type ObservationType =
  | "movement"
  | "presence"
  | "absence"
  | "change"
  | "anomaly"
  | "rumor"
  | "other";

export type Significance =
  | "routine"
  | "noteworthy"
  | "concerning"
  | "urgent";

export interface Observation extends Provenance, Compartmented {
  id: string;
  type: ObservationType;
  description: string;
  geometry: GeoJSON;
  place_id?: string;
  occurred_at: string;
  occurred_at_precision: TimePrecision;
  observed_at: string;
  significance: Significance;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

export type CommType =
  | "broadcast"
  | "social_media_post"
  | "press_release"
  | "threat"
  | "negotiation"
  | "propaganda"
  | "other";

export type CommMedium =
  | "radio"
  | "social_media"
  | "print"
  | "television"
  | "phone"
  | "messenger"
  | "in_person"
  | "other";

export type Sentiment =
  | "threatening"
  | "conciliatory"
  | "neutral"
  | "inflammatory"
  | "informational";

export interface Communication extends Provenance, Compartmented {
  id: string;
  type: CommType;
  medium: CommMedium;
  content_summary: string;
  content_raw?: string;
  language?: Language;
  occurred_at: string;
  confidence: Confidence;
  sentiment?: Sentiment;
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

export type MovementType =
  | "group_movement"
  | "individual"
  | "vehicle_convoy"
  | "cargo"
  | "displacement"
  | "patrol"
  | "other";

export interface Movement extends Provenance, Compartmented {
  id: string;
  type: MovementType;
  origin?: GeoJSON;
  destination?: GeoJSON;
  route?: GeoJSON;
  origin_place_id?: string;
  destination_place_id?: string;
  started_at?: string;
  ended_at?: string;
  observed_at: string;
  estimated_count?: number;
  confidence: Confidence;
  significance: Significance;
}

// ---------------------------------------------------------------------------
// ServiceRequest
// ---------------------------------------------------------------------------

export type ServiceType =
  | "medical"
  | "fire"
  | "police"
  | "humanitarian"
  | "rescue"
  | "evacuation"
  | "shelter"
  | "food_water"
  | "other";

export type Urgency = "immediate" | "urgent" | "routine";

export type ServiceStatus =
  | "pending"
  | "acknowledged"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequest extends Provenance {
  id: string;
  type: ServiceType;
  urgency: Urgency;
  description: string;
  geometry: GeoJSON;
  place_id?: string;
  requested_at: string;
  status: ServiceStatus;
  responded_by?: string;
  response_time?: string;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Disruption
// ---------------------------------------------------------------------------

export type DisruptionType =
  | "road_block"
  | "power_outage"
  | "water_outage"
  | "telecom_outage"
  | "market_closure"
  | "school_closure"
  | "curfew"
  | "port_closure"
  | "airport_closure"
  | "other";

export type DisruptionCause =
  | "gang"
  | "government"
  | "natural"
  | "infrastructure_failure"
  | "protest"
  | "unknown";

export type DisruptionSeverity = "total" | "partial" | "intermittent";

export interface Disruption extends Provenance, Compartmented {
  id: string;
  type: DisruptionType;
  description?: string;
  geometry: GeoJSON;
  place_id?: string;
  caused_by?: DisruptionCause;
  started_at: string;
  ended_at?: string; // null = ongoing
  severity: DisruptionSeverity;
  affected_population?: number;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// DisasterImpact
// ---------------------------------------------------------------------------

export type DisasterType =
  | "hurricane"
  | "earthquake"
  | "flooding"
  | "landslide"
  | "drought"
  | "tsunami"
  | "other";

export type ImpactType =
  | "structural_damage"
  | "casualties"
  | "displacement"
  | "infrastructure_loss"
  | "crop_loss"
  | "contamination"
  | "access_cut";

export interface DisasterImpact extends Provenance {
  id: string;
  disaster_type: DisasterType;
  impact_type: ImpactType;
  geometry: GeoJSON;
  place_id?: string;
  occurred_at: string;
  severity: Severity;
  estimated_affected?: number;
  estimated_displaced?: number;
  estimated_casualties?: number;
  description?: string;
  confidence: Confidence;
}
