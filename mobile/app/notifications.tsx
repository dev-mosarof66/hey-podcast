import { useEffect, useRef } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from 'constants/Colors';
import { Shimmer } from 'components/Shimmer';
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  type ApiNotification,
} from 'store/api';
import { hp, wp } from 'utils/utils';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationRow({ item }: { item: ApiNotification }) {
  return (
    <Pressable
      onPress={() => {
        if (item.episodeId) router.navigate('/(tabs)/home');
      }}
      className={`flex-row items-center gap-3 px-6 py-4 active:opacity-70 ${
        item.read ? '' : 'bg-primary/5'
      }`}>
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.primary + '1A' }}>
        <Ionicons name="headset" size={22} color={Colors.primary} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-foreground text-base font-semibold">
          {item.title}
        </Text>
        {!!item.body && (
          <Text numberOfLines={2} className="text-foreground/60 mt-0.5 text-sm">
            {item.body}
          </Text>
        )}
        <Text className="text-foreground/40 mt-1 text-xs">{timeAgo(item.createdAt)}</Text>
      </View>

      {!item.read && <View className="bg-primary h-2.5 w-2.5 rounded-full" />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { data: items = [], isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationsReadMutation();
  const marked = useRef(false);

  // Mark everything read once, when the inbox is opened.
  useEffect(() => {
    if (!marked.current && items.some((n) => !n.read)) {
      marked.current = true;
      markRead();
    }
  }, [items, markRead]);

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={Colors.muted} />
        </Pressable>
        <Text className="text-foreground text-2xl font-bold tracking-tight">Notifications</Text>
      </View>

      {isLoading ? (
        <View className="gap-3 px-6 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="bg-foreground/5 h-20 w-20 items-center justify-center rounded-full">
            <Ionicons name="notifications-outline" size={wp(9)} color={Colors.muted} />
          </View>
          <Text className="text-foreground mt-5 text-lg font-semibold">No notifications yet</Text>
          <Text className="text-foreground/50 mt-1 text-center text-sm">
            When your daily digest is ready, it&rsquo;ll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NotificationRow item={item} />}
          ItemSeparatorComponent={() => <View className="bg-foreground/5 ml-20 h-px" />}
          contentContainerStyle={{ paddingBottom: hp(4) }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
