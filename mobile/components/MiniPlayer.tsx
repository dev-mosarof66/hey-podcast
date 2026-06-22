import { useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';
import { usePlayer, usePlayerActions } from 'components/PlayerProvider';
import { hp, wp } from 'utils/utils';

// Swipe distance / velocity past which a right-swipe dismisses the bar.
const DISMISS_DX = wp(28);
const DISMISS_VX = 0.5;

/** Persistent bar above the tab bar; tap to open the full player, swipe right to dismiss. */
export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const { episode, isPlaying, isBuffering, position, duration } = usePlayer();
  const { toggle, close } = usePlayerActions();

  // Horizontal drag offset for the swipe-to-dismiss gesture.
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      // Claim the gesture only on a clearly-horizontal rightward drag, so taps
      // (open player / play-pause) and vertical scrolls still work.
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_e, g) => {
        if (g.dx > 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx > DISMISS_DX || g.vx > DISMISS_VX) {
          // Fling it off the right edge, then stop + clear the player.
          Animated.timing(translateX, {
            toValue: wp(110),
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            close();
            translateX.setValue(0); // reset for the next episode
          });
        } else {
          // Not far enough — snap back.
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  if (!episode) return null;

  const total = duration || episode.durationSec || 1;
  const pct = Math.min(100, Math.max(0, (position / total) * 100));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: wp(4),
        right: wp(4),
        bottom: insets.bottom + wp(2) + hp(8),
      }}>
      <Animated.View
        {...pan.panHandlers}
        style={{
          transform: [{ translateX }],
          opacity: translateX.interpolate({
            inputRange: [0, wp(50)],
            outputRange: [1, 0.2],
            extrapolate: 'clamp',
          }),
        }}>
        <Pressable
          onPress={() => router.push('/player')}
          style={{
            borderRadius: wp(4),
            overflow: 'hidden',
            backgroundColor: dark ? '#1B1B24' : '#FFFFFF',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            shadowColor: dark ? Colors.primary : '#000',
            shadowOpacity: dark ? 0.35 : 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}>
          {/* Progress hairline along the top edge */}
          <View style={{ height: 2, backgroundColor: dark ? '#ffffff14' : '#00000010' }}>
            <View style={{ height: 2, width: `${pct}%`, backgroundColor: Colors.primary }} />
          </View>

          <View className="flex-row items-center gap-3 p-2.5">
            <View
              className="items-center justify-center rounded-xl"
              style={{ width: wp(11), height: wp(11), backgroundColor: episode.color + '22' }}>
              <Ionicons name={episode.icon} size={wp(5.5)} color={episode.color} />
            </View>

            <View className="flex-1">
              <Text numberOfLines={1} className="text-foreground text-sm font-bold">
                {episode.title}
              </Text>
              <Text numberOfLines={1} className="text-foreground/50 text-xs">
                {episode.topic} · {episode.durationMin} min
              </Text>
            </View>

            <Pressable
              hitSlop={12}
              onPress={toggle}
              className="items-center justify-center rounded-full"
              style={{ width: wp(11), height: wp(11), backgroundColor: Colors.primary }}>
              {isBuffering && !isPlaying ? (
                <Ionicons name="ellipsis-horizontal" size={wp(5.5)} color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={wp(5.5)}
                  color="#fff"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              )}
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
