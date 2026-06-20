import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const { mode, setMode } = useTheme();

  return (
    <View className="bg-foreground/5 flex-row rounded-full p-1">
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setMode(opt.mode)}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-full py-2.5 ${
              active ? 'bg-primary' : ''
            }`}>
            <Ionicons name={opt.icon} size={16} color={active ? '#fff' : Colors.muted} />
            <Text
              className={`text-sm font-semibold ${active ? 'text-white' : 'text-foreground/50'}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
