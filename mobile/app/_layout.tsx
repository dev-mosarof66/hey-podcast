import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';

import { AuthProvider } from 'components/AuthProvider';
import { DownloadsProvider } from 'components/DownloadsProvider';
import { PlayerProvider } from 'components/PlayerProvider';
import { PushProvider } from 'components/PushProvider';
import { ThemeProvider } from 'components/ThemeProvider';
import { store } from 'store/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <DownloadsProvider>
          <PlayerProvider>
            <PushProvider>
              <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="personalize" />
                <Stack.Screen name="pricing" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="generating" options={{ gestureEnabled: false }} />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="topic/[id]" />
                <Stack.Screen name="redeem" />
                <Stack.Screen name="player" options={{ presentation: 'modal' }} />
              </Stack>
              <StatusBar style="auto" />
              </SafeAreaProvider>
            </PushProvider>
          </PlayerProvider>
          </DownloadsProvider>
        </ThemeProvider>
      </AuthProvider>
      {/* Top-level toast overlay */}
      <Toast />
    </Provider>
  );
}
