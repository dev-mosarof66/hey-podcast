import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';

interface Props extends TextInputProps {
  label: string;
  icon?: IoniconName;
  /** Renders a password field with a show/hide toggle. */
  secure?: boolean;
}

export function TextField({ label, icon, secure, onFocus, onBlur, ...props }: Props) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  const accent = focused ? Colors.primary : Colors.muted;

  return (
    <View className="gap-2">
      <Text className="text-foreground/60 text-sm font-medium">{label}</Text>

      {/* Filled / soft — no border; fill darkens slightly on focus. */}
      <View
        className={`flex-row items-center gap-3 rounded-2xl px-4 ${
          focused ? 'bg-foreground/[0.09]' : 'bg-foreground/[0.05]'
        }`}>
        {icon && <Ionicons name={icon} size={19} color={accent} />}
        <TextInput
          className="text-foreground flex-1 py-4 text-base"
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
