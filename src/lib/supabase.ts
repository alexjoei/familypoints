import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { createClient, processLock } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = !!url && !!key;
// Chunks keep native session values below SecureStore's per-value size limit.
const nativeStorage = {
  async getItem(key: string) {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    const { version, count } = JSON.parse(raw) as { version: string; count: number };
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${version}.${i}`)),
    );
    return chunks.every((c) => c !== null) ? chunks.join('') : null;
  },
  async setItem(key: string, value: string) {
    const old = await SecureStore.getItemAsync(key),
      version = Crypto.randomUUID();
    const chunks = value.match(/[\s\S]{1,400}/gu) ?? [''];
    await Promise.all(
      chunks.map((part, i) => SecureStore.setItemAsync(`${key}.${version}.${i}`, part)),
    );
    await SecureStore.setItemAsync(key, JSON.stringify({ version, count: chunks.length }));
    if (old) {
      const previous = JSON.parse(old);
      await Promise.all(
        Array.from({ length: previous.count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}.${previous.version}.${i}`),
        ),
      );
    }
  },
  async removeItem(key: string) {
    const old = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    if (old) {
      const previous = JSON.parse(old);
      await Promise.all(
        Array.from({ length: previous.count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}.${previous.version}.${i}`),
        ),
      );
    }
  },
};
export const supabase = configured
  ? createClient(url!, key!, {
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: nativeStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
        lock: processLock,
      },
    })
  : null;
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
WebBrowser.maybeCompleteAuthSession();
export const authRedirect = () =>
  makeRedirectUri({ scheme: 'familypoints', path: 'auth/callback' });
export async function googleLogin() {
  if (!supabase) throw new Error('not_configured');
  const redirectTo = authRedirect();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      scopes: 'openid email profile',
    },
  });
  if (error) throw error;
  if (Platform.OS !== 'web' && data.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') await finishNativeAuth(result.url);
  }
}
let lastCode: string | undefined;
export async function finishNativeAuth(url: string) {
  if (!supabase || Platform.OS === 'web') return;
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'familypoints:' ||
    parsed.hostname !== 'auth' ||
    parsed.pathname !== '/callback'
  )
    return;
  if (parsed.searchParams.get('error')) throw new Error('auth_failed');
  const code = parsed.searchParams.get('code');
  if (code && code !== lastCode) {
    lastCode = code;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      lastCode = undefined;
      throw error;
    }
  }
}
