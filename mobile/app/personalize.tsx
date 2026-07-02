import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { PrimaryButton } from 'components/Button';
import { GeneratingDigest } from 'components/GeneratingDigest';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';
import { topicUi } from 'constants/topicUi';
import {
  useGenerateDigestMutation,
  useGetConfigQuery,
  useGetEpisodeQuery,
  useGetMeQuery,
  useSetMyTopicsMutation,
  useUpdateMeMutation,
} from 'store/api';
import { hp, wp } from 'utils/utils';

const STEP_META = [
  { title: 'How old are you?', subtitle: 'Helps us tune the tone and picks.' },
  { title: 'What do you do?', subtitle: 'So episodes match your world.' },
  { title: 'Pick your topics', subtitle: 'We’ll build a daily digest from these.' },
];

const TOTAL_STEPS = 3;
const PRIMARY = '#7008e7';
const LIGHT_BG = ['#faf5ff', '#f3e8ff', '#ede9fe'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

// Soft violet glow under the CTA (shared with the onboarding button).
const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

export default function PersonalizeScreen() {
  const inset = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  // Edit mode (re-entered from Profile) just saves and returns — no onboarding
  // generating animation or paywall.
  const isEdit = useLocalSearchParams<{ edit?: string }>().edit === '1';

  const { data: config } = useGetConfigQuery();
  const { data: me } = useGetMeQuery();
  const [updateMe, { isLoading: savingMe }] = useUpdateMeMutation();
  const [saveTopics, { isLoading: savingTopics }] = useSetMyTopicsMutation();
  const [generateDigest] = useGenerateDigestMutation();

  const ageRanges = config?.ageRanges ?? [];
  const professions = config?.professions ?? [];
  const topics = config?.topics ?? [];
  const loadingConfig = !config;

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [profession, setProfession] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const seededProfile = useRef(false);
  const seededTopics = useRef(false);

  // Poll the just-queued episode until the generation job reaches a terminal
  // state. Stops polling once ready/failed so we don't hammer the server.
  const { data: genEpisode } = useGetEpisodeQuery(genId ?? '', {
    skip: !genId,
    pollingInterval: 3000,
  });
  const genReady = genEpisode?.status === 'ready';
  const genFailed = genEpisode?.status === 'failed';

  useEffect(() => {
    if (me && !seededProfile.current) {
      setAgeRange(me.ageRange);
      setProfession(me.profession);
      seededProfile.current = true;
    }
  }, [me]);

  useEffect(() => {
    if (topics.length && !seededTopics.current) {
      setSelected(new Set(topics.filter((t) => t.followed).map((t) => t.id)));
      seededTopics.current = true;
    }
  }, [topics]);

  const saving = savingMe || savingTopics;
  const canContinue = step === 0 ? !!ageRange : step === 1 ? !!profession : selected.size > 0;

  const goTo = (i: number) => {
    setStep(i);
    pagerRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const toggleTopic = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const finish = async () => {
    try {
      // Mark onboarded so the launch guard stops routing them back here.
      await updateMe({ ageRange, profession, onboarded: true }).unwrap();
      await saveTopics({ topicIds: [...selected] }).unwrap();
      if (isEdit) {
        // Re-entered to edit preferences — just save and go back.
        Toast.show({ type: 'success', text1: 'Preferences updated' });
        router.back();
        return;
      }

      // First-time onboarding: show the generating step and build the user's
      // personalized daily digest from all the topics they just picked, then
      // wait for it to finish. (Free — uses the digest endpoint, not the
      // premium-gated on-demand generator.)
      setGenerating(true);
      const episode = await generateDigest().unwrap();
      setGenId(episode.id);
    } catch {
      setGenerating(false);
      Toast.show({ type: 'error', text1: 'Could not save', text2: 'Please try again.' });
    }
  };

  const onContinue = () => (step < TOTAL_STEPS - 1 ? goTo(step + 1) : finish());

  if (generating) {
    return (
      <GeneratingDigest
        ready={genReady}
        failed={genFailed}
        onDone={() => router.replace('/redeem')}
      />
    );
  }

  // Theme-aware surfaces + text (mirror the onboarding palette).
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(26,11,46,0.08)';
  // Opaque tint (violet pre-blended over the card bg) — a translucent fill would
  // let the card's drop shadow show through and read as an inner shadow.
  const activeFill = dark ? '#241440' : '#f6f0fe';
  const progressInactive = dark ? 'rgba(248,250,252,0.15)' : 'rgba(26,11,46,0.12)';
  const footerBorder = dark ? 'rgba(248,250,252,0.08)' : 'rgba(26,11,46,0.06)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const labelFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const Heading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <View style={{ paddingBottom: 16 }}>
      <Text style={[styles.hTitle, { color: titleColor, fontFamily: titleFont }]}>{title}</Text>
      <Text style={[styles.hSub, { color: subColor, fontFamily: bodyFont }]}>{subtitle}</Text>
    </View>
  );

  const pageScroll = { paddingHorizontal: wp(6), paddingTop: hp(3), paddingBottom: hp(2) };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Top bar: back (edit mode only) + progress */}
        <View style={styles.topbar}>
          {isEdit && (
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={dark ? '#f8fafc' : '#1a0b2e'} />
            </Pressable>
          )}
          <View style={styles.progress}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  { backgroundColor: i <= step ? PRIMARY : progressInactive },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Swipeable steps */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width);
            if (page !== step) setStep(page);
          }}
          style={styles.flex}>
          {/* Step 0 — age range */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pageScroll}>
              <Heading {...STEP_META[0]} />
              <View style={{ gap: 12 }}>
                {ageRanges.map((a) => {
                  const active = ageRange === a;
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setAgeRange(a)}
                      style={[
                        styles.row,
                        styles.cardShadow,
                        {
                          backgroundColor: active ? activeFill : cardBg,
                          borderColor: active ? PRIMARY : cardBorder,
                        },
                        active && styles.activeGlow,
                      ]}>
                      <Text style={[styles.optLabel, { color: titleColor, fontFamily: labelFont }]}>
                        {a}
                      </Text>
                      {active && <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Step 1 — profession */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pageScroll}>
              <Heading {...STEP_META[1]} />
              <View style={styles.grid}>
                {professions.map((p) => {
                  const active = profession === p.label;
                  return (
                    <Pressable
                      key={p.label}
                      onPress={() => setProfession(p.label)}
                      style={[
                        styles.card,
                        styles.cardShadow,
                        {
                          backgroundColor: active ? activeFill : cardBg,
                          borderColor: active ? PRIMARY : cardBorder,
                        },
                        active && styles.activeGlow,
                      ]}>
                      <View style={[styles.iconWrap, { backgroundColor: 'rgba(112,8,231,0.10)' }]}>
                        <Ionicons name={p.icon as IoniconName} size={22} color={PRIMARY} />
                      </View>
                      <View style={styles.cardFoot}>
                        <Text
                          style={[styles.optLabel, { color: titleColor, fontFamily: labelFont }]}>
                          {p.label}
                        </Text>
                        {active && <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Step 2 — topics */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pageScroll}>
              <Heading {...STEP_META[2]} />
              <View style={styles.grid}>
                {loadingConfig
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Shimmer key={i} style={{ width: '48%', height: hp(13), borderRadius: 20 }} />
                    ))
                  : topics.map((t) => {
                      const ui = topicUi(t.slug);
                      const active = selected.has(t.id);
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => toggleTopic(t.id)}
                          style={[
                            styles.card,
                            styles.cardShadow,
                            {
                              backgroundColor: active ? activeFill : cardBg,
                              borderColor: active ? PRIMARY : cardBorder,
                            },
                            active && styles.activeGlow,
                          ]}>
                          <View style={styles.cardHead}>
                            <View style={[styles.iconWrap, { backgroundColor: ui.color + '22' }]}>
                              <Ionicons name={ui.icon} size={22} color={ui.color} />
                            </View>
                            {active && (
                              <Ionicons name="checkmark-circle" size={22} color={ui.color} />
                            )}
                          </View>
                          <Text
                            style={[styles.optLabel, { color: titleColor, fontFamily: labelFont }]}>
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[styles.footer, { borderTopColor: footerBorder, paddingBottom: inset.bottom }]}>
          <PrimaryButton onPress={onContinue} disabled={!canContinue || saving} style={CTA_GLOW}>
            <Text style={[styles.ctaText, { fontFamily: labelFont }]}>
              {step < TOTAL_STEPS - 1 ? (
                'Continue'
              ) : saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : isEdit ? (
                'Save'
              ) : (
                'Finish'
              )}
            </Text>
          </PrimaryButton>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  progress: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  segment: { height: 6, flex: 1, borderRadius: 9999 },
  hTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  hSub: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  card: { width: '48%', gap: 12, borderRadius: 20, borderWidth: 1.5, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  optLabel: { fontSize: 16, fontWeight: '600' },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  activeGlow: {
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  footer: { borderTopWidth: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  ctaText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
});
