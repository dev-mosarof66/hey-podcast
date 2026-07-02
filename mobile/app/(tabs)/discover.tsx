import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Shimmer } from 'components/Shimmer';
import { usePlayerActions } from 'components/PlayerProvider';
import { useTheme } from 'components/ThemeProvider';
import { Colors } from 'constants/Colors';
import { topicUi } from 'constants/topicUi';
import { useCardShadow } from 'hooks/useCardShadow';
import { useGenerateEpisodeMutation, useGetBrowseTopicsQuery, useGetTopicsQuery } from 'store/api';
import { toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

// Soft lavender (not near-white) so opaque white cards visibly lift off it.
const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

export default function DiscoverScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
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

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.12)' : 'rgba(112,8,231,0.22)';

  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const TopicCard = ({
    id,
    slug,
    label,
    followed,
  }: {
    id: string;
    slug: string;
    label: string;
    followed?: boolean;
  }) => {
    const ui = topicUi(slug);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/topic/[id]', params: { id } })}
        style={[styles.topicCard, { backgroundColor: cardBg, borderColor: cardBorder }, cardShadow]}>
        <View style={styles.topicHead}>
          <View style={[styles.topicIcon, { backgroundColor: ui.color + '22' }]}>
            <Ionicons name={ui.icon} size={22} color={ui.color} />
          </View>
          {followed && <Ionicons name="checkmark-circle" size={20} color={ui.color} />}
        </View>
        <Text
          numberOfLines={2}
          style={[styles.topicLabel, { color: titleColor, fontFamily: semiFont }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top','bottom']}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: titleColor, fontFamily: titleFont }]}>Discover</Text>
          <Text style={[styles.h1sub, { color: subColor, fontFamily: bodyFont }]}>
            Generate an episode on anything
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: hp(14) }}>
          {/* On-demand generation */}
          <LinearGradient
            colors={['#8b2fe8', '#7008e7', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.genCard, cardShadow]}>
            <View style={styles.genHead}>
              <Ionicons name="sparkles" size={wp(5)} color="#fff" />
              <Text style={[styles.genTitle, { fontFamily: titleFont }]}>Create on demand</Text>
            </View>
            <Text style={[styles.genSub, { fontFamily: bodyFont }]}>
              Type any topic and two AI hosts will record a short episode for you.
            </Text>

            <View style={styles.inputPill}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="What are you curious about?"
                placeholderTextColor="rgba(255,255,255,0.6)"
                onSubmitEditing={onGenerate}
                style={[styles.input, { fontFamily: bodyFont }]}
              />
              <Pressable
                onPress={onGenerate}
                disabled={!prompt.trim() || generating}
                style={styles.genBtn}>
                <Text style={[styles.genBtnText, { fontFamily: semiFont }]}>
                  {generating ? '…' : 'Generate'}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Followed topics */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Following Topics
          </Text>
          {topicsLoading ? (
            <View style={styles.grid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} style={{ width: '48%', height: hp(13), borderRadius: 20 }} />
              ))}
            </View>
          ) : followedTopics.length ? (
            <View style={styles.grid}>
              {followedTopics.map((t) => (
                <TopicCard key={t.id} id={t.id} slug={t.slug} label={t.label} followed />
              ))}
            </View>
          ) : (
            <Text style={[styles.hint, { color: labelColor, fontFamily: bodyFont }]}>
              Follow topics below to fill your daily feed.
            </Text>
          )}

          {/* Browse / follow topics */}
          <Text style={[styles.sectionLabel, { color: labelColor, fontFamily: semiFont }]}>
            Browse topics
          </Text>
          <View style={styles.grid}>
            {browseLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Shimmer key={i} style={{ width: '48%', height: hp(13), borderRadius: 20 }} />
                ))
              : browseTopics.map((t) => (
                  <TopicCard key={t.id} id={t.id} slug={t.slug} label={t.label} />
                ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: wp(6), paddingTop: 8, paddingBottom: 8 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h1sub: { marginTop: 4, fontSize: 14 },
  genCard: { borderRadius: wp(5), padding: wp(5), overflow: 'hidden' },
  genHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  genSub: { marginTop: 4, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.75)' },
  inputPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#ffffff' },
  genBtn: {
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  genBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hint: { fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  topicCard: { width: '48%', borderRadius: 20, borderWidth: 1.5, padding: 16 },
  topicHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topicIcon: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  // Reserve two lines so short and long labels produce equal-height cards.
  topicLabel: { marginTop: 12, fontSize: 16, lineHeight: 20, minHeight: 40, fontWeight: '600' },
});
