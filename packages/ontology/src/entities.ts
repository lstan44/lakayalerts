/**
 * ENTITIES — things that exist in the world.
 *
 * Person, Organization, Place, Asset, Infrastructure, Account
 */

import type {
  Confidence,
  Compartmented,
  GeoJSON,
  Language,
  Provenance,
  SourceMethod,
  ValidityWindow,
} from "./common.js";

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------

export type PersonStatus = "active" | "deceased" | "unknown" | "merged";

export interface Person extends Provenance, Compartmented {
  id: string;
  display_name?: string;
  description?: string;
  status: PersonStatus;
  confidence: Confidence;
}

export type IdentifierType =
  | "phone"
  | "email"
  | "gov_id"
  | "nickname"
  | "handle"
  | "device_id"
  | "face_encoding"
  | "biometric"
  | "plate_number";

export interface PersonIdentifier extends ValidityWindow {
  id: string;
  person_id: string;
  type: IdentifierType;
  value: string; // encrypted at rest for PII types
  confidence: Confidence;
  source_id: string;
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export type OrgType =
  | "government"
  | "ngo"
  | "business"
  | "gang"
  | "armed_group"
  | "political_party"
  | "religious"
  | "media"
  | "informal"
  | "unknown";

export type OrgStatus =
  | "active"
  | "disbanded"
  | "fragmented"
  | "unknown"
  | "merged";

export interface Organization extends Provenance, Compartmented {
  id: string;
  name: string;
  aliases?: string[];
  type: OrgType;
  status: OrgStatus;
  description?: string;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Place
// ---------------------------------------------------------------------------

export type PlaceType =
  | "department"
  | "arrondissement"
  | "commune"
  | "section_communale"
  | "neighborhood"
  | "landmark"
  | "road_segment"
  | "choke_point"
  | "border_crossing"
  | "poi";

export interface Place extends Provenance {
  id: string;
  name: string;
  aliases?: string[];
  type: PlaceType;
  geometry: GeoJSON;
  centroid: GeoJSON;
  parent_id?: string;
  population?: number;
  elevation?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

export type AssetType =
  | "vehicle"
  | "weapon"
  | "phone"
  | "vessel"
  | "equipment"
  | "document"
  | "currency"
  | "contraband"
  | "other";

export type AssetStatus =
  | "active"
  | "seized"
  | "destroyed"
  | "missing"
  | "unknown";

export interface Asset extends Provenance, Compartmented {
  id: string;
  type: AssetType;
  subtype?: string;
  identifiers: Record<string, string>;
  description?: string;
  status: AssetStatus;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

export type InfraType =
  | "road"
  | "bridge"
  | "hospital"
  | "school"
  | "power_station"
  | "water_system"
  | "telecom_tower"
  | "port"
  | "airport"
  | "government_building"
  | "market"
  | "church"
  | "fuel_station"
  | "other";

export type InfraStatus =
  | "operational"
  | "degraded"
  | "offline"
  | "destroyed"
  | "under_construction"
  | "unknown";

export interface Infrastructure extends Provenance {
  id: string;
  name: string;
  type: InfraType;
  geometry: GeoJSON;
  place_id?: string;
  status: InfraStatus;
  capacity?: Record<string, unknown>;
  operator_id?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Account (system user, distinct from Person)
// ---------------------------------------------------------------------------

export type AccountRole =
  | "citizen"
  | "verified_citizen"
  | "journalist"
  | "field_reporter"
  | "analyst"
  | "senior_analyst"
  | "responder"
  | "commander"
  | "admin"
  | "system";

export type VerificationLevel =
  | "anonymous"
  | "phone_verified"
  | "email_verified"
  | "id_verified"
  | "institutional";

export type AccountStatus = "active" | "suspended" | "banned" | "dormant";

export interface Account {
  id: string;
  person_id?: string;
  display_name?: string;
  roles: AccountRole[];
  trust_score: number; // 0–100
  verification_level: VerificationLevel;
  status: AccountStatus;
  language: Language;
  compartments?: string[];
  purposes?: string[];
  preferences: AccountPreferences;
  created_at: string;
  last_active_at: string;
}

export interface AccountPreferences {
  alert_radius_meters: number;
  home_location?: GeoJSON;
  notification_channels: ("in_app" | "push" | "sms" | "email")[];
  signal_type_filters?: string[];
  language: Language;
}

// ---------------------------------------------------------------------------
// Trust Score (computed)
// ---------------------------------------------------------------------------

export interface TrustScoreComponents {
  account_age_factor: number;
  verification_level_factor: number;
  claim_accuracy_history: number;
  community_standing: number;
  activity_consistency: number;
  penalty_deductions: number;
}

export { SourceMethod };
