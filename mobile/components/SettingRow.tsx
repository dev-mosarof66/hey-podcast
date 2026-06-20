import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
import type { IoniconName } from 'constants/types';
import { wp } from 'utils/utils';

interface Props {
  icon: IoniconName;
  label: string;
  /** Trailing value text (e.g. current setting). */
  value?: string;
  onPress?: () => void;
  /** Render in a destructive red style (e.g. Sign out). */
  danger?: boolean;
}

export function SettingRow({ icon, label, value, onPress, danger }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 active:opacity-60">
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          danger ? 'bg-red-500/10' : 'bg-primary/10'
        }`}>
        <Ionicons name={icon} size={wp(4.5)} color={danger ? '#ef4444' : Colors.primary} />
      </View>
      <Text
        className={`flex-1 text-base font-medium ${danger ? 'text-red-500' : 'text-foreground'}`}>
        {label}
      </Text>
      {value ? <Text className="text-foreground/40 text-sm">{value}</Text> : null}
      {!danger && <Ionicons name="chevron-forward" size={18} color={Colors.muted} />}
    </Pressable>
  );
}
