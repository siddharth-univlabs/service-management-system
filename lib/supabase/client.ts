import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(config.url, config.anonKey);
}
