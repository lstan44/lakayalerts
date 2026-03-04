/**
 * Shared primitives used across the entire ontology.
 */

// ---------------------------------------------------------------------------
// Temporal
// ---------------------------------------------------------------------------

/** Tri-temporal fields present on every object that enters from the outside */
export interface Temporal {
  /** When the source claims the thing happened */
  occurred_at?: string;
  /** Precision of occurred_at */
  occurred_at_precision?: TimePrecision;
  /** When the source observed / reported it */
  observed_at?: string;
  /** When Citadel received and stored it (system-set, immutable) */
  ingested_at: string;
}

export type TimePrecision =
  | "exact"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "approximate";

/** Bitemporal validity window for relationships and attributes */
export interface ValidityWindow {
  valid_from?: string;
  valid_to?: string;
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export type SourceMethod =
  | "citizen_report"
  | "analyst_created"
  | "import"
  | "model_derived"
  | "api_feed"
  | "social_media_scrape"
  | "news_scrape"
  | "sensor"
  | "system";

/** Every object carries provenance */
export interface Provenance {
  created_at: string;
  created_by: string; // FK → Account.id
  source_method: SourceMethod;
}

// ---------------------------------------------------------------------------
// Confidence & Severity
// ---------------------------------------------------------------------------

/** 0.0–1.0 */
export type Confidence = number;

export type Severity =
  | "critical"
  | "high"
  | "moderate"
  | "low"
  | "informational";

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/** Optional compartment restriction */
export interface Compartmented {
  compartment_id?: string;
}

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** GeoJSON geometry — the canonical interchange format */
export interface GeoJSON {
  type: "Point" | "LineString" | "Polygon" | "MultiPolygon" | "GeometryCollection";
  coordinates: unknown;
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export type Language = "ht" | "fr" | "en" | "es";

// ---------------------------------------------------------------------------
// Channel
// ---------------------------------------------------------------------------

export type Channel =
  | "web_app"
  | "mobile_app"
  | "sms"
  | "ussd"
  | "voice_ivr"
  | "api"
  | "email"
  | "social_media_scrape"
  | "news_scrape"
  | "sensor"
  | "analyst_input"
  | "system_derived";
