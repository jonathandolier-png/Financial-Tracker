import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SetupScreen } from './src/screens/SetupScreen';
import { hasCredentials, initSupabase } from './src/lib/supabase';
import { startBackgroundTracking, requestPermissions } from './src/lib/locationService';
import { View, ActivityIndicator } from 'react-native';
import { colors } from './src/theme/colors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hasCreds = await hasCredentials();
        if (hasCreds) {
          await initSupabase().catch(() => {});
          setNeedsSetup(false);
          setReady(true);
          // Request permissions after showing the app — don't block startup
          requestPermissions()
            .then((ok) => { if (ok) startBackgroundTracking().catch(() => {}); })
            .catch(() => {});
          return;
        }
      } catch (_) {}
      setNeedsSetup(true);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  if (needsSetup) {
    return (
      <SetupScreen
        onComplete={async () => {
          try {
            const ok = await requestPermissions();
            if (ok) await startBackgroundTracking();
          } catch (_) {}
          setNeedsSetup(false);
        }}
      />
    );
  }

  return <AppNavigator />;
}
