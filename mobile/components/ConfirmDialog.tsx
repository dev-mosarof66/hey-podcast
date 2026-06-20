import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from 'constants/Colors';
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
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Backdrop — tap to dismiss */}
        <Pressable className="absolute inset-0 bg-black/50" onPress={onCancel} />

        {/* Card */}
        <View className="bg-card w-full items-center rounded-3xl p-6">
          {icon && (
            <View
              className={`h-14 w-14 items-center justify-center rounded-full ${
                destructive ? 'bg-red-500/10' : 'bg-primary/10'
              }`}>
              <Ionicons name={icon} size={26} color={destructive ? '#ef4444' : Colors.primary} />
            </View>
          )}
          <Text className="text-foreground mt-4 text-xl font-bold">{title}</Text>
          <Text className="text-foreground/60 mt-2 text-center text-sm leading-5">{message}</Text>

          <View className="mt-6 w-full flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="border-foreground/15 flex-1 items-center rounded-full border py-3.5 active:opacity-70">
              <Text className="text-foreground text-base font-semibold">{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center rounded-full py-3.5 active:opacity-90 ${
                destructive ? 'bg-red-500' : 'bg-primary'
              }`}>
              <Text className="text-base font-semibold text-white">{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
