import { supabase, USER_ID, getFinancialYear } from './supabase';

export interface CountryVisit {
  id?: string;
  user_id: string;
  country_code: string;
  country_name: string;
  date: string; // YYYY-MM-DD
  financial_year: number;
}

export interface CountryLimit {
  id?: string;
  user_id: string;
  country_code: string;
  day_limit: number;
  alert_days_before: number;
}

export interface CountrySummary {
  country_code: string;
  country_name: string;
  days: number;
  limit?: number;
  alert_days_before?: number;
}

export async function logCountryVisit(
  countryCode: string,
  countryName: string,
  date: Date = new Date()
): Promise<void> {
  const dateStr = date.toISOString().split('T')[0];
  const fy = getFinancialYear(date);

  const { error } = await supabase
    .from('country_visits')
    .upsert(
      {
        user_id: USER_ID,
        country_code: countryCode,
        country_name: countryName,
        date: dateStr,
        financial_year: fy,
      },
      { onConflict: 'user_id,country_code,date' }
    );

  if (error) throw error;
}

export async function getCountrySummaries(financialYear?: number): Promise<CountrySummary[]> {
  const fy = financialYear ?? getFinancialYear();

  const [{ data: visits, error: visitsError }, { data: limits, error: limitsError }] =
    await Promise.all([
      supabase
        .from('country_visits')
        .select('country_code, country_name')
        .eq('user_id', USER_ID)
        .eq('financial_year', fy),
      supabase
        .from('country_limits')
        .select('country_code, day_limit, alert_days_before')
        .eq('user_id', USER_ID),
    ]);

  if (visitsError) throw visitsError;
  if (limitsError) throw limitsError;

  const dayCounts: Record<string, { name: string; days: number }> = {};
  for (const v of visits ?? []) {
    if (!dayCounts[v.country_code]) {
      dayCounts[v.country_code] = { name: v.country_name, days: 0 };
    }
    dayCounts[v.country_code].days++;
  }

  const limitMap: Record<string, { day_limit: number; alert_days_before: number }> = {};
  for (const l of limits ?? []) {
    limitMap[l.country_code] = {
      day_limit: l.day_limit,
      alert_days_before: l.alert_days_before ?? 10,
    };
  }

  return Object.entries(dayCounts)
    .map(([code, { name, days }]) => ({
      country_code: code,
      country_name: name,
      days,
      limit: limitMap[code]?.day_limit,
      alert_days_before: limitMap[code]?.alert_days_before,
    }))
    .sort((a, b) => b.days - a.days);
}

export async function setCountryLimit(
  countryCode: string,
  dayLimit: number,
  alertDaysBefore: number = 10
): Promise<void> {
  const { error } = await supabase
    .from('country_limits')
    .upsert(
      {
        user_id: USER_ID,
        country_code: countryCode,
        day_limit: dayLimit,
        alert_days_before: alertDaysBefore,
      },
      { onConflict: 'user_id,country_code' }
    );

  if (error) throw error;
}

export async function deleteCountryLimit(countryCode: string): Promise<void> {
  const { error } = await supabase
    .from('country_limits')
    .delete()
    .eq('user_id', USER_ID)
    .eq('country_code', countryCode);

  if (error) throw error;
}

export async function getAvailableFinancialYears(): Promise<number[]> {
  const { data, error } = await supabase
    .from('country_visits')
    .select('financial_year')
    .eq('user_id', USER_ID);

  if (error) throw error;

  const years = [...new Set((data ?? []).map((r) => r.financial_year))].sort(
    (a, b) => b - a
  );

  const currentFy = getFinancialYear();
  if (!years.includes(currentFy)) years.unshift(currentFy);

  return years;
}
