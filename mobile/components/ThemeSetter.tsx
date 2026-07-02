import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_600SemiBold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme, type ThemeMode } from 'components/ThemeProvider';

interface Option {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: Option[] = [
  { mode: 'light', label: 'Light', icon: 'sunny' },
  { mode: 'dark', label: 'Dark', icon: 'moon' },
  { mode: 'system', label: 'System', icon: 'phone-portrait' },
];

/** Segmented control to switch the app theme (Light / Dark / System). */
export function ThemeSetter() {
  const { mode, setMode, scheme } = useTheme();
  const dark = scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_600SemiBold });
  const font = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const trackBg = dark ? 'rgba(248,250,252,0.06)' : 'rgba(26,11,46,0.06)';
  const inactive = dark ? 'rgba(248,250,252,0.5)' : 'rgba(26,11,46,0.5)';

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setMode(opt.mode)}
            style={[styles.tab, active && { backgroundColor: Colors.primary }]}>
            <Ionicons name={opt.icon} size={16} color={active ? '#fff' : inactive} />
            <Text style={[styles.label, { color: active ? '#fff' : inactive, fontFamily: font }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 9999, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 9999, paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: '600' },
});
