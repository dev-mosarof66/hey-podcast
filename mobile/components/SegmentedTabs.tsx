import { Pressable, Text, View } from 'react-native';

export interface Segment {
  id: string;
  label: string;
}

interface Props {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
}

/** Pill segmented control. */
export function SegmentedTabs({ segments, value, onChange }: Props) {
  return (
    <View className="bg-foreground/5 flex-row rounded-full p-1">
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            className={`flex-1 items-center rounded-full py-2.5 ${active ? 'bg-primary' : ''}`}>
            <Text
              className={`text-sm font-semibold ${active ? 'text-white' : 'text-foreground/50'}`}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
