import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { wp } from 'utils/utils';

const MESSAGES = [
  'Scanning your topics…',
  'Fetching the latest stories…',
  'Writing the two-host script…',
  'Mixing the voices…',
  'Almost ready…',
];

const GENERATE_MS = 8000;
const SUCCESS_MS = 1000;

/**
 * Fake "generating your personalized digest" step: ~8s of branded loading,
 * then a success flash, then calls onDone (→ pricing). No real pipeline yet.
 */
export function GeneratingDigest({ onDone }: { onDone: () => void }) {
  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;

  // Generating phase: progress bar + rotating messages for 8s.
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: GENERATE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), GENERATE_MS / MESSAGES.length);
    const toSuccess = setTimeout(() => setSuccess(true), GENERATE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(toSuccess);
    };
  }, [progress]);

  // Success phase: pop the checkmark, then hand off after 1s.
  useEffect(() => {
    if (!success) return;
    Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    const t = setTimeout(onDone, SUCCESS_MS);
    return () => clearTimeout(t);
  }, [success, onDone, successScale]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

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
            Your daily digest is ready.
          </Text>
        </Animated.View>
      ) : (
        <View className="w-full items-center">
          <AnimatedLogo size={wp(22)} />
          <Text className="text-foreground mt-8 text-2xl font-bold tracking-tight">
            Personalizing your feed
          </Text>
          <Text className="text-foreground/50 mt-2 text-center text-sm">{MESSAGES[msg]}</Text>
          <View className="bg-foreground/10 mt-8 h-1.5 w-full overflow-hidden rounded-full">
            <Animated.View className="bg-primary h-full rounded-full" style={{ width }} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
