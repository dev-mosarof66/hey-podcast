import { View } from 'react-native';

import { Shimmer } from 'components/Shimmer';

/** Loading placeholder shaped like an EpisodeCard row. */
export function EpisodeCardSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-foreground/10 bg-background p-4">
      {/* icon */}
      <Shimmer className="h-11 w-11 rounded-full" />

      <View className="flex-1 gap-2">
        {/* title */}
        <Shimmer className="h-4 w-4/5 rounded-md" />
        {/* topic pill + meta */}
        <View className="flex-row items-center gap-2">
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-3 w-20 rounded-md" />
        </View>
      </View>

      {/* play affordance */}
      <Shimmer className="h-8 w-8 rounded-full" />
    </View>
  );
}
