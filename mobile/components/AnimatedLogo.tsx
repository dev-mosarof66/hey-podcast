import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

const TILE_COLOR = '#0F6E56';
const MIN_SCALE = 0.35;
const HALF_CYCLE = 650;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const BARS = [
  { ratio: 0.4, color: '#9FE1CB' },
  { ratio: 0.8, color: '#BFEEDD' },
  { ratio: 0.95, color: '#E1F5EE' },
  { ratio: 0.8, color: '#BFEEDD' },
  { ratio: 0.4, color: '#9FE1CB' },
];

const CENTER_INDEX = Math.floor(BARS.length / 2);

interface BarProps {
  width: number;
  height: number;
  color: string;
  delay: number;
}

function Bar({ width, height, color, delay }: BarProps) {
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: HALF_CYCLE,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(scale, {
          toValue: MIN_SCALE,
          duration: HALF_CYCLE,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );

    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [scale, delay]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: width / 2,
        backgroundColor: color,
        transform: [{ scaleY: scale }],
      }}
    />
  );
}

export function AnimatedLogo({ size = 64 }: { size?: number }) {
  const barWidth = size * 0.1;
  const gap = size * 0.06;
  const maxBarHeight = size * 0.62;

  return (
    <View
      style={{
        width: size * 1.2,
        height: size * 1.2,
        borderRadius: size,
        backgroundColor: TILE_COLOR,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
      }}>
      {BARS.map((bar, i) => (
        <Bar
          key={i}
          width={barWidth}
          height={maxBarHeight * bar.ratio}
          color={bar.color}
          // symmetric: bars equidistant from the center pulse together
          delay={Math.abs(i - CENTER_INDEX) * 150}
        />
      ))}
    </View>
  );
}
