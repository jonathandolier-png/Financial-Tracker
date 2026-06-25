import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SetupScreen } from './src/screens/SetupScreen';
import { hasCredentials, initSupabase } from './src/lib/supabase';
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
    const giveUp = setTimeout(() => {
      setNeedsSetup(true);
      setReady(true);
    }, 4000);

    (async () => {
      try {
        const hasCreds = await hasCredentials();
        clearTimeout(giveUp);
        if (hasCreds) {
          initSupabase().catch(() => {});
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      } catch (_) {
        clearTimeout(giveUp);
        setNeedsSetup(true);
      }
      setReady(true);
      Notifications.requestPermissionsAsync().catch(() => {});
    })();

    return () => clearTimeout(giveUp);
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
          setNeedsSetup(false);
        }}
      />
    );
  }

  return <AppNavigator />;
}
