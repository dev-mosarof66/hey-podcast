import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { PrimaryButton } from 'components/Button';
import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';
import { useSubscribeMutation } from 'store/api';
import { hp, wp } from 'utils/utils';

const FEATURES = [
  'Unlimited on-demand episodes',
  'Offline downloads',
  'No listening limits',
  'Priority generation',
];

type PlanId = 'monthly' | 'yearly';
const PLANS: { id: PlanId; label: string; price: string; per: string; note?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: '$9', per: '/mo' },
  { id: 'yearly', label: 'Yearly', price: '$79', per: '/yr', note: 'Save 27%' },
];

const METHODS: { id: string; label: string; icon: IoniconName; color: string }[] = [
  { id: 'google', label: 'Google Pay', icon: 'logo-google', color: '#EA4335' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'card', color: Colors.primary },
];

function Radio({ active }: { active: boolean }) {
  return (
    <View
      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
        active ? 'border-primary' : 'border-foreground/30'
      }`}>
      {active && <View className="bg-primary h-2.5 w-2.5 rounded-full" />}
    </View>
  );
}

export default function PricingScreen() {
  const [plan, setPlan] = useState<PlanId>('monthly');
  const [method, setMethod] = useState('google');
  const [subscribe, { isLoading }] = useSubscribeMutation();

  const dismiss = () => router.back();
  const selectedPlan = PLANS.find((p) => p.id === plan)!;

  const onSubscribe = async () => {
    try {
      await subscribe({ plan }).unwrap();
      Toast.show({ type: 'success', text1: 'Welcome to Premium!', text2: 'Enjoy unlimited episodes.' });
      router.replace('/(tabs)/home');
    } catch {
      Toast.show({ type: 'error', text1: 'Subscription failed', text2: 'Please try again.' });
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
      <View className="flex-row justify-end px-6 pt-2">
        <Pressable hitSlop={12} onPress={dismiss}>
          <Ionicons name="close" size={26} color={Colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(2) }}>
        {/* Hero */}
        <View className="items-center pb-6 pt-1">
          <LinearGradient
            colors={['#9B1FA4', '#721378', '#3C0A45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: wp(18), height: wp(18), borderRadius: wp(9) }}
            className="items-center justify-center">
            <Ionicons name="diamond" size={wp(8)} color="#fff" />
          </LinearGradient>
          <Text className="text-foreground mt-4 text-3xl font-bold tracking-tight">
            Hey Podcast Premium
          </Text>
          <Text className="text-foreground/50 mt-1 text-center text-sm">
            Your daily digest, unlimited.
          </Text>
        </View>

        {/* Features */}
        <View className="mb-7 gap-3">
          {FEATURES.map((f) => (
            <View key={f} className="flex-row items-center gap-3">
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              <Text className="text-foreground text-base">{f}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text className="text-foreground/40 mb-2 text-xs font-semibold uppercase tracking-widest">
          Choose a plan
        </Text>
        <View className="gap-3">
          {PLANS.map((p) => {
            const active = plan === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlan(p.id)}
                className={`flex-row items-center justify-between rounded-2xl border p-4 active:opacity-80 ${
                  active ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-card'
                }`}>
                <View className="flex-row items-center gap-3">
                  <Radio active={active} />
                  <View>
                    <Text className="text-foreground text-base font-bold">{p.label}</Text>
                    {p.note && (
                      <Text className="text-primary text-xs font-semibold">{p.note}</Text>
                    )}
                  </View>
                </View>
                <Text className="text-foreground text-lg font-bold">
                  {p.price}
                  <Text className="text-foreground/50 text-sm font-medium">{p.per}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Payment method */}
        <Text className="text-foreground/40 mb-2 mt-6 text-xs font-semibold uppercase tracking-widest">
          Payment method
        </Text>
        <View className="gap-3">
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                className={`flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${
                  active ? 'border-primary bg-primary/5' : 'border-foreground/10 bg-card'
                }`}>
                <Ionicons name={m.icon} size={22} color={m.color} />
                <Text className="text-foreground flex-1 text-base font-semibold">{m.label}</Text>
                <Radio active={active} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="gap-2 px-6 pb-2 pt-3">
        <PrimaryButton
          text={isLoading ? 'Processing…' : `Subscribe — ${selectedPlan.price}${selectedPlan.per}`}
          onPress={onSubscribe}
          disabled={isLoading}
        />
        <Text className="text-foreground/40 text-center text-xs">Cancel anytime.</Text>
        <Pressable hitSlop={8} className="self-center py-1" onPress={dismiss}>
          <Text className="text-foreground/50 text-sm font-semibold">Maybe later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
