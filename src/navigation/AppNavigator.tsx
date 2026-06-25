import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CountryDetailScreen } from '../screens/CountryDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  CountryDetail: { countryCode: string; countryName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CountryDetail" component={CountryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
