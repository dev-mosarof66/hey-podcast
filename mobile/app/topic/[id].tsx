import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from 'constants/Colors';
import { EpisodeCard } from 'components/EpisodeCard';
import { Shimmer } from 'components/Shimmer';
import { usePlayerActions } from 'components/PlayerProvider';
import type { Episode } from 'constants/types';
import { useGetTopicEpisodesQuery, useGetTopicsQuery, useSetMyTopicsMutation } from 'store/api';
import { toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery();
  const { data: apiEpisodes = [], isLoading } = useGetTopicEpisodesQuery(id!, { skip: !id });
  const [saveTopics, { isLoading: saving }] = useSetMyTopicsMutation();
  const { playEpisode } = usePlayerActions();

  const topic = topics.find((t) => t.id === id);
  const isFollowed = !!topic?.followed;
  const episodes = apiEpisodes.map(toUiEpisode);

  const toggleFollow = () => {
    if (!id) return;
    const next = new Set(topics.filter((t) => t.followed).map((t) => t.id));
    next.has(id) ? next.delete(id) : next.add(id);
    saveTopics({ topicIds: [...next] });
  };

  const play = (ep: Episode) => {
    playEpisode(ep);
    router.push('/player');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header: back · topic name (centered) · follow */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.muted} />
        </Pressable>
        {topicsLoading && !topic ? (
          <View className="flex-1 items-center px-3">
            <Shimmer className="h-5 w-32 rounded-md" />
          </View>
        ) : (
          <Text
            numberOfLines={1}
            className="flex-1 px-3 text-center text-xl font-bold tracking-tight text-foreground">
            {topic?.label}
          </Text>
        )}
        <Pressable
          onPress={toggleFollow}
          disabled={saving}
          className="flex-row items-center gap-1.5">
          <Ionicons
            name={isFollowed ? 'checkmark-circle' : 'add-circle'}
            size={wp(7)}
            color={Colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: wp(6),
          paddingTop: hp(1),
          paddingBottom: hp(14),
        }}>
        <Text className="mb-3 text-lg font-bold uppercase tracking-tight text-foreground">
          Episodes
        </Text>

        {isLoading ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-20 w-full rounded-xl" />
            ))}
          </View>
        ) : episodes.length ? (
          <View className="gap-3">
            {episodes.map((e) => (
              <EpisodeCard key={e.id} episode={e} onPress={() => play(e)} />
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 py-16">
            <Ionicons name="sparkles-outline" size={wp(9)} color={Colors.muted} />
            <Text className="text-base font-semibold text-foreground">No episodes yet</Text>
            <Text className="text-center text-sm text-foreground/50">
              Episodes for this topic will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
