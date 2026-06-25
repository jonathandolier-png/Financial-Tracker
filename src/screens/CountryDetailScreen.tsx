import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getSupabase, USER_ID, getFinancialYearLabel } from '../lib/supabase';
import { getFlagEmoji } from '../lib/locationService';

interface Props {
  navigation: any;
  route: { params: { countryCode: string; countryName: string } };
}

interface VisitDay {
  date: string;
  financial_year: number;
}

export function CountryDetailScreen({ navigation, route }: Props) {
  const { countryCode, countryName } = route.params;
  const flag = getFlagEmoji(countryCode);
  const [days, setDays] = useState<VisitDay[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await getSupabase()
          .from('country_visits')
          .select('date, financial_year')
          .eq('user_id', USER_ID)
          .eq('country_code', countryCode)
          .order('date', { ascending: false });
        setDays(data ?? []);
        setLoading(false);
      })();
    }, [countryCode])
  );

  const byYear: Record<number, string[]> = {};
  for (const d of days) {
    if (!byYear[d.financial_year]) byYear[d.financial_year] = [];
    byYear[d.financial_year].push(d.date);
  }

  function toRanges(dates: string[]): string[] {
    const sorted = [...dates].sort();
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const diff = (new Date(cur).getTime() - new Date(prev).getTime()) / 86400000;
      if (diff === 1) { prev = cur; }
      else {
        ranges.push(start === prev ? fmt(start) : `${fmt(start)} - ${fmt(prev)}`);
        start = cur; prev = cur;
      }
    }
    ranges.push(start === prev ? fmt(start) : `${fmt(start)} - ${fmt(prev)}`);
    return ranges;
  }

  function fmt(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>{String.fromCharCode(8592)}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.countryName}>{countryName}</Text>
        <Text style={styles.totalDays}>{days.length} day{days.length !== 1 ? 's' : ''} total across all years</Text>
        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
        ) : (
          years.map((fy) => {
            const fyDays = byYear[fy];
            const ranges = toRanges(fyDays);
            return (
              <View key={fy} style={styles.yearBlock}>
                <View style={styles.yearHeader}>
                  <Text style={styles.yearLabel}>FY {getFinancialYearLabel(fy)}</Text>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>{fyDays.length} days</Text>
                  </View>
                </View>
                {ranges.map((r, i) => (
                  <View key={i} style={styles.rangeRow}>
                    <View style={styles.dot} />
                    <Text style={styles.rangeText}>{r}</Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon: { color: colors.text, fontSize: 20 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60, alignItems: 'center' },
  flag: { fontSize: 64, marginTop: 16, marginBottom: 12 },
  countryName: { color: colors.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  totalDays: { color: colors.textSecondary, fontSize: 15, marginBottom: 32 },
  yearBlock: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  yearHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  yearLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  yearBadge: { backgroundColor: colors.purpleGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.purpleDim },
  yearBadgeText: { color: colors.purpleLight, fontSize: 13, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.purple },
  rangeText: { color: colors.textSecondary, fontSize: 14 },
});
