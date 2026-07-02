import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

import { Colors } from 'constants/Colors';
import { Shimmer } from 'components/Shimmer';
import { useTheme } from 'components/ThemeProvider';
import { useCardShadow } from 'hooks/useCardShadow';
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  type ApiNotification,
} from 'store/api';
import { hp, wp } from 'utils/utils';

const LIGHT_BG = ['#efe6fc', '#e8dcf9', '#e0d2f4'] as const;
const DARK_BG = ['#020618', '#0b0a1e', '#0a0a1a'] as const;

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
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold });
  const cardShadow = useCardShadow();

  const cardBg = dark ? '#16161f' : '#ffffff';
  const unreadBg = dark ? '#1c1630' : '#f6f0fe';
  const cardBorder = dark ? 'rgba(248,250,252,0.10)' : 'rgba(112,8,231,0.18)';
  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.6)' : 'rgba(26,11,46,0.6)';
  const mutedText = dark ? 'rgba(248,250,252,0.4)' : 'rgba(26,11,46,0.4)';
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;

  return (
    <Pressable
      onPress={() => {
        if (item.episodeId) router.navigate('/(tabs)/home');
      }}
      style={[
        styles.row,
        { backgroundColor: item.read ? cardBg : unreadBg, borderColor: cardBorder },
        cardShadow,
      ]}>
      <View style={[styles.icon, { backgroundColor: 'rgba(112,8,231,0.10)' }]}>
        <Ionicons name="headset" size={22} color={Colors.primary} />
      </View>

      <View style={styles.flex}>
        <Text numberOfLines={1} style={[styles.title, { color: titleColor, fontFamily: semiFont }]}>
          {item.title}
        </Text>
        {!!item.body && (
          <Text numberOfLines={2} style={[styles.body, { color: subColor, fontFamily: bodyFont }]}>
            {item.body}
          </Text>
        )}
        <Text style={[styles.time, { color: mutedText, fontFamily: bodyFont }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>

      {!item.read && <View style={styles.dot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const { data: items = [], isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationsReadMutation();
  const marked = useRef(false);

  const titleColor = dark ? '#f8fafc' : '#1a0b2e';
  const subColor = dark ? 'rgba(248,250,252,0.55)' : 'rgba(26,11,46,0.55)';
  const titleFont = fontsLoaded ? 'Sora_700Bold' : undefined;
  const bodyFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  // Mark everything read once, when the inbox is opened.
  useEffect(() => {
    if (!marked.current && items.some((n) => !n.read)) {
      marked.current = true;
      markRead();
    }
  }, [items, markRead]);

  return (
    <LinearGradient colors={dark ? DARK_BG : LIGHT_BG} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={titleColor} />
          </Pressable>
          <Text style={[styles.h1, { color: titleColor, fontFamily: titleFont }]}>Notifications</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp(6), paddingTop: hp(1), paddingBottom: hp(4) }}>
          {isLoading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Shimmer key={i} style={{ height: hp(9), width: '100%', borderRadius: 20 }} />
              ))}
            </View>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: 'rgba(112,8,231,0.08)' }]}>
                <Ionicons name="notifications-outline" size={wp(9)} color={Colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: titleColor, fontFamily: semiFont }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySub, { color: subColor, fontFamily: bodyFont }]}>
                When your daily digest is ready, it&rsquo;ll show up here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {items.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: wp(5), paddingVertical: 12 },
  h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, padding: 16 },
  icon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  title: { fontSize: 15, fontWeight: '600' },
  body: { marginTop: 2, fontSize: 14, lineHeight: 19 },
  time: { marginTop: 4, fontSize: 12 },
  dot: { height: 10, width: 10, borderRadius: 9999, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: hp(14), paddingHorizontal: 24 },
  emptyIcon: { height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  emptyTitle: { marginTop: 20, fontSize: 17, fontWeight: '600' },
  emptySub: { marginTop: 4, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
