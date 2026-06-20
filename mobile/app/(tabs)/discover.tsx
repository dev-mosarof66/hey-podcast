import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { Shimmer } from 'components/Shimmer';
import { usePlayerActions } from 'components/PlayerProvider';
import { Colors } from 'constants/Colors';
import { topicUi } from 'constants/topicUi';
import { useCardShadow } from 'hooks/useCardShadow';
import { useGenerateEpisodeMutation, useGetBrowseTopicsQuery, useGetTopicsQuery } from 'store/api';
import { toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

export default function DiscoverScreen() {
  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery();
  const { data: browseTopics = [], isLoading: browseLoading } = useGetBrowseTopicsQuery();
  const [generate, { isLoading: generating }] = useGenerateEpisodeMutation();
  const { playEpisode } = usePlayerActions();

  const [prompt, setPrompt] = useState('');

  const cardShadow = useCardShadow();

  const onGenerate = async () => {
    const p = prompt.trim();
    if (!p) return;
    try {
      const ep = await generate({ prompt: p }).unwrap();
      setPrompt('');
      if (ep.status === 'ready' && ep.audioUrl) {
        // Instant (stub / no engine keys) — play right away.
        playEpisode(toUiEpisode(ep));
        router.push('/player');
      } else {
        // Real async generation — watch progress, then auto-play when ready.
        router.push({ pathname: '/generating', params: { id: ep.id } });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not generate', text2: 'Please try again.' });
    }
  };

  const followedTopics = topics.filter((t) => t.followed);

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      <View className="px-6 pb-2 pt-2">
        <Text className="text-foreground text-3xl font-bold tracking-tight">Discover</Text>
        <Text className="text-foreground/50 mt-1 text-sm">Generate an episode on anything</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(14) }}>
        {/* On-demand generation */}
        <LinearGradient
          colors={['#9B1FA4', '#721378', '#3C0A45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: wp(5), padding: wp(5), overflow: 'hidden' }, cardShadow]}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={wp(5)} color="#fff" />
            <Text className="text-lg font-bold text-white">Create on demand</Text>
          </View>
          <Text className="mt-1 text-md text-white/70">
            Type any topic and two AI hosts will record a short episode for you.
          </Text>

          <View className="mt-4 flex-row items-center rounded-full bg-white/15 pl-4 pr-1">
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="What are you curious about?"
              placeholderTextColor="rgba(255,255,255,0.6)"
              onSubmitEditing={onGenerate}
              className="text-white flex-1 py-3 text-md"
            />
            <Pressable
              onPress={onGenerate}
              disabled={!prompt.trim() || generating}
              className={`rounded-full px-4 py-2 ${prompt.trim() ? 'bg-white' : 'bg-white'}`}>
              <Text style={{ color: Colors.primary }} className="text-sm font-bold">
                {generating ? '…' : 'Generate'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Followed topics */}
        <Text className="text-foreground mb-3 mt-7 text-lg font-bold tracking-tight uppercase">
          Following Topics
        </Text>
        {topicsLoading ? (
          <View className="flex-row gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-9 w-24 rounded-full" />
            ))}
          </View>
        ) : followedTopics.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: wp(2) }}>
            {followedTopics.map((t) => {
              const ui = topicUi(t.slug);
              return (
                <View
                  key={t.id}
                  className="flex-row items-center gap-2 rounded-full px-4 py-2"
                  style={{ backgroundColor: ui.color + '1A' }}>
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: ui.color }} />
                  <Text className="text-foreground text-md font-medium">{t.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <Text className="text-foreground/40 text-sm">
            Follow topics below to fill your daily feed.
          </Text>
        )}

        {/* Browse / follow topics */}
        <Text className="text-foreground mb-3 mt-7 text-lg font-bold tracking-tight uppercase">
          Browse topics
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {browseLoading 
            ? Array.from({ length: 8 }).map((_, i) => (
                <Shimmer key={i} className="h-28 w-[48%] rounded-2xl" />
              ))
            : browseTopics.map((t) => {
                const ui = topicUi(t.slug);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push({ pathname: '/topic/[id]', params: { id: t.id } })}
                    className="bg-card w-[48%] gap-3 rounded-2xl p-4 active:opacity-70"
                    style={cardShadow}>
                    <View
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: ui.color + '22' }}>
                      <Ionicons name={ui.icon} size={22} color={ui.color} />
                    </View>
                    <Text className="text-foreground text-lg font-semibold">{t.label}</Text>
                  </Pressable>
                );
              })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
