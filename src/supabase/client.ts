import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/types/supabase";

const supabaseUrl = 'https://wkstbehsenrlwhtaqfgq.supabase.co'

export function createSupabaseClient(token: string) {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}