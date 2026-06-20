import { useRef, useState } from 'react';
import {
  FlatList,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { PrimaryButton } from 'components/Button';
import { hp, wp } from 'utils/utils';

interface Step {
  key: string;
  animation: AnimationObject;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    key: 'follow',
    animation: require('../assets/lottie/follow-topics.json'),
    title: 'Follow what you love',
    description:
      "Pick the topics you're curious about and we'll keep up with the latest on them for you.",
  },
  {
    key: 'generate',
    animation: require('../assets/lottie/fresh-episodes.json'),
    title: 'Fresh episodes, daily',
    description:
      'Every day, two AI hosts turn your topics into a short, lively podcast — made just for you.',
  },
  {
    key: 'listen',
    animation: require('../assets/lottie/listen-anywhere.json'),
    title: 'Listen anywhere',
    description:
      'Stream on the go with background playback. Your daily digest, ready whenever you are.',
  },
];

export default function Onboarding() {
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Step>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === STEPS.length - 1;

  const finish = () => {
    router.replace('/(auth)/register');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={STEPS}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-10">
            <LottieView
              source={item.animation}
              autoPlay
              loop
              style={{ width: width * 0.7, height: width * 0.7 }}
            />
            <Text className="text-foreground text-center text-4xl font-bold tracking-tight">
              {item.title}
            </Text>
            <Text className="text-foreground mt-2 text-center text-lg leading-6">
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Footer: dots + CTAs */}
      <View className="gap-4 px-6">
        <View className="flex-row justify-center gap-2">
          {STEPS.map((step, i) => (
            <View
              key={step.key}
              style={{
                width: wp(5),
                height: wp(2)
              }}
              className={`rounded-full ${
                i === index ? 'bg-secondary' : 'bg-primary'
              }`}
            />
          ))}
        </View>

        <View
          style={{
            paddingBottom: inset.bottom - 12,
          }}>
          <PrimaryButton text={isLast ? 'Get Started' : 'Next'} onPress={next} />
        </View>
      </View>
    </SafeAreaView>
  );
}
