import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * A single shimmering placeholder block. Size/shape it with `className`
 * (e.g. "h-6 w-3/4 rounded-md"). The base tint comes from the theme so it
 * works in light + dark.
 */
export function Shimmer({ className = '' }: { className?: string }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!width) return;
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [width, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={`bg-foreground/10 overflow-hidden ${className}`}>
      {width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}
