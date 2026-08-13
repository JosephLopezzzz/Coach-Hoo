import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MealProvider } from '../context/MealContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
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
      <LanguageProvider>
        <ToastProvider>
          <MealProvider>
            <StatusBar style="dark" backgroundColor={Colors.bg} />
            <View style={styles.webGutter}>
              <View style={styles.appContainer}>
                <RootLayoutNav />
              </View>
            </View>
          </MealProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webGutter: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#EBECEE' : Colors.bg,
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: Colors.bg,
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 30,
          overflow: 'hidden',
        }
      : {}),
  },
});
