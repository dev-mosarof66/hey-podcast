import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { ConfirmDialog } from 'components/ConfirmDialog';
import { DigestHero } from 'components/DigestHero';
import { DigestHeroSkeleton } from 'components/DigestHeroSkeleton';
import { EpisodeCard } from 'components/EpisodeCard';
import { EpisodeCardSkeleton } from 'components/EpisodeCardSkeleton';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { usePlayerActions } from 'components/PlayerProvider';
import { useGetContinueQuery, useGetDigestHeroQuery, useGetMeQuery, useGetNotificationsQuery } from 'store/api';
import type { Episode } from 'constants/types';
import { toUiContinue, toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

const PRIMARY = '#7008e7';
const CYAN = '#0891b2';
// Soft lavender (not near-white) so opaque white cards visibly lift off it.
const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

// Only check once per app session; a persisted flag then stops it re-asking
// after the user has already responded (granted or dismissed).
let notifChecked = false;
const NOTIF_SEEN_KEY = 'notif_prompt_seen';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const { data: heroEpisode, isLoading, isError, refetch } = useGetDigestHeroQuery();
  const { data: continueItems, isLoading: continueLoading } = useGetContinueQuery();
  const { playEpisode } = usePlayerActions();
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const { data: notifications = [] } = useGetNotificationsQuery();
  const unread = notifications.some((n) => !n.read);
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });

  // Ask for notification permission from Home (not on launch) with a branded
  // popup that routes to Settings — instead of the abrupt native OS alert.
  // Shown once: skipped if already granted OR the user has responded before.
  const [notifPrompt, setNotifPrompt] = useState(false);
  useEffect(() => {
    if (notifChecked) return;
    notifChecked = true;
    (async () => {
      try {
        const [perm, seen] = await Promise.all([
          Notifications.getPermissionsAsync(),
          SecureStore.getItemAsync(NOTIF_SEEN_KEY),
        ]);
        if (!perm.granted && !seen) setNotifPrompt(true);
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  const closeNotifPrompt = (openSettings: boolean) => {
    setNotifPrompt(false);
    SecureStore.setItemAsync(NOTIF_SEEN_KEY, '1').catch(() => {});
    if (openSettings) Linking.openSettings();
  };

  const today = heroEpisode ? toUiEpisode(heroEpisode) : undefined;
  const recent = (continueItems ?? []).map(toUiContinue);

  const play = (ep: Episode) => {
    playEpisode(ep);
    router.push('/player');
  };

  const name = me?.displayName || me?.email?.split('@')[0] || 'there';
  const initial = (me?.displayName || me?.email || '?').charAt(0).toUpperCase();

  // Theme-aware palette (mirrors the onboarding / auth flow).
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.08)' : 'rgba(112,8,231,0.15)';
  const bellBg = dark ? 'rgba(248,250,252,0.06)' : 'rgba(112,8,231,0.08)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const quickShadow = {
    shadowColor: dark ? PRIMARY : '#000',
    shadowOpacity: dark ? 0.3 : 0.08,
    shadowRadius: dark ? 10 : 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: dark ? 5 : 4,
  };

  const QuickCard = ({
    onPress,
    icon,
    tint,
    accent,
    title,
    caption,
  }: {
    onPress: () => void;
    icon: keyof typeof Ionicons.glyphMap;
    tint: string;
    accent: string;
    title: string;
    caption: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.quickCard, { backgroundColor: cardBg, borderColor: cardBorder }, quickShadow]}>
      <View style={[styles.quickIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={[styles.quickTitle, { color: titleColor, fontFamily: titleFont }]}>{title}</Text>
      <Text style={[styles.quickCaption, { color: subColor, fontFamily: bodyFont }]}>{caption}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top','bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { borderColor: PRIMARY }]}>
              {meLoading ? (
                <Shimmer style={styles.fill} />
              ) : me?.avatarUrl ? (
                <>
                  <Image
                    source={{ uri: me.avatarUrl }}
                    style={styles.fill}
                    onLoadEnd={() => setAvatarLoaded(true)}
                  />
                  {!avatarLoaded && (
                    <View style={StyleSheet.absoluteFill}>
                      <Shimmer style={styles.fill} />
                    </View>
                  )}
                </>
              ) : (
                <Text style={[styles.avatarInitial, { color: titleColor, fontFamily: titleFont }]}>
                  {initial}
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.greeting, { color: subColor, fontFamily: bodyFont }]}>
                {greeting()}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.name, { color: titleColor, fontFamily: titleFont }]}>
                {name}
              </Text>
            </View>
          </View>

          {/* Notification bell */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/notifications')}
            style={[styles.bell, { backgroundColor: bellBg }]}>
            <Ionicons name="notifications-outline" size={wp(5.5)} color={PRIMARY} />
            {unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(5), paddingTop: hp(2), paddingBottom: hp(16) }}>
          {isLoading ? (
            <DigestHeroSkeleton />
          ) : isError ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={40} color={Colors.muted} />
              <Text style={[styles.stateText, { color: subColor, fontFamily: bodyFont }]}>
                Couldn&rsquo;t load your feed.
              </Text>
              <Pressable onPress={() => refetch()} style={[styles.retry, quickShadow]}>
                <Text style={[styles.retryText, { fontFamily: semiFont }]}>Retry</Text>
              </Pressable>
            </View>
          ) : today ? (
            <DigestHero episode={today} onPress={() => play(today)} />
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="sparkles-outline" size={36} color={PRIMARY} />
              <Text style={[styles.emptyTitle, { color: titleColor, fontFamily: semiFont }]}>
                No episodes yet
              </Text>
              <Text style={[styles.emptySub, { color: subColor, fontFamily: bodyFont }]}>
                Follow topics in Discover to start your daily digest.
              </Text>
            </View>
          )}

          {/* Quick actions */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Quick Actions
          </Text>
          <View style={styles.quickRow}>
            <QuickCard
              onPress={() => router.navigate({ pathname: '/library', params: { tab: 'saved' } })}
              icon="bookmark"
              tint="rgba(112,8,231,0.10)"
              accent={PRIMARY}
              title="Saved"
              caption="Your bookmarks"
            />
            <QuickCard
              onPress={() => router.navigate({ pathname: '/library', params: { tab: 'downloads' } })}
              icon="cloud-download"
              tint="rgba(8,145,178,0.10)"
              accent={CYAN}
              title="Downloads"
              caption="Listen offline"
            />
          </View>

          {/* Recent activity */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Recent activity
          </Text>
          {continueLoading ? (
            <View style={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <EpisodeCardSkeleton key={i} />
              ))}
            </View>
          ) : recent.length > 0 ? (
            <View style={styles.list}>
              {recent.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} onPress={() => play(episode)} />
              ))}
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Ionicons name="time-outline" size={wp(8)} color={Colors.secondary} />
              <Text style={[styles.emptyTitle, { color: titleColor, fontFamily: semiFont }]}>
                No recent activity found
              </Text>
              <Text style={[styles.emptySub, { color: subColor, fontFamily: bodyFont }]}>
                Episodes you play will show up here.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Notifications permission — branded popup that routes to Settings. */}
        <ConfirmDialog
          visible={notifPrompt}
          icon="notifications-outline"
          title="Turn on notifications"
          message="Get a heads-up the moment your daily digest is ready — so you never miss an episode."
          confirmText="Open Settings"
          cancelText="Not now"
          onConfirm={() => closeNotifPrompt(true)}
          onCancel={() => closeNotifPrompt(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  avatar: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 9999,
    borderWidth: 2,
  },
  avatarInitial: { fontSize: 18, fontWeight: '700' },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  bell: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  unreadDot: {
    position: 'absolute',
    right: 10,
    top: 9,
    height: 9,
    width: 9,
    borderRadius: 9999,
    backgroundColor: PRIMARY,
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 16 },
  quickIcon: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    marginBottom: 12,
  },
  quickTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  quickCaption: { marginTop: 2, fontSize: 13 },
  list: { width: '100%', gap: 12 },
  stateBox: { alignItems: 'center', gap: 10, paddingVertical: hp(6) },
  stateText: { textAlign: 'center', fontSize: 14 },
  retry: {
    marginTop: 4,
    borderRadius: 9999,
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  emptyCard: {
    marginTop: 4,
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
  },
  emptyTitle: { textAlign: 'center', fontSize: 17, fontWeight: '600' },
  emptySub: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
