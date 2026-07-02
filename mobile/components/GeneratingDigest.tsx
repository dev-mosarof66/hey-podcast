import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { PrimaryButton } from 'components/Button';
import { useTheme } from 'components/ThemeProvider';
import { Colors } from 'constants/Colors';
import { wp } from 'utils/utils';

const MESSAGES = [
  'Scanning your topics…',
  'Fetching the latest stories…',
  'Writing the two-host script…',
  'Mixing the voices…',
  'Almost ready…',
];

const PRIMARY = '#7008e7';
const LIGHT_BG = ['#faf5ff', '#f3e8ff', '#ede9fe'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

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
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
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

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const track = dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)';
  const failCircle = dark ? 'rgba(248,250,252,0.06)' : 'rgba(26,11,46,0.05)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const btnFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const logo = wp(22);

  const renderBody = () => {
    // Generation failed/stalled — let the user head to Home; the job keeps
    // going server-side and the episode shows up on the feed when it's ready.
    if (failed && !success) {
      return (
        <>
          <View style={[styles.failCircle, { backgroundColor: failCircle }]}>
            <Ionicons name="cloud-offline-outline" size={wp(11)} color={Colors.muted} />
          </View>
          <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
            Still cooking your digest
          </Text>
          <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
            This one&rsquo;s taking a while — we&rsquo;ll keep working on it in the background. You can
            start exploring now.
          </Text>
          <PrimaryButton onPress={onDone} style={[styles.homeBtn, CTA_GLOW]}>
            <Text style={[styles.homeBtnText, { fontFamily: btnFont }]}>Go to Home</Text>
          </PrimaryButton>
        </>
      );
    }

    if (success) {
      return (
        <Animated.View style={[styles.center, { transform: [{ scale: successScale }] }]}>
          <View style={[styles.successCircle, styles.successGlow]}>
            <Ionicons name="checkmark" size={wp(13)} color="#fff" />
          </View>
          <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
            You&rsquo;re all set!
          </Text>
          <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
            Your first episode is ready.
          </Text>
        </Animated.View>
      );
    }

    return (
      <View style={styles.loadingWrap}>
        {/* Soft violet glow behind the animated brand mark for depth. */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['rgba(139,47,232,0.22)', 'rgba(159,225,203,0.10)', 'rgba(255,255,255,0)']}
            style={[styles.glow, { width: logo * 2, height: logo * 2, borderRadius: logo }]}
          />
          <AnimatedLogo size={logo} />
        </View>
        <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
          Personalizing your feed
        </Text>
        <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>{MESSAGES[msg]}</Text>
        <View style={[styles.track, { backgroundColor: track }]}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.safe}>{renderBody()}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  center: { alignItems: 'center' },
  loadingWrap: { width: '100%', alignItems: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  title: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sub: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  track: {
    marginTop: 32,
    height: 6,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 9999,
  },
  fill: { height: '100%', borderRadius: 9999, backgroundColor: PRIMARY },
  successCircle: {
    height: wp(26),
    width: wp(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: PRIMARY,
  },
  successGlow: {
    shadowColor: PRIMARY,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  failCircle: {
    height: wp(20),
    width: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  homeBtn: { marginTop: 32, width: 'auto', paddingHorizontal: 32 },
  homeBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
