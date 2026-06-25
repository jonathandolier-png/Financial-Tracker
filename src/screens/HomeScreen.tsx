import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { CountryCard } from '../components/CountryCard';
import { CountrySummary, getCountrySummaries, getAvailableFinancialYears, logCountryVisit } from '../lib/database';
import { getFinancialYearLabel, getFinancialYear } from '../lib/supabase';
import { getFlagEmoji } from '../lib/locationService';
import { COUNTRIES, Country } from '../data/countries';

interface Props {
  navigation: any;
}

export function HomeScreen({ navigation }: Props) {
  const [summaries, setSummaries] = useState<CountrySummary[]>([]);
  const [financialYears, setFinancialYears] = useState<number[]>([]);
  const [selectedFY, setSelectedFY] = useState<number>(getFinancialYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [logging, setLogging] = useState(false);

  const filteredCountries = search.trim()
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.code.toLowerCase().includes(search.trim().toLowerCase())
      )
    : COUNTRIES;

  const load = useCallback(async (fy?: number) => {
    try {
      const [data, years] = await Promise.all([
        getCountrySummaries(fy ?? selectedFY),
        getAvailableFinancialYears(),
      ]);
      setSummaries(data);
      setFinancialYears(years);
    } catch (_) {
      // network/supabase error — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFY]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openPicker = () => {
    setSearch('');
    setPickerVisible(true);
  };

  const logVisit = async (country: Country) => {
    setLogging(true);
    setPickerVisible(false);
    try {
      await logCountryVisit(country.code, country.name);
      await load();
      Alert.alert(
        `${getFlagEmoji(country.code)} Logged`,
        `Today in ${country.name} has been recorded.`
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save. Check your Supabase connection.');
    } finally {
      setLogging(false);
    }
  };

  const totalDays = summaries.reduce((s, c) => s + c.days, 0);
  const countriesVisited = summaries.length;
  const alertCountries = summaries.filter(
    (s) => s.limit && s.limit - s.days <= (s.alert_days_before ?? 10) && s.limit - s.days >= 0
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Country Days</Text>
            <Text style={styles.appSubtitle}>Financial Year Tracker</Text>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Financial Year Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
        >
          {financialYears.map((fy) => (
            <Pressable
              key={fy}
              style={[styles.yearChip, fy === selectedFY && styles.yearChipActive]}
              onPress={() => {
                setSelectedFY(fy);
                setLoading(true);
                load(fy);
              }}
            >
              <Text style={[styles.yearChipText, fy === selectedFY && styles.yearChipTextActive]}>
                FY {getFinancialYearLabel(fy)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{countriesVisited}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, alertCountries.length > 0 && { color: colors.warning }]}>
              {alertCountries.length}
            </Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Alert Banner */}
        {alertCountries.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>
              ⚠️{' '}
              {alertCountries
                .map((s) => `${getFlagEmoji(s.country_code)} ${s.country_name}: ${s.limit! - s.days} days left`)
                .join('  ·  ')}
            </Text>
          </View>
        )}

        {/* Country List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Countries Visited</Text>

          {loading ? (
            <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
          ) : summaries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌍</Text>
              <Text style={styles.emptyTitle}>No visits recorded yet</Text>
              <Text style={styles.emptyBody}>
                Tap the button below to log which country you're in today.
              </Text>
            </View>
          ) : (
            summaries.map((s) => (
              <CountryCard
                key={s.country_code}
                summary={s}
                onPress={() => navigation.navigate('CountryDetail', {
                  countryCode: s.country_code,
                  countryName: s.country_name,
                })}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Log Visit Button */}
      <Pressable style={styles.fab} onPress={openPicker} disabled={logging}>
        {logging ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.fabText}>+ Log Today's Country</Text>
        )}
      </Pressable>

      {/* Country Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.pickerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Where are you today?</Text>
            <Pressable onPress={() => setPickerVisible(false)} style={styles.pickerClose}>
              <Text style={styles.pickerCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search country..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.countryRow} onPress={() => logVisit(item)}>
                <Text style={styles.countryFlag}>{getFlagEmoji(item.code)}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  appTitle: { color: colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  appSubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: { fontSize: 20 },
  yearRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  yearChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  yearChipTextActive: { color: colors.white, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  statNumber: { color: colors.purpleLight, fontSize: 28, fontWeight: '700' },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  alertBannerText: { color: colors.warning, fontSize: 13, lineHeight: 20 },
  section: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 36,
    left: 24,
    right: 24,
    backgroundColor: colors.purple,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  pickerContainer: { flex: 1, backgroundColor: colors.background },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pickerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  pickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseText: { color: colors.textSecondary, fontSize: 16 },
  searchBox: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  countryFlag: { fontSize: 28 },
  countryName: { color: colors.text, fontSize: 16 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
});
