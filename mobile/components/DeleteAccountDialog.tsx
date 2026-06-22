import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

interface Props {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive confirmation — user must type the exact phrase to enable Delete. */
export function DeleteAccountDialog({ visible, loading, onConfirm, onCancel }: Props) {
  const [text, setText] = useState('');
  const canDelete = text.trim() === CONFIRM_PHRASE;

  // Smoothly lift the card above the keyboard (animated translateY) instead of
  // snapping between layouts. Half the keyboard height recenters it.
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => {
      Animated.timing(lift, {
        toValue: -e.endCoordinates.height / 2,
        duration: e.duration || 220,
        useNativeDriver: true,
      }).start();
    };
    const onHide = (e: KeyboardEvent) => {
      Animated.timing(lift, {
        toValue: 0,
        duration: e.duration || 200,
        useNativeDriver: true,
      }).start();
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable className="absolute inset-0 bg-black/50" onPress={close} />

        <Animated.View
          className="bg-card w-full rounded-3xl p-6"
          style={{ transform: [{ translateY: lift }] }}>
          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </View>
            <Text className="text-foreground mt-2 text-2xl font-bold">Delete account</Text>
            <Text className="text-foreground/60 mt-2 text-center text-md leading-5">
              This permanently deletes your account and all your data. This can&rsquo;t be undone.
            </Text>
          </View>

          <Text className="text-foreground/50 mt-5 text-sm">
            Type <Text className="text-foreground font-bold">{CONFIRM_PHRASE}</Text> to confirm
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={CONFIRM_PHRASE}
            placeholderTextColor={Colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            className="border-foreground/15 text-foreground mt-2 rounded-xl border px-4 py-3 text-base"
          />

          <View className="mt-6 w-full flex-row gap-3">
            <Pressable
              onPress={close}
              className="border-foreground/15 flex-1 items-center rounded-full border py-3.5 active:opacity-70">
              <Text className="text-foreground text-base font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => canDelete && !loading && onConfirm()}
              disabled={!canDelete || loading}
              className={`flex-1 items-center rounded-full py-3.5 ${
                canDelete && !loading ? 'bg-red-500 active:opacity-90' : 'bg-red-500/40'
              }`}>
              <Text className="text-base font-semibold text-white">
                {loading ? 'Deleting...' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
