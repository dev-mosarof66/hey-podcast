import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts, Sora_500Medium, Sora_700Bold } from '@expo-google-fonts/sora';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { PrimaryButton } from 'components/Button';
import { useTheme } from 'components/ThemeProvider';
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
  'Recording the two hosts…',
  'Mixing the audio…',
  'Almost ready…',
];

const PRIMARY = '#7008e7';
const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

/**
 * Real generation screen: polls the episode until it's ready, then hands it to
 * the player. Driven by the server pipeline, not a fixed timer.
 */
export default function GeneratingScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_700Bold });
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

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const track = dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)';
  const failBg = dark ? 'rgba(248,250,252,0.06)' : 'rgba(26,11,46,0.05)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;

  const logo = wp(22);

  const renderBody = () => {
    if (failed) {
      return (
        <>
          <View style={[styles.failCircle, { backgroundColor: failBg }]}>
            <Ionicons name="alert-circle-outline" size={wp(11)} color={Colors.muted} />
          </View>
          <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
            Generation failed
          </Text>
          <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
            Something went wrong creating this episode. Please try again.
          </Text>
          <PrimaryButton onPress={() => router.back()} style={[styles.backBtn, CTA_GLOW]}>
            <Text style={[styles.backText, { fontFamily: bodyFont }]}>Back</Text>
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
            Episode ready!
          </Text>
          <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>Starting playback…</Text>
        </Animated.View>
      );
    }

    return (
      <View style={styles.loadingWrap}>
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['rgba(139,47,232,0.22)', 'rgba(159,225,203,0.10)', 'rgba(255,255,255,0)']}
            style={[styles.glow, { width: logo * 2, height: logo * 2, borderRadius: logo }]}
          />
          <AnimatedLogo size={logo} />
        </View>
        <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
          Creating your episode
        </Text>
        <Text style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>{MESSAGES[msg]}</Text>
        <View style={[styles.track, { backgroundColor: track }]}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Text style={[styles.note, { color: subColor, fontFamily: bodyFont }]}>
          This usually takes under a minute. You can leave — it&rsquo;ll appear on Home.
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={[styles.flex, styles.center, { paddingHorizontal: 40 }]}>{renderBody()}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { width: '100%', alignItems: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  title: { marginTop: 32, textAlign: 'center', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  sub: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  note: { marginTop: 16, textAlign: 'center', fontSize: 13, lineHeight: 19 },
  track: { marginTop: 32, height: 6, width: '100%', overflow: 'hidden', borderRadius: 9999 },
  fill: { height: '100%', borderRadius: 9999, backgroundColor: PRIMARY },
  successCircle: { height: wp(26), width: wp(26), alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: PRIMARY },
  successGlow: { shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  failCircle: { height: wp(20), width: wp(20), alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  backBtn: { marginTop: 32, width: 'auto', paddingHorizontal: 40 },
  backText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
