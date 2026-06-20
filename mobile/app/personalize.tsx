import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';

import { PrimaryButton } from 'components/Button';
import { GeneratingDigest } from 'components/GeneratingDigest';
import { Shimmer } from 'components/Shimmer';
import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';
import { topicUi } from 'constants/topicUi';
import {
  useGetConfigQuery,
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

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="pb-3">
      <Text className="text-foreground text-3xl font-bold tracking-tight">{title}</Text>
      <Text className="text-foreground/50 mt-1 text-sm">{subtitle}</Text>
    </View>
  );
}

export default function PersonalizeScreen() {
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  // Edit mode (re-entered from Profile) just saves and returns — no onboarding
  // generating animation or paywall.
  const isEdit = useLocalSearchParams<{ edit?: string }>().edit === '1';

  const { data: config } = useGetConfigQuery();
  const { data: me } = useGetMeQuery();
  const [updateMe, { isLoading: savingMe }] = useUpdateMeMutation();
  const [saveTopics, { isLoading: savingTopics }] = useSetMyTopicsMutation();

  const ageRanges = config?.ageRanges ?? [];
  const professions = config?.professions ?? [];
  const topics = config?.topics ?? [];
  const loadingConfig = !config;

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [profession, setProfession] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const seededProfile = useRef(false);
  const seededTopics = useRef(false);

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
  const canContinue =
    step === 0 ? !!ageRange : step === 1 ? !!profession : selected.size > 0;

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
      // First-time onboarding: show the generating step → pricing.
      setGenerating(true);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save', text2: 'Please try again.' });
    }
  };

  const onContinue = () => (step < TOTAL_STEPS - 1 ? goTo(step + 1) : finish());

  if (generating) {
    return <GeneratingDigest onDone={() => router.replace('/pricing')} />;
  }

  const pageScroll = {
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(2),
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Top bar: back (edit mode only) + progress */}
      <View className="flex-row items-center gap-3 px-6 pt-2">
        {isEdit && (
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.muted} />
          </Pressable>
        )}
        <View className="flex-1 flex-row justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-foreground/15'}`}
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
        className="flex-1">
        {/* Step 0 — age range */}
        <View style={{ width }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pageScroll}>
            <Heading {...STEP_META[0]} />
            <View className="gap-3">
              {ageRanges.map((a) => {
                const active = ageRange === a;
                return (
                  <Pressable
                    key={a}
                    onPress={() => setAgeRange(a)}
                    className={`flex-row items-center justify-between rounded-2xl border p-4 active:opacity-80 ${
                      active ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-card'
                    }`}>
                    <Text className="text-foreground text-base font-semibold">{a}</Text>
                    {active && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
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
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {professions.map((p) => {
                const active = profession === p.label;
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => setProfession(p.label)}
                    className={`w-[48%] gap-3 rounded-2xl border p-4 active:opacity-80 ${
                      active ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-card'
                    }`}>
                    <View className="bg-primary/10 h-11 w-11 items-center justify-center rounded-full">
                      <Ionicons name={p.icon as IoniconName} size={22} color={Colors.primary} />
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-foreground text-base font-semibold">{p.label}</Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
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
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {loadingConfig
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Shimmer key={i} className="h-28 w-[48%] rounded-2xl" />
                  ))
                : topics.map((t) => {
                    const ui = topicUi(t.slug);
                    const active = selected.has(t.id);
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => toggleTopic(t.id)}
                        className={`w-[48%] gap-3 rounded-2xl border p-4 active:opacity-80 ${
                          active ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-card'
                        }`}>
                        <View className="flex-row items-center justify-between">
                          <View
                            className="h-11 w-11 items-center justify-center rounded-full"
                            style={{ backgroundColor: ui.color + '22' }}>
                            <Ionicons name={ui.icon} size={22} color={ui.color} />
                          </View>
                          {active && (
                            <Ionicons name="checkmark-circle" size={22} color={ui.color} />
                          )}
                        </View>
                        <Text className="text-foreground text-base font-semibold">{t.label}</Text>
                      </Pressable>
                    );
                  })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="border-foreground/5 border-t px-6 pb-2 pt-4">
        <PrimaryButton
          text={
            step < TOTAL_STEPS - 1
              ? 'Continue'
              : saving
                ? 'Saving…'
                : isEdit
                  ? 'Save'
                  : 'Finish'
          }
          onPress={onContinue}
          disabled={!canContinue || saving}
        />
      </View>
    </SafeAreaView>
  );
}
