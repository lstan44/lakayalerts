/**
 * @citadel/api — Core REST API
 *
 * Cloudflare Worker serving the Citadel API.
 * Built with Hono for routing.
 *
 * This is the primary gateway. It:
 * - Authenticates requests via Supabase JWT
 * - Validates input with @citadel/validators
 * - Reads/writes via @citadel/db
 * - Enqueues async work to Cloudflare Queues (ingest, alerts, analytics)
 * - Stores evidence media in R2
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
  // EVIDENCE_BUCKET: R2Bucket;
  // INGEST_QUEUE: Queue;
  // ALERT_QUEUE: Queue;
  // ANALYTICS_QUEUE: Queue;
  // CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "citadel-api",
    version: "0.1.0",
  });
});

// API version prefix
const v1 = new Hono<{ Bindings: Env }>();

v1.get("/claims", (c) => {
  return c.json({ message: "TODO: list claims" });
});

v1.post("/claims", (c) => {
  return c.json({ message: "TODO: create claim" });
});

v1.get("/incidents", (c) => {
  return c.json({ message: "TODO: list incidents" });
});

v1.get("/alerts", (c) => {
  return c.json({ message: "TODO: list alerts" });
});

v1.get("/places", (c) => {
  return c.json({ message: "TODO: list places" });
});

app.route("/v1", v1);

export default app;
