import { createClient } from '@supabase/supabase-js'
import { config } from '@/config/env'

/**
 * Supabase client instance
 * Used for member authentication and rental/review submission
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(config.supabase.url && config.supabase.anonKey)
}

