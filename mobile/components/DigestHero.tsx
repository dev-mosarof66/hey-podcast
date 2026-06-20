import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import { HOSTS } from 'constants/hosts';
import type { Episode } from 'constants/types';
import { wp } from 'utils/utils';

const WAVE = [22, 38, 16, 50, 28, 44, 20, 34];

export function DigestHero({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const dark = useTheme().scheme === 'dark';

  // A plain black shadow disappears on dark backgrounds, so on dark we use a
  // primary-colored glow instead. borderRadius + an (under-the-gradient)
  // backgroundColor make iOS render the shadow as a rounded rect.
  const shadow = {
    borderRadius: wp(4),
    backgroundColor: '#721378',
    shadowColor: dark ? Colors.primary : '#000',
    shadowOpacity: dark ? 0.6 : 0.18,
    shadowRadius: dark ? 18 : 12,
    shadowOffset: { width: 0, height: dark ? 8 : 6 },
    elevation: dark ? 10 : 6,
  };

  // Real host names from the generated script; fall back to the defaults.
  const hostA = episode.hosts?.A ?? HOSTS.A;
  const hostB = episode.hosts?.B ?? HOSTS.B;

  return (
    <TouchableOpacity onPress={onPress} style={shadow}>
      <LinearGradient
        colors={['#9B1FA4', '#721378', '#3C0A45']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: wp(4), padding: wp(4), overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: wp(4),
            top: wp(4),
            flexDirection: 'row',
            alignItems: 'center',
            gap: wp(1.5),
            opacity: 0.1,
          }}>
          {WAVE.map((h, i) => (
            <View
              key={i}
              style={{ width: wp(1.6), height: wp(h / 3), borderRadius: 99, backgroundColor: '#fff' }}
            />
          ))}
        </View>

        {/* Pill */}
        <View className="flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1">
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text className="text-[11px] font-bold uppercase tracking-widest text-white">
            Daily digest
          </Text>
        </View>

        {/* Title */}
        <Text numberOfLines={2} className="mt-3 text-3xl font-extrabold leading-8 text-white">
          {episode.title}
        </Text>

        {/* Hosts + meta */}
        <View className="mt-2 flex-row items-center gap-2">
          <View className="flex-row">
            <View className="h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-white/25">
              <Text className="text-[10px] font-bold text-white">{hostA.charAt(0)}</Text>
            </View>
            <View className="-ml-2 h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-white/25">
              <Text className="text-[10px] font-bold text-white">{hostB.charAt(0)}</Text>
            </View>
          </View>
          <Text className="text-sm text-white/75">
            {hostA} & {hostB} · {episode.durationMin} min
          </Text>
        </View>

        {/* Play row */}
        <View className="mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="h-8 w-8 items-center justify-center rounded-full bg-white"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}>
              <Ionicons name="play" size={wp(4.5)} color={Colors.primary} style={{ marginLeft: 2 }} />
            </View>
            <Text className="text-base font-bold text-white">Listen now</Text>
          </View>
          <Ionicons name="arrow-forward" size={wp(4.5)} color="rgba(255,255,255,0.85)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
