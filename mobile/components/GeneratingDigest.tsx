import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { Colors } from 'constants/Colors';
import { wp } from 'utils/utils';

const MESSAGES = [
  'Scanning your topics…',
  'Fetching the latest stories…',
  'Writing the two-host script…',
  'Mixing the voices…',
  'Almost ready…',
];

/**
 * "Generating your personalized digest" step. Driven by the real generation
 * job, not a timer: the progress bar creeps toward ~90% while the pipeline
 * runs, then `ready` fills it, flashes success, and hands off (→ Home). If the
 * job fails, an error state lets the user continue anyway.
 */
export function GeneratingDigest({
  ready,
  failed = false,
  onDone,
}: {
  ready: boolean;
  failed?: boolean;
  onDone: () => void;
}) {
  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;
  const handed = useRef(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Indeterminate creep toward ~90% while the pipeline runs + rotating copy.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.9,
      duration: 45000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    const interval = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 3000);
    return () => clearInterval(interval);
  }, [progress]);

  // Ready → fill the bar, pop the checkmark, then hand off after ~1s.
  useEffect(() => {
    if (!ready || handed.current) return;
    handed.current = true;
    Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: false }).start(() => {
      setSuccess(true);
      Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      doneTimer.current = setTimeout(onDone, 1000);
    });
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [ready, onDone, progress, successScale]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // Generation failed/stalled — let the user head to Home; the job keeps going
  // server-side and the episode will appear on the feed when it's ready.
  if (failed && !success) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center px-10">
        <View className="bg-foreground/5 h-20 w-20 items-center justify-center rounded-full">
          <Ionicons name="cloud-offline-outline" size={wp(11)} color={Colors.muted} />
        </View>
        <Text className="text-foreground mt-6 text-2xl font-bold tracking-tight">
          Still cooking your digest
        </Text>
        <Text className="text-foreground/50 mt-2 text-center text-sm">
          This one&rsquo;s taking a while — we&rsquo;ll keep working on it in the background. You can
          start exploring now.
        </Text>
        <Pressable onPress={onDone} className="bg-primary mt-8 rounded-full px-7 py-3">
          <Text className="font-semibold text-white">Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1 items-center justify-center px-10">
      {success ? (
        <Animated.View style={{ transform: [{ scale: successScale }] }} className="items-center">
          <View className="bg-primary p-6 items-center justify-center rounded-full">
            <Ionicons name="checkmark" size={wp(13)} color="#fff" />
          </View>
          <Text className="text-foreground mt-6 text-2xl font-bold tracking-tight">
            You&rsquo;re all set!
          </Text>
          <Text className="text-foreground/50 mt-1 text-center text-sm">
            Your first episode is ready.
          </Text>
        </Animated.View>
      ) : (
        <View className="w-full items-center">
          <AnimatedLogo size={wp(22)} />
          <Text className="text-foreground mt-8 text-2xl font-bold tracking-tight">
            Personalizing your feed
          </Text>
          <Text className="text-foreground/50 mt-2 text-center text-md">{MESSAGES[msg]}</Text>
          <View className="bg-foreground/10 mt-8 h-1.5 w-full overflow-hidden rounded-full">
            <Animated.View className="bg-primary h-full rounded-full" style={{ width }} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
