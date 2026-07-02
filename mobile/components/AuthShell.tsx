import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Sora_500Medium, Sora_800ExtraBold } from '@expo-google-fonts/sora';

import { AnimatedLogo } from 'components/AnimatedLogo';
import { AuthBackground } from 'components/AuthBackground';
import { useTheme } from 'components/ThemeProvider';
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
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_800ExtraBold });
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
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

  const background = dark ? '#020618' : '#f1f5f9';

  return (
    <View style={styles.root}>
      {/* Textured background */}
      <AuthBackground />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.root}>
          {/* Top: logo + title + tagline (outside the card) */}
          <SafeAreaView edges={['top']} style={styles.header}>
            <AnimatedLogo size={wp(15)} />
            <Text style={[styles.title, fontsLoaded && { fontFamily: 'Sora_800ExtraBold' }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, fontsLoaded && { fontFamily: 'Sora_500Medium' }]}>
              {subtitle}
            </Text>
          </SafeAreaView>

          {/* Bottom card — slides up with the keyboard */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: background,
                paddingBottom: insets.bottom + hp(2),
                transform: [{ translateY }],
              },
            ]}>
            {children}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: {
    width: '100%',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    borderTopLeftRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 20,
  },
});
