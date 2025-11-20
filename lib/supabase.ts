import { createClient } from '@supabase/supabase-js';

// Configuration: Try Environment Variables first, fallback to provided hardcoded values
// Note: In a real production app, never commit real keys. These are here for demo purposes.
// We cast import.meta to any to avoid TS errors if vite types are missing
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://vxrvmrvlzigmnaxdacah.supabase.co';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnZtcnZsemlnbW5heGRhY2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDQ2NjAsImV4cCI6MjA3OTE4MDY2MH0.qTAK0iEcOUI1pSR_4alvvX4hO0n4uL_q22yW1u7SgBU';

// Flag to check if real credentials are present
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase credentials are missing or invalid. Authentication features will be disabled.");
}

// Initialize Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
