import { StyleSheet, View } from 'react-native';

import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';

/** Loading placeholder shaped like an EpisodeCard row. */
export function EpisodeCardSkeleton() {
  const dark = useTheme().scheme === 'dark';
  const cardBg = dark ? '#16161f' : '#ffffff';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(112,8,231,0.18)';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Shimmer style={{ height: 44, width: 44, borderRadius: 9999 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Shimmer style={{ height: 16, width: '80%', borderRadius: 6 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Shimmer style={{ height: 16, width: 64, borderRadius: 9999 }} />
          <Shimmer style={{ height: 12, width: 80, borderRadius: 6 }} />
        </View>
      </View>
      <Shimmer style={{ height: 32, width: 32, borderRadius: 9999 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
});
