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

  // On launch: load the stored token and open OPTIMISTICALLY — trust it right
  // away so the app doesn't sit on the splash waiting for a possibly-cold
  // server (Render free tier can take 30–60s to wake). We then validate with
  // GET /auth/me in the BACKGROUND and only sign out if the server
  // definitively rejects the token (401/403). A network/unreachable error
  // keeps the session; real requests will retry once the server is up.
  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (!stored) {
        setReady(true);
        return;
      }
      // Route immediately with the stored token.
      setTok(stored);
      setReady(true);

      // Background validation — never blocks the splash.
      dispatch(api.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
        .unwrap()
        .catch(async (err) => {
          const status = (err as { status?: number | string })?.status;
          if (status === 401 || status === 403) {
            await clearToken();
            setTok(null); // definitively invalid → drop to login
          }
          // else: offline / cold server → keep the optimistic session
        });
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
