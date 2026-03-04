/**
 * OPERATIONAL — workflow and coordination.
 *
 * Case, Task, Briefing, ResponseAction
 */

import type {
  Compartmented,
  GeoJSON,
  Provenance,
} from "./common.js";

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

export type CaseType =
  | "investigation"
  | "humanitarian_response"
  | "disaster_response"
  | "monitoring"
  | "assessment"
  | "other";

export type CaseStatus =
  | "open"
  | "active"
  | "on_hold"
  | "closed"
  | "archived";

export type Priority = "critical" | "high" | "medium" | "low";

export interface Case extends Provenance, Compartmented {
  id: string;
  title: string;
  description?: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  assigned_to?: string[];
  situation_ids?: string[];
  geometry?: GeoJSON;
  place_ids?: string[];
  opened_at: string;
  closed_at?: string;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export type TaskType =
  | "verify_claim"
  | "field_assessment"
  | "contact_source"
  | "analyze_pattern"
  | "write_briefing"
  | "dispatch_response"
  | "follow_up"
  | "other";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Task extends Provenance {
  id: string;
  case_id?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assigned_to?: string;
  due_at?: string;
  completed_at?: string;
}

// ---------------------------------------------------------------------------
// Briefing
// ---------------------------------------------------------------------------

export type BriefingType =
  | "daily_summary"
  | "situation_update"
  | "threat_assessment"
  | "after_action"
  | "strategic_outlook"
  | "ad_hoc";

export type BriefingGeneration =
  | "ai_draft"
  | "analyst_written"
  | "ai_assisted";

export type BriefingStatus = "draft" | "review" | "published" | "archived";

export interface Briefing extends Provenance, Compartmented {
  id: string;
  type: BriefingType;
  title: string;
  content: string; // markdown
  period_start?: string;
  period_end?: string;
  place_ids?: string[];
  situation_ids?: string[];
  generated_by: BriefingGeneration;
  model_run_id?: string;
  reviewed_by?: string;
  status: BriefingStatus;
  audience_roles: string[];
  published_at?: string;
}

// ---------------------------------------------------------------------------
// ResponseAction
// ---------------------------------------------------------------------------

export type ResponseType =
  | "deploy_responders"
  | "allocate_resources"
  | "issue_alert"
  | "coordinate_evacuation"
  | "establish_checkpoint"
  | "provide_aid"
  | "other";

export type ResponseStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Effectiveness =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "counterproductive";

export interface ResponseAction extends Provenance {
  id: string;
  situation_id?: string;
  case_id?: string;
  type: ResponseType;
  description: string;
  status: ResponseStatus;
  assigned_to_org?: string;
  assigned_to_account?: string;
  geometry?: GeoJSON;
  started_at?: string;
  completed_at?: string;
  outcome?: string;
  effectiveness?: Effectiveness;
}
