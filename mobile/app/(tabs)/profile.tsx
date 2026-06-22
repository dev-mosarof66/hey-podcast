import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { Colors } from 'constants/Colors';
import { useAuth } from 'components/AuthProvider';
import { ConfirmDialog } from 'components/ConfirmDialog';
import { DeleteAccountDialog } from 'components/DeleteAccountDialog';
import { SettingRow } from 'components/SettingRow';
import { Shimmer } from 'components/Shimmer';
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

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

function Stat({ value, label, loading }: { value: string; label: string; loading?: boolean }) {
  return (
    <View className="flex-1 items-center">
      {loading ? (
        <Shimmer className="h-6 w-10 rounded-md bg-white/20" />
      ) : (
        <Text className="text-xl font-bold text-white">{value}</Text>
      )}
      <Text className="mt-0.5 text-md text-white/60">{label}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-7 text-md font-semibold uppercase tracking-widest text-foreground/40">
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pb-2 pt-2">
        <Text className="text-3xl font-bold tracking-tight text-foreground">Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(14),paddingTop: wp(4) }}>
        {/* Identity card */}
        <LinearGradient
          colors={['#9B1FA4', '#721378', '#3C0A45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: wp(5), padding: wp(5), overflow: 'hidden' }, cardShadow]}>
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/20">
              {meLoading ? (
                <Shimmer className="h-full w-full bg-white/20" />
              ) : me?.avatarUrl ? (
                <Image source={{ uri: me.avatarUrl }} className="h-full w-full" />
              ) : (
                <Text className="text-2xl font-bold text-white">{initial}</Text>
              )}
            </View>
            <View className="flex-1 gap-1.5">
              {meLoading ? (
                <>
                  <Shimmer className="h-5 w-32 rounded-md bg-white/20" />
                  <Shimmer className="h-4 w-44 rounded-md bg-white/20" />
                </>
              ) : (
                <>
                  <Text numberOfLines={1} className="text-2xl font-bold text-white">
                    {name}
                  </Text>
                  <Text numberOfLines={1} className="text-base text-white/70">
                    {email}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View className="mt-6 flex-row items-center">
            <Stat value={String(episodesPlayed)} label="Episodes" loading={statsLoading} />
            <View className="h-8 w-px bg-white/20" />
            <Stat value={formatMinutes(minutesListened)} label="Listened" loading={statsLoading} />
            <View className="h-8 w-px bg-white/20" />
            <Stat value={String(followed)} label="Topics" loading={topicsLoading} />
          </View>
        </LinearGradient>

        {/* Premium card — billing isn't live yet, so this previews plans
            ("Coming soon") and routes to pricing rather than promo redemption. */}
        <Pressable onPress={() => router.navigate('/pricing')} className="active:opacity-90">
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              { borderRadius: wp(5), padding: wp(4.5), marginTop: hp(2), overflow: 'hidden' },
              cardShadow,
            ]}>
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-white/25">
                <Ionicons name="diamond" size={wp(6)} color="#fff" />
              </View>
              <View className="flex-1 gap-1.5">
                {subLoading ? (
                  <>
                    <Shimmer className="h-4 w-28 rounded-md bg-white/30" />
                    <Shimmer className="h-3 w-40 rounded-md bg-white/30" />
                  </>
                ) : (
                  <>
                    <Text className="text-lg font-bold text-white">
                      {isPremium ? 'Premium active' : 'Go Premium'}
                    </Text>
                    <Text className="text-sm text-white/80">
                      {isPremium
                        ? 'Manage your subscription'
                        : 'Unlimited episodes & offline downloads'}
                    </Text>
                  </>
                )}
              </View>
              <View className="rounded-full bg-white px-4 py-2">
                <Text className="text-sm font-bold" style={{ color: '#D97706' }}>
                  {subLoading ? '···' : isPremium ? 'Manage' : 'Coming soon'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Promo code */}
        <Pressable
          onPress={() => router.navigate({ pathname: '/redeem', params: { from: 'profile' } })}
          style={[{ marginTop: hp(1.5) }, cardShadow]}
          className="bg-card flex-row items-center gap-3 rounded-2xl p-4 active:opacity-80">
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.primary + '1A' }}>
            <Ionicons name="gift-outline" size={22} color={Colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">Have a promo code?</Text>
            <Text className="text-foreground/60 mt-0.5 text-sm">Redeem it for premium access</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </Pressable>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <View className="rounded-2xl bg-card px-4" style={cardShadow}>
          {/* <SettingRow
            icon="pricetags-outline"
            label="Followed topics"
            value={`${followed}`}
            onPress={() => router.navigate({ pathname: '/personalize', params: { edit: '1' } })}
          /> */}
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
        <View className="rounded-2xl bg-card px-4" style={cardShadow}>
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
              Toast.show({
                type: 'info',
                text1: 'Coming soon',
                text2: 'Help & feedback is on the way.',
              })
            }
          />
          <SettingRow
            icon="information-circle-outline"
            label="About"
            value="v1.0.0"
            onPress={() =>
              Toast.show({ type: 'info', text1: 'Hey Podcast', text2: 'Version 1.0.0' })
            }
          />
        </View>

        {/* Danger zone */}
        <Text className="text-md mb-2 mt-7 font-semibold uppercase tracking-widest text-red-500">
          Danger zone
        </Text>
        <View className="mt-1 rounded-2xl bg-card px-4" style={cardShadow}>
          <SettingRow
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={() => setSignOutVisible(true)}
          />
          <View className='w-full h-px bg-foreground/30' />
          <SettingRow
            icon="trash-outline"
            label="Delete account"
            danger
            onPress={() => setDeleteVisible(true)}
          />
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
  );
}
