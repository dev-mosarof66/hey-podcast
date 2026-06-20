import * as SecureStore from 'expo-secure-store';

const KEY = 'auth_token';

// Kept in memory so RTK Query's prepareHeaders can read it synchronously.
let current: string | null = null;

export function getToken(): string | null {
  return current;
}

/** Load the persisted token into memory (call once on app start). */
export async function loadToken(): Promise<string | null> {
  current = await SecureStore.getItemAsync(KEY);
  return current;
}

export async function setToken(token: string): Promise<void> {
  current = token;
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  current = null;
  await SecureStore.deleteItemAsync(KEY);
}
