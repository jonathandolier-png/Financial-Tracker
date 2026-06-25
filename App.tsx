import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SetupScreen } from './src/screens/SetupScreen';
import { hasCredentials, initSupabase } from './src/lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from './src/theme/colors';

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
