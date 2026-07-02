import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { AuthShell } from 'components/AuthShell';
import { useAuth } from 'components/AuthProvider';
import { PrimaryButton } from 'components/Button';
import { TextField } from 'components/TextField';
import { useTheme } from 'components/ThemeProvider';
import { Colors } from 'constants/Colors';
import { useGoogleSignIn } from 'hooks/useGoogleSignIn';
import { useLoginMutation } from 'store/api';
import { useFonts, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function errMessage(e: unknown): string {
  const data = (e as { data?: { message?: string } })?.data;
  return data?.message ?? 'Could not log in. Check your details and try again.';
}

export default function LoginScreen() {
  const inset = useSafeAreaInsets();
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const { signIn } = useAuth();
  const google = useGoogleSignIn();

  // Theme-aware colors (replace the foreground/card NativeWind tokens).
  const fg = dark ? '248, 250, 252' : '2, 6, 24';
  const card = dark ? '#16161f' : '#ffffff';
  const medFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

  const onSubmit = async () => {
    try {
      const res = await login({ email: email.trim(), password }).unwrap();
      await signIn(res.token);
      router.replace('/(tabs)/home');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: errMessage(e) });
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your daily digest">
      <View style={{ gap: 16 }}>
        <TextField
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          icon="lock-closed-outline"
          placeholder="Your password"
          secure
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton onPress={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#ffffff', fontFamily: semiFont }}>Log in</Text>
          )}
        </PrimaryButton>
      </View>

      {/* Divider */}
      <View style={{ marginVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ height: 1, flex: 1, backgroundColor: `rgba(${fg}, 0.1)` }} />
        <Text style={{ fontSize: 12, color: `rgba(${fg}, 0.4)` }}>OR</Text>
        <View style={{ height: 1, flex: 1, backgroundColor: `rgba(${fg}, 0.1)` }} />
      </View>

      {/* Google sign-in (icon only) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        <Pressable
          onPress={google.signIn}
          disabled={google.loading}
          style={({ pressed }) => [
            {
              height: 56,
              width: 56,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              borderRadius: 9999,
              borderWidth: 2,
              borderColor: Colors.primary,
            },
            pressed && { opacity: 0.8 },
          ]}>
          <Ionicons name="logo-google" size={24} color="#EA4335" />
        </Pressable>
      </View>

      {/* Switch */}
      <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: inset.bottom }}>
        <Text style={{ fontSize: 15, color: `rgba(${fg}, 0.6)`, fontFamily: medFont }}>
          Don&rsquo;t have an account?
        </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={8}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.primary, fontFamily: semiFont }}>Sign up</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
