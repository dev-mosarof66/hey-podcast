import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { Colors } from 'constants/Colors';
import { PrimaryButton } from 'components/Button';
import { useRedeemPromoMutation } from 'store/api';
import { wp } from 'utils/utils';

export default function RedeemScreen() {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [redeem, { isLoading }] = useRedeemPromoMutation();
  const [trialDays, setTrialDays] = useState<number | null>(null);

  // Slide the centered content up so it re-centers in the space above the
  // keyboard (same Keyboard-listener approach as the auth screens - reliable
  // on iOS + Android). Half the keyboard height recenters it exactly.
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height / 2,
        duration: e.duration || 220,
        useNativeDriver: true,
      }).start();
    };
    const onHide = (e: KeyboardEvent) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 200,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

  const onRedeem = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    try {
      const res = await redeem({ code: c }).unwrap();
      Keyboard.dismiss();
      setTrialDays(res.trialDays);
    } catch (e) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Could not redeem this code.';
      Toast.show({ type: 'error', text1: 'Redeem failed', text2: msg });
    }
  };

  // Success -> play the unlock animation, which auto-redirects home.
  if (trialDays != null) {
    return <UnlockingView trialDays={trialDays} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Animated.View
        className="flex flex-1 items-center justify-center"
        style={{ transform: [{ translateY }] }}>
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="gift" size={wp(10)} color={Colors.primary} />
        </View>
        <Text className="text-2xl font-bold text-foreground">Have a promo code?</Text>
        <Text className="text-md mt-1 text-foreground/50">
          Access all the premium features for 7 - day.
        </Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="PROMO CODE"
          placeholderTextColor={Colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onRedeem}
          className={`mt-6 w-96 rounded-2xl border px-4 py-4 text-base tracking-widest text-foreground ${
            focused ? 'border-primary' : 'border-foreground/15'
          }`}
        />

        <View className="w-96 mt-4">
          <PrimaryButton
            text={isLoading ? 'Redeeming...' : 'Get 7 - Day Trial'}
            onPress={onRedeem}
            disabled={!code.trim() || isLoading}
          />
        </View>
      </Animated.View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

/**
 * A ~3s "unlocking premium" celebration: a glowing badge pulses while a bar
 * fills, the copy flips to "Premium unlocked!", then we redirect home.
 */
function UnlockingView({ trialDays }: { trialDays: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const glow = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    Animated.timing(progress, { toValue: 1, duration: 2600, useNativeDriver: false }).start();

    const doneTimer = setTimeout(() => setDone(true), 2600);
    const navTimer = setTimeout(() => router.replace('/(tabs)/home'), 3000);
    return () => {
      pulse.stop();
      clearTimeout(doneTimer);
      clearTimeout(navTimer);
    };
  }, [scale, glow, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-10">
      <Animated.View style={{ transform: [{ scale }] }} className="items-center">
        {/* Glowing badge */}
        <View className="items-center justify-center">
          <Animated.View
            style={{ opacity: glow }}
            className="absolute h-28 w-28 rounded-full bg-primary/30"
          />
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Ionicons name={'diamond'} size={wp(11)} color="#fff" />
          </View>
        </View>

        <Text className="mt-7 text-2xl font-bold tracking-tight text-foreground">
          {done ? 'Premium unlocked!' : 'Unlocking premium...'}
        </Text>
        <Text className="mt-2 text-center text-md text-foreground/50">
          {done
            ? `Your ${trialDays}-day free trial is now active.`
            : 'Setting up your premium experience.'}
        </Text>

        {/* Progress bar */}
        <View className="mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-foreground/10">
          <Animated.View className="h-full rounded-full bg-primary" style={{ width }} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
