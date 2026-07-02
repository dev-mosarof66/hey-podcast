import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { PrimaryButton } from 'components/Button';
import { useTheme } from 'components/ThemeProvider';
import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';
import { hp, wp } from 'utils/utils';

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

function Radio({ active, inactiveBorder }: { active: boolean; inactiveBorder: string }) {
  return (
    <View style={[styles.radio, { borderColor: active ? PRIMARY : inactiveBorder }]}>
      {active && <View style={styles.radioDot} />}
    </View>
  );
}

export default function PricingScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const [plan, setPlan] = useState<PlanId>('monthly');
  const [method, setMethod] = useState('google');
  const dismiss = () => router.back();

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(112,8,231,0.18)';
  const activeFill = dark ? '#241440' : '#f6f0fe';
  const inactiveBorder = dark ? 'rgba(248,250,252,0.25)' : 'rgba(26,11,46,0.25)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  // Billing isn't live yet — let users preview the plans, but don't take
  // payments. Promo codes remain the way to unlock premium for now.
  const onSubscribe = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming soon',
      text2: "Premium billing isn't live yet. Have a promo code? Redeem it from Profile.",
    });
  };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topbar}>
          <Pressable hitSlop={12} onPress={dismiss}>
            <Ionicons name="close" size={26} color={titleColor} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(2) }}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['#8b2fe8', '#7008e7', '#4c1d95']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroBadge, CTA_GLOW]}>
              <Ionicons name="diamond" size={wp(8)} color="#fff" />
            </LinearGradient>
            <Text style={[styles.heroTitle, { color: titleColor, fontFamily: titleFont }]}>
              Daily Download Premium
            </Text>
            <Text style={[styles.heroSub, { color: subColor, fontFamily: bodyFont }]}>
              Your daily digest, unlimited.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />
                <Text style={[styles.featureText, { color: titleColor, fontFamily: bodyFont }]}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Plans */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Choose a plan
          </Text>
          <View style={{ gap: 12 }}>
            {PLANS.map((p) => {
              const active = plan === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPlan(p.id)}
                  style={[
                    styles.optionRow,
                    { backgroundColor: active ? activeFill : cardBg, borderColor: active ? PRIMARY : cardBorder },
                  ]}>
                  <View style={styles.optionLeft}>
                    <Radio active={active} inactiveBorder={inactiveBorder} />
                    <View>
                      <Text style={[styles.optionLabel, { color: titleColor, fontFamily: semiFont }]}>
                        {p.label}
                      </Text>
                      {p.note && (
                        <Text style={[styles.optionNote, { fontFamily: semiFont }]}>{p.note}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.price, { color: titleColor, fontFamily: titleFont }]}>
                    {p.price}
                    <Text style={[styles.per, { color: subColor, fontFamily: bodyFont }]}>{p.per}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Payment method */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Payment method
          </Text>
          <View style={{ gap: 12 }}>
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[
                    styles.methodRow,
                    { backgroundColor: active ? activeFill : cardBg, borderColor: active ? PRIMARY : cardBorder },
                  ]}>
                  <Ionicons name={m.icon} size={22} color={m.color} />
                  <Text style={[styles.methodLabel, { color: titleColor, fontFamily: semiFont }]}>
                    {m.label}
                  </Text>
                  <Radio active={active} inactiveBorder={inactiveBorder} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryButton onPress={onSubscribe} style={CTA_GLOW}>
            <Text style={[styles.ctaText, { fontFamily: semiFont }]}>Coming soon</Text>
          </PrimaryButton>
          <Text style={[styles.footNote, { color: labelColor, fontFamily: bodyFont }]}>
            Premium billing is coming soon.
          </Text>
          <Pressable hitSlop={8} style={styles.later} onPress={dismiss}>
            <Text style={[styles.laterText, { color: subColor, fontFamily: semiFont }]}>Maybe later</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: wp(6), paddingTop: 8 },
  hero: { alignItems: 'center', paddingTop: 4, paddingBottom: hp(3) },
  heroBadge: { width: wp(18), height: wp(18), borderRadius: wp(9), alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 16, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  heroSub: { marginTop: 4, textAlign: 'center', fontSize: 14 },
  features: { marginBottom: hp(3), gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15 },
  sectionLabel: { marginTop: 24, marginBottom: 10, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 16, fontWeight: '700' },
  optionNote: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  price: { fontSize: 18, fontWeight: '700' },
  per: { fontSize: 14, fontWeight: '500' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1.5, padding: 16 },
  methodLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  radio: { height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, borderWidth: 2 },
  radioDot: { height: 10, width: 10, borderRadius: 9999, backgroundColor: PRIMARY },
  footer: { paddingHorizontal: wp(6), paddingTop: 12, paddingBottom: 8, gap: 8 },
  ctaText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  footNote: { textAlign: 'center', fontSize: 12 },
  later: { alignSelf: 'center', paddingVertical: 4 },
  laterText: { fontSize: 14, fontWeight: '600' },
});
