import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Textured auth background: a diagonal brand gradient, a soft radial glow up top
 * for depth, and a fine dot pattern overlay so it reads as a real texture rather
 * than a flat fill. Drawn with SVG (one GPU layer, no image asset).
 */
export function AuthBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="auth-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A41FAE" />
          <Stop offset="55%" stopColor="#721378" />
          <Stop offset="100%" stopColor="#350A3F" />
        </LinearGradient>

        <RadialGradient id="auth-glow" cx="50%" cy="6%" rx="80%" ry="55%">
          <Stop offset="0%" stopColor="#E879F9" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#E879F9" stopOpacity="0" />
        </RadialGradient>

        <Pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <Circle cx="3" cy="3" r="1.5" fill="#FFFFFF" fillOpacity="0.1" />
        </Pattern>
      </Defs>

      <Rect width="100%" height="100%" fill="url(#auth-bg)" />
      <Rect width="100%" height="100%" fill="url(#auth-glow)" />
      <Rect width="100%" height="100%" fill="url(#auth-dots)" />
    </Svg>
  );
}
