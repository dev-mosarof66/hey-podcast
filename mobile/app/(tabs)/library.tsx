import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import type { Episode, IoniconName } from 'constants/types';
import { SegmentedTabs } from 'components/SegmentedTabs';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { usePlayerActions } from 'components/PlayerProvider';
import { useDownloadActions, useDownloads } from 'components/DownloadsProvider';
import { useCardShadow } from 'hooks/useCardShadow';
import { useGetContinueQuery, useGetSavedQuery } from 'store/api';
import { toUiContinue, toUiEpisode } from 'utils/episode';
import { hp, wp } from 'utils/utils';

const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

const SEGMENTS = [
  { id: 'saved', label: 'Saved' },
  { id: 'history', label: 'History' },
  { id: 'downloads', label: 'Downloads' },
];

/** Shared theme palette + fonts for the cards / states. */
function usePalette() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  return {
    dark,
    titleColor: dark ? '#f8fafc' : '#1a0b2e',
    subColor: dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)',
    mutedText: dark ? 'rgba(248,250,252,0.4)' : 'rgba(26,11,46,0.4)',
    cardBg: dark ? '#16161f' : '#ffffff',
    cardBorder: dark ? 'rgba(248,250,252,0.12)' : 'rgba(112,8,231,0.22)',
    track: dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)',
    titleFont: fontsLoaded ? 'Sora_700Bold' : undefined,
    bodyFont: fontsLoaded ? 'Sora_500Medium' : undefined,
    semiFont: fontsLoaded ? 'Sora_600SemiBold' : undefined,
  };
}

/** Download / remove toggle for an episode, driven by the on-device manifest. */
function DownloadButton({ episode }: { episode: Episode }) {
  const { downloads, progress } = useDownloads();
  const { download, remove } = useDownloadActions();
  if (!episode.audioUrl) return null;

  const isDownloaded = !!downloads[episode.id];
  const prog = progress[episode.id];
  const busy = prog != null;

  return (
    <Pressable
      hitSlop={10}
      disabled={busy}
      onPress={() => (isDownloaded ? remove(episode.id) : download(episode))}>
      {busy ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Ionicons
          name={isDownloaded ? 'cloud-done' : 'download-outline'}
          size={24}
          color={isDownloaded ? Colors.primary : Colors.muted}
        />
      )}
    </Pressable>
  );
}

function CardHead({ episode }: { episode: Episode }) {
  return (
    <View style={styles.head}>
      <View style={[styles.icon, { backgroundColor: episode.color }]}>
        <Ionicons name={episode.icon} size={20} color="#fff" />
      </View>
      <View style={styles.actions}>
        <DownloadButton episode={episode} />
        <Ionicons name="play-circle" size={30} color={Colors.primary} />
      </View>
    </View>
  );
}

function LibraryCard({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const cardShadow = useCardShadow();
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: p.cardBg, borderColor: p.cardBorder }, cardShadow]}>
      <CardHead episode={episode} />
      <Text numberOfLines={2} style={[styles.title, { color: p.titleColor, fontFamily: p.semiFont }]}>
        {episode.title}
      </Text>
      <Text style={[styles.meta, { color: p.mutedText, fontFamily: p.bodyFont }]}>
        {episode.topic} · {episode.durationMin} min
      </Text>
    </Pressable>
  );
}

function ContinueCard({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const pct = Math.round((episode.progress ?? 0) * 100);
  const cardShadow = useCardShadow();
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: p.cardBg, borderColor: p.cardBorder }, cardShadow]}>
      <CardHead episode={episode} />
      <Text numberOfLines={2} style={[styles.title, { color: p.titleColor, fontFamily: p.semiFont }]}>
        {episode.title}
      </Text>
      <View>
        <View style={[styles.progressTrack, { backgroundColor: p.track }]}>
          <View style={[styles.progressFill, { width: `${Math.max(4, pct)}%` }]} />
        </View>
        <Text style={[styles.metaSmall, { color: p.mutedText, fontFamily: p.bodyFont }]}>
          {pct}% · {episode.durationMin} min
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ icon, title, message }: { icon: IoniconName; title: string; message: string }) {
  const p = usePalette();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: p.dark ? 'rgba(248,250,252,0.06)' : 'rgba(112,8,231,0.08)' }]}>
        <Ionicons name={icon} size={28} color={Colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: p.titleColor, fontFamily: p.semiFont }]}>{title}</Text>
      <Text style={[styles.emptyMsg, { color: p.mutedText, fontFamily: p.bodyFont }]}>{message}</Text>
    </View>
  );
}

function ListSkeleton() {
  return (
    <View style={{ gap: 12, paddingTop: 8 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} style={{ height: hp(11), width: '100%', borderRadius: 20 }} />
      ))}
    </View>
  );
}

export default function LibraryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState(tab ?? 'saved');
  const p = usePalette();

  // Tab screens stay mounted, so `useState(tab)` only applies on first mount.
  // Re-sync the segment to the incoming param each time the screen is focused,
  // so the Home quick actions land on the requested tab on every visit.
  useFocusEffect(
    useCallback(() => {
      if (tab) setSegment(tab);
    }, [tab])
  );

  const { data: saved = [], isLoading: savedLoading } = useGetSavedQuery();
  const { data: cont = [], isLoading: contLoading } = useGetContinueQuery();
  const { playEpisode } = usePlayerActions();

  const savedEpisodes = saved.map(toUiEpisode);
  const historyEpisodes = cont.map(toUiContinue);
  const { downloads: localDownloads } = useDownloads();
  const downloaded = Object.values(localDownloads).map((d) => d.episode);

  const play = (ep: Episode) => {
    playEpisode(ep);
    router.push('/player');
  };

  return (
    <LinearGradient colors={p.dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.h1, { color: p.titleColor, fontFamily: p.titleFont }]}>Library</Text>
        </View>

        <View style={{ paddingHorizontal: wp(6) }}>
          <SegmentedTabs segments={SEGMENTS} value={segment} onChange={setSegment} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingTop: hp(2), paddingBottom: hp(14), gap: 12 }}>
          {/* Saved */}
          {segment === 'saved' &&
            (savedLoading ? (
              <ListSkeleton />
            ) : savedEpisodes.length ? (
              <>
                <Text style={[styles.sectionTitle, { color: p.titleColor, fontFamily: p.semiFont }]}>
                  Saved episodes
                </Text>
                {savedEpisodes.map((e) => (
                  <LibraryCard key={e.id} episode={e} onPress={() => play(e)} />
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
              <>
                <Text style={[styles.sectionTitle, { color: p.titleColor, fontFamily: p.semiFont }]}>
                  Continue listening
                </Text>
                {historyEpisodes.map((e) => (
                  <ContinueCard key={e.id} episode={e} onPress={() => play(e)} />
                ))}
              </>
            ) : (
              <EmptyState
                icon="time-outline"
                title="No history yet"
                message="Episodes you play will appear here."
              />
            ))}

          {/* Downloads */}
          {segment === 'downloads' &&
            (downloaded.length ? (
              downloaded.map((e) => <LibraryCard key={e.id} episode={e} onPress={() => play(e)} />)
            ) : (
              <EmptyState
                icon="cloud-download-outline"
                title="No downloads yet"
                message="Download episodes to listen offline, even without a connection."
              />
            ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: wp(6), paddingTop: 8, paddingBottom: 12 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 2 },
  card: { width: '100%', gap: 12, borderRadius: 20, borderWidth: 1.5, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  meta: { fontSize: 11 },
  metaSmall: { marginTop: 6, fontSize: 11 },
  progressTrack: { height: 4, overflow: 'hidden', borderRadius: 9999 },
  progressFill: { height: '100%', borderRadius: 9999, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', gap: 12, paddingVertical: hp(10) },
  emptyIcon: { height: 64, width: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyMsg: { paddingHorizontal: 40, textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
