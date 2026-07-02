import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';

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
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold });
  const { episode, isPlaying, isBuffering, position, duration } = usePlayer();
  const { toggle, close } = usePlayerActions();

  // Horizontal drag offset for the swipe-to-dismiss gesture.
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      // Claim the gesture only on a clearly-horizontal rightward drag, so taps
      // (open player / play-pause) and vertical scrolls still work.
      onMoveShouldSetPanResponder: (_e, g) => g.dx > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
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
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    })
  ).current;

  if (!episode) return null;

  const total = duration || episode.durationSec || 1;
  const pct = Math.min(100, Math.max(0, (position / total) * 100));

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const titleFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: wp(4), right: wp(4), bottom: insets.bottom + wp(2) + hp(8) }}>
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
          style={[
            styles.card,
            {
              backgroundColor: dark ? '#1B1B24' : '#FFFFFF',
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(112,8,231,0.12)',
              shadowColor: dark ? Colors.primary : '#000',
              shadowOpacity: dark ? 0.35 : 0.15,
            },
          ]}>
          {/* Progress hairline along the top edge */}
          <View style={[styles.track, { backgroundColor: dark ? '#ffffff14' : '#00000010' }]}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>

          <View style={styles.row}>
            <View style={[styles.artTile, { backgroundColor: episode.color + '22' }]}>
              <Ionicons name={episode.icon} size={wp(5.5)} color={episode.color} />
            </View>

            <View style={styles.flex}>
              <Text numberOfLines={1} style={[styles.title, { color: titleColor, fontFamily: titleFont }]}>
                {episode.title}
              </Text>
              <Text numberOfLines={1} style={[styles.sub, { color: subColor, fontFamily: bodyFont }]}>
                {episode.topic} · {episode.durationMin} min
              </Text>
            </View>

            <Pressable hitSlop={12} onPress={toggle} style={styles.playBtn}>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: wp(4),
    overflow: 'hidden',
    borderWidth: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  track: { height: 3 },
  fill: { height: 3, backgroundColor: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  artTile: { width: wp(11), height: wp(11), alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  sub: { marginTop: 2, fontSize: 12 },
  playBtn: {
    width: wp(11),
    height: wp(11),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
