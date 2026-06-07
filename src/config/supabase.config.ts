import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. ' +
          'Set DB_PROVIDER=typeorm to use direct PostgreSQL instead.',
      );
    }

    _client = createClient(url, key);
  }

  return _client;
}
