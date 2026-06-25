import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL_KEY = 'supabase_url';
export const SUPABASE_KEY_KEY = 'supabase_anon_key';

let _supabase: SupabaseClient | null = null;

function makeClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function initSupabase(): Promise<SupabaseClient | null> {
  const url = await AsyncStorage.getItem(SUPABASE_URL_KEY);
  const key = await AsyncStorage.getItem(SUPABASE_KEY_KEY);
  if (!url || !key) return null;
  _supabase = makeClient(url, key);
  return _supabase;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) throw new Error('Supabase not initialised');
  return _supabase;
}

export async function saveSupabaseCredentials(url: string, key: string): Promise<void> {
  await AsyncStorage.setItem(SUPABASE_URL_KEY, url.trim());
  await AsyncStorage.setItem(SUPABASE_KEY_KEY, key.trim());
  try {
    _supabase = makeClient(url.trim(), key.trim());
  } catch (_) {
    // credentials saved; client initialised on next app launch
  }
}

export async function hasCredentials(): Promise<boolean> {
  const url = await AsyncStorage.getItem(SUPABASE_URL_KEY);
  const key = await AsyncStorage.getItem(SUPABASE_KEY_KEY);
  return !!(url && key);
}

export const USER_ID = 'default';

export function getFinancialYear(date: Date = new Date()): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
}

export function getFinancialYearLabel(fy: number): string {
  return `${fy}/${String(fy + 1).slice(2)}`;
}

export function getFinancialYearRange(fy: number): { start: Date; end: Date } {
  return {
    start: new Date(fy, 3, 1),
    end: new Date(fy + 1, 2, 31),
  };
}
