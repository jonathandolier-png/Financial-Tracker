import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logCountryVisit, getCountrySummaries } from './database';

export const LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const LAST_COUNTRY_KEY = 'last_country_code';
const LAST_LOG_DATE_KEY = 'last_log_date';

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
  if (error) return;
  const { locations } = data;
  if (!locations?.length) return;

  const location = locations[locations.length - 1];
  await processLocation(location.coords.latitude, location.coords.longitude);
});

async function processLocation(lat: number, lon: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(LAST_LOG_DATE_KEY);

    if (lastDate === today) return;

    const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!geocode?.isoCountryCode || !geocode.country) return;

    const countryCode = geocode.isoCountryCode.toUpperCase();
    const countryName = geocode.country;

    await logCountryVisit(countryCode, countryName);
    await AsyncStorage.setItem(LAST_LOG_DATE_KEY, today);
    await AsyncStorage.setItem(LAST_COUNTRY_KEY, countryCode);

    await checkAlerts(countryCode);
  } catch (_) {
    // silently fail — will retry next location update
  }
}

async function checkAlerts(justLoggedCountryCode: string): Promise<void> {
  const summaries = await getCountrySummaries();
  for (const s of summaries) {
    if (!s.limit) continue;
    const remaining = s.limit - s.days;
    const threshold = s.alert_days_before ?? 10;
    if (remaining <= threshold && remaining >= 0) {
      const flag = getFlagEmoji(s.country_code);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${flag} ${s.country_name} limit approaching`,
          body: `You have ${remaining} day${remaining === 1 ? '' : 's'} left of your ${s.limit}-day limit.`,
          sound: true,
        },
        trigger: null,
      });
    }
  }
}

export function getFlagEmoji(countryCode: string): string {
  const offset = 127397;
  return Array.from(countryCode.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}

export async function requestPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') return false;

  const { status: notif } = await Notifications.requestPermissionsAsync();
  if (notif !== 'granted') return false;

  return true;
}

export async function startBackgroundTracking(): Promise<void> {
  const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15 * 60 * 1000, // every 15 minutes
    distanceInterval: 5000, // or every 5km
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Country Days Tracker',
      notificationBody: 'Tracking your location in the background.',
      notificationColor: '#7C3AED',
    },
  });
}

export async function stopBackgroundTracking(): Promise<void> {
  const isRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

export async function getCurrentCountry(): Promise<{ code: string; name: string } | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    if (geo?.isoCountryCode && geo.country) {
      return { code: geo.isoCountryCode.toUpperCase(), name: geo.country };
    }
  } catch (_) {
    // pass
  }
  return null;
}
