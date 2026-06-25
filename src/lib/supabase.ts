import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const SUPABASE_URL_KEY = 'supabase_url';
export const SUPABASE_KEY_KEY = 'supabase_anon_key';

let _supabase: SupabaseClient | null = null;

export async function initSupabase(): Promise<SupabaseClient | null> {
  const url = await SecureStore.getItemAsync(SUPABASE_URL_KEY);
  const key = await SecureStore.getItemAsync(SUPABASE_KEY_KEY);
  if (!url || !key) return null;
  _supabase = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _supabase;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) throw new Error('Supabase not initialised');
  return _supabase;
}

export async function saveSupabaseCredentials(url: string, key: string): Promise<void> {
  await SecureStore.setItemAsync(SUPABASE_URL_KEY, url.trim());
  await SecureStore.setItemAsync(SUPABASE_KEY_KEY, key.trim());
  _supabase = createClient(url.trim(), key.trim(), {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export async function hasCredentials(): Promise<boolean> {
  const url = await SecureStore.getItemAsync(SUPABASE_URL_KEY);
  const key = await SecureStore.getItemAsync(SUPABASE_KEY_KEY);
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
