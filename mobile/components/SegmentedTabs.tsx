import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts, Sora_600SemiBold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';

export interface Segment {
  id: string;
  label: string;
}

interface Props {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
}

/** Pill segmented control. */
export function SegmentedTabs({ segments, value, onChange }: Props) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_600SemiBold });
  const font = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const trackBg = dark ? 'rgba(248,250,252,0.06)' : 'rgba(26,11,46,0.06)';
  const inactive = dark ? 'rgba(248,250,252,0.5)' : 'rgba(26,11,46,0.5)';

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            style={[styles.tab, active && { backgroundColor: Colors.primary }]}>
            <Text style={[styles.label, { color: active ? '#fff' : inactive, fontFamily: font }]}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 9999, padding: 4 },
  tab: { flex: 1, alignItems: 'center', borderRadius: 9999, paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: '600' },
});
