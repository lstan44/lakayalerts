# CITADEL ONTOLOGY

**The World Model**

*Not tables. Not screens. Reality, represented.*

---

## Foundational Principles

This ontology is governed by six invariants. Every object, relationship, and query must respect them.

### 1. Claims, not facts

No data enters Citadel as truth. Everything is an assertion — a claim made by a source, supported by evidence, with computed confidence. The system never states "a shooting happened." It states "Source X claimed a shooting happened at time T, supported by evidence E1..En, with confidence 0.83."

### 2. Time, everywhere

Every object and every relationship carries three temporal dimensions:

| Timestamp | Meaning |
|-----------|---------|
| `occurred_at` | When the source claims the thing happened in the real world |
| `observed_at` | When the source observed or reported it |
| `ingested_at` | When Citadel received and stored it |

Most attributes and relationships also carry `valid_from` / `valid_to` for bitemporal state tracking. "This person was affiliated with Organization X from March to September 2024" is a first-class statement.

### 3. Identity is probabilistic

A phone number is not a person. A nickname is not a person. A face is not a person. They are **identifiers** linked to an **identity** with confidence. Identities can be merged, split, or left ambiguous. The system tolerates uncertainty rather than forcing premature resolution.

### 4. Geography is geometry

Location is never a string. It is a PostGIS geometry (point, polygon, linestring) tied to an administrative hierarchy and optionally to a named landmark or infrastructure element. This enables spatial queries — "all incidents within 500m of schools" — without hacks.

### 5. Provenance is mandatory

Every object knows where it came from: who created it, how, from what upstream data, under what permissions, and every mutation is logged immutably. Without this, analysts don't trust the system and the system doesn't survive scrutiny.

### 6. Access is policy, not role

Permissions are not "admin can see everything." They are fine-grained policies: object-level, attribute-level, purpose-limited, compartmented, and dynamically evaluated. The access control model is part of the ontology, not bolted on after.

---

## Ontology Overview

### Object Categories

```
ENTITIES (things that exist)
├── Person
├── Organization
├── Place
├── Asset
├── Infrastructure
└── Account

EVENTS (things that happen)
├── Incident
├── Observation
├── Communication
├── Movement
├── ServiceRequest
├── Disruption
└── DisasterImpact

ASSERTIONS & EVIDENCE
├── Claim
├── EvidenceItem
├── Source
├── VerificationAction
└── ConfidenceScore

DERIVED INTELLIGENCE
├── Pattern
├── Situation
├── DerivedInsight
├── ModelRun
├── Explanation
└── Alert

OPERATIONAL
├── Case
├── Task
├── Briefing
└── ResponseAction

ACCESS & AUDIT
├── Policy
├── Role
├── Compartment
├── Purpose
└── AuditEntry
```

### The Truth Loop

```
Raw world input → Claim
                    │
         supported by Evidence
                    │
         processed by VerificationAction
                    │
         produces AssessedClaim (with ConfidenceScore)
                    │
         updates Entity state / creates DerivedInsight / triggers Alert
                    │
         all queryable by time, geography, permissions
```

---

## Part I: Entity Types

### E1. Person

A conceptual identity representing a real human being. Not a user account — a representation of a person who exists in the world and may appear across many signals.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | Stable internal identifier |
| `display_name` | text | no | Best-known name (may be alias) |
| `description` | text | no | Free-text description |
| `status` | enum | yes | `active`, `deceased`, `unknown`, `merged` |
| `confidence` | float | yes | 0.0–1.0. How confident we are this identity is real and correctly resolved |
| `created_at` | timestamp | yes | When this identity was first created in Citadel |
| `created_by` | FK→Account | yes | Provenance |
| `source_method` | enum | yes | `citizen_report`, `analyst_created`, `import`, `model_derived` |
| `compartment_id` | FK→Compartment | no | Access restriction |

**Identifiers** (separate table, many-to-one):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `person_id` | FK→Person | yes | |
| `type` | enum | yes | `phone`, `email`, `gov_id`, `nickname`, `handle`, `device_id`, `face_encoding`, `biometric`, `plate_number` |
| `value` | text | yes | The identifier value (encrypted at rest for PII types) |
| `confidence` | float | yes | How confident this identifier belongs to this person |
| `valid_from` | timestamp | no | When this identifier became active |
| `valid_to` | timestamp | no | When this identifier became inactive |
| `source_id` | FK→Source | yes | Where this identifier link came from |

**Time semantics:** Person entities are long-lived. Attributes change over time (name, status, affiliations). Each change is event-sourced via AuditEntry. The `valid_from`/`valid_to` on identifiers track when the association was believed active.

**Evidence requirements:** A Person should not exist without at least one linked Claim or EvidenceItem that motivated its creation. The `source_method` field records how it entered the system.

**Access policy:** Person records default to `restricted`. PII identifiers are encrypted and subject to attribute-level masking. Citizen-tier users never see Person entities directly — they only interact through Claims and Incidents. Analyst-tier users see resolved persons within their compartment. Exact identifiers require elevated clearance.

---

### E2. Organization

A group, institution, gang, business, government agency, NGO, or any named collective entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | Primary name |
| `aliases` | text[] | no | Known alternative names |
| `type` | enum | yes | `government`, `ngo`, `business`, `gang`, `armed_group`, `political_party`, `religious`, `media`, `informal`, `unknown` |
| `status` | enum | yes | `active`, `disbanded`, `fragmented`, `unknown`, `merged` |
| `description` | text | no | |
| `confidence` | float | yes | Confidence in this entity's existence and characterization |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

**Time semantics:** Organizations have lifespans. They form, merge, split, dissolve. Status changes are tracked temporally. Control zones (relationship to Place) carry `valid_from`/`valid_to`.

**Evidence requirements:** Must link to at least one Claim or Source that established its existence.

**Access policy:** Gang/armed group organizations may be compartmented. Type-specific policies (e.g., "gang intelligence" compartment).

---

### E3. Place

A geographic entity with geometry and administrative context. Not just coordinates — a *thing* in the world that has a name, boundaries, and meaning.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | Primary name |
| `aliases` | text[] | no | Alternative names, Creole/French variants |
| `type` | enum | yes | `department`, `arrondissement`, `commune`, `section_communale`, `neighborhood`, `landmark`, `road_segment`, `choke_point`, `border_crossing`, `poi` |
| `geometry` | geometry | yes | PostGIS: point, polygon, linestring, or multipolygon |
| `centroid` | geometry(Point) | yes | Computed centroid for quick queries |
| `parent_id` | FK→Place | no | Administrative parent (section → commune → arrondissement → department) |
| `population` | integer | no | Estimated population |
| `elevation` | float | no | Meters above sea level (relevant for flood risk) |
| `metadata` | jsonb | no | Extensible properties (road condition, infrastructure access, etc.) |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |

**Administrative hierarchy (Haiti):**
```
Haiti (country)
└── Department (10: Ouest, Nord, Sud, etc.)
    └── Arrondissement (42)
        └── Commune (145)
            └── Section Communale (571)
                └── Neighborhood / Habitation (thousands)
```

**Time semantics:** Place geometry and control status change over time. "Gang X controlled this neighborhood from January to August" requires temporal relationships. Administrative boundaries are relatively stable; control zones are volatile.

**Evidence requirements:** Administrative boundaries imported from authoritative sources (Haiti CNIGS, OpenStreetMap, humanitarian datasets). Informal places created from clustered claims require source linkage.

**Access policy:** Place data is generally public. Control zone assessments may be restricted. Exact coordinates of sensitive facilities (safe houses, intelligence posts) are compartmented.

---

### E4. Asset

A tangible object that matters to the intelligence picture: vehicles, weapons, phones, vessels, equipment.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `vehicle`, `weapon`, `phone`, `vessel`, `equipment`, `document`, `currency`, `contraband`, `other` |
| `subtype` | text | no | e.g., "Toyota Hilux", "AK-47", "Samsung Galaxy" |
| `identifiers` | jsonb | yes | Type-specific: `{ plate: "AA-12345", vin: "..." }` or `{ imei: "...", phone: "..." }` |
| `description` | text | no | |
| `status` | enum | yes | `active`, `seized`, `destroyed`, `missing`, `unknown` |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

**Time semantics:** Assets have ownership histories, location histories, and status changes — all temporal.

**Evidence requirements:** Must link to originating Claim or intelligence product.

**Access policy:** Weapon and contraband assets default to restricted compartment.

---

### E5. Infrastructure

Critical infrastructure elements: roads, bridges, hospitals, schools, power stations, water systems, telecom towers, ports, airports.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | |
| `type` | enum | yes | `road`, `bridge`, `hospital`, `school`, `power_station`, `water_system`, `telecom_tower`, `port`, `airport`, `government_building`, `market`, `church`, `fuel_station`, `other` |
| `geometry` | geometry | yes | Point or linestring or polygon |
| `place_id` | FK→Place | no | Administrative location |
| `status` | enum | yes | `operational`, `degraded`, `offline`, `destroyed`, `under_construction`, `unknown` |
| `capacity` | jsonb | no | Type-specific: `{ beds: 120 }` for hospital, `{ mw: 5 }` for power |
| `operator` | FK→Organization | no | Who operates this |
| `metadata` | jsonb | no | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |

**Time semantics:** Status changes are temporal events (infrastructure goes offline, comes back). Capacity may change seasonally.

**Evidence requirements:** Initial data imported from authoritative sources (OSM, humanitarian datasets). Status changes require linked Claims/Observations.

**Access policy:** General infrastructure data is public. Military/security infrastructure is compartmented. Exact capacity of sensitive facilities may be restricted.

---

### E6. Account

A user identity within Citadel. Distinct from Person — an Account is a system login; a Person is a real-world entity. One Person may have zero or many Accounts. One Account maps to at most one Person.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | Matches Supabase auth.users.id |
| `person_id` | FK→Person | no | Resolved real-world identity (null for anonymous) |
| `display_name` | text | no | Self-chosen display name |
| `roles` | enum[] | yes | `citizen`, `verified_citizen`, `journalist`, `analyst`, `responder`, `admin`, `system` |
| `trust_score` | float | yes | 0–100, computed |
| `verification_level` | enum | yes | `anonymous`, `phone_verified`, `email_verified`, `id_verified`, `institutional` |
| `status` | enum | yes | `active`, `suspended`, `banned`, `dormant` |
| `language` | enum | yes | `ht`, `fr`, `en` |
| `compartments` | FK[]→Compartment | no | Compartments this account can access |
| `purposes` | FK[]→Purpose | no | Authorized use purposes |
| `preferences` | jsonb | yes | Notification settings, radius, signal type filters |
| `created_at` | timestamp | yes | |
| `last_active_at` | timestamp | yes | |

**Trust Score Computation:**
```
trust_score = weighted_sum(
  account_age_factor,           // 0-15 pts: older = more trusted
  verification_level_factor,    // 0-25 pts: higher verification = more trusted
  claim_accuracy_history,       // 0-30 pts: % of past claims that were corroborated
  community_standing,           // 0-15 pts: net positive interactions
  activity_consistency,         // 0-10 pts: regular usage pattern vs. burst behavior
  penalty_deductions            // -50 to 0: false reports, spam, abuse
)
```

**Time semantics:** Trust score has a history. `trust_score_history` is maintained as a time series so analysts can see how trust evolved and why.

**Access policy:** Account data is private. Only the account holder sees their own profile. Analysts see trust scores and roles for accounts that generated claims they're reviewing. Admin sees all. Trust score computation is transparent to the account holder (they can see why their score is what it is).

---

## Part II: Event Types

### V1. Incident

Something that happened in the world — a discrete event with a time, place, type, and severity. An Incident is NOT a citizen report (that's a Claim). An Incident is the assessed reality: "we believe an event occurred."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | text | yes | From extensible taxonomy (see below) |
| `category` | enum | yes | `security`, `infrastructure`, `health`, `environment`, `economic`, `social`, `disaster` |
| `title` | text | yes | Short description |
| `description` | text | no | Detailed description |
| `geometry` | geometry | yes | Where it happened (point, polygon, or line) |
| `place_id` | FK→Place | no | Resolved place |
| `occurred_at` | timestamp | yes | Best estimate of when it happened |
| `occurred_at_precision` | enum | yes | `exact`, `minute`, `hour`, `day`, `week`, `approximate` |
| `severity` | enum | yes | `critical`, `high`, `moderate`, `low`, `informational` |
| `status` | enum | yes | `reported`, `confirmed`, `ongoing`, `resolved`, `retracted` |
| `confidence` | float | yes | 0.0–1.0 |
| `claim_count` | integer | yes | Number of claims supporting this incident |
| `created_at` | timestamp | yes | When Citadel created this incident record |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | `auto_clustered`, `analyst_created`, `promoted_claim`, `import` |
| `compartment_id` | FK→Compartment | no | |

**Relationship to Claims:** An Incident may be created automatically when multiple Claims cluster (same type + nearby location + recent time) or manually by an analyst promoting a Claim. The linked Claims are the *evidence* for the Incident's existence.

**Incident Taxonomy (extensible, hierarchical):**
```
security/
├── gang_activity
│   ├── turf_expansion
│   ├── checkpoint_extortion
│   └── recruitment
├── kidnapping
│   ├── ransom
│   └── express
├── robbery
│   ├── armed
│   ├── home_invasion
│   └── carjacking
├── shooting
├── assault
├── sexual_violence
├── terrorism
├── smuggling
│   ├── weapons
│   ├── drugs
│   └── human
└── arson

infrastructure/
├── road_closure
├── road_damage
├── bridge_failure
├── power_outage
├── water_disruption
├── telecom_outage
├── building_collapse
└── fuel_shortage

health/
├── disease_outbreak
├── hospital_overcrowding
├── contamination
├── medical_supply_shortage
└── epidemic_spread

environment/
├── flooding
├── landslide
├── deforestation
├── pollution
└── coastal_erosion

disaster/
├── hurricane
├── earthquake
├── tsunami_warning
├── drought
└── wildfire

economic/
├── market_disruption
├── supply_shortage
├── price_spike
├── port_closure
└── bank_run

social/
├── protest
├── civil_unrest
├── election_incident
├── displacement
├── religious_event
└── labor_strike
```

**Time semantics:** `occurred_at` + `occurred_at_precision` distinguishes "we know this happened at 9:12 PM" from "sometime last Tuesday." Status changes are temporal (ongoing → resolved at time T).

**Evidence requirements:** An Incident must link to at least one Claim. Confidence is computed from the supporting evidence graph.

**Access policy:** Most incidents are visible to all authenticated users. Sensitive incidents (terrorism, high-profile kidnapping) may be compartmented. Citizen-tier sees confirmed incidents in their zone. Analysts see all within their compartment.

---

### V2. Observation

A non-incident signal: something noticed that may or may not become significant. "Military vehicles moving south on Route Nationale 1." "Unusual crowd gathering at market." "Boat spotted offshore."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `movement`, `presence`, `absence`, `change`, `anomaly`, `rumor`, `other` |
| `description` | text | yes | What was observed |
| `geometry` | geometry | yes | Where |
| `place_id` | FK→Place | no | |
| `occurred_at` | timestamp | yes | |
| `occurred_at_precision` | enum | yes | |
| `observed_at` | timestamp | yes | When the observer made the observation |
| `significance` | enum | yes | `routine`, `noteworthy`, `concerning`, `urgent` |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

**Time semantics:** Observations distinguish `occurred_at` (when the thing was seen) from `observed_at` (when the observer reported it). This matters — "I saw this yesterday" is different from "I see this now."

**Evidence requirements:** Must link to at least one Claim or Source.

**Access policy:** Observations with `movement` or `presence` type involving security entities may be auto-compartmented.

---

### V3. Communication

A detected or reported communication between entities. Not the content of messages within Citadel — this represents real-world communications that are relevant intelligence (e.g., "Radio broadcast by Group X threatening Zone Y," "Social media post by Leader Z").

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `broadcast`, `social_media_post`, `press_release`, `threat`, `negotiation`, `propaganda`, `other` |
| `medium` | enum | yes | `radio`, `social_media`, `print`, `television`, `phone`, `messenger`, `in_person`, `other` |
| `content_summary` | text | yes | Summary of the communication |
| `content_raw` | text | no | Original text if available |
| `language` | enum | no | `ht`, `fr`, `en`, `es`, `other` |
| `occurred_at` | timestamp | yes | |
| `confidence` | float | yes | |
| `sentiment` | enum | no | `threatening`, `conciliatory`, `neutral`, `inflammatory`, `informational` |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

**Linked via relationships:** `communicated_by` → Person/Organization, `directed_at` → Person/Organization/Place, `references` → any Entity/Event.

---

### V4. Movement

A detected or reported movement of people, groups, assets, or goods.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `group_movement`, `individual`, `vehicle_convoy`, `cargo`, `displacement`, `patrol`, `other` |
| `origin` | geometry | no | Starting point/area |
| `destination` | geometry | no | Ending point/area |
| `route` | geometry(LineString) | no | Path if known |
| `origin_place_id` | FK→Place | no | |
| `destination_place_id` | FK→Place | no | |
| `started_at` | timestamp | no | |
| `ended_at` | timestamp | no | |
| `observed_at` | timestamp | yes | |
| `estimated_count` | integer | no | People/vehicles involved |
| `confidence` | float | yes | |
| `significance` | enum | yes | `routine`, `noteworthy`, `concerning`, `urgent` |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

---

### V5. ServiceRequest

A request for help or response: ambulance needed, fire brigade, police, humanitarian aid.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `medical`, `fire`, `police`, `humanitarian`, `rescue`, `evacuation`, `shelter`, `food_water`, `other` |
| `urgency` | enum | yes | `immediate`, `urgent`, `routine` |
| `description` | text | yes | |
| `geometry` | geometry | yes | Where help is needed |
| `place_id` | FK→Place | no | |
| `requested_at` | timestamp | yes | |
| `status` | enum | yes | `pending`, `acknowledged`, `dispatched`, `in_progress`, `completed`, `cancelled` |
| `responded_by` | FK→Organization | no | |
| `response_time` | interval | no | Time from request to first response |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |

---

### V6. Disruption

A disruption to normal life or infrastructure: road blocked, power out, market closed, curfew imposed.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `road_block`, `power_outage`, `water_outage`, `telecom_outage`, `market_closure`, `school_closure`, `curfew`, `port_closure`, `airport_closure`, `other` |
| `description` | text | no | |
| `geometry` | geometry | yes | Affected area |
| `place_id` | FK→Place | no | |
| `caused_by` | enum | no | `gang`, `government`, `natural`, `infrastructure_failure`, `protest`, `unknown` |
| `started_at` | timestamp | yes | |
| `ended_at` | timestamp | no | Null = ongoing |
| `severity` | enum | yes | `total`, `partial`, `intermittent` |
| `affected_population` | integer | no | Estimated |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |
| `compartment_id` | FK→Compartment | no | |

**Time semantics:** Disruptions are *intervals* — they have a start and (eventually) an end. This is critical for queries like "what disruptions were active on Tuesday at 3 PM?"

---

### V7. DisasterImpact

The impact of a natural disaster on a specific area. Separate from the disaster event itself — one hurricane creates many impacts across different zones.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `disaster_type` | enum | yes | `hurricane`, `earthquake`, `flooding`, `landslide`, `drought`, `tsunami`, `other` |
| `impact_type` | enum | yes | `structural_damage`, `casualties`, `displacement`, `infrastructure_loss`, `crop_loss`, `contamination`, `access_cut` |
| `geometry` | geometry | yes | Affected area |
| `place_id` | FK→Place | no | |
| `occurred_at` | timestamp | yes | |
| `severity` | enum | yes | `catastrophic`, `severe`, `moderate`, `minor` |
| `estimated_affected` | integer | no | People affected |
| `estimated_displaced` | integer | no | People displaced |
| `estimated_casualties` | integer | no | |
| `description` | text | no | |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | |

---

## Part III: Assertions & Evidence

This is the epistemological core of Citadel. These types define what the system *believes* and *why*.

### A1. Claim

The atomic unit of input. Every piece of information that enters Citadel — whether from a citizen's phone, an analyst's assessment, a news article, or a sensor reading — is a Claim. A Claim says: "Source X asserts Y at time T."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `source_id` | FK→Source | yes | Who/what made this claim |
| `account_id` | FK→Account | no | If from a Citadel user |
| `channel` | enum | yes | `web_app`, `mobile_app`, `sms`, `ussd`, `voice_ivr`, `api`, `email`, `social_media_scrape`, `news_scrape`, `sensor`, `analyst_input`, `system_derived` |
| `claim_type` | enum | yes | `incident_report`, `observation`, `tip`, `correction`, `corroboration`, `contradiction`, `status_update`, `request_for_help` |
| `content` | text | yes | Free-text content of the claim |
| `structured_data` | jsonb | no | Parsed/structured fields (type, severity, etc.) |
| `geometry` | geometry | no | Claimed location |
| `place_id` | FK→Place | no | Resolved place |
| `occurred_at` | timestamp | no | When the claimant says it happened |
| `occurred_at_precision` | enum | no | `exact`, `minute`, `hour`, `day`, `week`, `approximate` |
| `observed_at` | timestamp | yes | When the claimant observed/reported it |
| `language` | enum | no | `ht`, `fr`, `en` |
| `anonymous` | boolean | yes | If true, source identity is stripped at ingestion |
| `status` | enum | yes | `pending`, `under_review`, `assessed`, `retracted`, `spam` |
| `confidence` | float | yes | Computed, starts at prior based on source trust |
| `created_at` | timestamp | yes | When Citadel received it |

**The Claim is the boundary between the outside world and Citadel's internal model.** Nothing from the outside modifies an Entity or Event directly. It creates a Claim, the Claim is assessed, and the assessment updates the world model.

**Migration path from current codebase:** The existing `incidents` table rows become Claims with `channel: 'web_app'` and `claim_type: 'incident_report'`.

---

### A2. EvidenceItem

A piece of evidence supporting or contradicting a Claim. Photos, videos, audio recordings, documents, screenshots, sensor readings, third-party data points.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `claim_id` | FK→Claim | no | The claim this evidence supports (may be independent) |
| `type` | enum | yes | `image`, `video`, `audio`, `document`, `screenshot`, `sensor_reading`, `external_data`, `witness_statement`, `official_record` |
| `storage_url` | text | yes | Supabase Storage URL |
| `storage_path` | text | yes | Internal storage path |
| `mime_type` | text | yes | |
| `file_size` | integer | no | Bytes |
| `original_filename` | text | no | |
| `metadata` | jsonb | no | EXIF data, sensor metadata, etc. |
| `geometry` | geometry | no | Where the evidence was captured (from EXIF or sensor) |
| `captured_at` | timestamp | no | When the evidence was captured (from EXIF/metadata) |
| `analysis` | jsonb | no | AI analysis results (content classification, object detection, etc.) |
| `integrity_hash` | text | yes | SHA-256 hash at ingestion for tamper detection |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `compartment_id` | FK→Compartment | no | |

**Migration path:** The existing `incident_media` rows become EvidenceItems with appropriate type mapping.

---

### A3. Source

A source of information. May be a Citadel account, an external feed, a sensor, a news outlet, an anonymous tip line. Sources have track records that inform trust.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `citizen`, `journalist`, `security_force`, `government_official`, `ngo`, `international_org`, `news_outlet`, `social_media_account`, `sensor`, `satellite`, `api_feed`, `anonymous`, `system` |
| `name` | text | no | Display name or identifier |
| `account_id` | FK→Account | no | If source is a Citadel user |
| `organization_id` | FK→Organization | no | If source is institutional |
| `url` | text | no | For external sources |
| `trust_score` | float | yes | 0–100, computed from track record |
| `total_claims` | integer | yes | Number of claims from this source |
| `corroborated_claims` | integer | yes | Claims that were independently corroborated |
| `retracted_claims` | integer | yes | Claims that were retracted or found false |
| `reliability_rating` | enum | yes | NATO-style: `A` (completely reliable) → `F` (unreliable) + `1` (confirmed) → `6` (truth cannot be judged) |
| `status` | enum | yes | `active`, `suspended`, `retired`, `blacklisted` |
| `created_at` | timestamp | yes | |

**Reliability computation:**
```
reliability = f(
  corroborated_claims / total_claims,  // accuracy ratio
  recency_weighted_accuracy,            // recent claims matter more
  verification_level,                   // institutional > verified > anonymous
  domain_expertise,                     // history of accurate claims by type
  penalty_history                       // false reports deduct heavily
)
```

---

### A4. VerificationAction

An explicit decision about a Claim or Incident: verified, dismissed, escalated, merged. This is the audit trail of analytical judgment.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `target_type` | enum | yes | `claim`, `incident`, `observation`, `person`, `organization` |
| `target_id` | UUID | yes | What was verified |
| `action` | enum | yes | `verify`, `dismiss`, `escalate`, `merge`, `split`, `retract`, `reclassify`, `upgrade_severity`, `downgrade_severity`, `request_more_info` |
| `previous_state` | jsonb | yes | State before action |
| `new_state` | jsonb | yes | State after action |
| `rationale` | text | yes | Why this decision was made (mandatory for audit) |
| `evidence_ids` | UUID[] | no | Evidence that informed the decision |
| `performed_by` | FK→Account | yes | |
| `performed_at` | timestamp | yes | |
| `automated` | boolean | yes | Was this an automated system action or human? |
| `model_run_id` | FK→ModelRun | no | If automated, which model produced this |

---

### A5. ConfidenceScore

A computed confidence value with full explainability. Attached to any object that has a `confidence` field. Explains *why* the system believes what it believes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `target_type` | enum | yes | What type of object this score is for |
| `target_id` | UUID | yes | The object being scored |
| `score` | float | yes | 0.0–1.0 |
| `components` | jsonb | yes | Breakdown (see below) |
| `explanation` | text | yes | Human-readable explanation |
| `computed_at` | timestamp | yes | |
| `model_version` | text | yes | Version of the scoring algorithm |
| `supersedes_id` | FK→ConfidenceScore | no | Previous score (creates chain) |

**Components structure:**
```json
{
  "source_trust": { "value": 0.72, "weight": 0.25, "detail": "Source has 72% accuracy over 45 claims" },
  "corroboration": { "value": 0.90, "weight": 0.30, "detail": "3 independent sources within 500m and 30min" },
  "ai_assessment": { "value": 0.65, "weight": 0.20, "detail": "Image analysis consistent with claim type" },
  "spatial_plausibility": { "value": 0.95, "weight": 0.10, "detail": "Location matches known activity zone" },
  "temporal_plausibility": { "value": 0.88, "weight": 0.10, "detail": "Time consistent with historical patterns" },
  "human_verification": { "value": null, "weight": 0.05, "detail": "Not yet reviewed by analyst" }
}
```

---

## Part IV: Derived Intelligence

These types are *products* of analysis, not raw inputs. They must be clearly labeled as derived so users never confuse a model's output with ground truth.

### D1. Pattern

An automatically or manually detected pattern in the signal stream.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `spatial_cluster`, `temporal_spike`, `movement_pattern`, `correlation`, `absence`, `escalation`, `seasonal`, `network`, `custom` |
| `title` | text | yes | Short description |
| `description` | text | yes | Detailed explanation |
| `geometry` | geometry | no | Geographic extent of pattern |
| `place_ids` | FK[]→Place | no | Involved places |
| `signal_ids` | UUID[] | yes | The events/claims that constitute this pattern |
| `signal_count` | integer | yes | |
| `time_window_start` | timestamp | yes | |
| `time_window_end` | timestamp | yes | |
| `confidence` | float | yes | |
| `severity` | enum | yes | `critical`, `high`, `moderate`, `low`, `informational` |
| `status` | enum | yes | `emerging`, `active`, `stable`, `declining`, `expired`, `dismissed` |
| `model_run_id` | FK→ModelRun | no | Which analysis produced this |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `compartment_id` | FK→Compartment | no | |

---

### D2. Situation

A higher-level aggregation: a *situation* that multiple patterns, incidents, and observations collectively describe. "The security situation in Cité Soleil" or "Hurricane response in the South."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `title` | text | yes | |
| `description` | text | yes | |
| `category` | enum | yes | `security_crisis`, `humanitarian_emergency`, `natural_disaster`, `civil_unrest`, `infrastructure_crisis`, `public_health`, `political_event`, `other` |
| `geometry` | geometry | no | Geographic extent |
| `place_ids` | FK[]→Place | no | |
| `status` | enum | yes | `emerging`, `active`, `stabilizing`, `resolved`, `monitoring` |
| `severity` | enum | yes | `critical`, `high`, `moderate`, `low` |
| `started_at` | timestamp | yes | |
| `resolved_at` | timestamp | no | |
| `pattern_ids` | FK[]→Pattern | no | Linked patterns |
| `incident_count` | integer | yes | |
| `claim_count` | integer | yes | |
| `confidence` | float | yes | |
| `created_at` | timestamp | yes | |
| `created_by` | FK→Account | yes | |
| `source_method` | enum | yes | `auto_detected`, `analyst_created`, `escalated` |
| `compartment_id` | FK→Compartment | no | |

---

### D3. DerivedInsight

An analytical product: a hotspot assessment, risk prediction, network inference, trend analysis. Always labeled as derived and linked to its provenance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `hotspot`, `risk_zone`, `trend`, `network_inference`, `prediction`, `anomaly_explanation`, `impact_assessment`, `correlation_finding` |
| `title` | text | yes | |
| `content` | text | yes | The insight itself (may be AI-generated) |
| `geometry` | geometry | no | |
| `place_ids` | FK[]→Place | no | |
| `time_horizon` | enum | no | `current`, `next_24h`, `next_7d`, `next_30d` |
| `confidence` | float | yes | |
| `model_run_id` | FK→ModelRun | yes | Must link to the analysis that produced it |
| `input_ids` | jsonb | yes | IDs and types of all inputs used |
| `created_at` | timestamp | yes | |
| `expires_at` | timestamp | no | When this insight becomes stale |
| `compartment_id` | FK→Compartment | no | |

---

### D4. ModelRun

A record of an AI/ML analysis execution. This is how the system explains itself: "DerivedInsight X was produced by ModelRun Y, which used inputs Z, with algorithm version V."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `model_name` | text | yes | e.g., `spatial_cluster_dbscan`, `claude_classify`, `severity_forecast` |
| `model_version` | text | yes | Semantic version |
| `parameters` | jsonb | yes | Full parameter set used |
| `input_summary` | jsonb | yes | What data was fed in (counts, time range, types) |
| `output_summary` | jsonb | yes | What was produced (counts, types) |
| `started_at` | timestamp | yes | |
| `completed_at` | timestamp | yes | |
| `duration_ms` | integer | yes | |
| `status` | enum | yes | `completed`, `failed`, `partial` |
| `triggered_by` | enum | yes | `scheduled`, `threshold`, `analyst_request`, `system_event` |
| `triggered_by_account` | FK→Account | no | |

---

### D5. Explanation

A human-readable explanation artifact. Attached to any derived object to answer "why does the system think this?"

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `target_type` | text | yes | What is being explained |
| `target_id` | UUID | yes | |
| `content` | text | yes | The explanation (may be AI-generated) |
| `format` | enum | yes | `text`, `markdown`, `structured` |
| `language` | enum | yes | `ht`, `fr`, `en` |
| `model_run_id` | FK→ModelRun | no | |
| `created_at` | timestamp | yes | |

---

### D6. Alert

A notification product. Generated when a pattern crosses a threshold, a situation escalates, or an analyst decides to broadcast.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `zone_alert`, `breaking`, `escalation`, `safety_advisory`, `all_clear`, `system` |
| `title` | text | yes | |
| `body` | text | yes | |
| `severity` | enum | yes | `critical`, `high`, `moderate`, `low`, `informational` |
| `geometry` | geometry | no | Target area |
| `place_ids` | FK[]→Place | no | Target zones |
| `situation_id` | FK→Situation | no | Related situation |
| `channels` | enum[] | yes | `in_app`, `push`, `sms`, `email`, `public_web` |
| `audience_roles` | enum[] | no | Which roles receive this (null = all in zone) |
| `audience_compartments` | FK[]→Compartment | no | |
| `created_by` | FK→Account | yes | |
| `approved_by` | FK→Account | no | For high-severity alerts, requires approval |
| `sent_at` | timestamp | no | |
| `expires_at` | timestamp | no | |
| `status` | enum | yes | `draft`, `pending_approval`, `sent`, `expired`, `retracted` |
| `created_at` | timestamp | yes | |

---

## Part V: Operational Types

### O1. Case

A bundle of related entities, events, and evidence being tracked as a unit. An investigation, a humanitarian response, a monitoring assignment.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `title` | text | yes | |
| `description` | text | no | |
| `type` | enum | yes | `investigation`, `humanitarian_response`, `disaster_response`, `monitoring`, `assessment`, `other` |
| `status` | enum | yes | `open`, `active`, `on_hold`, `closed`, `archived` |
| `priority` | enum | yes | `critical`, `high`, `medium`, `low` |
| `assigned_to` | FK[]→Account | no | |
| `situation_ids` | FK[]→Situation | no | Linked situations |
| `geometry` | geometry | no | Area of interest |
| `place_ids` | FK[]→Place | no | |
| `opened_at` | timestamp | yes | |
| `closed_at` | timestamp | no | |
| `created_by` | FK→Account | yes | |
| `compartment_id` | FK→Compartment | yes | Cases are always compartmented |

---

### O2. Task

A discrete action item within a Case or standalone.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `case_id` | FK→Case | no | |
| `title` | text | yes | |
| `description` | text | no | |
| `type` | enum | yes | `verify_claim`, `field_assessment`, `contact_source`, `analyze_pattern`, `write_briefing`, `dispatch_response`, `follow_up`, `other` |
| `status` | enum | yes | `pending`, `assigned`, `in_progress`, `completed`, `cancelled` |
| `priority` | enum | yes | `critical`, `high`, `medium`, `low` |
| `assigned_to` | FK→Account | no | |
| `due_at` | timestamp | no | |
| `completed_at` | timestamp | no | |
| `created_by` | FK→Account | yes | |
| `created_at` | timestamp | yes | |

---

### O3. Briefing

An intelligence summary document — daily briefing, situation update, threat assessment.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `type` | enum | yes | `daily_summary`, `situation_update`, `threat_assessment`, `after_action`, `strategic_outlook`, `ad_hoc` |
| `title` | text | yes | |
| `content` | text | yes | Markdown body |
| `period_start` | timestamp | no | Period covered |
| `period_end` | timestamp | no | |
| `place_ids` | FK[]→Place | no | Geographic scope |
| `situation_ids` | FK[]→Situation | no | Referenced situations |
| `generated_by` | enum | yes | `ai_draft`, `analyst_written`, `ai_assisted` |
| `model_run_id` | FK→ModelRun | no | If AI-generated |
| `reviewed_by` | FK→Account | no | Human reviewer |
| `status` | enum | yes | `draft`, `review`, `published`, `archived` |
| `audience_roles` | enum[] | yes | Who can see this |
| `compartment_id` | FK→Compartment | no | |
| `created_by` | FK→Account | yes | |
| `created_at` | timestamp | yes | |
| `published_at` | timestamp | no | |

---

### O4. ResponseAction

A tracked response to a situation: deployment, resource allocation, communication action.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `situation_id` | FK→Situation | no | |
| `case_id` | FK→Case | no | |
| `type` | enum | yes | `deploy_responders`, `allocate_resources`, `issue_alert`, `coordinate_evacuation`, `establish_checkpoint`, `provide_aid`, `other` |
| `description` | text | yes | |
| `status` | enum | yes | `planned`, `in_progress`, `completed`, `cancelled` |
| `assigned_to_org` | FK→Organization | no | Responsible organization |
| `assigned_to_account` | FK→Account | no | Responsible individual |
| `geometry` | geometry | no | Where the response is happening |
| `started_at` | timestamp | no | |
| `completed_at` | timestamp | no | |
| `outcome` | text | no | What happened |
| `effectiveness` | enum | no | `highly_effective`, `effective`, `partially_effective`, `ineffective`, `counterproductive` |
| `created_by` | FK→Account | yes | |
| `created_at` | timestamp | yes | |

---

## Part VI: Access Control & Audit

### P1. Policy

A permission policy that governs access to objects, attributes, or actions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | |
| `description` | text | yes | |
| `type` | enum | yes | `object_access`, `attribute_mask`, `action_permission`, `purpose_limitation`, `temporal_restriction` |
| `target_type` | text | no | Which object type this applies to (null = all) |
| `conditions` | jsonb | yes | Policy rules in structured format |
| `effect` | enum | yes | `allow`, `deny`, `mask`, `redact` |
| `priority` | integer | yes | Higher priority wins on conflict |
| `active` | boolean | yes | |
| `created_by` | FK→Account | yes | |
| `created_at` | timestamp | yes | |

**Example policies:**
```json
// Citizens can only see confirmed incidents in their zone
{
  "name": "citizen_incident_view",
  "type": "object_access",
  "target_type": "incident",
  "conditions": {
    "viewer_role": ["citizen", "verified_citizen"],
    "object_status": ["confirmed", "ongoing", "resolved"],
    "spatial": "viewer_zone_or_adjacent"
  },
  "effect": "allow"
}

// Mask exact coordinates for anonymous claims
{
  "name": "anonymous_location_mask",
  "type": "attribute_mask",
  "target_type": "claim",
  "conditions": {
    "object_anonymous": true,
    "viewer_role": ["citizen", "verified_citizen"]
  },
  "effect": "mask",
  "mask_config": {
    "geometry": "snap_to_zone_centroid",
    "precision_meters": 500
  }
}

// Gang intelligence compartment
{
  "name": "gang_intel_compartment",
  "type": "object_access",
  "conditions": {
    "object_compartment": "gang_intelligence",
    "viewer_compartments_includes": "gang_intelligence"
  },
  "effect": "allow"
}
```

---

### P2. Role

Not a simple label. A role is a defined set of capabilities with explicit scope.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | `citizen`, `verified_citizen`, `journalist`, `field_reporter`, `analyst`, `senior_analyst`, `responder`, `commander`, `admin`, `system` |
| `description` | text | yes | |
| `capabilities` | jsonb | yes | What actions this role can perform |
| `default_compartments` | FK[]→Compartment | no | Compartments auto-assigned |
| `max_data_sensitivity` | enum | yes | `public`, `internal`, `restricted`, `secret` |
| `can_create_types` | text[] | yes | Which object types this role can create |
| `can_verify` | boolean | yes | Can perform verification actions |
| `can_alert` | boolean | yes | Can create alerts |
| `can_export` | boolean | yes | Can export data |

---

### P3. Compartment

An access boundary. Objects inside a compartment are only visible to accounts authorized for that compartment. Implements "need to know."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | e.g., `gang_intelligence`, `vip_protection`, `humanitarian_ops`, `election_security` |
| `description` | text | yes | |
| `parent_id` | FK→Compartment | no | Hierarchical (access to parent grants access to children) |
| `classification` | enum | yes | `public`, `internal`, `restricted`, `secret` |
| `created_by` | FK→Account | yes | |
| `created_at` | timestamp | yes | |

---

### P4. Purpose

Why is someone accessing data? Purpose limitations ensure data collected for disaster response isn't repurposed for law enforcement without explicit authorization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `name` | text | yes | e.g., `disaster_response`, `law_enforcement`, `humanitarian_aid`, `journalism`, `public_safety`, `research`, `administration` |
| `description` | text | yes | |
| `restrictions` | jsonb | no | What data types are excluded for this purpose |
| `requires_approval` | boolean | yes | Does using data for this purpose require explicit approval |
| `created_at` | timestamp | yes | |

---

### P5. AuditEntry

An immutable log of every significant action in the system. Not just changes — also reads of sensitive data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | yes | |
| `timestamp` | timestamp | yes | |
| `account_id` | FK→Account | yes | Who did it |
| `action` | enum | yes | `create`, `read`, `update`, `delete`, `verify`, `export`, `alert`, `login`, `permission_change`, `search`, `bulk_query` |
| `target_type` | text | yes | |
| `target_id` | UUID | no | |
| `details` | jsonb | yes | Action-specific details |
| `ip_address` | inet | no | |
| `user_agent` | text | no | |
| `session_id` | UUID | no | |
| `purpose_id` | FK→Purpose | no | Why they accessed it |
| `compartment_id` | FK→Compartment | no | Which compartment was accessed |

**Immutability:** AuditEntry is append-only. No updates, no deletes. Implemented via Postgres policies that deny UPDATE and DELETE. Partitioned by month for performance.

---

## Part VII: Relationship Types

Relationships are first-class objects. They are not implicit foreign keys. They carry type, directionality, strength, confidence, time validity, and evidence pointers.

### Relationship Structure

Every relationship in the system shares this structure:

```
┌─────────────────────────────────────────────┐
│                 Relationship                 │
├─────────────────────────────────────────────┤
│ id              UUID                        │
│ type            text (from taxonomy below)  │
│ source_type     text (entity/event type)    │
│ source_id       UUID                        │
│ target_type     text (entity/event type)    │
│ target_id       UUID                        │
│ directional     boolean                     │
│ strength        float (0.0–1.0)             │
│ confidence      float (0.0–1.0)             │
│ valid_from      timestamp                   │
│ valid_to        timestamp (null = current)  │
│ evidence_ids    UUID[]                      │
│ source_method   enum                        │
│ created_at      timestamp                   │
│ created_by      FK→Account                  │
│ compartment_id  FK→Compartment              │
└─────────────────────────────────────────────┘
```

### Relationship Taxonomy

Organized by domain. 76 relationship types total.

#### People ↔ People (8)

| Type | Direction | Description |
|------|-----------|-------------|
| `associated_with` | bidirectional | General known association |
| `family_of` | bidirectional | Family relationship |
| `communicates_with` | bidirectional | Known communication pattern |
| `commands` | A → B | Chain of command |
| `subordinate_of` | A → B | Inverse of commands |
| `alias_of` | A → B | One identity is an alias of another |
| `same_as` | bidirectional | Identity resolution: believed to be the same person |
| `rival_of` | bidirectional | Known antagonism |

#### People ↔ Organizations (7)

| Type | Direction | Description |
|------|-----------|-------------|
| `member_of` | Person → Org | Membership |
| `leads` | Person → Org | Leadership |
| `founded` | Person → Org | Founding relationship |
| `affiliated_with` | Person → Org | Looser than membership |
| `employed_by` | Person → Org | Employment |
| `spokesperson_for` | Person → Org | Public representation |
| `former_member_of` | Person → Org | Historical membership (also use valid_to) |

#### People ↔ Places (5)

| Type | Direction | Description |
|------|-----------|-------------|
| `resides_in` | Person → Place | Current residence |
| `frequents` | Person → Place | Regular presence |
| `originated_from` | Person → Place | Origin |
| `last_seen_at` | Person → Place | Most recent known location |
| `controls` | Person → Place | Exercises control over area |

#### People ↔ Assets (4)

| Type | Direction | Description |
|------|-----------|-------------|
| `owns` | Person → Asset | Ownership |
| `possesses` | Person → Asset | Physical possession (not necessarily ownership) |
| `uses` | Person → Asset | Known usage |
| `transferred_to` | Person → Asset | Received asset |

#### People ↔ Events (6)

| Type | Direction | Description |
|------|-----------|-------------|
| `participated_in` | Person → Event | General participation |
| `perpetrated` | Person → Event | Alleged perpetrator |
| `victim_of` | Person → Event | Victim |
| `witnessed` | Person → Event | Witness |
| `reported` | Person → Event | Reported the event |
| `responded_to` | Person → Event | Responded (first responder, analyst, etc.) |

#### Organizations ↔ Organizations (6)

| Type | Direction | Description |
|------|-----------|-------------|
| `allied_with` | bidirectional | Alliance |
| `opposed_to` | bidirectional | Opposition |
| `parent_of` | A → B | Parent organization |
| `splinter_of` | A → B | Broke away from |
| `coordinates_with` | bidirectional | Operational coordination |
| `front_for` | A → B | A is a front for B |

#### Organizations ↔ Places (5)

| Type | Direction | Description |
|------|-----------|-------------|
| `headquartered_in` | Org → Place | HQ location |
| `operates_in` | Org → Place | Area of operations |
| `controls` | Org → Place | Territorial control |
| `patrols` | Org → Place | Patrols/monitors area |
| `displaced_from` | Org → Place | Lost control of area |

#### Organizations ↔ Events (4)

| Type | Direction | Description |
|------|-----------|-------------|
| `perpetrated` | Org → Event | Organizational responsibility |
| `claimed_responsibility` | Org → Event | Claimed (may not be verified) |
| `responded_to` | Org → Event | Organizational response |
| `affected_by` | Org → Event | Impacted by |

#### Organizations ↔ Assets (3)

| Type | Direction | Description |
|------|-----------|-------------|
| `owns` | Org → Asset | Organizational ownership |
| `operates` | Org → Asset | Operates (vehicle fleet, infrastructure) |
| `seized` | Org → Asset | Confiscated/seized |

#### Places ↔ Places (5)

| Type | Direction | Description |
|------|-----------|-------------|
| `contains` | A → B | Administrative containment |
| `adjacent_to` | bidirectional | Geographic adjacency |
| `connected_by` | A → B (via asset/infra) | Road/route connection |
| `supply_route_to` | A → B | Supply/trade route |
| `evacuation_route_to` | A → B | Evacuation path |

#### Places ↔ Infrastructure (4)

| Type | Direction | Description |
|------|-----------|-------------|
| `located_in` | Infra → Place | Physical location |
| `serves` | Infra → Place | Service area |
| `critical_for` | Infra → Place | Critical dependency (this hospital is the only one for this zone) |
| `blocks_access_to` | Infra → Place | When disrupted, blocks access |

#### Events ↔ Events (6)

| Type | Direction | Description |
|------|-----------|-------------|
| `caused_by` | A → B | Causal relationship |
| `preceded` | A → B | Temporal ordering |
| `related_to` | bidirectional | General relationship |
| `escalated_to` | A → B | Escalation chain |
| `in_response_to` | A → B | Response event |
| `part_of` | A → B | Component of larger event |

#### Claims ↔ Everything (7)

| Type | Direction | Description |
|------|-----------|-------------|
| `asserts_existence_of` | Claim → Entity | Claim establishes an entity |
| `asserts_event` | Claim → Event | Claim reports an event |
| `asserts_relationship` | Claim → Relationship | Claim asserts a connection |
| `corroborates` | Claim → Claim | Supports another claim |
| `contradicts` | Claim → Claim | Conflicts with another claim |
| `updates` | Claim → Claim | New information about same subject |
| `retracts` | Claim → Claim | Withdraws a previous claim |

#### Evidence ↔ Claims (3)

| Type | Direction | Description |
|------|-----------|-------------|
| `supports` | Evidence → Claim | Evidence backing a claim |
| `contradicts` | Evidence → Claim | Evidence against a claim |
| `depicts` | Evidence → Entity/Event | Evidence shows an entity or event |

#### Derived Intelligence ↔ Sources (3)

| Type | Direction | Description |
|------|-----------|-------------|
| `derived_from` | Insight → Signal/Claim | Input lineage |
| `produced_by` | Insight → ModelRun | Which analysis created this |
| `informs` | Insight → Alert/Briefing | Downstream products |

---

## Part VIII: Implementation Notes

### PostGIS Setup

Supabase supports PostGIS. Enable via:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

All `geometry` columns should use SRID 4326 (WGS84) for GPS compatibility:
```sql
ALTER TABLE signals ADD COLUMN geometry geometry(Geometry, 4326);
CREATE INDEX idx_signals_geometry ON signals USING GIST (geometry);
```

Spatial queries then become:
```sql
-- Incidents within 500m of all schools
SELECT i.* FROM incidents i
JOIN infrastructure s ON s.type = 'school'
WHERE ST_DWithin(i.geometry::geography, s.geometry::geography, 500)
AND i.occurred_at > NOW() - INTERVAL '30 days';
```

### Relationship Table Design

The polymorphic relationship table uses `source_type`/`target_type` + `source_id`/`target_id` rather than per-pair join tables. This is a deliberate trade-off:

**Advantages:**
- Single table to query for all relationships of any entity
- Relationship types can be added without schema changes
- Graph traversal queries are straightforward

**Costs:**
- No foreign key enforcement (mitigated by application-level validation + triggers)
- Needs careful indexing

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  directional BOOLEAN NOT NULL DEFAULT true,
  strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  evidence_ids UUID[] DEFAULT '{}',
  source_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES accounts(id),
  compartment_id UUID REFERENCES compartments(id)
);

CREATE INDEX idx_rel_source ON relationships(source_type, source_id);
CREATE INDEX idx_rel_target ON relationships(target_type, target_id);
CREATE INDEX idx_rel_type ON relationships(type);
CREATE INDEX idx_rel_valid ON relationships(valid_from, valid_to);
```

### Event Sourcing for Entity State

Entity attributes that change over time (Person status, Organization control zones, Infrastructure status) are tracked via an event-sourced pattern:

```sql
CREATE TABLE entity_state_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  attribute TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID NOT NULL REFERENCES accounts(id),
  reason TEXT,
  claim_id UUID,  -- what claim triggered this change
  audit_entry_id UUID NOT NULL REFERENCES audit_entries(id)
);
```

The "current" state is always the latest entry. Historical state at any point in time can be reconstructed by replaying changes up to that timestamp.

### Migration from Current Schema

```
Current                    Ontology
─────────────────────────────────────────
incidents           →      claims (with source_method='citizen_report')
incident_media      →      evidence_items
(no auth)           →      accounts (via Supabase Auth)
(no zones)          →      places (import Haiti admin boundaries)
(no verification)   →      verification_actions
(upvotes/downvotes) →      signal_votes table + atomic RPC
(no relationships)  →      relationships table
```

The migration is additive — existing data is preserved and enriched, not deleted.

### Row Level Security Strategy

Every table gets RLS policies. Example for `claims`:

```sql
-- Citizens see their own claims + assessed claims in their zone
CREATE POLICY claims_citizen_read ON claims FOR SELECT
USING (
  auth.uid() = account_id
  OR (
    status = 'assessed'
    AND compartment_id IS NULL  -- not compartmented
    AND EXISTS (
      SELECT 1 FROM account_preferences ap
      WHERE ap.account_id = auth.uid()
      AND ST_DWithin(
        claims.geometry::geography,
        ap.home_location::geography,
        ap.alert_radius_meters
      )
    )
  )
);

-- Analysts see everything in their compartments
CREATE POLICY claims_analyst_read ON claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = auth.uid()
    AND 'analyst' = ANY(a.roles)
    AND (
      claims.compartment_id IS NULL
      OR claims.compartment_id = ANY(a.compartments)
    )
  )
);
```

---

## Summary

This ontology provides **25 object types** and **76 relationship types** organized into six categories:

| Category | Types | Purpose |
|----------|-------|---------|
| Entities | Person, Organization, Place, Asset, Infrastructure, Account | Things that exist |
| Events | Incident, Observation, Communication, Movement, ServiceRequest, Disruption, DisasterImpact | Things that happen |
| Assertions | Claim, EvidenceItem, Source, VerificationAction, ConfidenceScore | What the system believes and why |
| Derived | Pattern, Situation, DerivedInsight, ModelRun, Explanation, Alert | Products of analysis |
| Operational | Case, Task, Briefing, ResponseAction | Workflow and coordination |
| Access | Policy, Role, Compartment, Purpose, AuditEntry | Who sees what, why, and the record of it |

Every object carries provenance. Every relationship carries time validity and confidence. Every derived product links to its inputs and model. Every access is audited.

This is not a database schema. It is a world model. The database schema is derived from it. The API is derived from it. The UI is derived from it. The access control is derived from it.

Citadel does not model an app. It models Haiti.
