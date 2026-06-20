import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedLogo } from 'components/AnimatedLogo';
import { useAuth } from 'components/AuthProvider';
import { useGetMeQuery } from 'store/api';
import { hp, wp } from 'utils/utils';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { ready, isAuthed } = useAuth();
  // Cached from the launch token validation; tells us if onboarding is done.
  const { data: me, isLoading, isUninitialized } = useGetMeQuery(undefined, {
    skip: !isAuthed,
  });

  // Safety net: never sit on the splash forever if the profile request hangs
  // (e.g. server unreachable / changed LAN IP). After this we route anyway.
  const [bailout, setBailout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBailout(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Wait only while the profile request is genuinely in flight — once it
  // settles (success OR error) we route. On error `me` is undefined → home,
  // matching the tab guard, which also fails open.
  const profilePending = isAuthed && (isUninitialized || isLoading) && !bailout;

  useEffect(() => {
    if (!ready) return;
    if (profilePending) return;

    const dest = !isAuthed
      ? '/(auth)/login'
      : me && !me.onboarded
        ? '/personalize'
        : '/(tabs)/home';
    const timer = setTimeout(() => router.replace(dest), 600);
    return () => clearTimeout(timer);
  }, [ready, isAuthed, profilePending, me]);

  return (
    <SafeAreaView className='flex-1'>
      <View className="bg-background flex-1 items-center justify-center px-10">
        {/* Brand mark */}
        <AnimatedLogo size={wp(15)} />

        {/* Wordmark */}
        <Text className="text-foreground mt-3 text-2xl font-bold tracking-tight">Hey Podcast</Text>

        {/* Tagline */}
        <Text className="text-primary mt-1 text-center text-lg">
          Your Daily AI News & Feed Partner
        </Text>

        {/* Loading indicator, pinned above the bottom safe area */}
        <View
          className="absolute left-0 right-0 items-center"
          style={{ bottom: insets.bottom }}>
          <ActivityIndicator color="#9FE1CB" size={hp(2.5)} />
        </View>
      </View>
    </SafeAreaView>
  );
}
