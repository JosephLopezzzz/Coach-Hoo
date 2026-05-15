import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MealProvider } from '../context/MealContext';
import { Colors } from '../constants/theme';

function RootLayoutNav() {
  const { isOnboarded, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)');
    }
  }, [isOnboarded, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MealProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <RootLayoutNav />
      </MealProvider>
    </AuthProvider>
  );
}
