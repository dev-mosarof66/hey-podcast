import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from 'constants/Colors';
import { HOSTS_LABEL, hostName } from 'constants/hosts';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { PLAYBACK_RATES, usePlayer, usePlayerActions } from 'components/PlayerProvider';
import { useGetEpisodeQuery, useGetSavedQuery, useToggleSavedMutation } from 'store/api';
import { formatTime, hp, wp } from 'utils/utils';

const WAVE = [26, 48, 18, 60, 34, 52, 22, 42, 30, 56, 20, 38];

export default function PlayerScreen() {
  const inset = useSafeAreaInsets()
  const dark = useTheme().scheme === 'dark';
  const { episode, isPlaying, isBuffering, position, duration, rate } = usePlayer();
  const { toggle, seekTo, skip, setRate } = usePlayerActions();
  const { data: saved = [] } = useGetSavedQuery();
  const [toggleSaved] = useToggleSavedMutation();
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

  if (!episode) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Pressable onPress={() => router.back()} className="rounded-full bg-primary px-6 py-3">
          <Text className="font-semibold text-white">Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const total = duration || episode.durationSec || 1;
  const value = drag ?? position;
  const accent = episode.color;
  const fg = dark ? '#FFFFFF' : '#0F172A';
  const isSaved = saved.some((s) => s.id === episode.id);
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <TouchableOpacity hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={Colors.muted} />
        </TouchableOpacity>
        <Text className="text-md font-bold uppercase tracking-widest text-foreground/70">
          Now Playing
        </Text>
        <TouchableOpacity
          hitSlop={12}
          onPress={() => toggleSaved({ id: episode.id, saved: !isSaved })}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isSaved ? Colors.primary : Colors.muted}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {/* Artwork */}
        <View className="items-center">
          <LinearGradient
            colors={[accent, '#721378', '#3C0A45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: wp(100),
              height: wp(70),
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: dark ? accent : '#000',
              shadowOpacity: dark ? 0.6 : 0.25,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            }}>
            <Ionicons name={episode.icon} size={wp(22)} color="rgba(255,255,255,0.92)" />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: wp(7),
                flexDirection: 'row',
                alignItems: 'center',
                gap: wp(1.5),
                opacity: 0.18,
              }}>
              {WAVE.map((h, i) => (
                <View
                  key={i}
                  style={{
                    width: wp(1.5),
                    height: wp(h / 3.4),
                    borderRadius: 99,
                    backgroundColor: '#fff',
                  }}
                />
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Meta */}
        <View className="items-center py-6">
          <View
            className="mb-3 self-center rounded-full px-3 py-1"
            style={{ backgroundColor: accent + '22' }}>
            <Text className="text-sm font-bold" style={{ color: accent }}>
              {episode.topic}
            </Text>
          </View>
          <Text
            numberOfLines={2}
            className="max-w-md text-center text-3xl font-extrabold leading-10 text-foreground">
            {episode.title}
          </Text>
          <Text className="text-md mt-3 text-foreground/70">{hostsLabel} · AI Host</Text>
        </View>

        {/* Transcript loading — placeholder while the full episode is fetched */}
        {fullLoading && transcript.length === 0 && (
          <View
            className="flex-1"
            style={{ paddingHorizontal: wp(6), paddingBottom: inset.bottom + hp(22) }}>
            <Shimmer className="mb-3 h-3 w-24 rounded-md" />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mb-3 gap-1.5">
                <Shimmer className="h-3 w-16 rounded-md" />
                <Shimmer className="h-4 w-full rounded-md" />
                <Shimmer className="h-4 w-3/4 rounded-md" />
              </View>
            ))}
          </View>
        )}

        {/* Transcript — fills the gap between meta and the pinned controls */}
        {transcript.length > 0 && (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: wp(6), paddingBottom: inset.bottom + hp(22) }}>
            <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground/50">
              Transcript
            </Text>
            {transcript.map((t, i) => {
              const isActive = i === activeIdx;
              return (
                <View
                  key={i}
                  className="mb-3"
                  onLayout={(e) => {
                    turnY.current[i] = e.nativeEvent.layout.y;
                  }}>
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color: t.speaker === 'A' ? accent : Colors.secondary,
                      opacity: isActive ? 1 : 0.7,
                    }}>
                    {full?.hosts?.[t.speaker] ?? hostName(t.speaker)}
                  </Text>
                  <Text
                    className={`mt-0.5 text-md leading-5 ${
                      isActive ? 'font-semibold text-foreground' : 'text-foreground/40'
                    }`}>
                    {t.text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* bottom bar */}
        <View className='w-full px-6 py-3 absolute bottom-0 bg-background' style={{
          marginBottom: inset.bottom - wp(4),
          shadowColor: dark ? Colors.primary : '#000',
          shadowOpacity: dark ? 0.35 : 0.15,
          shadowRadius: dark ? 14 : 12,
          shadowOffset: { width: 0, height: dark ? 0 : 4 },
          elevation: dark ? 8 : 10,
        }}>
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
            <View className="flex-row justify-between px-8">
              <Text className="text-sm text-foreground/50">{formatTime(value)}</Text>
              <Text className="text-sm text-foreground/50">
                -{formatTime(Math.max(0, total - value))}
              </Text>
            </View>
          </View>

          {/* Transport */}
          <View className="flex-row items-center justify-between px-2">
            <Pressable hitSlop={10} onPress={cycleRate} className="w-14 items-center">
              <Text className="text-base font-bold text-foreground">{rate}×</Text>
            </Pressable>

            <Pressable hitSlop={10} onPress={() => skip(-15)}>
              <Ionicons name="play-back" size={wp(6)} color={fg} />
            </Pressable>

            <Pressable
              onPress={toggle}
              className="items-center justify-center rounded-full"
              style={{
                width: wp(10),
                height: wp(10),
                backgroundColor: Colors.primary,
                shadowColor: Colors.primary,
                shadowOpacity: 0.5,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}>
              {isBuffering && !isPlaying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={wp(6)}
                  color="#fff"
                  style={{ marginLeft: isPlaying ? 0 : 3 }}
                />
              )}
            </Pressable>

            <Pressable hitSlop={10} onPress={() => skip(15)}>
              <Ionicons name="play-forward" size={wp(6)} color={fg} />
            </Pressable>

            {/* Save toggle */}
            <Pressable
              hitSlop={10}
              onPress={() => toggleSaved({ id: episode.id, saved: !isSaved })}
              className="w-14 items-center">
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? Colors.primary : Colors.muted}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
