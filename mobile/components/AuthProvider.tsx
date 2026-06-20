import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api } from 'store/api';
import { useAppDispatch } from 'store/hooks';
import { clearToken, loadToken, setToken } from 'store/token';

interface AuthValue {
  /** JWT for the current session, or null if signed out. */
  token: string | null;
  /** True once the persisted token has been loaded from storage. */
  ready: boolean;
  isAuthed: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // On launch: load the stored token and VALIDATE it with the server
  // (GET /auth/me). The session is authed ONLY if the server confirms the
  // token. Any failure — rejected (401/403) OR unreachable (network error) —
  // sends the user to login; we never trust an unverified token.
  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (!stored) {
        setReady(true);
        return;
      }
      try {
        await dispatch(api.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap();
        setTok(stored); // server accepted it → authed
      } catch (err) {
        const status = (err as { status?: number | string })?.status;
        // Definitively invalid → wipe it. Network/other error → keep it in
        // storage (a later launch may validate) but don't authenticate now.
        if (status === 401 || status === 403) {
          await clearToken();
        }
        setTok(null); // not verified → go to login
      } finally {
        setReady(true);
      }
    })();
  }, [dispatch]);

  const signIn = useCallback(async (next: string) => {
    await setToken(next);
    setTok(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setTok(null);
    // Drop all cached server data so the next user starts clean.
    dispatch(api.util.resetApiState());
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ token, ready, isAuthed: !!token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
