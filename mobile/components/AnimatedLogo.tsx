import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const RING_COUNT = 3;
const CYCLE = 2100; // one full ripple, ms

/** A sound-ripple ring that expands out from the center and fades. */
function Ring({ base, delay }: { base: number; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE,
        easing: Easing.out(Easing.ease),
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [progress, delay]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.05] });
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 0.6, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: base,
        height: base,
        borderRadius: base / 2,
        borderWidth: Math.max(2, base * 0.035),
        borderColor: '#9FE1CB',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export function AnimatedLogo({ size = 64 }: { size?: number }) {
  const tile = size * 1.2;
  const pulse = useRef(new Animated.Value(1)).current;

  // Gentle breathing on the center mark so it feels alive between ripples.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <LinearGradient
      colors={['#8b2fe8', '#7008e7', '#4c1d95']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: tile,
        height: tile,
        borderRadius: tile / 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {/* Expanding sound ripples */}
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <Ring key={i} base={size * 0.92} delay={i * (CYCLE / RING_COUNT)} />
      ))}

      {/* Center play mark */}
      <Animated.View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: 'rgba(255,255,255,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pulse }],
        }}>
        <Ionicons name="play" size={size * 0.28} color="#ffffff" style={{ marginLeft: size * 0.03 }} />
      </Animated.View>
    </LinearGradient>
  );
}
