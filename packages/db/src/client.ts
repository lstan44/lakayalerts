/**
 * Supabase client factory.
 *
 * All apps and workers use this to get a configured Supabase client.
 * Ensures consistent configuration across the platform.
 */

import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

export interface CitadelClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Service role key — only for server-side (workers). Never in browser. */
  supabaseServiceKey?: string;
}

export type CitadelClient = ReturnType<typeof createClient>;

export function createClient(config: CitadelClientConfig) {
  const key = config.supabaseServiceKey ?? config.supabaseAnonKey;
  return supabaseCreateClient(config.supabaseUrl, key, {
    auth: {
      autoRefreshToken: !config.supabaseServiceKey,
      persistSession: !config.supabaseServiceKey,
    },
  });
}
