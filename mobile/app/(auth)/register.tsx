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
import { useRegisterMutation } from 'store/api';

const CTA_GLOW = {
  shadowColor: Colors.primary,
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

function errMessage(e: unknown): string {
  const data = (e as { data?: { message?: string } })?.data;
  return data?.message ?? 'Could not create your account. Please try again.';
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const { signIn } = useAuth();

  const onSubmit = async () => {
    if (password.length < 8) {
      Toast.show({ type: 'error', text1: 'Weak password', text2: 'Use at least 8 characters.' });
      return;
    }
    try {
      const res = await register({
        email: email.trim(),
        password,
        displayName: name.trim() || undefined,
      }).unwrap();
      await signIn(res.token);
      // New account → pick topics first.
      router.replace('/personalize');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Sign up failed', text2: errMessage(e) });
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start your personal podcast feed">
      <View className="gap-3.5">
        <TextField
          label="Name"
          icon="person-outline"
          placeholder="Your name"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="At least 8 characters"
          secure
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton
          text={isLoading ? 'Creating…' : 'Create account'}
          onPress={onSubmit}
          disabled={isLoading}
          style={CTA_GLOW}
          styles="mt-1"
        />
      </View>

      {/* Switch */}
      <View className="mt-5 flex-row justify-center gap-1">
        <Text className="text-foreground/60 text-md">Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text className="text-primary text-md font-bold">Log in</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
