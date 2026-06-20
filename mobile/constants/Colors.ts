/**
 * Raw hex palette — mirrors the CSS variables in global.css.
 *
 * Use NativeWind classes (bg-primary, text-foreground, …) wherever you can.
 * These constants are only for APIs that need a raw color value instead of a
 * className — e.g. vector-icon `color` props, StatusBar, ActivityIndicator.
 */
export const Colors = {
  primary: '#721378',
  secondary: '#ed6aff',
  // Neutral grey for inactive icons — reads well on both light and dark.
  muted: '#94a3b8',
} as const;
