import { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import type { Episode } from 'constants/types';

function EpisodeCardBase({ episode, onPress }: { episode: Episode; onPress?: () => void }) {
  const dark = useTheme().scheme === 'dark';
  const pct = episode.progress ? Math.round(episode.progress * 100) : 0;

  const shadow = useMemo(
    () => ({
      shadowColor: dark ? Colors.primary : '#000',
      shadowOpacity: dark ? 0.35 : 0.1,
      shadowRadius: dark ? 10 : 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: dark ? 3 : 3,
    }),
    [dark]
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-purple-600/40 bg-background p-4"
      style={shadow}>
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: episode.color + '22' }}>
        <Ionicons name={episode.icon} size={22} color={episode.color} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-foreground text-base font-medium">
          {episode.title}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          {/* Topic pill */}
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: episode.color + '22' }}>
            <Text className="text-xs font-semibold" style={{ color: episode.color }}>
              {episode.topic}
            </Text>
          </View>
          <Text className="text-foreground text-xs">
            {episode.durationMin} min · {episode.published}
          </Text>
        </View>

        {/* Listening progress */}
        {episode.progress != null && (
          <View className="mt-2">
            <View className="bg-foreground/10 h-1 overflow-hidden rounded-full">
              <View
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </View>
          </View>
        )}
      </View>

      <Ionicons name="play-circle" size={34} color={Colors.primary} />
    </TouchableOpacity>
  );
}

export const EpisodeCard = memo(EpisodeCardBase);
