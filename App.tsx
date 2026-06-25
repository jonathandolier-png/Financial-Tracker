import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { startBackgroundTracking, requestPermissions } from './src/lib/locationService';

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
  useEffect(() => {
    (async () => {
      const ok = await requestPermissions();
      if (ok) {
        await startBackgroundTracking();
      }
    })();
  }, []);

  return <AppNavigator />;
}
