import { View } from 'react-native';

import { Shimmer } from 'components/Shimmer';
import { wp } from 'utils/utils';

/** Loading placeholder shaped like the DigestHero. */
export function DigestHeroSkeleton() {
  return (
    <View className="bg-foreground/5 gap-4 p-5" style={{ borderRadius: wp(4) }}>
      {/* pill */}
      <Shimmer className="h-5 w-24 rounded-full" />

      {/* title (two lines) */}
      <View className="gap-2">
        <Shimmer className="h-6 w-full rounded-md" />
        <Shimmer className="h-6 w-3/4 rounded-md" />
      </View>

      {/* meta */}
      <Shimmer className="h-4 w-2/5 rounded-md" />

      {/* play row */}
      <View className="mt-2 flex-row items-center gap-3">
        <Shimmer className="h-12 w-12 rounded-full" />
        <Shimmer className="h-4 w-24 rounded-md" />
      </View>
    </View>
  );
}
