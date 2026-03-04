/**
 * Claim validation — the most important schema since Claims are the
 * primary boundary between the outside world and Citadel's world model.
 */

import { z } from "zod";

const GeoJSONPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90), // latitude
  ]),
});

export const ClaimSchema = z.object({
  claim_type: z.enum([
    "incident_report",
    "observation",
    "tip",
    "correction",
    "corroboration",
    "contradiction",
    "status_update",
    "request_for_help",
  ]),
  content: z
    .string()
    .min(10, "Claim must be at least 10 characters")
    .max(5000, "Claim must be under 5000 characters"),
  geometry: GeoJSONPointSchema.optional(),
  occurred_at: z.string().datetime().optional(),
  occurred_at_precision: z
    .enum(["exact", "minute", "hour", "day", "week", "approximate"])
    .optional(),
  language: z.enum(["ht", "fr", "en", "es"]).optional(),
  anonymous: z.boolean().default(false),
  structured_data: z.record(z.unknown()).optional(),
});

export type ClaimInput = z.infer<typeof ClaimSchema>;
