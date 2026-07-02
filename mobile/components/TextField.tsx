import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import type { IoniconName } from 'constants/types';

interface Props extends TextInputProps {
  label: string;
  icon?: IoniconName;
  /** Renders a password field with a show/hide toggle. */
  secure?: boolean;
}

export function TextField({ label, icon, secure, onFocus, onBlur, ...props }: Props) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium });
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  const accent = focused ? Colors.primary : Colors.muted;
  const font = fontsLoaded ? 'Sora_500Medium' : undefined;
  const labelColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(2,6,24,0.6)';
  const textColor = dark ? '#f8fafc' : '#020618';
  const fill = focused
    ? dark
      ? 'rgba(248,250,252,0.10)'
      : 'rgba(2,6,24,0.09)'
    : dark
      ? 'rgba(248,250,252,0.05)'
      : 'rgba(2,6,24,0.05)';

  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: labelColor, fontFamily: font }]}>{label}</Text>

      {/* Filled / soft — no border; fill darkens slightly on focus. */}
      <View style={[styles.field, { backgroundColor: fill }]}>
        {icon && <Ionicons name={icon} size={19} color={accent} />}
        <TextInput
          style={[styles.input, { color: textColor, fontFamily: font }]}
          placeholderTextColor={Colors.muted}
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {secure && (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={accent} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingHorizontal: 16 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
});
