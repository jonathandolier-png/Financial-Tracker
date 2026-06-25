import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import { saveSupabaseCredentials } from '../lib/supabase';

interface Props {
  onComplete: () => Promise<void>;
}

export function SetupScreen({ onComplete }: Props) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      Alert.alert('Check the URL', 'It should look like https://abcdefgh.supabase.co');
      return;
    }
    if (cleanKey.length < 20) {
      Alert.alert('Check the key', 'The anon key should be a long string starting with "eyJ..."');
      return;
    }

    setSaving(true);
    try {
      await saveSupabaseCredentials(cleanUrl, cleanKey);
      await onComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', `Could not save credentials.\n\n${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.globe}>{String.fromCodePoint(0x1F30D)}</Text>
        <Text style={styles.title}>Country Days Tracker</Text>
        <Text style={styles.subtitle}>One-time setup — takes 3 minutes</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.stepTitle}>Create your free database</Text>
          </View>
          <Text style={styles.stepBody}>
            Go to{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://supabase.com')}
            >
              supabase.com
            </Text>
            {' '}sign up free, create a new project (any name), open{' '}
            <Text style={styles.bold}>SQL Editor</Text> in the left menu, paste the SQL below, click Run.
          </Text>
          <View style={styles.sqlBox}>
            <Text style={styles.sqlText}>{SQL_SNIPPET}</Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.stepTitle}>Copy your credentials</Text>
          </View>
          <Text style={styles.stepBody}>
            In Supabase go to <Text style={styles.bold}>Project Settings{String.fromCharCode(8594)}API</Text>.{' '}
            Copy your <Text style={styles.bold}>Project URL</Text> and{' '}
            <Text style={styles.bold}>anon public</Text> key, then paste them below.
          </Text>
        </View>

        <Text style={styles.inputLabel}>Project URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://abcdefgh.supabase.co"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.inputLabel}>Anon public key</Text>
        <TextInput
          style={[styles.input, styles.inputTall]}
          value={key}
          onChangeText={setKey}
          placeholder="eyJhbGciOi..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        <Pressable
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Connect & Start Tracking</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Your credentials are stored only on this device and sent only to your Supabase project.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SQL_SNIPPET = [
  "create table if not exists country_visits (",
  "  id uuid primary key default gen_random_uuid(),",
  "  user_id text not null default 'default',",
  "  country_code text not null,",
  "  country_name text not null,",
  "  date date not null,",
  "  financial_year int not null,",
  "  created_at timestamptz default now(),",
  "  unique (user_id, country_code, date)",
  ");",
  "create table if not exists country_limits (",
  "  id uuid primary key default gen_random_uuid(),",
  "  user_id text not null default 'default',",
  "  country_code text not null,",
  "  day_limit int not null,",
  "  alert_days_before int not null default 10,",
  "  created_at timestamptz default now(),",
  "  unique (user_id, country_code)",
  ");",
  "alter table country_visits enable row level security;",
  "alter table country_limits enable row level security;",
  "create policy 'Allow all' on country_visits for all using (true) with check (true);",
  "create policy 'Allow all' on country_limits for all using (true) with check (true);",
].join('\n');

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 60 },
  globe: { fontSize: 52, textAlign: 'center', marginBottom: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 6, marginBottom: 32 },
  stepCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: colors.white, fontWeight: '700', fontSize: 14 },
  stepTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  stepBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  link: { color: colors.purpleLight, textDecorationLine: 'underline' },
  bold: { color: colors.text, fontWeight: '600' },
  sqlBox: { backgroundColor: colors.background, borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  sqlText: { color: colors.purpleLight, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 18 },
  inputLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  inputTall: { minHeight: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.purple, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  footer: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
