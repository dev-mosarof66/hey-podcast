import { StyleSheet, View } from 'react-native';

import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { wp } from 'utils/utils';

/** Loading placeholder shaped like the DigestHero. */
export function DigestHeroSkeleton() {
  const dark = useTheme().scheme === 'dark';
  const bg = dark ? 'rgba(248,250,252,0.05)' : 'rgba(112,8,231,0.06)';

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Shimmer style={{ height: 20, width: 96, borderRadius: 9999 }} />
      <View style={{ gap: 8 }}>
        <Shimmer style={{ height: 24, width: '100%', borderRadius: 6 }} />
        <Shimmer style={{ height: 24, width: '75%', borderRadius: 6 }} />
      </View>
      <Shimmer style={{ height: 16, width: '40%', borderRadius: 6 }} />
      <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Shimmer style={{ height: 48, width: 48, borderRadius: 9999 }} />
        <Shimmer style={{ height: 16, width: 96, borderRadius: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, padding: 20, borderRadius: wp(4) },
});
