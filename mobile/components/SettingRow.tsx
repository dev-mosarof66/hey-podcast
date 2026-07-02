import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
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
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium });
  const font = fontsLoaded ? 'Sora_500Medium' : undefined;

  const labelColor = danger ? '#ef4444' : dark ? '#f8fafc' : '#1a0b2e';
  const valueColor = dark ? 'rgba(248,250,252,0.4)' : 'rgba(26,11,46,0.4)';
  const iconBg = danger ? 'rgba(239,68,68,0.10)' : 'rgba(112,8,231,0.10)';

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={wp(4.5)} color={danger ? '#ef4444' : Colors.primary} />
      </View>
      <Text style={[styles.label, { color: labelColor, fontFamily: font }]}>{label}</Text>
      {value ? <Text style={[styles.value, { color: valueColor, fontFamily: font }]}>{value}</Text> : null}
      {!danger && <Ionicons name="chevron-forward" size={18} color={Colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
  value: { fontSize: 14 },
});
