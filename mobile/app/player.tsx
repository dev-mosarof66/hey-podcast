import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_800ExtraBold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { HOSTS_LABEL, hostName } from 'constants/hosts';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { PLAYBACK_RATES, usePlayer, usePlayerActions } from 'components/PlayerProvider';
import { useDownloadActions, useDownloads } from 'components/DownloadsProvider';
import { useGetEpisodeQuery, useGetSavedQuery, useToggleSavedMutation } from 'store/api';
import { formatTime, hp, wp } from 'utils/utils';

const WAVE = [26, 48, 18, 60, 34, 52, 22, 42, 30, 56, 20, 38];
const LIGHT_BG = ['#faf5ff', '#f3e8ff', '#ede9fe'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

export default function PlayerScreen() {
  const inset = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_800ExtraBold });
  const { episode, isPlaying, isBuffering, position, duration, rate } = usePlayer();
  const { toggle, seekTo, skip, setRate } = usePlayerActions();
  const { data: saved = [] } = useGetSavedQuery();
  const [toggleSaved] = useToggleSavedMutation();
  const { downloads, progress } = useDownloads();
  const { download, remove } = useDownloadActions();
  const { data: full, isLoading: fullLoading } = useGetEpisodeQuery(episode?.id ?? '', {
    skip: !episode,
  });
  const [drag, setDrag] = useState<number | null>(null);

  // Karaoke-style auto-scroll: keep the line currently being spoken in view.
  // Each turn reports its Y offset via onLayout; we scroll only when the active
  // line *changes* (not on every position tick) to avoid jitter mid-line.
  const scrollRef = useRef<ScrollView>(null);
  const turnY = useRef<number[]>([]);
  const lastIdx = useRef(-1);
  useEffect(() => {
    const tr = full?.transcript ?? [];
    const idx = tr.findIndex(
      (t) => t.start != null && position >= t.start && (t.end == null || position < t.end)
    );
    if (idx < 0 || idx === lastIdx.current) return;
    lastIdx.current = idx;
    const y = turnY.current[idx];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - hp(6)), animated: true });
  }, [full, position]);

  const titleFont = fontsLoaded ? 'Sora_800ExtraBold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  if (!episode) {
    return (
      <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
        <SafeAreaView style={[styles.flex, styles.center]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeText, { fontFamily: semiFont }]}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const total = duration || episode.durationSec || 1;
  const value = drag ?? position;
  const accent = episode.color;
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(26,11,46,0.6)';
  const labelColor = dark ? 'rgba(248,250,252,0.45)' : 'rgba(26,11,46,0.45)';
  const mutedText = dark ? 'rgba(248,250,252,0.4)' : 'rgba(26,11,46,0.4)';
  const fadeColor = dark ? '#0a0a1a' : '#ede9fe';
  const isSaved = saved.some((s) => s.id === episode.id);
  const isDownloaded = !!downloads[episode.id];
  const isDownloading = progress[episode.id] != null;
  const transcript = full?.transcript ?? [];
  const hostsLabel = full?.hosts ? `${full.hosts.A} & ${full.hosts.B}` : HOSTS_LABEL;
  const activeIdx = transcript.findIndex(
    (t) => t.start != null && position >= t.start && (t.end == null || position < t.end)
  );

  const cycleRate = () => {
    const i = PLAYBACK_RATES.indexOf(rate);
    setRate(PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length]);
  };

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <TouchableOpacity hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color={titleColor} />
          </TouchableOpacity>
          <Text style={[styles.nowPlaying, { color: labelColor, fontFamily: semiFont }]}>
            Now Playing
          </Text>
          <View style={styles.topActions}>
            <TouchableOpacity
              hitSlop={12}
              disabled={isDownloading}
              onPress={() => (isDownloaded ? remove(episode.id) : download(episode))}>
              {isDownloading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name={isDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                  size={24}
                  color={isDownloaded ? Colors.primary : subColor}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={12}
              onPress={() => toggleSaved({ id: episode.id, saved: !isSaved })}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? Colors.primary : subColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.flex}>
          {/* Artwork */}
          <View style={styles.artWrap}>
            <LinearGradient
              colors={[accent, '#721378', '#3C0A45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.art, { shadowColor: dark ? accent : '#000', shadowOpacity: dark ? 0.6 : 0.3 }]}>
              <Ionicons name={episode.icon} size={wp(22)} color="rgba(255,255,255,0.92)" />
              <View pointerEvents="none" style={styles.wave}>
                {WAVE.map((h, i) => (
                  <View key={i} style={{ width: wp(1.5), height: wp(h / 3.4), borderRadius: 99, backgroundColor: '#fff' }} />
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Meta */}
          <View style={styles.meta}>
            <View style={[styles.pill, { backgroundColor: accent + '22' }]}>
              <Text style={[styles.pillText, { color: accent, fontFamily: semiFont }]}>
                {episode.topic}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
              {episode.title}
            </Text>
            <Text style={[styles.hosts, { color: subColor, fontFamily: bodyFont }]}>
              {hostsLabel} · AI Host
            </Text>
          </View>

          {/* Transcript loading — placeholder while the full episode is fetched */}
          {fullLoading && transcript.length === 0 && (
            <View style={[styles.flex, { paddingHorizontal: wp(6), paddingBottom: inset.bottom + hp(22) }]}>
              <Shimmer style={{ height: 12, width: 96, borderRadius: 6, marginBottom: 12 }} />
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={{ marginBottom: 12, gap: 6 }}>
                  <Shimmer style={{ height: 12, width: 64, borderRadius: 6 }} />
                  <Shimmer style={{ height: 16, width: '100%', borderRadius: 6 }} />
                  <Shimmer style={{ height: 16, width: '75%', borderRadius: 6 }} />
                </View>
              ))}
            </View>
          )}

          {/* Transcript — fills the gap between meta and the pinned controls */}
          {transcript.length > 0 && (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: inset.bottom + hp(22) }}>
              <Text style={[styles.transcriptLabel, { color: labelColor, fontFamily: semiFont }]}>
                Transcript
              </Text>
              {transcript.map((t, i) => {
                const isActive = i === activeIdx;
                return (
                  <View
                    key={i}
                    style={{ marginBottom: 14 }}
                    onLayout={(e) => {
                      turnY.current[i] = e.nativeEvent.layout.y;
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: semiFont,
                        fontWeight: '700',
                        color: t.speaker === 'A' ? accent : Colors.secondary,
                        opacity: isActive ? 1 : 0.7,
                      }}>
                      {full?.hosts?.[t.speaker] ?? hostName(t.speaker)}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: 15,
                        lineHeight: 21,
                        fontFamily: bodyFont,
                        color: isActive ? titleColor : mutedText,
                        fontWeight: isActive ? '600' : '400',
                      }}>
                      {t.text}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Bottom controls — gradient fade lets the transcript melt underneath */}
          <View style={[styles.bottomBar, { paddingBottom: inset.bottom + 6 }]}>
            <LinearGradient
              colors={['transparent', fadeColor, fadeColor]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Scrubber */}
            <View>
              <Slider
                minimumValue={0}
                maximumValue={total}
                value={value}
                onValueChange={setDrag}
                onSlidingComplete={(v) => {
                  seekTo(v);
                  setDrag(null);
                }}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={dark ? '#ffffff30' : '#00000020'}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.times}>
                <Text style={[styles.time, { color: mutedText, fontFamily: bodyFont }]}>
                  {formatTime(value)}
                </Text>
                <Text style={[styles.time, { color: mutedText, fontFamily: bodyFont }]}>
                  -{formatTime(Math.max(0, total - value))}
                </Text>
              </View>
            </View>

            {/* Transport */}
            <View style={styles.transport}>
              <Pressable hitSlop={10} onPress={cycleRate} style={styles.rateBtn}>
                <Text style={[styles.rate, { color: titleColor, fontFamily: semiFont }]}>{rate}×</Text>
              </Pressable>

              <Pressable hitSlop={10} onPress={() => skip(-15)}>
                <Ionicons name="play-back" size={wp(7)} color={titleColor} />
              </Pressable>

              <Pressable onPress={toggle} style={styles.playBtn}>
                {isBuffering && !isPlaying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={wp(7)}
                    color="#fff"
                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                  />
                )}
              </Pressable>

              <Pressable hitSlop={10} onPress={() => skip(15)}>
                <Ionicons name="play-forward" size={wp(7)} color={titleColor} />
              </Pressable>

              <Pressable
                hitSlop={10}
                onPress={() => toggleSaved({ id: episode.id, saved: !isSaved })}
                style={styles.rateBtn}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isSaved ? Colors.primary : subColor}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  closeBtn: { borderRadius: 9999, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12 },
  closeText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(5), paddingVertical: 8 },
  nowPlaying: { fontSize: 12, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  artWrap: { alignItems: 'center' },
  art: {
    width: wp(100),
    height: wp(70),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  wave: { position: 'absolute', bottom: wp(7), flexDirection: 'row', alignItems: 'center', gap: wp(1.5), opacity: 0.18 },
  meta: { alignItems: 'center', paddingVertical: hp(3), paddingHorizontal: wp(6) },
  pill: { marginBottom: 12, alignSelf: 'center', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 5 },
  pillText: { fontSize: 13, fontWeight: '700' },
  title: { maxWidth: wp(85), textAlign: 'center', fontSize: 26, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 },
  hosts: { marginTop: 12, fontSize: 15 },
  transcriptLabel: { marginBottom: 12, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: wp(6), paddingTop: hp(2) },
  times: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  time: { fontSize: 13 },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 8 },
  rateBtn: { width: 56, alignItems: 'center' },
  rate: { fontSize: 16, fontWeight: '700' },
  playBtn: {
    width: wp(16),
    height: wp(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
