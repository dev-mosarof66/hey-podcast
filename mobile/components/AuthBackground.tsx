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
 * Textured auth background: a diagonal violet brand gradient with a soft glow up
 * top and a mint glow in the lower corner for depth, faint sound-ripple rings
 * that echo the app logo, and a fine dot pattern so it reads as real texture
 * rather than a flat fill. Drawn with SVG (one GPU layer, no image asset).
 */
export function AuthBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="auth-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8b2fe8" />
          <Stop offset="55%" stopColor="#7008e7" />
          <Stop offset="100%" stopColor="#3b0a75" />
        </LinearGradient>

        <RadialGradient id="auth-glow" cx="50%" cy="4%" rx="85%" ry="55%">
          <Stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="auth-mint" cx="10%" cy="98%" rx="60%" ry="45%">
          <Stop offset="0%" stopColor="#9FE1CB" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#9FE1CB" stopOpacity="0" />
        </RadialGradient>

        <Pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <Circle cx="3" cy="3" r="1.5" fill="#FFFFFF" fillOpacity="0.09" />
        </Pattern>
      </Defs>

      <Rect width="100%" height="100%" fill="url(#auth-bg)" />

      {/* Sound-ripple rings — echo the logo, sit behind the header logo/title. */}
      <Circle cx="50%" cy="24%" r="90" stroke="#9FE1CB" strokeOpacity="0.14" strokeWidth="2" fill="none" />
      <Circle cx="50%" cy="24%" r="150" stroke="#9FE1CB" strokeOpacity="0.1" strokeWidth="2" fill="none" />
      <Circle cx="50%" cy="24%" r="215" stroke="#9FE1CB" strokeOpacity="0.06" strokeWidth="2" fill="none" />

      <Rect width="100%" height="100%" fill="url(#auth-glow)" />
      <Rect width="100%" height="100%" fill="url(#auth-mint)" />
      <Rect width="100%" height="100%" fill="url(#auth-dots)" />
    </Svg>
  );
}
