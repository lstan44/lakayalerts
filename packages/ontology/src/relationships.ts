/**
 * RELATIONSHIPS — first-class edges connecting everything.
 *
 * 76 relationship types across all domains.
 */

import type {
  Compartmented,
  Confidence,
  Provenance,
  ValidityWindow,
} from "./common.js";

// ---------------------------------------------------------------------------
// Relationship (the universal edge)
// ---------------------------------------------------------------------------

export interface Relationship extends Provenance, Compartmented, ValidityWindow {
  id: string;
  type: RelationshipType;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  directional: boolean;
  strength: number; // 0.0–1.0
  confidence: Confidence;
  evidence_ids: string[];
}

// ---------------------------------------------------------------------------
// Relationship Type Taxonomy (76 types)
// ---------------------------------------------------------------------------

// Person ↔ Person
export type PersonPersonRel =
  | "associated_with"
  | "family_of"
  | "communicates_with"
  | "commands"
  | "subordinate_of"
  | "alias_of"
  | "same_as"
  | "rival_of";

// Person ↔ Organization
export type PersonOrgRel =
  | "member_of"
  | "leads"
  | "founded"
  | "affiliated_with"
  | "employed_by"
  | "spokesperson_for"
  | "former_member_of";

// Person ↔ Place
export type PersonPlaceRel =
  | "resides_in"
  | "frequents"
  | "originated_from"
  | "last_seen_at"
  | "person_controls";

// Person ↔ Asset
export type PersonAssetRel =
  | "owns"
  | "possesses"
  | "uses"
  | "transferred_to";

// Person ↔ Event
export type PersonEventRel =
  | "participated_in"
  | "perpetrated"
  | "victim_of"
  | "witnessed"
  | "reported"
  | "responded_to";

// Org ↔ Org
export type OrgOrgRel =
  | "allied_with"
  | "opposed_to"
  | "parent_of"
  | "splinter_of"
  | "coordinates_with"
  | "front_for";

// Org ↔ Place
export type OrgPlaceRel =
  | "headquartered_in"
  | "operates_in"
  | "org_controls"
  | "patrols"
  | "displaced_from";

// Org ↔ Event
export type OrgEventRel =
  | "org_perpetrated"
  | "claimed_responsibility"
  | "org_responded_to"
  | "affected_by";

// Org ↔ Asset
export type OrgAssetRel =
  | "org_owns"
  | "operates"
  | "seized";

// Place ↔ Place
export type PlacePlaceRel =
  | "contains"
  | "adjacent_to"
  | "connected_by"
  | "supply_route_to"
  | "evacuation_route_to";

// Place ↔ Infrastructure
export type PlaceInfraRel =
  | "located_in"
  | "serves"
  | "critical_for"
  | "blocks_access_to";

// Event ↔ Event
export type EventEventRel =
  | "caused_by"
  | "preceded"
  | "related_to"
  | "escalated_to"
  | "in_response_to"
  | "part_of";

// Claim ↔ Everything
export type ClaimRel =
  | "asserts_existence_of"
  | "asserts_event"
  | "asserts_relationship"
  | "corroborates"
  | "contradicts"
  | "updates"
  | "retracts";

// Evidence ↔ Claims
export type EvidenceRel =
  | "supports"
  | "evidence_contradicts"
  | "depicts";

// Derived ↔ Sources
export type DerivedRel =
  | "derived_from"
  | "produced_by"
  | "informs";

/** Union of all 76 relationship types */
export type RelationshipType =
  | PersonPersonRel
  | PersonOrgRel
  | PersonPlaceRel
  | PersonAssetRel
  | PersonEventRel
  | OrgOrgRel
  | OrgPlaceRel
  | OrgEventRel
  | OrgAssetRel
  | PlacePlaceRel
  | PlaceInfraRel
  | EventEventRel
  | ClaimRel
  | EvidenceRel
  | DerivedRel;
