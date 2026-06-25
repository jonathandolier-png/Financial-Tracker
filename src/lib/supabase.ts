import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const USER_ID = 'default';

export function getFinancialYear(date: Date = new Date()): number {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
}

export function getFinancialYearLabel(fy: number): string {
  return `${fy}/${String(fy + 1).slice(2)}`;
}

export function getFinancialYearRange(fy: number): { start: Date; end: Date } {
  return {
    start: new Date(fy, 3, 1),   // April 1
    end: new Date(fy + 1, 2, 31), // March 31 next year
  };
}
