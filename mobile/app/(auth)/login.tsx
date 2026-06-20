import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { AuthShell } from 'components/AuthShell';
import { useAuth } from 'components/AuthProvider';
import { PrimaryButton } from 'components/Button';
import { TextField } from 'components/TextField';
import { Colors } from 'constants/Colors';
import { useGoogleSignIn } from 'hooks/useGoogleSignIn';
import { useLoginMutation } from 'store/api';

const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

function errMessage(e: unknown): string {
  const data = (e as { data?: { message?: string } })?.data;
  return data?.message ?? 'Could not log in. Check your details and try again.';
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const { signIn } = useAuth();
  const google = useGoogleSignIn();

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
      <View className="gap-4">
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

        {/* <Pressable hitSlop={8} className="self-end">
          <Text className="text-primary text-sm font-semibold">Forgot password?</Text>
        </Pressable> */}

        <PrimaryButton
          text={isLoading ? 'Logging in…' : 'Log in'}
          onPress={onSubmit}
          disabled={isLoading}
          style={CTA_GLOW}
          styles="mt-1"
        />
      </View>

      {/* Divider */}
      <View className="my-5 flex-row items-center gap-3">
        <View className="bg-foreground/10 h-px flex-1" />
        <Text className="text-foreground/40 text-xs">OR</Text>
        <View className="bg-foreground/10 h-px flex-1" />
      </View>

      {/* Google sign-in (icon only) */}
      <Pressable
        onPress={google.signIn}
        disabled={google.loading}
        className="border-foreground/15 bg-card h-14 w-14 items-center justify-center self-center rounded-full border active:opacity-80">
        <Ionicons name="logo-google" size={24} color="#EA4335" />
      </Pressable>

      {/* Switch */}
      <View className="mt-6 flex-row justify-center gap-1">
        <Text className="text-foreground/60 text-md">Don&rsquo;t have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={8}>
            <Text className="text-primary text-md font-bold">Sign up</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
