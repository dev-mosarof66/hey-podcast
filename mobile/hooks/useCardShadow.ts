import { useMemo } from 'react';

import { Colors } from 'constants/Colors';
import { useTheme } from 'components/ThemeProvider';

/**
 * Theme-aware card shadow. Use on an OPAQUE surface (e.g. `bg-card`) — a
 * shadow behind a translucent background bleeds through and looks like an
 * inner shadow. On dark a primary glow stands in for the invisible black one.
 */
export function useCardShadow() {
  const dark = useTheme().scheme === 'dark';
  return useMemo(
    () => ({
      shadowColor: dark ? Colors.primary : '#000',
      shadowOpacity: dark ? 0.25 : 0.08,
      shadowRadius: dark ? 10 : 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: dark ? 5 : 3,
    }),
    [dark]
  );
}
