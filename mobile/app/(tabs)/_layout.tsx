import { Redirect, Tabs } from 'expo-router';

import { useAuth } from 'components/AuthProvider';
import { MiniPlayer } from 'components/MiniPlayer';
import { TabBar } from 'components/TabBar';
import { useGetMeQuery } from 'store/api';

export default function TabLayout() {
  const { ready, isAuthed } = useAuth();
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthed });

  // Wait for the session to load, then guard: no token → login.
  if (!ready) return null;
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
  // Strict onboarding: a user who hasn't finished personalization can't reach
  // the feed, even by deep-link or restart — bounce them back.
  if (me && !me.onboarded) return <Redirect href="/personalize" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <>
          <MiniPlayer />
          <TabBar {...props} />
        </>
      )}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
