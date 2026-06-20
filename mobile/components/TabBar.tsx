import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import { hp, wp } from 'utils/utils';

interface IconProps {
  focused: boolean;
  color: string;
  size: number;
}

interface TabMeta {
  label: string;
  renderIcon: (props: IconProps) => ReactNode;
}

const TAB_META: Record<string, TabMeta> = {
  home: {
    label: 'Home',
    renderIcon: ({ color, size }) => <Entypo name="home" size={size} color={color} />,
  },
  discover: {
    label: 'Discover',
    renderIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
    ),
  },
  library: {
    label: 'Library',
    renderIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'library' : 'library-outline'} size={size} color={color} />
    ),
  },
  profile: {
    label: 'Profile',
    renderIcon: ({ color, size }) => <FontAwesome5 name="user" solid size={size} color={color} />,
  },
};

const RADIUS = wp(50);

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom }]} pointerEvents="box-none">
      <View style={styles.shadow}>
        <View
          style={[
            styles.glassClip,
            { borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)' },
          ]}>
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={dark ? 40 : 60}
            tint={dark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: RADIUS,
                backgroundColor: dark ? 'rgba(18,18,26,0.45)' : 'rgba(255,255,255,0.45)',
              },
            ]}
          />
        </View>

        <View style={styles.row}>
          {state.routes.map((route, i) => {
            const meta = TAB_META[route.name];
            if (!meta) return null;

            const focused = state.index === i;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.tab}>
                <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                  {meta.renderIcon({
                    focused,
                    size: focused ? wp(7) : wp(5.5),
                    color: focused ? Colors.primary : Colors.muted,
                  })}
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: wp(4),
    right: wp(4),
  },
  // Holds the shadow and provides the positioning context for the absolute glass.
  shadow: {
    borderRadius: RADIUS,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: wp(4),
    shadowOffset: { width: 0, height: hp(1) },
    elevation: 12,
  },
  glassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingBottom: hp(0.5),
    paddingHorizontal: wp(1),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: hp(0.4),
  },
  iconPill: {
    height: wp(10),
    width: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS,
  },
  iconPillActive: {
    transform: [{ translateY: -hp(2.2) }],
  },
  label: {
    fontSize: wp(3),
    fontWeight: '600',
    color: Colors.muted,
  },
});
