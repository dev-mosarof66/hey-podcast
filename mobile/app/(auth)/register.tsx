import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useFonts, Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';

import { AuthShell } from 'components/AuthShell';
import { useAuth } from 'components/AuthProvider';
import { PrimaryButton } from 'components/Button';
import { TextField } from 'components/TextField';
import { useTheme } from 'components/ThemeProvider';
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
  const dark = useTheme().scheme === 'dark';
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const { signIn } = useAuth();

  // Theme-aware foreground (replaces the foreground NativeWind tokens).
  const fg = dark ? '248, 250, 252' : '2, 6, 24';
  const medFont = fontsLoaded ? 'Sora_500Medium' : undefined;
  const semiFont = fontsLoaded ? 'Sora_600SemiBold' : undefined;

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
      // New account -> pick topics first.
      router.replace('/personalize');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Sign up failed', text2: errMessage(e) });
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start your personal podcast feed">
      <View style={{ gap: 14 }}>
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

        <PrimaryButton onPress={onSubmit} disabled={isLoading} style={[CTA_GLOW, { marginTop: 4 }]}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff', fontFamily: semiFont }}>
              Create account
            </Text>
          )}
        </PrimaryButton>
      </View>

      {/* Switch */}
      <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text style={{ fontSize: 15, color: `rgba(${fg}, 0.6)`, fontFamily: medFont }}>
          Already have an account?
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.primary, fontFamily: semiFont }}>
              Log in
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
