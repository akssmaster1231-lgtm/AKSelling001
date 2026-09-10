import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function isValidHttpUrl(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return false;
  try {
    const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getSafeSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (isValidHttpUrl(envUrl)) {
    const trimmed = (envUrl as string).trim();
    const withProto = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(withProto);
      return parsed.origin;
    } catch {
      // fallback
    }
  }
  return 'https://placeholder.supabase.co';
}

function getSafeSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (envKey && typeof envKey === 'string') {
    const trimmed = envKey.trim();
    if (trimmed.length > 0 && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';
}

export const supabaseUrl = getSafeSupabaseUrl();
export const supabaseAnonKey = getSafeSupabaseAnonKey();

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(import.meta.env.VITE_SUPABASE_URL) &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'undefined' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'null' &&
  !supabaseUrl.includes('placeholder.supabase.co')
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

