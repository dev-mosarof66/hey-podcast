import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import type { Episode } from 'constants/types';

function EpisodeCardBase({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold });
  const pct = episode.progress ? Math.round(episode.progress * 100) : 0;

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.5)' : 'rgba(26,11,46,0.5)';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(112,8,231,0.18)';
  const track = dark ? 'rgba(248,250,252,0.12)' : 'rgba(26,11,46,0.10)';
  const medFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const shadow = useMemo(
    () => ({
      shadowColor: dark ? Colors.primary : '#000',
      shadowOpacity: dark ? 0.35 : 0.1,
      shadowRadius: dark ? 10 : 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }),
    [dark]
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, shadow]}>
      <View style={[styles.icon, { backgroundColor: episode.color + '22' }]}>
        <Ionicons name={episode.icon} size={22} color={episode.color} />
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.title, { color: titleColor, fontFamily: semiFont }]}>
          {episode.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.pill, { backgroundColor: episode.color + '22' }]}>
            <Text style={[styles.pillText, { color: episode.color, fontFamily: semiFont }]}>
              {episode.topic}
            </Text>
          </View>
          <Text style={[styles.meta, { color: subColor, fontFamily: medFont }]}>
            {episode.durationMin} min · {episode.published}
          </Text>
        </View>

        {episode.progress != null && (
          <View style={[styles.track, { backgroundColor: track }]}>
            <View style={[styles.fill, { width: `${Math.max(4, pct)}%` }]} />
          </View>
        )}
      </View>

      <Ionicons name="play-circle" size={34} color={Colors.primary} />
    </TouchableOpacity>
  );
}

export const EpisodeCard = memo(EpisodeCardBase);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  icon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12 },
  track: { marginTop: 8, height: 4, overflow: 'hidden', borderRadius: 9999 },
  fill: { height: '100%', borderRadius: 9999, backgroundColor: Colors.primary },
});
