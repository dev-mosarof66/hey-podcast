import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { EpisodeCard } from 'components/EpisodeCard';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { usePlayerActions } from 'components/PlayerProvider';
import type { Episode } from 'constants/types';
import { useGetTopicEpisodesQuery, useGetTopicsQuery, useSetMyTopicsMutation } from 'store/api';
import { toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

export default function TopicScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: topics = [], isLoading: topicsLoading } = useGetTopicsQuery();
  const { data: apiEpisodes = [], isLoading } = useGetTopicEpisodesQuery(id!, { skip: !id });
  const [saveTopics, { isLoading: saving }] = useSetMyTopicsMutation();
  const { playEpisode } = usePlayerActions();

  const topic = topics.find((t) => t.id === id);
  const isFollowed = !!topic?.followed;
  const episodes = apiEpisodes.map(toUiEpisode);

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

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
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header: back · topic name (centered) · follow */}
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={titleColor} />
          </Pressable>
          {topicsLoading && !topic ? (
            <View style={styles.headerCenter}>
              <Shimmer style={{ height: 20, width: 128, borderRadius: 6 }} />
            </View>
          ) : (
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: titleColor, fontFamily: titleFont }]}>
              {topic?.label}
            </Text>
          )}
          <Pressable onPress={toggleFollow} disabled={saving} hitSlop={8}>
            <Ionicons
              name={isFollowed ? 'checkmark-circle' : 'add-circle'}
              size={wp(7)}
              color={Colors.primary}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingTop: hp(1), paddingBottom: hp(14) }}>
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Episodes
          </Text>

          {isLoading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} style={{ height: hp(10), width: '100%', borderRadius: 20 }} />
              ))}
            </View>
          ) : episodes.length ? (
            <View style={{ gap: 12 }}>
              {episodes.map((e) => (
                <EpisodeCard key={e.id} episode={e} onPress={() => play(e)} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={wp(9)} color={Colors.muted} />
              <Text style={[styles.emptyTitle, { color: titleColor, fontFamily: semiFont }]}>
                No episodes yet
              </Text>
              <Text style={[styles.emptySub, { color: subColor, fontFamily: bodyFont }]}>
                Episodes for this topic will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(5), paddingVertical: 12 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: { flex: 1, paddingHorizontal: 12, textAlign: 'center', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionLabel: { marginBottom: 12, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: hp(8) },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
