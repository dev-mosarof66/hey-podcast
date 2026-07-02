import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { PrimaryButton } from 'components/Button';
import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';

interface Step {
  key: string;
  animation: AnimationObject;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    key: 'follow',
    animation: require('../assets/lottie/follow-topics.json'),
    title: 'Follow what you love',
    description:
      "Pick the topics you're curious about and we'll keep up with the latest on them for you.",
  },
  {
    key: 'generate',
    animation: require('../assets/lottie/fresh-episodes.json'),
    title: 'Fresh episodes, daily',
    description:
      'Every day, two AI hosts turn your topics into a short, lively podcast — made just for you.',
  },
  {
    key: 'listen',
    animation: require('../assets/lottie/listen-anywhere.json'),
    title: 'Listen anywhere',
    description:
      'Stream on the go with background playback. Your daily digest, ready whenever you are.',
  },
];

const PRIMARY = '#7008e7';
const LIGHT_BG = ['#faf5ff', '#f3e8ff', '#ede9fe'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

// Soft violet glow under the CTA (same treatment as the register button).
const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

export default function Onboarding() {
  const inset = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Step>>(null);
  const [index, setIndex] = useState(0);
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });

  const isLast = index === STEPS.length - 1;

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const btnFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const descColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(26,11,46,0.6)';
  const ringInner = dark ? 'rgba(159,225,203,0.16)' : 'rgba(112,8,231,0.16)';
  const ringOuter = dark ? 'rgba(159,225,203,0.08)' : 'rgba(112,8,231,0.10)';
  const inactiveDot = dark ? 'rgba(248,250,252,0.22)' : 'rgba(2,6,24,0.15)';
  const skipColor = dark ? 'rgba(248,250,252,0.5)' : 'rgba(2,6,24,0.5)';

  const finish = () => {
    SecureStore.setItemAsync('seen_onboarding', '1').catch(() => {});
    router.replace('/(auth)/register');
  };

  const next = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  };

  const ring = width * 0.66;

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Skip */}
        <View style={styles.topbar}>
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={[styles.skip, { color: skipColor, fontFamily: bodyFont }]}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={STEPS}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              {/* Brand rings + glow behind the animation for depth */}
              <View style={styles.halo}>
                <View
                  style={[
                    styles.ring,
                    { width: ring * 1.28, height: ring * 1.28, borderColor: ringOuter },
                  ]}
                />
                <View style={[styles.ring, { width: ring, height: ring, borderColor: ringInner }]} />
                <LinearGradient
                  colors={['rgba(139,47,232,0.20)', 'rgba(159,225,203,0.10)', 'rgba(255,255,255,0)']}
                  style={[styles.glow, { width: ring * 1.1, height: ring * 1.1, borderRadius: ring }]}
                />
              </View>

              <LottieView
                source={item.animation}
                autoPlay
                loop
                style={{ width: width * 0.66, height: width * 0.66 }}
              />
              <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
                {item.title}
              </Text>
              <Text style={[styles.desc, { color: descColor, fontFamily: bodyFont }]}>
                {item.description}
              </Text>
            </View>
          )}
        />

        {/* Footer: progress + CTA */}
        <View style={[styles.footer, { paddingBottom: inset.bottom }]}>
          <View style={styles.dots}>
            {STEPS.map((step, i) => (
              <View
                key={step.key}
                style={[
                  styles.dot,
                  i === index
                    ? { width: 26, backgroundColor: PRIMARY }
                    : { width: 8, backgroundColor: inactiveDot },
                ]}
              />
            ))}
          </View>

          <PrimaryButton onPress={next} style={CTA_GLOW}>
            <Text style={[styles.ctaText, { fontFamily: btnFont }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
          </PrimaryButton>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 8 },
  skip: { fontSize: 15, fontWeight: '500' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  halo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderRadius: 9999 },
  glow: { position: 'absolute' },
  title: { marginTop: 24, textAlign: 'center', fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  desc: { marginTop: 12, textAlign: 'center', fontSize: 16, lineHeight: 24 },
  footer: { paddingHorizontal: 28, paddingBottom: 8, gap: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 9999 },
  ctaText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
});
