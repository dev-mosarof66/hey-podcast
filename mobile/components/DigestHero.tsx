import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_800ExtraBold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import { HOSTS } from 'constants/hosts';
import type { Episode } from 'constants/types';
import { wp } from 'utils/utils';

const WAVE = [22, 38, 16, 50, 28, 44, 20, 34];

export function DigestHero({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_800ExtraBold });

  // A plain black shadow disappears on dark backgrounds, so on dark we use a
  // primary-colored glow instead. borderRadius + an (under-the-gradient)
  // backgroundColor make iOS render the shadow as a rounded rect.
  const shadow = {
    borderRadius: wp(4),
    backgroundColor: '#4c1d95',
    shadowColor: dark ? Colors.primary : '#000',
    shadowOpacity: dark ? 0.6 : 0.18,
    shadowRadius: dark ? 18 : 12,
    shadowOffset: { width: 0, height: dark ? 8 : 6 },
    elevation: dark ? 10 : 6,
  };

  const titleFont = fontsLoaded ? 'Sora_800ExtraBold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  // Real host names from the generated script; fall back to the defaults.
  const hostA = episode.hosts?.A ?? HOSTS.A;
  const hostB = episode.hosts?.B ?? HOSTS.B;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={shadow}>
      <LinearGradient
        colors={['#8b2fe8', '#7008e7', '#4c1d95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View pointerEvents="none" style={styles.wave}>
          {WAVE.map((h, i) => (
            <View key={i} style={{ width: wp(1.6), height: wp(h / 3), borderRadius: 99, backgroundColor: '#fff' }} />
          ))}
        </View>

        {/* Pill */}
        <View style={styles.pill}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={[styles.pillText, { fontFamily: semiFont }]}>Daily digest</Text>
        </View>

        {/* Title */}
        <Text numberOfLines={2} style={[styles.title, { fontFamily: titleFont }]}>
          {episode.title}
        </Text>

        {/* Hosts + meta */}
        <View style={styles.hostsRow}>
          <View style={styles.avatars}>
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, { fontFamily: semiFont }]}>{hostA.charAt(0)}</Text>
            </View>
            <View style={[styles.avatar, { marginLeft: -8 }]}>
              <Text style={[styles.avatarText, { fontFamily: semiFont }]}>{hostB.charAt(0)}</Text>
            </View>
          </View>
          <Text style={[styles.hostsText, { fontFamily: bodyFont }]}>
            {hostA} & {hostB} · {episode.durationMin} min
          </Text>
        </View>

        {/* Play row */}
        <View style={styles.playRow}>
          <View style={styles.playLeft}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={wp(4.5)} color={Colors.primary} style={{ marginLeft: 2 }} />
            </View>
            <Text style={[styles.playText, { fontFamily: semiFont }]}>Listen now</Text>
          </View>
          <Ionicons name="arrow-forward" size={wp(4.5)} color="rgba(255,255,255,0.85)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: wp(4), padding: wp(4), overflow: 'hidden' },
  wave: { position: 'absolute', right: wp(4), top: wp(4), flexDirection: 'row', alignItems: 'center', gap: wp(1.5), opacity: 0.1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: '#fff' },
  title: { marginTop: 12, fontSize: 26, fontWeight: '800', lineHeight: 32, color: '#fff' },
  hostsRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatars: { flexDirection: 'row' },
  avatar: { height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.25)' },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  hostsText: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  playRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: { height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  playText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
