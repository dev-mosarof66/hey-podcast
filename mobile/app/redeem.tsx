import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { PrimaryButton } from 'components/Button';
import { useTheme } from 'components/ThemeProvider';
import { useRedeemPromoMutation } from 'store/api';
import { hp, wp } from 'utils/utils';

const PRIMARY = '#7008e7';
const CODE_LENGTH = 6;
const LIGHT_BG = ['#faf5ff', '#f3e8ff', '#ede9fe'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;
const GLOW = ['rgba(139,47,232,0.22)', 'rgba(159,225,203,0.10)', 'rgba(255,255,255,0)'] as const;

const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

export default function RedeemScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [redeem, { isLoading }] = useRedeemPromoMutation();
  const [trialDays, setTrialDays] = useState<number | null>(null);
  // Opened from Profile (vs. the onboarding/paywall flow) → offer a way back.
  const fromProfile = useLocalSearchParams<{ from?: string }>().from === 'profile';

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

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const btnFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Close (Profile entry only) */}
        <View style={styles.topbar}>
          {fromProfile && (
            <Pressable hitSlop={12} onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={dark ? '#f8fafc' : '#1a0b2e'} />
            </Pressable>
          )}
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
            {/* Glowing gift badge */}
            <View style={styles.badgeWrap}>
              <LinearGradient colors={GLOW} style={styles.badgeGlow} />
              <View style={[styles.badge, { backgroundColor: 'rgba(112,8,231,0.10)' }]}>
                <Ionicons name="gift" size={wp(10)} color={PRIMARY} />
              </View>
            </View>

            <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
              Have a promo code?
            </Text>
            <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
              Access all the premium features for 7 days.
            </Text>

            {/* Six dashed digit boxes over a hidden input (tap anywhere focuses). */}
            <Pressable style={styles.codeWrap} onPress={() => inputRef.current?.focus()}>
              <View style={styles.boxRow}>
                {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                  const char = code[i] ?? '';
                  const isActive = focused && i === code.length;
                  const isMarked = i < code.length || isActive;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.box,
                        {
                          backgroundColor: cardBg,
                          borderColor: isMarked ? PRIMARY : cardBorder,
                        },
                        isActive && CTA_GLOW,
                      ]}>
                      <Text style={[styles.boxText, { color: titleColor, fontFamily: titleFont }]}>
                        {char}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(t) =>
                  setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH))
                }
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                caretHidden
                maxLength={CODE_LENGTH}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={onRedeem}
                style={styles.hiddenInput}
              />
            </Pressable>

            <PrimaryButton
              onPress={onRedeem}
              disabled={code.length < CODE_LENGTH || isLoading}
              style={[styles.btn, CTA_GLOW]}>
              <Text style={[styles.btnText, { fontFamily: btnFont }]}>
                {isLoading ? <ActivityIndicator color="#fff" /> : 'Get 7-Day Trial'}
              </Text>
            </PrimaryButton>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

/**
 * A ~3s "unlocking premium" celebration: a glowing badge pulses while a bar
 * fills, the copy flips to "Premium unlocked!", then we redirect home.
 */
function UnlockingView({ trialDays }: { trialDays: number }) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_700Bold });
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
      ])
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

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const track = dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={[styles.flex, styles.center, { paddingHorizontal: 40 }]}>
        <Animated.View style={[styles.center, { transform: [{ scale }] }]}>
          {/* Glowing badge */}
          <View style={styles.center}>
            <Animated.View style={[styles.unlockGlow, { opacity: glow }]} />
            <View style={[styles.unlockBadge, CTA_GLOW]}>
              <Ionicons name="diamond" size={wp(11)} color="#fff" />
            </View>
          </View>

          <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
            {done ? 'Premium unlocked!' : 'Unlocking premium…'}
          </Text>
          <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
            {done
              ? `Your ${trialDays}-day free trial is now active.`
              : 'Setting up your premium experience.'}
          </Text>

          <View style={[styles.unlockTrack, { backgroundColor: track }]}>
            <Animated.View style={[styles.unlockFill, { width: barWidth }]} />
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  topbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 8, minHeight: wp(10) },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  badgeWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  badgeGlow: { position: 'absolute', width: wp(40), height: wp(40), borderRadius: wp(20) },
  badge: { height: wp(20), width: wp(20), alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  sub: { marginTop: 8, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  codeWrap: { marginTop: 28, width: '100%' },
  boxRow: { flexDirection: 'row', gap: 8, marginTop: hp(1), justifyContent: 'center' },
  box: {
    flex: 1,
    height: 58,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: { fontSize: 22, fontWeight: '700' },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  btn: { marginTop: hp(6), width: '100%' },
  btnText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  // Unlocking celebration
  unlockGlow: { position: 'absolute', height: wp(30), width: wp(30), borderRadius: 9999, backgroundColor: 'rgba(112,8,231,0.30)' },
  unlockBadge: { height: wp(24), width: wp(24), alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: PRIMARY },
  unlockTrack: { marginTop: 28, height: 6, width: wp(56), overflow: 'hidden', borderRadius: 9999 },
  unlockFill: { height: '100%', borderRadius: 9999, backgroundColor: PRIMARY },
});
