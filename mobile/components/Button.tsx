import { type ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { Colors } from 'constants/Colors';
import { wp } from 'utils/utils';

interface ButtonProps extends TouchableOpacityProps {
  children?: ReactNode;
}

/** Solid, filled call-to-action button. Compose the label as children. */
export const PrimaryButton = ({ children, style, ...props }: ButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.base, styles.primary, style]} {...props}>
      {children}
    </TouchableOpacity>
  );
};

/** Bordered, transparent variant for secondary actions. */
export const OutlineButton = ({ children, style, ...props }: ButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.base, styles.outline, style]} {...props}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: wp(12),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  primary: { backgroundColor: Colors.primary },
  outline: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent' },
});
