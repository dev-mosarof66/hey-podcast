import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
import type { Episode, IoniconName } from 'constants/types';
import { SegmentedTabs } from 'components/SegmentedTabs';
import { Shimmer } from 'components/Shimmer';
import { usePlayerActions } from 'components/PlayerProvider';
import { useCardShadow } from 'hooks/useCardShadow';
import { useGetContinueQuery, useGetSavedQuery } from 'store/api';
import { toUiContinue, toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

const SEGMENTS = [
  { id: 'saved', label: 'Saved' },
  { id: 'history', label: 'History' },
  { id: 'downloads', label: 'Downloads' },
];

function LibraryRow({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-3 active:opacity-70">
      <View
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: episode.color }}>
        <Ionicons name={episode.icon} size={22} color="#fff" />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-foreground text-base font-medium">
          {episode.title}
        </Text>
        <Text className="text-foreground/45 mt-0.5 text-xs">
          {episode.topic} · {episode.durationMin} min
        </Text>
      </View>
      <Ionicons name="play-circle" size={32} color={Colors.primary} />
    </Pressable>
  );
}

function ContinueCard({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const pct = Math.round((episode.progress ?? 0) * 100);
  const cardShadow = useCardShadow();
  return (
    <Pressable
      onPress={onPress}
      style={[{ width: wp(60) }, cardShadow]}
      className="bg-card gap-3 rounded-2xl p-4 active:opacity-80">
      <View className="flex-row items-center justify-between">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: episode.color }}>
          <Ionicons name={episode.icon} size={20} color="#fff" />
        </View>
        <Ionicons name="play-circle" size={30} color={Colors.primary} />
      </View>
      <Text numberOfLines={2} className="text-foreground text-sm font-semibold leading-5">
        {episode.title}
      </Text>
      <View>
        <View className="bg-foreground/10 h-1 overflow-hidden rounded-full">
          <View className="bg-primary h-full rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
        </View>
        <Text className="text-foreground/40 mt-1.5 text-[11px]">
          {pct}% · {episode.durationMin} min
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ icon, title, message }: { icon: IoniconName; title: string; message: string }) {
  return (
    <View className="items-center gap-3 py-20">
      <View className="bg-foreground/5 h-16 w-16 items-center justify-center rounded-full">
        <Ionicons name={icon} size={28} color={Colors.muted} />
      </View>
      <Text className="text-foreground text-base font-semibold">{title}</Text>
      <Text className="text-foreground/40 px-10 text-center text-sm">{message}</Text>
    </View>
  );
}

function ListSkeleton() {
  return (
    <View className="gap-3 pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-14 w-full rounded-xl" />
      ))}
    </View>
  );
}

export default function LibraryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState(tab ?? 'saved');

  // Tab screens stay mounted, so `useState(tab)` only applies on first mount.
  // Re-sync the segment to the incoming param each time the screen is focused,
  // so the Home quick actions land on the requested tab on every visit.
  useFocusEffect(
    useCallback(() => {
      if (tab) setSegment(tab);
    }, [tab]),
  );

  const { data: saved = [], isLoading: savedLoading } = useGetSavedQuery();
  const { data: cont = [], isLoading: contLoading } = useGetContinueQuery();
  const { playEpisode } = usePlayerActions();

  const savedEpisodes = saved.map(toUiEpisode);
  const historyEpisodes = cont.map(toUiContinue);
  const downloads = saved.filter((s) => s.downloaded).map(toUiEpisode);

  const play = (ep: Episode) => {
    playEpisode(ep);
    router.push('/player');
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      <View className="px-6 pb-3 pt-2">
        <Text className="text-foreground text-3xl font-bold tracking-tight">Library</Text>
      </View>

      <View className="px-6">
        <SegmentedTabs segments={SEGMENTS} value={segment} onChange={setSegment} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp(6), paddingTop: hp(2), paddingBottom: hp(14) }}>
        {/* Saved */}
        {segment === 'saved' &&
          (savedLoading ? (
            <ListSkeleton />
          ) : savedEpisodes.length ? (
            <>
              <Text className="text-foreground mb-1 text-lg font-bold tracking-tight">
                Saved episodes
              </Text>
              {savedEpisodes.map((e) => (
                <LibraryRow key={e.id} episode={e} onPress={() => play(e)} />
              ))}
            </>
          ) : (
            <EmptyState
              icon="bookmark-outline"
              title="Nothing saved yet"
              message="Save episodes to find them here later."
            />
          ))}

        {/* History */}
        {segment === 'history' &&
          (contLoading ? (
            <ListSkeleton />
          ) : historyEpisodes.length ? (
            <View className="gap-3">
              <Text className="text-foreground text-lg font-bold tracking-tight">
                Continue listening
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: wp(3) }}>
                {historyEpisodes.map((e) => (
                  <ContinueCard key={e.id} episode={e} onPress={() => play(e)} />
                ))}
              </ScrollView>
            </View>
          ) : (
            <EmptyState
              icon="time-outline"
              title="No history yet"
              message="Episodes you play will appear here."
            />
          ))}

        {/* Downloads */}
        {segment === 'downloads' &&
          (savedLoading ? (
            <ListSkeleton />
          ) : downloads.length ? (
            downloads.map((e) => <LibraryRow key={e.id} episode={e} onPress={() => play(e)} />)
          ) : (
            <EmptyState
              icon="cloud-download-outline"
              title="No downloads yet"
              message="Download episodes to listen offline, even without a connection."
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
