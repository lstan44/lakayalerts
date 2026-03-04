# CITADEL — Technical Plan

**Haiti's National Intelligence & Decision Platform**

*From LakayAlerts to Citadel: The Architecture of National Awareness*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Target Vision & Architecture](#3-target-vision--architecture)
4. [The Five Strategic Layers](#4-the-five-strategic-layers)
5. [Domain Model & Data Architecture](#5-domain-model--data-architecture)
6. [System Architecture](#6-system-architecture)
7. [Phased Delivery Roadmap](#7-phased-delivery-roadmap)
8. [Security & Trust Architecture](#8-security--trust-architecture)
9. [AI & Intelligence Engine](#9-ai--intelligence-engine)
10. [Infrastructure & Operations](#10-infrastructure--operations)
11. [Risk Register](#11-risk-register)
12. [Appendix: Technical Specifications](#12-appendix-technical-specifications)

---

## 1. Executive Summary

Citadel transforms a single-purpose crime reporting app into Haiti's national intelligence and decision platform. It aggregates fragmented signals from citizens, institutions, sensors, and open data into a unified stream of real-time national awareness.

The system must serve three fundamentally different user populations simultaneously:

| Persona | Need | Interface |
|---------|------|-----------|
| **Citizens** | Report incidents, receive alerts, stay safe | Mobile-first PWA, SMS, USSD, voice |
| **Analysts** | Detect patterns, verify signals, produce intelligence | Dashboard with advanced filtering, temporal/spatial analysis |
| **Decision Makers** | Understand national situation, coordinate response | Strategic dashboard, briefing generation, alert escalation |

The transformation is organized into **five phases** over approximately 18 months, each phase delivering a usable, deployable product increment.

---

## 2. Current State Assessment

### 2.1 What Exists

| Layer | Current State | Assessment |
|-------|---------------|------------|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, Leaflet maps | Solid foundation. Keep. |
| **Backend** | Supabase (Postgres + Storage + Auth) | Viable for Phase 1-2. Will need supplemental services. |
| **Data Model** | 2 tables: `incidents`, `incident_media` | Minimal. Must be expanded dramatically. |
| **Auth** | None implemented. User type defined but unused. | Critical gap. Must be Phase 1 priority. |
| **Signal Types** | 7 hardcoded crime/disaster types | Must become an extensible taxonomy. |
| **Verification** | Boolean `verified` flag, upvote/downvote (race condition) | Primitive. Must become multi-layered trust system. |
| **Analysis** | None | Core Citadel capability — must be built. |
| **Notifications** | Bell icon placeholder, no implementation | Must support push, SMS, email, in-app. |
| **i18n** | Language field in User type (`ht`/`fr`), no implementation | Must support Haitian Creole, French, English. |
| **Offline** | None | Critical for Haiti's connectivity landscape. |

### 2.2 Technical Debt to Resolve

1. **Vote race condition** — `updateIncidentVotes` uses read-then-write. Must use atomic increment (`rpc` or Postgres function).
2. **No authentication** — `reporter_id` field exists in schema but is never set.
3. **Unused `fetchIncidentById`** — Detail page filters in-memory from full list.
4. **No error boundaries** — A single component crash takes down the app.
5. **`index.html` title** — Still says "Vite + React + TS".
6. **Package name** — Still `vite-react-typescript-starter`.
7. **No tests** — Zero test coverage.
8. **No CI/CD pipeline.**
9. **No environment configuration management.**
10. **`replace('_', ' ')` for type display** — Works by coincidence (all current types have one underscore). Should use `replaceAll` or a display name map.

### 2.3 What to Preserve

- React + TypeScript + Vite toolchain
- Tailwind CSS design system
- Leaflet/OpenStreetMap mapping (no vendor lock-in, works offline)
- Supabase as the primary data layer
- React Query caching and refetch patterns
- Component composition patterns (already clean)

---

## 3. Target Vision & Architecture

### 3.1 The Citadel Metaphor

The name references the Citadelle Laferrière — the mountaintop fortress built after Haiti's revolution. That fortress was built so the nation could never be surprised again.

Citadel (the platform) serves the same purpose in the information domain.

### 3.2 Core Architectural Principles

1. **Signal-first, not form-first.** Every input is a signal. A text report, a photo, a GPS coordinate, a social media post — they are all signals with varying confidence levels. The system processes signals, not forms.

2. **Offline-capable by default.** Haiti has intermittent connectivity. Every citizen-facing feature must work offline and sync when connectivity returns. This is not optional.

3. **Multi-channel input.** Not everyone has a smartphone. The system must accept signals via: app, SMS (Twilio/local telco), USSD, voice (IVR), web, API, and eventually IoT sensors.

4. **Trust is computed, not assumed.** Every signal has a confidence score derived from: source reputation, corroboration count, temporal consistency, spatial plausibility, and AI analysis.

5. **Progressive disclosure.** Citizens see a simple, focused interface. Analysts see data density. Decision makers see strategic summaries. Same data, different lenses.

6. **Extensible taxonomy.** Incident types are not hardcoded enums. They are a hierarchical taxonomy that can grow to cover crime, health, infrastructure, economics, environment, and more.

7. **Sovereignty-aware.** Data stays in-region where possible. No dependency on a single foreign cloud provider for core operations.

### 3.3 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CITADEL PLATFORM                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Citizen   │  │ Analyst  │  │ Command  │  │ External API     │   │
│  │ App (PWA) │  │ Console  │  │ Dashboard│  │ Partners/NGOs    │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────────┬─────────┘   │
│        │             │             │                 │              │
│  ┌─────▼─────────────▼─────────────▼─────────────────▼──────────┐  │
│  │                    API GATEWAY / BFF                          │  │
│  │            (Auth, Rate Limiting, Routing)                    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │                    SERVICE LAYER                              │  │
│  │                                                               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐           │  │
│  │  │ Signal  │ │ Identity │ │ Alert  │ │ Analysis │           │  │
│  │  │ Ingestion│ │ & Trust  │ │ Engine │ │ Engine   │           │  │
│  │  └────┬────┘ └────┬─────┘ └───┬────┘ └────┬─────┘           │  │
│  │       │           │           │            │                  │  │
│  │  ┌────▼───┐ ┌─────▼────┐ ┌───▼─────┐ ┌───▼──────┐          │  │
│  │  │ Media  │ │ Reputation│ │Notifica-│ │ Pattern  │          │  │
│  │  │ Proc.  │ │ System   │ │ tion    │ │ Detection│          │  │
│  │  └────────┘ └──────────┘ └─────────┘ └──────────┘          │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │                    DATA LAYER                                │  │
│  │                                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐     │  │
│  │  │ Postgres │  │ Time-    │  │ Blob    │  │ Cache    │     │  │
│  │  │ (Supa-   │  │ series   │  │ Storage │  │ (Redis)  │     │  │
│  │  │  base)   │  │ (signals)│  │ (media) │  │          │     │  │
│  │  └──────────┘  └──────────┘  └─────────┘  └──────────┘     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  INGESTION LAYER                              │  │
│  │  SMS Gateway │ USSD │ Social Media │ RSS │ Sensors │ APIs   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. The Five Strategic Layers

### Layer 1: Signal Collection

**Purpose:** Capture information from every possible source with minimal friction.

#### Signal Sources (Ordered by Implementation Priority)

| Source | Channel | Priority | Phase |
|--------|---------|----------|-------|
| Citizen reports | PWA (existing) | P0 | 1 |
| Citizen reports | SMS / USSD | P0 | 2 |
| Citizen reports | Voice (IVR) | P1 | 3 |
| Authority reports | Analyst console | P0 | 2 |
| Social media | Twitter/X, Facebook scraping | P1 | 3 |
| News feeds | RSS / web scraping | P1 | 3 |
| Weather/disaster | NOAA, USGS APIs | P1 | 2 |
| Satellite imagery | Sentinel, Maxar (stretch) | P2 | 4 |
| IoT sensors | Water level, air quality, traffic | P2 | 5 |
| Economic signals | Price indices, market data | P2 | 4 |
| Partner APIs | NGOs, UN agencies | P1 | 3 |

#### Signal Data Model

Every input becomes a **Signal** — the atomic unit of Citadel:

```typescript
interface Signal {
  id: string;
  source: SignalSource;          // who/what produced this
  channel: SignalChannel;        // how it arrived (app, sms, api, scrape...)
  type: string;                  // taxonomic classification
  category: SignalCategory;      // SECURITY | INFRASTRUCTURE | HEALTH | ENVIRONMENT | ECONOMIC | SOCIAL
  content: {
    text?: string;
    media?: MediaRef[];
    structured?: Record<string, unknown>;  // for machine-generated signals
  };
  location?: GeoPoint;
  area?: GeoPolygon;             // for area-wide signals (e.g., "all of Cité Soleil")
  timestamp: string;             // when event occurred (reporter's claim)
  received_at: string;           // when system received it
  confidence: number;            // 0.0 - 1.0, computed
  severity: SeverityLevel;
  verification: VerificationState;
  corroborations: string[];      // IDs of signals that corroborate this one
  metadata: Record<string, unknown>;
}
```

#### Offline-First Reporting

```
Reporter opens app (offline)
  → Report stored in IndexedDB with pending status
  → Background sync registered (Service Worker)

Connectivity returns
  → Service Worker fires sync event
  → Queued signals uploaded with original timestamps
  → Server acknowledges, local cache updated
  → Push notification confirms submission
```

### Layer 2: Signal Verification

**Purpose:** Separate noise from truth. Transform raw signals into verified intelligence.

#### Trust Score Architecture

Every entity in the system has a **Trust Score** (0-100):

```
Trust Score = f(
  account_age,           // older accounts are more trusted
  verification_level,    // phone, email, government ID, institutional
  historical_accuracy,   // % of past signals that were corroborated
  community_standing,    // net positive/negative interactions
  signal_consistency,    // do their signals match spatial/temporal patterns?
  penalty_history        // false reports reduce trust significantly
)
```

#### Verification Pipeline

```
Signal arrives
  │
  ├── Automated checks (instant)
  │   ├── Spam / duplicate detection
  │   ├── Location plausibility (is the GPS in Haiti?)
  │   ├── Temporal plausibility (is the timestamp reasonable?)
  │   ├── Media analysis (EXIF data, reverse image search, AI content detection)
  │   └── Source trust score lookup
  │
  ├── Corroboration engine (continuous)
  │   ├── Spatial clustering (other signals within radius + time window?)
  │   ├── Cross-source matching (same event from different sources?)
  │   └── Confidence recalculation on every new corroboration
  │
  ├── AI analysis (async, seconds)
  │   ├── NLP classification and entity extraction
  │   ├── Sentiment and urgency scoring
  │   ├── Image/video content classification
  │   └── Anomaly detection against historical patterns
  │
  └── Human verification (when needed)
      ├── Analyst queue for ambiguous signals
      ├── Community verification (crowdsourced for non-sensitive)
      └── Institutional verification (for official confirmations)
```

#### Confidence Score Calculation

```
confidence = (
  source_trust * 0.25 +
  corroboration_factor * 0.30 +
  ai_assessment * 0.20 +
  spatial_plausibility * 0.10 +
  temporal_plausibility * 0.10 +
  human_verification * 0.05
)
```

Signals below a configurable threshold (e.g., 0.3) are quarantined. Above 0.7, they are treated as verified.

### Layer 3: Pattern Recognition

**Purpose:** Detect emerging situations before they are obvious to humans.

#### Pattern Types

| Pattern | Description | Example |
|---------|-------------|---------|
| **Spatial Cluster** | Unusual concentration of signals in an area | 8 robbery reports in Tabarre within 2 hours |
| **Temporal Spike** | Abnormal increase in signal frequency for a type | Kidnapping reports 3x above 30-day average |
| **Movement Pattern** | Directional drift of signal clusters over time | Gang activity signals moving south from Croix-des-Bouquets |
| **Correlation** | Two signal types occurring together | Road closures + gunfire reports in same zone |
| **Absence Pattern** | Expected signals stop appearing | Zero reports from a normally active zone (may indicate fear/control) |
| **Escalation** | Severity increasing over time in an area | Signals upgrading from MODERATE to HIGH to CRITICAL |
| **Seasonal** | Patterns matching historical time-of-year trends | Flooding signals during hurricane season |

#### Detection Methods

- **Geospatial clustering**: DBSCAN / HDBSCAN on signal coordinates with time windowing
- **Time series analysis**: STL decomposition, anomaly detection on signal frequency
- **Graph analysis**: Network of correlated signals, community detection
- **AI classification**: Fine-tuned models on historical Haitian incident data
- **Rule engine**: Configurable analyst-defined triggers (e.g., "if > N kidnappings in zone X within T hours, escalate")

### Layer 4: Strategic Intelligence

**Purpose:** Present synthesized understanding to decision makers.

#### Analyst Console Features

- **Live signal feed** with advanced filtering (type, severity, confidence, zone, time range)
- **Heat maps** showing signal density by type, time, severity
- **Timeline view** showing event evolution
- **Zone profiles** — aggregate statistics for each geographic area
- **Trend analysis** — how is this week different from last week?
- **Relationship graph** — which signals and events are connected?
- **Briefing generator** — AI-assisted summary of the current national situation
- **Alert configuration** — custom triggers for specific patterns

#### Decision Maker Dashboard

- **National threat level** (computed aggregate)
- **Top 5 active situations** with summaries
- **Department/region breakdown** with color-coded status
- **Resource allocation view** — where are responders deployed?
- **Historical comparison** — same period last month/year
- **Export and sharing** — PDF briefings, secure sharing

### Layer 5: Coordinated Response

**Purpose:** Turn intelligence into action.

#### Response Capabilities

- **Alert broadcasting** — Push targeted alerts to citizens by zone
- **Responder dispatch** — Integrate with emergency services
- **Situation rooms** — Shared workspace for multi-agency coordination
- **Public information** — Verified public alerts (distinct from unverified signals)
- **After-action tracking** — Was the response effective? Close the loop.

---

## 5. Domain Model & Data Architecture

### 5.1 Core Entities

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Account    │────▶│   Signal     │────▶│    Media     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ type         │     │ source_id    │     │ signal_id    │
│ trust_score  │     │ channel      │     │ type         │
│ roles[]      │     │ type         │     │ url          │
│ verified_at  │     │ category     │     │ analysis     │
│ preferences  │     │ content      │     └──────────────┘
└──────────────┘     │ location     │
                     │ severity     │     ┌──────────────┐
┌──────────────┐     │ confidence   │────▶│Corroboration │
│    Zone      │◀────│ zone_id      │     │              │
│              │     │ verification │     │ signal_a_id  │
│ id           │     │ created_at   │     │ signal_b_id  │
│ name         │     └──────────────┘     │ type         │
│ boundary     │                          │ strength     │
│ department   │     ┌──────────────┐     └──────────────┘
│ threat_level │     │   Pattern    │
│ population   │     │              │     ┌──────────────┐
└──────────────┘     │ id           │     │    Alert     │
                     │ type         │     │              │
┌──────────────┐     │ signals[]    │     │ id           │
│  Situation   │◀────│ situation_id │     │ situation_id │
│              │     │ confidence   │     │ zone_ids[]   │
│ id           │     │ detected_at  │     │ severity     │
│ title        │     └──────────────┘     │ message      │
│ status       │                          │ channels[]   │
│ severity     │                          │ sent_at      │
│ signals[]    │                          └──────────────┘
│ zones[]      │
│ created_at   │
│ resolved_at  │
└──────────────┘
```

### 5.2 Database Evolution Plan

**Current (2 tables):**
- `incidents`
- `incident_media`

**Phase 1 Target (8 tables):**
- `accounts` — authenticated users with roles and trust scores
- `signals` — replaces `incidents`, expanded schema
- `signal_media` — replaces `incident_media`
- `zones` — geographic zones with boundaries
- `signal_votes` — replaces the race-condition vote columns, one row per user per signal
- `verification_actions` — audit trail of verification decisions
- `account_sessions` — session management
- `account_preferences` — notification and display preferences

**Phase 2 Target (adds 6 tables):**
- `patterns` — detected patterns
- `situations` — aggregated events
- `alerts` — sent alerts
- `alert_subscriptions` — who gets what alerts
- `corroborations` — signal-to-signal corroboration links
- `ingestion_sources` — configured external data sources

**Phase 3+ Target (adds 5+ tables):**
- `briefings` — generated intelligence briefings
- `response_actions` — coordinated response tracking
- `zone_statistics` — precomputed zone-level aggregates (materialized)
- `signal_classifications` — AI classification results
- `audit_log` — comprehensive system audit trail

### 5.3 Migration Strategy

The existing `incidents` table will be migrated to `signals` with a Supabase migration:

```sql
-- Phase 1 Migration (simplified)
ALTER TABLE incidents RENAME TO signals;
ALTER TABLE signals ADD COLUMN source_type TEXT DEFAULT 'citizen';
ALTER TABLE signals ADD COLUMN channel TEXT DEFAULT 'web_app';
ALTER TABLE signals ADD COLUMN category TEXT DEFAULT 'SECURITY';
ALTER TABLE signals ADD COLUMN confidence FLOAT DEFAULT 0.5;
ALTER TABLE signals ADD COLUMN zone_id UUID REFERENCES zones(id);

-- Atomic vote increment (fixes race condition)
CREATE OR REPLACE FUNCTION increment_vote(signal_id UUID, vote_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF vote_type = 'upvote' THEN
    UPDATE signals SET upvotes = upvotes + 1 WHERE id = signal_id;
  ELSIF vote_type = 'downvote' THEN
    UPDATE signals SET downvotes = downvotes + 1 WHERE id = signal_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. System Architecture

### 6.1 Frontend Architecture

#### Application Shell (Progressive Web App)

```
src/
├── app/
│   ├── App.tsx                    # Root with providers
│   ├── router.tsx                 # Route definitions
│   └── providers/
│       ├── AuthProvider.tsx        # Authentication context
│       ├── QueryProvider.tsx       # React Query config
│       ├── I18nProvider.tsx        # Internationalization
│       ├── OfflineProvider.tsx     # Service Worker + sync
│       └── ThemeProvider.tsx       # Citadel design system
│
├── features/
│   ├── signals/                   # Signal collection & display
│   │   ├── components/
│   │   │   ├── SignalFeed.tsx      # Real-time signal list
│   │   │   ├── SignalCard.tsx      # Individual signal display
│   │   │   ├── SignalDetail.tsx    # Full signal view
│   │   │   ├── SignalMap.tsx       # Map with signal markers
│   │   │   ├── ReportFlow.tsx     # Multi-step reporting wizard
│   │   │   └── MediaCapture.tsx   # Camera/file upload
│   │   ├── hooks/
│   │   │   ├── useSignals.ts      # Signal data fetching
│   │   │   ├── useReportSignal.ts # Signal submission
│   │   │   └── useNearbySignals.ts
│   │   ├── services/
│   │   │   └── signalService.ts
│   │   └── types.ts
│   │
│   ├── auth/                      # Authentication
│   │   ├── components/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── PhoneVerify.tsx
│   │   │   └── ProfileSetup.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── services/
│   │       └── authService.ts
│   │
│   ├── alerts/                    # Alert system
│   │   ├── components/
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── AlertList.tsx
│   │   │   └── AlertPreferences.tsx
│   │   └── hooks/
│   │       └── useAlerts.ts
│   │
│   ├── zones/                     # Zone intelligence
│   │   ├── components/
│   │   │   ├── ZoneProfile.tsx
│   │   │   ├── ZoneMap.tsx
│   │   │   └── ZoneStats.tsx
│   │   └── hooks/
│   │       └── useZone.ts
│   │
│   ├── analyst/                   # Analyst console (Phase 2)
│   │   ├── components/
│   │   │   ├── AnalystDashboard.tsx
│   │   │   ├── SignalQueue.tsx
│   │   │   ├── PatternViewer.tsx
│   │   │   ├── HeatMap.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── SituationRoom.tsx
│   │   └── hooks/
│   │
│   └── command/                   # Command dashboard (Phase 3)
│       ├── components/
│       │   ├── NationalOverview.tsx
│       │   ├── ThreatBoard.tsx
│       │   ├── BriefingView.tsx
│       │   └── ResponseTracker.tsx
│       └── hooks/
│
├── shared/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── Map/                   # Reusable map components
│   │   ├── Layout/
│   │   └── ui/                    # Design system primitives
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useOffline.ts
│   │   └── useRealtime.ts        # Supabase realtime subscriptions
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── haversine.ts
│   │   ├── confidence.ts          # Confidence score calculations
│   │   └── i18n.ts
│   └── types/
│       ├── signal.ts
│       ├── account.ts
│       ├── zone.ts
│       └── common.ts
│
├── service-worker/
│   ├── sw.ts                      # Service worker entry
│   ├── sync.ts                    # Background sync logic
│   └── cache.ts                   # Cache strategies
│
└── assets/
    └── locales/
        ├── ht.json                # Haitian Creole
        ├── fr.json                # French
        └── en.json                # English
```

#### Three Interface Modes

The app detects the user's role and renders accordingly:

1. **Citizen Mode** (default) — Simple, focused. Report signals, view nearby alerts, map view. Minimal cognitive load. Works offline.

2. **Analyst Mode** — Dense information. Signal queues, pattern overlays, filtering, verification tools, timeline scrubbing.

3. **Command Mode** — Strategic view. National dashboard, situation summaries, response coordination.

These are **not** three separate apps. They are three presentation layers over the same data, controlled by role-based access.

### 6.2 Backend Architecture

#### Supabase as Core (Phases 1-3)

Supabase remains the primary backend for:
- **PostgreSQL** — primary database, RLS (Row Level Security) for access control
- **Auth** — phone/email authentication, OAuth for institutional users
- **Realtime** — WebSocket subscriptions for live signal feeds
- **Storage** — media files (images, video, audio)
- **Edge Functions** — serverless compute for signal processing

#### Supplemental Services (Phase 2+)

As the platform grows beyond what Supabase alone can handle:

| Service | Purpose | Technology |
|---------|---------|------------|
| **Signal Processor** | Ingests, classifies, scores signals | Supabase Edge Functions → later Deno/Node microservice |
| **Pattern Engine** | Runs detection algorithms on signal stream | Python service (scikit-learn, HDBSCAN) |
| **AI Service** | NLP, image analysis, anomaly detection | Claude API / local models |
| **Notification Service** | Multi-channel alert delivery | Supabase Edge Function + Twilio (SMS) + FCM (push) |
| **Ingestion Workers** | Pull from external sources | Scheduled Edge Functions / cron |
| **Cache Layer** | Hot data, rate limiting, session state | Upstash Redis (serverless) |

### 6.3 Real-Time Architecture

```
Citizen submits signal
  │
  ▼
Supabase Insert (signals table)
  │
  ├──▶ Postgres trigger → fires Supabase Realtime event
  │     │
  │     └──▶ All connected clients receive update via WebSocket
  │          (analysts see it in queue, citizens see nearby signals update)
  │
  └──▶ Database webhook → Edge Function: process_signal
        │
        ├── Classify signal (type, category)
        ├── Calculate initial confidence
        ├── Check for corroborations (spatial + temporal query)
        ├── Update confidence if corroborated
        ├── Check pattern triggers
        └── Queue notifications if thresholds met
```

### 6.4 API Design

#### REST Endpoints (Supabase auto-generated + custom)

```
# Signals
GET    /signals                    # List signals (filtered, paginated)
GET    /signals/:id                # Get single signal
POST   /signals                    # Create signal (citizen report)
PATCH  /signals/:id/verify         # Analyst verification action
POST   /signals/:id/vote           # Atomic vote (replaces current)

# Zones
GET    /zones                      # List zones
GET    /zones/:id                  # Zone profile with statistics
GET    /zones/:id/signals          # Signals in zone

# Alerts
GET    /alerts                     # Alerts for current user
POST   /alerts                     # Create alert (analyst/system)
PUT    /alerts/preferences         # Update alert preferences

# Patterns (Phase 2+)
GET    /patterns                   # Detected patterns
GET    /patterns/:id               # Pattern detail

# Situations (Phase 2+)
GET    /situations                 # Active situations
GET    /situations/:id             # Situation detail with signals

# Analysis (Phase 3+)
GET    /analysis/heatmap           # Heatmap data
GET    /analysis/trends            # Trend data
GET    /analysis/briefing          # AI-generated briefing
```

---

## 7. Phased Delivery Roadmap

### Phase 1: Foundation (Weeks 1-8)
**Theme: "Make what exists reliable, add identity, rebrand"**

This phase transforms the prototype into a trustworthy foundation.

#### 1.1 Identity & Authentication
- Implement Supabase Auth (phone OTP primary, email secondary)
- Account creation flow with phone verification
- Anonymous reporting preserved (creates ephemeral session)
- Role system: `citizen`, `verified_citizen`, `analyst`, `admin`
- Row Level Security policies on all tables

#### 1.2 Data Model Migration
- Rename `incidents` → `signals`
- Add `confidence`, `category`, `channel`, `source_type` columns
- Create `zones` table with Haiti's geographic divisions (departments, communes, sections)
- Create `signal_votes` table (replaces race-condition columns)
- Atomic vote function via Postgres RPC
- Create `accounts` table extending Supabase auth.users

#### 1.3 Rebranding & Design System
- Rename project: LakayAlerts → Citadel
- New visual identity: dark theme (strategic, professional), accent color palette
- Design token system via Tailwind config
- New Header with Citadel branding
- Update `index.html` title, meta tags, favicon, manifest

#### 1.4 Signal Taxonomy Expansion
- Replace hardcoded `type` enum with extensible taxonomy:
  - **Security**: Gang Activity, Kidnapping, Robbery, Assault, Shooting, Sexual Violence, Terrorism
  - **Infrastructure**: Road Closure, Power Outage, Water Disruption, Building Collapse, Telecom Outage
  - **Natural Disaster**: Hurricane, Flooding, Earthquake, Landslide, Drought
  - **Health**: Disease Outbreak, Hospital Overcrowding, Contamination
  - **Social**: Protest, Civil Unrest, Election Incident, Displacement
  - **Economic**: Market Disruption, Supply Shortage, Price Spike

#### 1.5 Core Bug Fixes & Quality
- Fix vote race condition (atomic increment)
- Use `fetchIncidentById` properly in detail page
- Add React Error Boundaries
- Set up ESLint strict config + Prettier
- Set up Vitest + React Testing Library
- Basic test coverage for services and critical components
- CI pipeline (GitHub Actions): lint, typecheck, test, build

#### 1.6 Offline Foundations
- Service Worker registration
- App manifest for PWA (installable)
- Basic asset caching (app shell, map tiles)
- IndexedDB storage for pending reports

**Phase 1 Deliverable:** A rebranded, authenticated, offline-installable app with an expanded signal taxonomy, clean data model, atomic voting, and CI pipeline.

---

### Phase 2: Intelligence (Weeks 9-18)
**Theme: "The system begins to think"**

#### 2.1 Verification Engine
- Automated confidence scoring on signal creation
- Corroboration detection: when a new signal matches existing signals (same type + nearby location + recent time), automatically link them and boost confidence
- Analyst verification queue: signals below confidence threshold land in a review queue
- Verification audit trail

#### 2.2 Analyst Console
- New route: `/analyst` (role-gated)
- Signal queue with bulk actions (verify, dismiss, merge, escalate)
- Advanced filtering: type, severity, confidence range, zone, time range, source trust
- Map with heat map overlay (signal density)
- Basic timeline view
- Signal detail with full provenance chain

#### 2.3 Zone Intelligence
- Interactive zone map (Haiti departments → communes → sections)
- Zone profiles: recent signals, trends, threat level
- Zone-level statistics (computed via Postgres materialized views)
- Zone comparison tool

#### 2.4 Real-Time Feeds
- Supabase Realtime subscriptions for live signal updates
- WebSocket-based signal feed (new signals appear without refresh)
- Typing indicators / live user count on situation views

#### 2.5 Notification System
- In-app notifications (bell icon becomes functional)
- Push notifications (FCM via Supabase Edge Functions)
- SMS alerts for critical situations (Twilio integration)
- User-configurable alert preferences: zone radius, signal types, severity threshold

#### 2.6 Multi-Channel Ingestion
- SMS reporting endpoint (Twilio webhook → Edge Function → signal)
- External data source: weather/disaster alerts (NOAA API)
- Basic RSS/news ingestion for context (not treated as verified signals)

#### 2.7 Internationalization
- i18n framework (react-i18next or lightweight alternative)
- Full Haitian Creole translation
- French translation
- Language selector in user preferences
- Signal content stays in original language (no auto-translate yet)

**Phase 2 Deliverable:** A platform with real-time intelligence feeds, analyst verification workflows, zone-based situational awareness, multi-channel input, and a notification system.

---

### Phase 3: Pattern Recognition (Weeks 19-28)
**Theme: "The system sees what humans miss"**

#### 3.1 Pattern Detection Engine
- Spatial clustering (DBSCAN on signal coordinates, configurable radius + time window)
- Temporal anomaly detection (signal frequency vs. historical baseline)
- Escalation detection (severity trending upward in a zone)
- Absence detection (zones that go silent)
- Configurable analyst-defined trigger rules

#### 3.2 Situation Management
- Patterns automatically create **Situations** (aggregated events)
- Situation lifecycle: `emerging → active → stabilizing → resolved`
- Analyst can manually create, merge, split situations
- Situation timeline showing evolution
- Situation room: shared workspace for multi-analyst collaboration

#### 3.3 AI Integration
- Claude API integration for:
  - Signal classification (auto-categorize free-text reports)
  - Summarization (daily/weekly situation briefs)
  - Anomaly explanation (why is this pattern unusual?)
  - Threat assessment (given these signals, what is the likely trajectory?)
- Image analysis: classify uploaded photos (fire, flooding, crowd, weapon)
- Voice-to-text for voice reports (Whisper or similar)

#### 3.4 Command Dashboard
- New route: `/command` (admin role only)
- National overview: map with department-level threat colors
- Top situations board
- Trend comparison (week-over-week, month-over-month)
- AI-generated daily briefing

#### 3.5 Advanced Mapping
- Satellite imagery base layer option
- Time-slider to replay signal history
- Custom marker icons by signal type and severity
- Cluster visualization at zoom levels
- Route analysis (safe corridor planning)

**Phase 3 Deliverable:** A platform with automated pattern detection, AI-assisted analysis, situation management, and a command-level national dashboard.

---

### Phase 4: Ecosystem (Weeks 29-40)
**Theme: "The nation connects"**

#### 4.1 Partner API
- RESTful API for institutional partners (NGOs, UN agencies, government)
- API key management, rate limiting, audit logging
- Webhook subscriptions (push data to partners on events)
- Data sharing agreements enforced in code (what data goes to whom)

#### 4.2 Coordinated Response
- Response action tracking (who is doing what, where)
- Resource allocation view (map of responder positions)
- Inter-agency messaging (secure, audited)
- After-action reports (link response to outcomes)

#### 4.3 Economic & Infrastructure Intelligence
- Price monitoring signals (basic goods, fuel)
- Infrastructure status tracking (roads, bridges, power grid)
- Supply chain indicators (port activity, import data)

#### 4.4 Public-Facing Layer
- Verified public alert page (no login required)
- Embeddable alert widget for news sites
- Public API for verified signals (open data commitment)

#### 4.5 Mobile Optimization
- Native-like experience via enhanced PWA
- Camera integration for quick reporting
- Background location (opt-in) for automatic zone alerts
- Battery-conscious design

**Phase 4 Deliverable:** A connected ecosystem with partner APIs, coordinated response capabilities, economic intelligence, and a public information layer.

---

### Phase 5: National Nervous System (Weeks 41+)
**Theme: "The country becomes aware of itself"**

#### 5.1 Predictive Intelligence
- ML models trained on historical signal data
- Predictive risk scores by zone and time
- Early warning system for escalating situations
- "What if" scenario modeling

#### 5.2 Expanded Sensor Network
- IoT device integration (water level sensors, air quality)
- Traffic flow analysis (cell tower data, partner APIs)
- Satellite change detection (deforestation, construction, displacement camps)

#### 5.3 Public Health Module
- Disease outbreak tracking
- Hospital capacity monitoring
- Contamination alerts

#### 5.4 Election Security Module
- Polling station incident reporting
- Vote count anomaly detection
- Observer report aggregation

#### 5.5 Disaster Preparedness
- Hurricane tracking integration
- Flood prediction models
- Evacuation route planning
- Resource pre-positioning

**Phase 5 Deliverable:** A mature national intelligence infrastructure with predictive capabilities, expanded sensor networks, and domain-specific modules.

---

## 8. Security & Trust Architecture

### 8.1 Authentication & Authorization

| Level | Mechanism | Access |
|-------|-----------|--------|
| **Anonymous** | Ephemeral session | Submit signals only |
| **Citizen** | Phone OTP | Submit, view, vote, preferences |
| **Verified Citizen** | Phone + ID verification | Higher trust score, priority processing |
| **Analyst** | Email/OAuth + 2FA | Verification queue, pattern tools, console |
| **Admin** | OAuth + 2FA + approval | Command dashboard, system config, user management |
| **API Partner** | API key + IP allowlist | Scoped data access per agreement |

### 8.2 Data Protection

- **Row Level Security (RLS)** on all Supabase tables — enforced at the database level, not just the API
- **PII isolation** — reporter identity stored separately, linked by encrypted reference
- **Anonymous reports** — no identity stored, only the signal content
- **Media encryption** — sensitive media encrypted at rest in Supabase Storage
- **Audit logging** — all data access logged (who viewed what, when)
- **Data retention policies** — configurable per signal type and severity

### 8.3 Operational Security

- **Reporter protection** — anonymous mode strips all identifying metadata (device fingerprint, IP, precise GPS jitter)
- **Analyst accountability** — all verification decisions attributed and logged
- **Anti-gaming** — rate limiting, trust score decay for false reports, CAPTCHA for suspicious activity
- **Secure communications** — all API traffic over TLS, WebSocket connections authenticated

### 8.4 Threat Model

| Threat | Mitigation |
|--------|------------|
| False signal flooding | Rate limiting, trust scores, automated spam detection |
| Reporter targeting | Anonymous mode, PII isolation, GPS jitter for low-trust zones |
| Data exfiltration | RLS, audit logging, encrypted sensitive fields |
| System manipulation | Analyst audit trails, multi-analyst verification for high-severity |
| State-level surveillance | End-to-end encryption option for sensitive reports, warrant canary |
| DDoS | Cloudflare/CDN, Supabase infrastructure, graceful degradation |

---

## 9. AI & Intelligence Engine

### 9.1 AI Capabilities by Phase

| Phase | Capability | Model/Approach |
|-------|-----------|----------------|
| 2 | Signal classification | Claude API (text classification prompt) |
| 2 | Duplicate detection | Embedding similarity (local) |
| 3 | Situation summarization | Claude API (summarization prompt) |
| 3 | Daily briefing generation | Claude API (structured output) |
| 3 | Image classification | Vision model (Claude or open-source) |
| 3 | Anomaly explanation | Claude API (analysis prompt) |
| 4 | Voice-to-text | Whisper API or local deployment |
| 5 | Predictive risk scoring | Custom ML (time series forecasting) |
| 5 | Trend forecasting | Prophet/NeuralProphet on signal time series |

### 9.2 AI Architecture

```
Signal arrives
  │
  ▼
Edge Function: ai_classify
  │
  ├── Extract text, location, media
  ├── Call Claude API with classification prompt
  │   ├── Signal type (from taxonomy)
  │   ├── Urgency score (0-1)
  │   ├── Key entities (people, places, organizations)
  │   └── Suggested severity
  │
  ├── If media attached:
  │   ├── Image → Claude Vision for content classification
  │   └── Video → Extract keyframes → classify
  │
  └── Store classification results in signal_classifications table
```

### 9.3 Language Considerations

- Primary languages: **Haitian Creole (Kreyòl)**, French
- Claude has strong French capability; Kreyòl support must be evaluated and potentially supplemented
- Signal text often mixes languages — model must handle code-switching
- Custom prompt engineering for Haitian context (place names, slang, local terminology)

---

## 10. Infrastructure & Operations

### 10.1 Hosting & Deployment

| Component | Service | Justification |
|-----------|---------|---------------|
| Frontend | Vercel or Cloudflare Pages | Global CDN, instant deploys, preview deploys |
| Database | Supabase (managed Postgres) | Already integrated, RLS, Realtime, Auth |
| Edge Functions | Supabase Edge Functions | Co-located with database, low latency |
| Storage | Supabase Storage | Already integrated, CDN-backed |
| AI | Anthropic Claude API | Best-in-class reasoning, structured output |
| SMS | Twilio | Reliable, good Caribbean coverage |
| Push Notifications | Firebase Cloud Messaging | Free tier sufficient for early phases |
| Monitoring | Sentry (errors) + Axiom (logs) | Essential for production reliability |
| CI/CD | GitHub Actions | Already using GitHub |

### 10.2 Environments

| Environment | Purpose |
|-------------|---------|
| `local` | Developer machines, mocked Supabase |
| `preview` | Per-PR preview deploys (Vercel) |
| `staging` | Full integration testing, staging Supabase project |
| `production` | Live system |

### 10.3 Monitoring & Observability

- **Error tracking**: Sentry for frontend and Edge Functions
- **Performance**: Web Vitals monitoring (LCP, FID, CLS)
- **Database**: Supabase dashboard + pg_stat_statements
- **Uptime**: External uptime monitoring (e.g., BetterUptime)
- **Alerting**: PagerDuty/Opsgenie for critical system failures
- **Analytics**: Privacy-respecting analytics (Plausible or PostHog)

### 10.4 Scaling Considerations

| Challenge | Strategy |
|-----------|----------|
| Signal volume growth | Postgres partitioning by date, materialized views for aggregates |
| Media storage | CDN-backed object storage, automatic compression, retention policies |
| Real-time connections | Supabase Realtime scales horizontally, client-side pagination |
| AI processing costs | Batch non-urgent classifications, cache repeated patterns, use Haiku for simple classification |
| Offline sync conflicts | Last-write-wins for votes, server-authoritative for signals |

---

## 11. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Low connectivity in target regions | High | High | Offline-first PWA, SMS fallback, minimal bundle size |
| 2 | False/malicious signal flooding | High | High | Trust scores, rate limiting, automated detection, analyst queue |
| 3 | Reporter safety compromised | Medium | Critical | Anonymous mode, PII isolation, GPS jitter, encrypted storage |
| 4 | Supabase service disruption | Low | High | Local caching, degraded-mode operation, multi-region consideration |
| 5 | AI classification errors | Medium | Medium | Human-in-the-loop verification, confidence thresholds, continuous evaluation |
| 6 | Scope creep across phases | High | Medium | Strict phase gating, deliverable-based milestones, PM discipline |
| 7 | Government interference/misuse | Medium | Critical | Transparency reports, data access policies, warrant canary, civil society oversight |
| 8 | Adoption resistance | Medium | High | Simple citizen UX, community ambassadors, SMS/USSD accessibility |
| 9 | Data sovereignty concerns | Medium | Medium | Regional hosting preference, data residency policies, open-source core |
| 10 | Team scaling challenges | Medium | Medium | Clean architecture, documentation, modular design enables parallel work |

---

## 12. Appendix: Technical Specifications

### 12.1 Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript (full stack) | Already established, type safety, shared types |
| Frontend Framework | React 18+ | Already established, ecosystem, hiring pool |
| Build Tool | Vite | Already established, fast, modern |
| Styling | Tailwind CSS | Already established, utility-first, design system compatible |
| State Management | React Query + Context | Already established, server state handled, minimal client state |
| Maps | Leaflet + OpenStreetMap | Already established, offline tile caching possible, no vendor lock-in |
| Database | PostgreSQL (Supabase) | Already established, PostGIS for geospatial, RLS for security |
| Auth | Supabase Auth | Integrated, phone OTP, OAuth, JWT |
| Real-time | Supabase Realtime | Integrated, WebSocket, Postgres CDC |
| AI | Claude API (Anthropic) | Best reasoning capability, structured output, multilingual |
| SMS | Twilio | Reliable, programmable, Caribbean coverage |
| i18n | react-i18next | Battle-tested, lazy loading, pluralization |
| Testing | Vitest + RTL + Playwright | Fast unit tests, component tests, E2E |
| CI/CD | GitHub Actions | Already using GitHub, free for public repos |

### 12.2 Performance Budgets

| Metric | Target | Rationale |
|--------|--------|-----------|
| First Contentful Paint | < 1.5s (3G) | Haiti connectivity is often slow |
| Largest Contentful Paint | < 2.5s (3G) | Critical for perceived performance |
| Time to Interactive | < 3.5s (3G) | App must be usable quickly |
| Bundle size (initial) | < 150KB gzipped | Minimize data usage |
| Offline report submission | < 2s | Must feel instant |
| Signal-to-feed latency | < 5s | Near-real-time awareness |

### 12.3 Browser & Device Support

| Platform | Minimum |
|----------|---------|
| Chrome/Chromium | Last 2 versions |
| Safari/iOS | Last 2 versions |
| Firefox | Last 2 versions |
| Samsung Internet | Last 2 versions |
| Android WebView | Chrome 80+ |
| Screen size | 320px minimum width |
| Offline | Full report + cached read |

### 12.4 Key Dependencies to Add (By Phase)

**Phase 1:**
- `workbox` — Service Worker tooling (offline/PWA)
- `idb` — IndexedDB wrapper for offline storage
- `react-i18next` + `i18next` — Internationalization
- `@supabase/auth-ui-react` — Auth UI components
- `vitest` + `@testing-library/react` — Testing

**Phase 2:**
- `@supabase/realtime-js` — Already included via supabase-js, just need to use it
- `recharts` or `@visx/visx` — Charts and data visualization
- `date-fns` — Date manipulation (lightweight)
- `zustand` — Lightweight client state (for analyst console)

**Phase 3:**
- `deck.gl` or enhanced Leaflet plugins — Advanced geospatial visualization
- `@anthropic-ai/sdk` — Claude API client
- `playwright` — E2E testing

**Phase 4+:**
- `express` or `hono` — API gateway (if needed beyond Edge Functions)
- `bull` or `pg-boss` — Job queue for background processing

---

## Summary

Citadel is built incrementally. Each phase delivers a usable product. The architecture supports this by being modular — features are added as new `features/` directories, new database tables, and new Edge Functions, without destabilizing what already works.

The existing LakayAlerts codebase is not thrown away. It is **evolved**. The React components are refactored into the new feature structure. The Supabase database is migrated, not replaced. The Leaflet map is enhanced, not swapped.

The system grows from a single-user crime reporting app into a multi-role intelligence platform by layering capabilities on a solid foundation.

Phase 1 is the foundation. Everything else is built on top of it.

**The next step is to begin Phase 1 implementation.**
