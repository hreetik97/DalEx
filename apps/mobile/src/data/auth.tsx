// Firebase Auth state + Google/Apple sign-in (apps/mobile/src/data/auth.tsx).
// v26 modular API. Native-only sign-in methods are dynamically imported so the
// web bundle never executes them. Screens consume useAuth(); they never touch
// Firebase Auth directly.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { hasConsented } from './consent';
import { setMessagingUid, unregisterDeviceToken } from './messaging';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** True once the DPDP account notice has been agreed to (consentLog). */
  consentComplete: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshConsent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  consentComplete: false,
  signInGoogle: async () => {},
  signInApple: async () => {},
  signOut: async () => {},
  refreshConsent: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

type NativeUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function toAuthUser(u: NativeUser): AuthUser {
  return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL };
}

/** Create users/{uid} on first sign-in. Profile + defaults only; consentLog starts empty. */
async function ensureUserDoc(u: NativeUser): Promise<void> {
  const ref = doc(getFirestore(), 'users', u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: u.displayName,
      email: u.email,
      photoURL: u.photoURL,
      createdAt: serverTimestamp(),
      timezone: 'Asia/Kolkata',
      notifPrefs: { eveningDigest: true, digestTime: '21:00', morningNudge: false },
      consentLog: [],
    });
  }
}

let googleConfigured = false;
async function ensureGoogleConfigured(): Promise<void> {
  if (googleConfigured || Platform.OS === 'web') return;
  const { GoogleOneTapSignIn } = await import('react-native-nitro-google-signin');
  GoogleOneTapSignIn.configure({ webClientId: 'autoDetect' });
  googleConfigured = true;
}

async function buildAppleNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [consentComplete, setConsentComplete] = useState(false);
  const userRef = useRef<AuthUser | null>(null);

  const refreshConsent = useCallback(async () => {
    const u = userRef.current;
    if (!u) {
      setConsentComplete(false);
      return;
    }
    setConsentComplete(await hasConsented(u.uid).catch(() => false));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (fbUser) => {
      if (fbUser) {
        const u = toAuthUser(fbUser as unknown as NativeUser);
        userRef.current = u;
        setUser(u);
        setMessagingUid(u.uid);
        try {
          await ensureUserDoc(fbUser as unknown as NativeUser);
          setConsentComplete(await hasConsented(u.uid));
        } catch {
          setConsentComplete(false);
        }
      } else {
        userRef.current = null;
        setUser(null);
        setMessagingUid(null);
        setConsentComplete(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInGoogle = useCallback(async () => {
    if (Platform.OS === 'web') throw new Error('Google sign-in is not available on web.');
    await ensureGoogleConfigured();
    const {
      GoogleOneTapSignIn,
      isNoSavedCredentialFoundResponse,
      isSuccessResponse,
    } = await import('react-native-nitro-google-signin');
    if (Platform.OS === 'android') {
      await GoogleOneTapSignIn.checkPlayServices();
    }
    let response = await GoogleOneTapSignIn.signIn();
    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.createAccount();
    }
    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.presentExplicitSignIn();
    }
    if (!isSuccessResponse(response)) {
      throw new Error('Google sign-in was cancelled or failed.');
    }
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error('Google sign-in returned no ID token.');
    await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
  }, []);

  const signInApple = useCallback(async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is only available on iOS.');
    const AppleAuthentication = await import('expo-apple-authentication');
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) throw new Error('Apple Sign-In is not available on this device.');
    const { raw, hashed } = await buildAppleNonce();
    const appleCred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    if (!appleCred.identityToken) {
      throw new Error('Apple sign-in returned no identity token.');
    }
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: appleCred.identityToken,
      rawNonce: raw,
    });
    const result = await signInWithCredential(getAuth(), credential);
    // Capture the user's name on first sign-in (Apple only sends it once).
    const given = appleCred.fullName?.givenName;
    const family = appleCred.fullName?.familyName;
    if ((given || family) && !result.user.displayName) {
      const name = [given, family].filter(Boolean).join(' ');
      const ref = doc(getFirestore(), 'users', result.user.uid);
      await setDoc(ref, { displayName: name }, { merge: true }).catch(() => {});
    }
  }, []);

  const signOut = useCallback(async () => {
    const u = userRef.current;
    if (u) {
      await unregisterDeviceToken(u.uid).catch(() => {});
    }
    if (Platform.OS !== 'web') {
      try {
        const { GoogleOneTapSignIn } = await import('react-native-nitro-google-signin');
        await GoogleOneTapSignIn.signOut();
      } catch {
        // Not a Google session (or module unavailable) — continue with Firebase sign-out.
      }
    }
    await firebaseSignOut(getAuth());
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, consentComplete, signInGoogle, signInApple, signOut, refreshConsent }}
    >
      {children}
    </AuthContext.Provider>
  );
}
