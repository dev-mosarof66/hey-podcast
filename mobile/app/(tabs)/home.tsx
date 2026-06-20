import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from 'constants/Colors';
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

  const today = heroEpisode ? toUiEpisode(heroEpisode) : undefined;
  const recent = (continueItems ?? []).map(toUiContinue);

  const play = (ep: Episode) => {
    playEpisode(ep);
    router.push('/player');
  };

  const name = me?.displayName || me?.email?.split('@')[0] || 'there';
  const initial = (me?.displayName || me?.email || '?').charAt(0).toUpperCase();
  const dark = useTheme().scheme === 'dark';
  const quickShadow = {
    shadowColor: dark ? Colors.primary : '#000',
    shadowOpacity: dark ? 0.3 : 0.08,
    shadowRadius: dark ? 10 : 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: dark ? 5 : 4,
  };

  return (
    <SafeAreaView className="bg-background w-full flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="w-full flex-row items-center justify-between p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { height: 4, width: 0.5 },
          elevation: 4,
        }}>
        {/* Left: avatar + greeting */}
        <View
          className="flex-row items-center gap-3 active:opacity-80">
          <View className="border-primary h-11 w-11 items-center justify-center overflow-hidden rounded-full border">
            {meLoading ? (
              <Shimmer className="h-full w-full" />
            ) : me?.avatarUrl ? (
              <>
                <Image
                  source={{ uri: me.avatarUrl }}
                  className="h-full w-full"
                  onLoadEnd={() => setAvatarLoaded(true)}
                />
                {!avatarLoaded && (
                  <View className="absolute inset-0">
                    <Shimmer className="h-full w-full" />
                  </View>
                )}
              </>
            ) : (
              <Text className="text-foreground text-lg font-bold">{initial}</Text>
            )}
          </View>
          <View>
            <Text className="text-md text-foreground/60 font-medium">{greeting()}</Text>
            <Text numberOfLines={1} className="text-foreground text-base font-bold">
              {name}
            </Text>
          </View>
        </View>

        {/* Right: notification bell — taps fire a test push */}
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-60">
          <Ionicons name="notifications-outline" size={wp(6)} color="#ed6aff" />
          {unread && (
            <View
              className="bg-primary absolute right-2 top-1.5 size-2"
              style={{ borderRadius: 100 }}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: hp(16),
        }}>
        {isLoading ? (
          <DigestHeroSkeleton />
        ) : isError ? (
          <View className="items-center gap-3 py-16">
            <Ionicons name="cloud-offline-outline" size={40} color={Colors.muted} />
            <Text className="text-foreground/60 text-center">Couldn&rsquo;t load your feed.</Text>
            <Pressable onPress={() => refetch()} className="bg-primary rounded-full px-5 py-2.5">
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : today ? (
          <DigestHero episode={today} onPress={() => play(today)} />
        ) : (
          <View className="bg-foreground/5 items-center gap-2 rounded-3xl p-8">
            <Ionicons name="sparkles-outline" size={36} color={Colors.primary} />
            <Text className="text-foreground text-center text-base font-semibold">
              No episodes yet
            </Text>
            <Text className="text-foreground/50 text-center text-sm">
              Follow topics in Discover to start your daily digest.
            </Text>
          </View>
        )}

        {/* Quick access: Saved & Downloads */}
        <View className="mt-8 flex flex-col gap-3">
          <Text className="text-foreground text-base font-bold uppercase tracking-widest">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.navigate({ pathname: '/library', params: { tab: 'saved' } })}
              className="border-primary/20 bg-background flex-1 rounded-2xl border p-4 active:opacity-80"
              style={quickShadow}>
              <View pointerEvents="none" className="bg-primary/10 absolute inset-0 rounded-2xl" />
              <View className="bg-primary/10 h-10 w-10 items-center justify-center rounded-full">
                <Ionicons name="bookmark" size={20} color={Colors.primary} />
              </View>
              <Text className="text-foreground mt-1 text-lg font-bold">Saved</Text>
              <Text className="text-foreground/60 mt-0.5 text-sm font-semibold">
                Your bookmarks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.navigate({ pathname: '/library', params: { tab: 'downloads' } })
              }
              className="border-primary/20 bg-background flex-1 rounded-2xl border p-4 active:opacity-80"
              style={quickShadow}>
              <View pointerEvents="none" className="bg-primary/10 absolute inset-0 rounded-2xl" />
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#0891b21A' }}>
                <Ionicons name="cloud-download" size={20} color="#0891b2" />
              </View>
              <Text className="text-foreground mt-1 text-lg font-bold">Downloads</Text>
              <Text className="text-foreground/60 mt-0.5 text-sm font-semibold">Listen offline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent activity */}
        <View className="flex w-full flex-col gap-3">
          <Text className="text-foreground mt-8 text-base font-bold uppercase tracking-widest">
            Recent activity
          </Text>
          {continueLoading ? (
            <View className="flex w-full flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EpisodeCardSkeleton key={i} />
              ))}
            </View>
          ) : recent.length > 0 ? (
            <View className="flex w-full flex-col gap-3">
              {recent.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} onPress={() => play(episode)} />
              ))}
            </View>
          ) : (
            <View className="items-center gap-2 rounded-2xl px-6 py-10">
              <Ionicons name="time-outline" size={wp(8)} color={Colors.secondary} />
              <Text className="text-foreground font-semibold text-center text-lg">
                No recent activity found
              </Text>
              <Text className="text-foreground/60 text-center text-base">
                Episodes you play will show up here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
