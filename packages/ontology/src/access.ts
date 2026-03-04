/**
 * ACCESS CONTROL & AUDIT — who sees what, why, and the record of it.
 *
 * Policy, Role, Compartment, Purpose, AuditEntry
 */

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export type PolicyType =
  | "object_access"
  | "attribute_mask"
  | "action_permission"
  | "purpose_limitation"
  | "temporal_restriction";

export type PolicyEffect = "allow" | "deny" | "mask" | "redact";

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  target_type?: string;
  conditions: Record<string, unknown>;
  effect: PolicyEffect;
  priority: number;
  active: boolean;
  created_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export type DataSensitivity =
  | "public"
  | "internal"
  | "restricted"
  | "secret";

export interface Role {
  id: string;
  name: string;
  description: string;
  capabilities: Record<string, boolean>;
  default_compartments?: string[];
  max_data_sensitivity: DataSensitivity;
  can_create_types: string[];
  can_verify: boolean;
  can_alert: boolean;
  can_export: boolean;
}

// ---------------------------------------------------------------------------
// Compartment
// ---------------------------------------------------------------------------

export type Classification =
  | "public"
  | "internal"
  | "restricted"
  | "secret";

export interface Compartment {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  classification: Classification;
  created_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Purpose
// ---------------------------------------------------------------------------

export interface Purpose {
  id: string;
  name: string;
  description: string;
  restrictions?: Record<string, unknown>;
  requires_approval: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// AuditEntry (append-only, immutable)
// ---------------------------------------------------------------------------

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "verify"
  | "export"
  | "alert"
  | "login"
  | "permission_change"
  | "search"
  | "bulk_query";

export interface AuditEntry {
  id: string;
  timestamp: string;
  account_id: string;
  action: AuditAction;
  target_type: string;
  target_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  purpose_id?: string;
  compartment_id?: string;
}
