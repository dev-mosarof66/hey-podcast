import { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useAuth } from 'components/AuthProvider';
import { useGoogleLoginMutation } from 'store/api';

function errMessage(e: unknown): string {
  const data = (e as { data?: { message?: string } })?.data;
  return data?.message ?? 'Could not sign in with Google. Please try again.';
}

/**
 * Native Google sign-in. The native module is loaded LAZILY inside signIn so a
 * dev build that doesn't include it can't crash the app at import time — it
 * just shows a toast. Requires a dev build with
 * `@react-native-google-signin/google-signin` compiled in.
 */
export function useGoogleSignIn() {
  const [googleLogin] = useGoogleLoginMutation();
  const { signIn: authSignIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    // Lazy require — throws here (caught) if the native module isn't in the build.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mod: any;
    try {
      mod = require('@react-native-google-signin/google-signin');
      mod.GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Google sign-in unavailable',
        text2: 'This build is missing the Google module — rebuild the dev client.',
      });
      return;
    }

    const { GoogleSignin, isErrorWithCode, statusCodes } = mod;
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      const idToken: string | null = result?.data?.idToken ?? result?.idToken ?? null;
      if (!idToken) throw new Error('No idToken returned from Google');

      const auth = await googleLogin({ idToken }).unwrap();
      await authSignIn(auth.token);
      // First-time Google users pick topics; returning users go to the feed.
      router.replace(auth.isNew ? '/personalize' : '/(tabs)/home');
    } catch (e) {
      if (isErrorWithCode?.(e) && (e as { code?: unknown }).code === statusCodes?.SIGN_IN_CANCELLED) {
        return; // user dismissed the sheet
      }
      Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: errMessage(e) });
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
