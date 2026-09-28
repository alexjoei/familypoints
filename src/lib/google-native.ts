// Resolved only on non-Android platforms. Their existing OAuth flow remains in use.
export async function getNativeGoogleIdToken(_hashedNonce: string): Promise<string | null> {
  throw new Error('native_google_android_only');
}
