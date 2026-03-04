/**
 * @citadel/ingest — Claim Ingestion Pipeline
 *
 * Cloudflare Worker (Queue consumer) that processes incoming claims.
 *
 * The pipeline:
 * 1. Validate claim structure
 * 2. Classify content (AI: type, severity, language)
 * 3. Geocode / resolve place
 * 4. Compute initial confidence from source trust
 * 5. Check for spatial/temporal clustering → auto-create Incidents
 * 6. Store in database
 * 7. Enqueue downstream: alert evaluation, analytics update
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ENVIRONMENT: string;
  // ALERT_QUEUE: Queue;
  // ANALYTICS_QUEUE: Queue;
}

export default {
  async fetch(_request: Request, _env: Env): Promise<Response> {
    return new Response(
      JSON.stringify({
        service: "citadel-ingest",
        status: "ok",
        message: "This worker processes claims from the queue",
      }),
      { headers: { "content-type": "application/json" } },
    );
  },

  // Queue handler — uncomment when queue is configured
  // async queue(batch: MessageBatch, env: Env): Promise<void> {
  //   for (const message of batch.messages) {
  //     const claim = message.body;
  //     // TODO: implement pipeline steps
  //     message.ack();
  //   }
  // },
};
