import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in a way that:
// 1. Works with Vite's static replacement (must use full path import.meta.env.VITE_...)
// 2. Bypasses TypeScript errors if config is strict
// 3. Provides a runtime fallback

const getSupabaseUrl = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_SUPABASE_URL;
  } catch (error) {
    return undefined;
  }
};

const getSupabaseAnonKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  } catch (error) {
    return undefined;
  }
};

// Configuration: Try Environment Variables first, fallback to provided hardcoded values
const supabaseUrl = getSupabaseUrl() || 'https://vxrvmrvlzigmnaxdacah.supabase.co';
const supabaseAnonKey = getSupabaseAnonKey() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnZtcnZsemlnbW5heGRhY2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDQ2NjAsImV4cCI6MjA3OTE4MDY2MH0.qTAK0iEcOUI1pSR_4alvvX4hO0n4uL_q22yW1u7SgBU';

// Flag to check if real credentials are present
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co';

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase credentials are missing or invalid. Authentication features will be disabled.");
}

// Initialize Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);