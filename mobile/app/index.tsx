import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AnimatedLogo } from 'components/AnimatedLogo';
import { useAuth } from 'components/AuthProvider';
import { useTheme } from 'components/ThemeProvider';
import { useGetMeQuery, useGetSubscriptionQuery } from 'store/api';
import { hp, wp } from 'utils/utils';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Sora_500Medium, Sora_800ExtraBold } from '@expo-google-fonts/sora';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_800ExtraBold });
  const { ready, isAuthed } = useAuth();
  // Cached from the launch token validation; tells us if onboarding is done.
  const {
    data: me,
    isLoading,
    isUninitialized,
  } = useGetMeQuery(undefined, {
    skip: !isAuthed,
  });
  const {
    data: sub,
    isLoading: subLoading,
    isUninitialized: subUninit,
  } = useGetSubscriptionQuery(undefined, { skip: !isAuthed });

  // Safety net: never sit on the splash forever if the profile request hangs
  // (e.g. server unreachable / changed LAN IP). After this we route anyway.
  const [bailout, setBailout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBailout(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // First-time visitors see the intro carousel before login. null = still
  // loading the flag; on error we assume "seen" so we never trap on onboarding.
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync('seen_onboarding')
      .then((v) => setSeenOnboarding(!!v))
      .catch(() => setSeenOnboarding(true));
  }, []);

  // Wait only while the profile request is genuinely in flight — once it
  // settles (success OR error) we route. On error `me` is undefined → home,
  // matching the tab guard, which also fails open.
  const profilePending =
    isAuthed && (isUninitialized || isLoading || subUninit || subLoading) && !bailout;

  useEffect(() => {
    if (!ready) return;
    if (profilePending) return;
    // For unauthenticated users, wait until we know whether they've seen the
    // intro so we don't flash login before routing to onboarding.
    if (!isAuthed && seenOnboarding === null) return;

    // Premium counts only while the trial/plan is still within its window.
    const premiumActive =
      sub?.tier === 'premium' &&
      (sub.renewsAt == null || new Date(sub.renewsAt).getTime() > Date.now());
    // Gate to /redeem ONLY when we positively know they're not on an active
    // plan (sub loaded AND not premium). If the subscription query never
    // resolved (e.g. server cold start + bailout), fail open to home rather
    // than trapping an already-premium user on the promo screen.
    const shouldGate = sub != null && !premiumActive;
    const dest = !isAuthed
      ? seenOnboarding
        ? '/(auth)/login'
        : '/onboarding'
      : me && !me.onboarded
        ? '/personalize'
        : shouldGate
          ? '/redeem'
          : '/(tabs)/home';
    const timer = setTimeout(() => router.replace(dest), 600);
    return () => clearTimeout(timer);
  }, [ready, isAuthed, profilePending, me, sub, seenOnboarding]);

  // Theme-aware surface + text colors (mirror global.css --background/--foreground).
  const background = dark ? '#020618' : '#f3e8ff';
  const foreground = dark ? '#f8fafc' : '#020618';

  // Premium brand type (Sora). Falls back to the system font until it loads.
  const wordFont = fontsLoaded ? 'Sora_800ExtraBold' : undefined;
  const tagFont = fontsLoaded ? 'Sora_500Medium' : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={background} />
      <View style={[styles.container, { backgroundColor: background }]}>
        {/* Brand mark */}
        <AnimatedLogo size={wp(15)} />

        {/* Wordmark */}
        <Text style={[styles.wordmark, { color: foreground, fontFamily: wordFont }]}>
          Daily Download
        </Text>

        {/* Tagline */}
        <Text style={[styles.tagline, { fontFamily: tagFont }]}>
          Your Daily AI News & Feed Partner
        </Text>

        {/* Loading indicator, pinned above the bottom safe area */}
        <View style={[styles.loader, { bottom: insets.bottom }]}>
          <ActivityIndicator color={foreground} size={hp(2.5)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  wordmark: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#7008e8',
    marginTop: 4,
    fontSize: 18,
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
