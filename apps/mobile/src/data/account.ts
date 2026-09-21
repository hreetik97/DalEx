// Account deletion (apps/mobile/src/data/account.ts).
// Calls the deleteAccount onCall Cloud Function (region asia-south1),
// which wipes users/{uid}/** and then the Auth user. Screens use this
// helper; they never import @react-native-firebase/functions directly.
import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';

type FunctionsModule = typeof import('@react-native-firebase/functions');

/**
 * Invoke the deleteAccount callable. Throws on failure; on success the
 * caller's Auth session is dead server-side — sign out locally afterwards.
 */
export async function callDeleteAccount(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Account deletion is only available in the mobile app.');
  }
  let fns: FunctionsModule;
  try {
    fns = await import('@react-native-firebase/functions');
  } catch {
    throw new Error('Cloud Functions module is unavailable in this build.');
  }
  const functions = fns.getFunctions(getApp(), 'asia-south1');
  const callable = fns.httpsCallable(functions, 'deleteAccount');
  await callable({});
}
