import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { CountrySummary, getCountrySummaries, setCountryLimit, deleteCountryLimit } from '../lib/database';
import { getFlagEmoji } from '../lib/locationService';

interface Props {
  navigation: any;
}

export function SettingsScreen({ navigation }: Props) {
  const [summaries, setSummaries] = useState<CountrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCountry, setModalCountry] = useState<CountrySummary | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [alertInput, setAlertInput] = useState('10');

  const load = async () => {
    const data = await getCountrySummaries();
    setSummaries(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const openLimitModal = (s: CountrySummary) => {
    setModalCountry(s);
    setLimitInput(s.limit ? String(s.limit) : '');
    setAlertInput(String(s.alert_days_before ?? 10));
  };

  const saveLimit = async () => {
    if (!modalCountry) return;
    const limit = parseInt(limitInput, 10);
    const alertBefore = parseInt(alertInput, 10);
    if (isNaN(limit) || limit < 1) {
      Alert.alert('Invalid', 'Enter a number of days (e.g. 183)');
      return;
    }
    await setCountryLimit(modalCountry.country_code, limit, isNaN(alertBefore) ? 10 : alertBefore);
    setModalCountry(null);
    load();
  };

  const removeLimit = async (countryCode: string) => {
    Alert.alert('Remove limit', 'Remove the day limit for this country?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteCountryLimit(countryCode);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionTitle}>Day Limits per Country</Text>
        <Text style={styles.sectionHint}>
          Tap a country to set the maximum number of days allowed per financial year. You'll get an alert when you're running low.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginTop: 24 }} />
        ) : summaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No countries logged yet. Use the + button on the home screen to log your first visit.
            </Text>
          </View>
        ) : (
          summaries.map((s) => (
            <View key={s.country_code} style={styles.countryRow}>
              <Text style={styles.countryFlag}>{getFlagEmoji(s.country_code)}</Text>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{s.country_name}</Text>
                {s.limit ? (
                  <Text style={styles.countryLimit}>
                    Limit: {s.limit} days · Alert {s.alert_days_before ?? 10} days before
                  </Text>
                ) : (
                  <Text style={styles.countryLimitNone}>No limit set</Text>
                )}
              </View>
              <View style={styles.rowActions}>
                <Pressable style={styles.editBtn} onPress={() => openLimitModal(s)}>
                  <Text style={styles.editBtnText}>Set</Text>
                </Pressable>
                {s.limit ? (
                  <Pressable style={styles.removeBtn} onPress={() => removeLimit(s.country_code)}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!modalCountry} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {modalCountry ? `${getFlagEmoji(modalCountry.country_code)} ${modalCountry.country_name}` : ''}
            </Text>

            <Text style={styles.modalLabel}>Maximum days per financial year</Text>
            <TextInput
              style={styles.modalInput}
              value={limitInput}
              onChangeText={setLimitInput}
              keyboardType="number-pad"
              placeholder="e.g. 183"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={styles.modalLabel}>Alert me when this many days remain</Text>
            <TextInput
              style={styles.modalInput}
              value={alertInput}
              onChangeText={setAlertInput}
              keyboardType="number-pad"
              placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalCountry(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveLimit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: { color: colors.text, fontSize: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  sectionHint: { color: colors.textSecondary, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  countryFlag: { fontSize: 30 },
  countryInfo: { flex: 1 },
  countryName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  countryLimit: { color: colors.purpleLight, fontSize: 12, marginTop: 2 },
  countryLimitNone: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    backgroundColor: colors.purpleGlow,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.purpleDim,
  },
  editBtnText: { color: colors.purpleLight, fontWeight: '600', fontSize: 13 },
  removeBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  removeBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  modalLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 16 },
  saveBtn: { flex: 1, backgroundColor: colors.purple, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
