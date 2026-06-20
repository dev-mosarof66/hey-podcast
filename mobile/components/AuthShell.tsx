import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { AuthBackground } from 'components/AuthBackground';
import { hp, wp } from 'utils/utils';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Auth layout: textured background with the brand mark + title up top, and the
 * form in a rounded card pinned to the bottom. The card slides up with the
 * keyboard (via Keyboard listeners — reliable on iOS + Android), and tapping
 * anywhere outside an input/button dismisses it.
 */
export function AuthShell({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      // Lift the card to sit just above the keyboard (it already reserves the
      // bottom safe-area inset, so subtract that to avoid a double gap).
      const lift = Math.max(e.endCoordinates.height - insets.bottom, 0);
      Animated.timing(translateY, {
        toValue: -lift,
        duration: e.duration || 220,
        useNativeDriver: true,
      }).start();
    };

    const onHide = (e: KeyboardEvent) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 200,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, translateY]);

  return (
    <View className="flex-1">
      {/* Textured background */}
      <AuthBackground />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          {/* Top: logo + title + tagline (outside the card) */}
          <SafeAreaView edges={['top']} className="flex-1 items-center justify-center px-8">
            <AnimatedLogo size={wp(15)} />
            <Text className="mt-4 w-full text-center text-3xl font-extrabold tracking-tight text-white">
              {title}
            </Text>
            <Text className="mt-2 text-center text-md text-white/75">{subtitle}</Text>
          </SafeAreaView>

          {/* Bottom card — slides up with the keyboard */}
          <Animated.View
            className="bg-background rounded-tl-[32px] p-6"
            style={{
              paddingBottom: insets.bottom + hp(2),
              transform: [{ translateY }],
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -6 },
              elevation: 20,
            }}>
            {children}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
