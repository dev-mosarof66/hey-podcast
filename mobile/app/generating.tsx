import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { usePlayerActions } from 'components/PlayerProvider';
import { Colors } from 'constants/Colors';
import { api, useGetEpisodeQuery } from 'store/api';
import { useAppDispatch } from 'store/hooks';
import { toUiEpisode } from 'utils/episode';
import { wp } from 'utils/utils';

const MESSAGES = [
  'Scanning the latest stories…',
  'Fetching fresh facts…',
  'Writing the two-host script…',
  'Recording Alex & Maya…',
  'Mixing the audio…',
  'Almost ready…',
];

/**
 * Real generation screen: polls the episode until it's ready, then hands it to
 * the player. Driven by the server pipeline, not a fixed timer.
 */
export default function GeneratingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playEpisode } = usePlayerActions();
  const dispatch = useAppDispatch();

  // Stop polling once the episode reaches a terminal state.
  const [stopPolling, setStopPolling] = useState(false);
  const { data: episode } = useGetEpisodeQuery(id!, {
    skip: !id,
    pollingInterval: stopPolling ? 0 : 3000,
  });

  const failed = episode?.status === 'failed';
  const ready = episode?.status === 'ready' && !!episode?.audioUrl;

  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;
  const handed = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (failed || ready) setStopPolling(true);
  }, [failed, ready]);

  // Indeterminate creep toward ~90% while the pipeline runs.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.9,
      duration: 50000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    const interval = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 3500);
    return () => clearInterval(interval);
  }, [progress]);

  // Ready → fill the bar, flash success, start playback.
  useEffect(() => {
    if (!ready || handed.current || !episode) return;
    handed.current = true;
    let cancelled = false;
    Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: false }).start(() => {
      if (cancelled) return; // user left during the animation
      setSuccess(true);
      Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      // Refresh the feed so the new episode shows on Home, then play it.
      dispatch(api.util.invalidateTags(['Episodes']));
      playEpisode(toUiEpisode(episode));
      navTimer.current = setTimeout(() => router.replace('/player'), 1100);
    });
    return () => {
      cancelled = true;
      if (navTimer.current) clearTimeout(navTimer.current);
    };
  }, [ready, episode, playEpisode, progress, successScale, dispatch]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (failed) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center px-10">
        <View className="bg-foreground/5 h-20 w-20 items-center justify-center rounded-full">
          <Ionicons name="alert-circle-outline" size={wp(11)} color={Colors.muted} />
        </View>
        <Text className="text-foreground mt-6 text-2xl font-bold tracking-tight">
          Generation failed
        </Text>
        <Text className="text-foreground/50 mt-2 text-center text-sm">
          Something went wrong creating this episode. Please try again.
        </Text>
        <Pressable onPress={() => router.back()} className="bg-primary mt-8 rounded-full px-7 py-3">
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1 items-center justify-center px-10">
      {success ? (
        <Animated.View style={{ transform: [{ scale: successScale }] }} className="items-center">
          <View className="bg-primary items-center justify-center rounded-full p-6">
            <Ionicons name="checkmark" size={wp(13)} color="#fff" />
          </View>
          <Text className="text-foreground mt-6 text-2xl font-bold tracking-tight">
            Episode ready!
          </Text>
          <Text className="text-foreground/50 mt-1 text-center text-sm">Starting playback…</Text>
        </Animated.View>
      ) : (
        <View className="w-full items-center">
          <AnimatedLogo size={wp(22)} />
          <Text className="text-foreground mt-8 text-2xl font-bold tracking-tight">
            Creating your episode
          </Text>
          <Text className="text-foreground/50 mt-2 text-center text-sm">{MESSAGES[msg]}</Text>
          <View className="bg-foreground/10 mt-8 h-1.5 w-full overflow-hidden rounded-full">
            <Animated.View className="bg-primary h-full rounded-full" style={{ width }} />
          </View>
          <Text className="text-foreground/30 mt-4 text-center text-xs">
            This usually takes under a minute. You can leave — it&rsquo;ll appear on Home.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
