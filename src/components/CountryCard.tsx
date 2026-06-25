import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { CountrySummary } from '../lib/database';
import { getFlagEmoji } from '../lib/locationService';

interface Props {
  summary: CountrySummary;
  onPress?: () => void;
}

export function CountryCard({ summary, onPress }: Props) {
  const { country_code, country_name, days, limit } = summary;
  const flag = getFlagEmoji(country_code);
  const ratio = limit ? Math.min(days / limit, 1) : 0;
  const remaining = limit ? limit - days : null;
  const isWarning = remaining !== null && remaining <= (summary.alert_days_before ?? 10);
  const isDanger = remaining !== null && remaining <= 5;

  const barColor = isDanger ? colors.danger : isWarning ? colors.warning : colors.purple;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.countryName}>{country_name}</Text>
          {limit ? (
            <Text style={[styles.limitText, isWarning && { color: barColor }]}>
              {remaining} day{remaining === 1 ? '' : 's'} remaining
            </Text>
          ) : (
            <Text style={styles.limitText}>No limit set</Text>
          )}
        </View>
        <View style={styles.daysBadge}>
          <Text style={styles.daysNumber}>{days}</Text>
          <Text style={styles.daysLabel}>{days === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>

      {limit ? (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
        </View>
      ) : null}

      {limit ? (
        <Text style={styles.limitCaption}>Limit: {limit} days</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.8,
    backgroundColor: colors.surfaceElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flag: {
    fontSize: 36,
    marginRight: 12,
  },
  titleBlock: {
    flex: 1,
  },
  countryName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  limitText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  daysBadge: {
    alignItems: 'center',
    backgroundColor: colors.purpleGlow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.purpleDim,
  },
  daysNumber: {
    color: colors.purpleLight,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  daysLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitCaption: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
});
