import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import type { IoniconName } from 'constants/types';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  icon?: IoniconName;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered, in-app confirmation popup (not the native Alert). */
export function ConfirmDialog({
  visible,
  title,
  message,
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });

  const cardBg = dark ? '#16161f' : '#ffffff';
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(26,11,46,0.6)';
  const cancelBorder = dark ? 'rgba(248,250,252,0.15)' : 'rgba(26,11,46,0.15)';
  const accent = destructive ? '#ef4444' : Colors.primary;
  const iconBg = destructive ? 'rgba(239,68,68,0.10)' : 'rgba(112,8,231,0.10)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={22} color={accent} />
            </View>
          )}
          <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>{title}</Text>
          <Text style={[styles.message, { color: subColor, fontFamily: bodyFont }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.cancel, { borderColor: cancelBorder }]}>
              <Text style={[styles.cancelText, { color: titleColor, fontFamily: semiFont }]}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.btn, { backgroundColor: accent }]}>
              <Text style={[styles.confirmText, { fontFamily: semiFont }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  card: { width: '100%', alignItems: 'center', borderRadius: 28, padding: 24 },
  iconWrap: { height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  title: { marginTop: 16, fontSize: 20, fontWeight: '700' },
  message: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  actions: { marginTop: 24, width: '100%', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, alignItems: 'center', borderRadius: 9999, paddingVertical: 14 },
  cancel: { borderWidth: 1 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
