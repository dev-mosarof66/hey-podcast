import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useAuth } from 'components/AuthProvider';
import { ConfirmDialog } from 'components/ConfirmDialog';
import { DeleteAccountDialog } from 'components/DeleteAccountDialog';
import { SettingRow } from 'components/SettingRow';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { PLAYBACK_RATES, usePlayerActions } from 'components/PlayerProvider';
import { ThemeSetter } from 'components/ThemeSetter';
import { useCardShadow } from 'hooks/useCardShadow';
import {
  useDeleteAccountMutation,
  useGetMeQuery,
  useGetStatsQuery,
  useGetSubscriptionQuery,
  useGetTopicsQuery,
} from 'store/api';
import { hp, wp } from 'utils/utils';

const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

function Stat({ value, label, loading }: { value: string; label: string; loading?: boolean }) {
  return (
    <View style={styles.stat}>
      {loading ? (
        <Shimmer style={{ height: 24, width: 40, borderRadius: 6 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const cardShadow = useCardShadow();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [speed, setSpeed] = useState(1);
  const { setRate } = usePlayerActions();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const { signOut: authSignOut } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery();
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
  const { data: sub, isLoading: subLoading } = useGetSubscriptionQuery();

  const isPremium = sub?.tier === 'premium';
  const followed = topics.filter((t) => t.followed).length;
  const episodesPlayed = stats?.episodesPlayed ?? 0;
  const minutesListened = stats?.minutesListened ?? 0;

  const name = me?.displayName || 'there';
  const email = me?.email ?? '';
  const initial = (me?.displayName || me?.email || '?').charAt(0).toUpperCase();

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(112,8,231,0.18)';
  const divider = dark ? 'rgba(248,250,252,0.10)' : 'rgba(26,11,46,0.10)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const groupStyle = [styles.group, { backgroundColor: cardBg, borderColor: cardBorder }, cardShadow];

  const signOut = async () => {
    setSignOutVisible(false);
    await authSignOut();
    router.replace('/(auth)/login');
  };

  const cyclePlaybackSpeed = () => {
    const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(speed) + 1) % PLAYBACK_RATES.length];
    setSpeed(next);
    setRate(next);
  };

  const onDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      setDeleteVisible(false);
      await authSignOut();
      router.replace('/(auth)/login');
    } catch {
      Toast.show({ type: 'error', text1: 'Could not delete account', text2: 'Please try again.' });
    }
  };

  const SectionLabel = ({ children, color }: { children: string; color?: string }) => (
    <Text style={[styles.sectionLabel, { color: color ?? labelColor, fontFamily: semiFont }]}>
      {children}
    </Text>
  );

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: titleColor, fontFamily: titleFont }]}>Profile</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(14), paddingTop: wp(4) }}>
          {/* Identity card */}
          <LinearGradient
            colors={['#8b2fe8', '#7008e7', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.identity, cardShadow]}>
            <View style={styles.identityTop}>
              <View style={styles.avatar}>
                {meLoading ? (
                  <Shimmer style={{ width: '100%', height: '100%' }} />
                ) : me?.avatarUrl ? (
                  <Image source={{ uri: me.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={[styles.avatarInitial, { fontFamily: titleFont }]}>{initial}</Text>
                )}
              </View>
              <View style={styles.identityText}>
                {meLoading ? (
                  <>
                    <Shimmer style={{ height: 20, width: 128, borderRadius: 6 }} />
                    <Shimmer style={{ height: 16, width: 176, borderRadius: 6 }} />
                  </>
                ) : (
                  <>
                    <Text numberOfLines={1} style={[styles.identityName, { fontFamily: titleFont }]}>
                      {name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.identityEmail, { fontFamily: bodyFont }]}>
                      {email}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.stats}>
              <Stat value={String(episodesPlayed)} label="Episodes" loading={statsLoading} />
              <View style={styles.statDivider} />
              <Stat value={formatMinutes(minutesListened)} label="Listened" loading={statsLoading} />
              <View style={styles.statDivider} />
              <Stat value={String(followed)} label="Topics" loading={topicsLoading} />
            </View>
          </LinearGradient>

          {/* Premium card — billing isn't live yet, so this previews plans
              ("Coming soon") and routes to pricing rather than promo redemption. */}
          <Pressable onPress={() => router.navigate('/pricing')}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.premium, cardShadow]}>
              <View style={styles.premiumRow}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="diamond" size={wp(6)} color="#fff" />
                </View>
                <View style={styles.premiumText}>
                  {subLoading ? (
                    <>
                      <Shimmer style={{ height: 16, width: 112, borderRadius: 6 }} />
                      <Shimmer style={{ height: 12, width: 160, borderRadius: 6 }} />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.premiumTitle, { fontFamily: titleFont }]}>
                        {isPremium ? 'Premium active' : 'Go Premium'}
                      </Text>
                      <Text style={[styles.premiumSub, { fontFamily: bodyFont }]}>
                        {isPremium ? 'Manage your subscription' : 'Unlimited episodes & offline downloads'}
                      </Text>
                    </>
                  )}
                </View>
                <View style={styles.premiumPill}>
                  <Text style={[styles.premiumPillText, { fontFamily: semiFont }]}>
                    {subLoading ? '···' : isPremium ? 'Manage' : 'Coming soon'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Promo code */}
          <Pressable
            onPress={() => router.navigate({ pathname: '/redeem', params: { from: 'profile' } })}
            style={[styles.promo, { backgroundColor: cardBg, borderColor: cardBorder }, cardShadow]}>
            <View style={[styles.promoIcon, { backgroundColor: 'rgba(112,8,231,0.10)' }]}>
              <Ionicons name="gift-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.promoTitle, { color: titleColor, fontFamily: semiFont }]}>
                Have a promo code?
              </Text>
              <Text style={[styles.promoSub, { color: subColor, fontFamily: bodyFont }]}>
                Redeem it for premium access
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
          </Pressable>

          {/* Preferences */}
          <SectionLabel>Preferences</SectionLabel>
          <View style={groupStyle}>
            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              value="On"
              onPress={() => Linking.openSettings()}
            />
            <SettingRow
              icon="speedometer-outline"
              label="Playback speed"
              value={`${speed}×`}
              onPress={cyclePlaybackSpeed}
            />
            <SettingRow
              icon="people-outline"
              label="Manage hosts"
              value="Upcoming"
              onPress={() =>
                Toast.show({
                  type: 'info',
                  text1: 'Coming soon',
                  text2: 'Custom host voices & names are on the way.',
                })
              }
            />
          </View>

          {/* Appearance */}
          <SectionLabel>Appearance</SectionLabel>
          <ThemeSetter />

          {/* Account */}
          <SectionLabel>Account</SectionLabel>
          <View style={groupStyle}>
            <SettingRow
              icon="gift-outline"
              label="Pricing"
              value={isPremium ? 'Premium' : undefined}
              onPress={() => router.navigate('/pricing')}
            />
            <SettingRow
              icon="help-circle-outline"
              label="Help & feedback"
              value="Upcoming"
              onPress={() =>
                Toast.show({ type: 'info', text1: 'Coming soon', text2: 'Help & feedback is on the way.' })
              }
            />
            <SettingRow
              icon="information-circle-outline"
              label="About"
              value="v1.0.0"
              onPress={() => Toast.show({ type: 'info', text1: 'Daily Download', text2: 'Version 1.0.0' })}
            />
          </View>

          {/* Danger zone */}
          <SectionLabel color="#ef4444">Danger zone</SectionLabel>
          <View style={groupStyle}>
            <SettingRow icon="log-out-outline" label="Sign out" danger onPress={() => setSignOutVisible(true)} />
            <View style={[styles.rowDivider, { backgroundColor: divider }]} />
            <SettingRow icon="trash-outline" label="Delete account" danger onPress={() => setDeleteVisible(true)} />
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={signOutVisible}
          icon="log-out-outline"
          title="Sign out"
          message="Are you sure you want to sign out?"
          confirmText="Sign out"
          destructive
          onConfirm={signOut}
          onCancel={() => setSignOutVisible(false)}
        />

        <DeleteAccountDialog
          visible={deleteVisible}
          loading={deleting}
          onConfirm={onDeleteAccount}
          onCancel={() => setDeleteVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: wp(6), paddingTop: 8, paddingBottom: 8 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  // Identity
  identity: { borderRadius: wp(5), padding: wp(5), overflow: 'hidden' },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: '#fff' },
  identityText: { flex: 1, gap: 6 },
  identityName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  identityEmail: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  stats: { marginTop: 24, flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  statDivider: { height: 32, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  // Premium
  premium: { borderRadius: wp(5), padding: wp(4.5), marginTop: hp(2), overflow: 'hidden' },
  premiumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumIcon: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.25)' },
  premiumText: { flex: 1, gap: 6 },
  premiumTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  premiumSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  premiumPill: { borderRadius: 9999, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8 },
  premiumPillText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  // Promo
  promo: { marginTop: hp(1.5), flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, padding: 16 },
  promoIcon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  promoTitle: { fontSize: 16, fontWeight: '700' },
  promoSub: { marginTop: 2, fontSize: 13 },
  // Sections
  sectionLabel: { marginTop: 28, marginBottom: 8, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  group: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  rowDivider: { width: '100%', height: StyleSheet.hairlineWidth },
});
