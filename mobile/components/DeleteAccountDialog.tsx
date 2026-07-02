import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

interface Props {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive confirmation — user must type the exact phrase to enable Delete. */
export function DeleteAccountDialog({ visible, loading, onConfirm, onCancel }: Props) {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const [text, setText] = useState('');
  const canDelete = text.trim() === CONFIRM_PHRASE;

  const cardBg = dark ? '#16161f' : '#ffffff';
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(26,11,46,0.6)';
  const border = dark ? 'rgba(248,250,252,0.15)' : 'rgba(26,11,46,0.15)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  // Smoothly lift the card above the keyboard (animated translateY) instead of
  // snapping between layouts. Half the keyboard height recenters it.
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => {
      Animated.timing(lift, { toValue: -e.endCoordinates.height / 2, duration: e.duration || 220, useNativeDriver: true }).start();
    };
    const onHide = (e: KeyboardEvent) => {
      Animated.timing(lift, { toValue: 0, duration: e.duration || 200, useNativeDriver: true }).start();
    };
    const show = Keyboard.addListener(showEvt, onShow);
    const hide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, [lift]);

  const close = () => {
    setText('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={close} />

        <Animated.View style={[styles.card, { backgroundColor: cardBg, transform: [{ translateY: lift }] }]}>
          <View style={styles.head}>
            <View style={styles.iconWrap}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>Delete account</Text>
            <Text style={[styles.message, { color: subColor, fontFamily: bodyFont }]}>
              This permanently deletes your account and all your data. This can&rsquo;t be undone.
            </Text>
          </View>

          <Text style={[styles.confirmLabel, { color: subColor, fontFamily: bodyFont }]}>
            Type <Text style={{ color: titleColor, fontFamily: semiFont }}>{CONFIRM_PHRASE}</Text> to confirm
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={CONFIRM_PHRASE}
            placeholderTextColor={Colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, { borderColor: border, color: titleColor, fontFamily: bodyFont }]}
          />

          <View style={styles.actions}>
            <Pressable onPress={close} style={[styles.btn, styles.cancel, { borderColor: border }]}>
              <Text style={[styles.cancelText, { color: titleColor, fontFamily: semiFont }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => canDelete && !loading && onConfirm()}
              disabled={!canDelete || loading}
              style={[styles.btn, { backgroundColor: canDelete && !loading ? '#ef4444' : 'rgba(239,68,68,0.4)' }]}>
              <Text style={[styles.confirmText, { fontFamily: semiFont }]}>
                {loading ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  card: { width: '100%', borderRadius: 28, padding: 24 },
  head: { alignItems: 'center' },
  iconWrap: { height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: 'rgba(239,68,68,0.10)' },
  title: { marginTop: 8, fontSize: 22, fontWeight: '700' },
  message: { marginTop: 8, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  confirmLabel: { marginTop: 20, fontSize: 14 },
  input: { marginTop: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  actions: { marginTop: 24, width: '100%', flexDirection: 'row', gap: 12 },
  btn: { flex: 1, alignItems: 'center', borderRadius: 9999, paddingVertical: 14 },
  cancel: { borderWidth: 1 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
