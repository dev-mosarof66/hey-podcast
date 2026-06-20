import { Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children' | 'className'> {
  /** Button label. */
  text: string;
  /** Extra classes for the container (width, margins, etc.). */
  styles?: string;
  /** Extra classes for the label. */
  textStyles?: string;
}

const BASE_CONTAINER =
  'h-14 w-full flex-row items-center justify-center rounded-full px-6 active:scale-[0.98]';
const BASE_TEXT = 'text-lg font-semibold';

/** Solid, filled call-to-action button. */
export const PrimaryButton = ({ text, styles = '', textStyles = '', ...props }: ButtonProps) => {
  return (
    <Pressable className={`${BASE_CONTAINER} bg-primary  ${styles}`} {...props}>
      <Text className={`${BASE_TEXT} text-white ${textStyles}`}>{text}</Text>
    </Pressable>
  );
};

/** Bordered, transparent variant for secondary actions. */
export const OutlineButton = ({ text, styles = '', textStyles = '', ...props }: ButtonProps) => {
  return (
    <Pressable
      className={`${BASE_CONTAINER} border-2 border-primary bg-transparent active:bg-primary/10 ${styles}`}
      {...props}>
      <Text className={`${BASE_TEXT} text-primary ${textStyles}`}>{text}</Text>
    </Pressable>
  );
};
