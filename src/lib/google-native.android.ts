import {
  GoogleOneTapSignIn,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from 'react-native-nitro-google-signin';

// OAuth client IDs are public identifiers. The Android client is registered
// separately with the app package and signing certificate in Google Cloud.
const webClientId = '31631729751-c33sklo13s9o6qhi1f3jeid7gi6217hg.apps.googleusercontent.com';

export async function getNativeGoogleIdToken(hashedNonce: string): Promise<string | null> {
  GoogleOneTapSignIn.configure({ webClientId, nonce: hashedNonce, autoSelectOnSignIn: false });
  await GoogleOneTapSignIn.checkPlayServices();
  let response = await GoogleOneTapSignIn.signIn();
  if (isNoSavedCredentialFoundResponse(response)) response = await GoogleOneTapSignIn.createAccount();
  if (isNoSavedCredentialFoundResponse(response))
    response = await GoogleOneTapSignIn.presentExplicitSignIn();
  return isSuccessResponse(response) ? response.data.idToken : null;
}
