import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type RecaptchaVerifier,
} from 'firebase/auth';
import {
  auth,
  saveUserProfileToFirestore,
  subscribeUserProfile,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
} from '@/firebase';
import { parseFirebaseAuthError, type ParsedAuthError } from '@/utils/authErrorHelper';
import { initializeUserWallet } from '@/utils/walletService';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  language: string;
  notificationEnabled: boolean;
  addresses: AddressEntry[];
  savedCards: CardEntry[];
  devices: DeviceEntry[];
  walletBalance?: number;
  totalCashbackEarned?: number;
  signupBonusClaimed?: boolean;
  successfulOrdersCount?: number;
  milestoneBonusClaimed?: boolean;
}

export interface AddressEntry {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export interface CardEntry {
  id: string;
  type: string;
  last4: string;
  holderName: string;
}

export interface DeviceEntry {
  id: string;
  name: string;
  lastActive: string;
}

interface AuthContextType {
  user: UserProfile | null;
  authInitialized: boolean;
  isAuthenticating: boolean;
  sendPhoneOTP: (phone: string, appVerifier: RecaptchaVerifier) => Promise<{ error: string | null; confirmationResult?: ConfirmationResult; parsedError?: ParsedAuthError }>;
  confirmPhoneOTP: (confirmationResult: ConfirmationResult, otpCode: string, phone: string, name?: string) => Promise<{ error: string | null; user?: UserProfile; parsedError?: ParsedAuthError }>;
  signInWithGoogle: (useRedirect?: boolean) => Promise<{ error: string | null; parsedError?: ParsedAuthError; user?: UserProfile }>;
  signInWithDirectCredentials: (name: string, phone: string, email?: string) => Promise<{ error: string | null; user?: UserProfile }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<AddressEntry, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  addCard: (card: Omit<CardEntry, 'id'>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
}

const defaultProfileTemplate: UserProfile = {
  id: 'guest',
  name: 'User',
  phone: '',
  email: '',
  avatar: '',
  language: 'English',
  notificationEnabled: true,
  addresses: [],
  savedCards: [],
  devices: [
    { id: 'd1', name: 'Web Browser', lastActive: 'Active now' },
  ],
  walletBalance: 20,
  totalCashbackEarned: 20,
  signupBonusClaimed: true,
  successfulOrdersCount: 0,
  milestoneBonusClaimed: false,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const saveLocalUser = (profile: UserProfile | null) => {
    try {
      if (profile) {
        localStorage.setItem('akselling_user_profile', JSON.stringify(profile));
      } else {
        localStorage.removeItem('akselling_user_profile');
      }
    } catch {
      // ignore
    }
  };

  // Sync with Firebase Auth state on startup & check redirect result
  useEffect(() => {
    let isMounted = true;

    // Restore any locally saved user session immediately (so reloads don't blank-screen)
    try {
      const stored = localStorage.getItem('akselling_user_profile');
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        if (parsed && parsed.id && parsed.id !== 'guest') {
          setUser(parsed);
          setAuthInitialized(true);
        }
      }
    } catch {
      // ignore
    }

    // Check for Google redirect result (crucial for mobile browser compatibility)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user && isMounted) {
          const fbUser = result.user;
          const realProfile: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
            email: fbUser.email || '',
            phone: fbUser.phoneNumber || '',
            avatar: fbUser.photoURL || '',
            language: 'English',
            notificationEnabled: true,
            addresses: [],
            savedCards: [],
            devices: [
              {
                id: 'd_' + Date.now(),
                name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Browser',
                lastActive: 'Active now',
              },
            ],
          };
          setUser(realProfile);
          saveLocalUser(realProfile);
          await saveUserProfileToFirestore(realProfile);
        }
      })
      .catch((err) => {
        console.warn('Google redirect result check notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;

      if (fbUser) {
        // Genuine logged in Firebase user
        const existingStored = localStorage.getItem('akselling_user_profile');
        const prev: UserProfile | null = existingStored ? JSON.parse(existingStored) : null;

        const resolvedProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || prev?.name || fbUser.email?.split('@')[0] || (fbUser.phoneNumber ? `User ${fbUser.phoneNumber.slice(-4)}` : 'AKSelling User'),
          phone: fbUser.phoneNumber || prev?.phone || '',
          email: fbUser.email || prev?.email || '',
          avatar: fbUser.photoURL || prev?.avatar || '',
          language: prev?.language || 'English',
          notificationEnabled: prev?.notificationEnabled ?? true,
          addresses: prev?.addresses || [],
          savedCards: prev?.savedCards || [],
          devices: prev?.devices || [
            { id: 'd1', name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser', lastActive: 'Active now' }
          ],
        };

        setUser(resolvedProfile);
        saveLocalUser(resolvedProfile);

        // Initialize Firestore wallet with guaranteed ₹20 signup bonus
        initializeUserWallet(resolvedProfile.id, {
          name: resolvedProfile.name,
          phone: resolvedProfile.phone,
          email: resolvedProfile.email,
        }).catch((wErr) => console.warn('Wallet init notice:', wErr));
      } else {
        // Only clear if not in an active custom session
        try {
          const stored = localStorage.getItem('akselling_user_profile');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id && parsed.id.startsWith('usr_')) {
              // Keep persistent custom session intact
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
        saveLocalUser(null);
      }
      setAuthInitialized(true);
    });

    // Safety timeout: if Firebase Auth never responds within 3 seconds,
    // force-initialize so the app doesn't stay on a blank white loading screen forever.
    const safetyTimer = setTimeout(() => {
      if (isMounted && !authInitialized) {
        setAuthInitialized(true);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Firestore user profile sync for active user
  useEffect(() => {
    const activeId = user?.id || user?.phone || user?.email;
    if (!activeId || activeId === 'guest') return;

    const unsubscribe = subscribeUserProfile(activeId, (remoteProfile) => {
      if (remoteProfile) {
        setUser((prev) => {
          if (!prev) return remoteProfile;
          const merged = { ...prev, ...remoteProfile };
          saveLocalUser(merged);
          return merged;
        });
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.phone, user?.email]);

  // Firebase Phone Auth: Send OTP
  const sendPhoneOTP = useCallback(async (phone: string, appVerifier: RecaptchaVerifier) => {
    setIsAuthenticating(true);
    try {
      const confirmationResult = await sendFirebasePhoneOtp(phone, appVerifier);
      setIsAuthenticating(false);
      return {
        error: null,
        confirmationResult,
      };
    } catch (err: unknown) {
      setIsAuthenticating(false);
      console.warn('Firebase Phone Auth send error:', err);
      const parsed = parseFirebaseAuthError(err, 'phone_send');
      return {
        error: parsed.message,
        parsedError: parsed,
      };
    }
  }, []);

  // Firebase Phone Auth: Confirm OTP and complete Sign-In
  const confirmPhoneOTP = useCallback(async (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    phone: string,
    name?: string
  ) => {
    setIsAuthenticating(true);
    try {
      const userCredential = await verifyFirebasePhoneOtp(confirmationResult, otpCode);
      const fbUser = userCredential.user;

      const profile: UserProfile = {
        ...defaultProfileTemplate,
        id: fbUser.uid || 'usr_ph_' + phone.replace(/\D/g, ''),
        name: name || fbUser.displayName || 'Customer',
        phone: fbUser.phoneNumber || phone,
        email: fbUser.email || '',
      };

      // Real-time Cloud Firestore persistence
      try {
        await saveUserProfileToFirestore(profile);
      } catch (fErr) {
        console.warn('Firestore profile sync:', fErr);
      }
      setUser(profile);
      saveLocalUser(profile);
      initializeUserWallet(profile.id, { name: profile.name, phone: profile.phone, email: profile.email }).catch(() => {});
      setIsAuthenticating(false);
      return { error: null, user: profile };
    } catch (err: unknown) {
      setIsAuthenticating(false);
      console.warn('Firebase Phone Auth verify OTP error:', err);
      const parsed = parseFirebaseAuthError(err, 'phone_verify');
      return { error: parsed.message, parsedError: parsed };
    }
  }, []);

  // Real Google Sign-In using Firebase Authentication Popup or Redirect
  const signInWithGoogle = useCallback(async (useRedirect = false) => {
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return { error: null };
      }

      const result = await signInWithPopup(auth, provider);
      const fbUser = result?.user;

      if (!fbUser) {
        throw new Error('No user returned from Google popup');
      }

      // Fetch real dynamic Google credentials
      const realGoogleProfile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        avatar: fbUser.photoURL || '',
        language: 'English',
        notificationEnabled: true,
        addresses: [],
        savedCards: [],
        devices: [
          {
            id: 'd_' + Date.now(),
            name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Browser',
            lastActive: 'Active now',
          },
        ],
      };

      // Save real user account to Cloud Firestore
      await saveUserProfileToFirestore(realGoogleProfile);
      setUser(realGoogleProfile);
      saveLocalUser(realGoogleProfile);
      initializeUserWallet(realGoogleProfile.id, { name: realGoogleProfile.name, phone: realGoogleProfile.phone, email: realGoogleProfile.email }).catch(() => {});
      setIsAuthenticating(false);
      return { error: null, user: realGoogleProfile };
    } catch (err: unknown) {
      setIsAuthenticating(false);
      console.warn('Google Sign-In error:', err);
      const parsed = parseFirebaseAuthError(err, 'google');
      return { error: parsed.message, parsedError: parsed };
    }
  }, []);

  // Direct Credentials Sign-In (Ensures user can always log in even if authorized domain or SMS quota is blocked)
  const signInWithDirectCredentials = useCallback(async (
    name: string,
    phone: string,
    email?: string
  ) => {
    setIsAuthenticating(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const fullPhone = cleanPhone ? `+91 ${cleanPhone}` : '';
      const resolvedName = name.trim() || 'Anoj Kumar Yadav';
      const userUid = 'usr_' + (cleanPhone || Date.now().toString());

      const profile: UserProfile = {
        id: userUid,
        name: resolvedName,
        phone: fullPhone,
        email: email || `${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@akselling.com`,
        avatar: '',
        language: 'English',
        notificationEnabled: true,
        addresses: [],
        savedCards: [],
        devices: [
          {
            id: 'd_' + Date.now(),
            name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
            lastActive: 'Active now',
          },
        ],
      };

      await saveUserProfileToFirestore(profile);
      setUser(profile);
      saveLocalUser(profile);
      initializeUserWallet(profile.id, { name: profile.name, phone: profile.phone, email: profile.email }).catch(() => {});
      setIsAuthenticating(false);
      return { error: null, user: profile };
    } catch (err) {
      console.warn('Direct credentials login notice:', err);
      setIsAuthenticating(false);
      return { error: 'Failed to create user session. Please retry.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign-out notice:', e);
    }
    setUser(null);
    saveLocalUser(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    const guestUser: UserProfile = {
      id: 'guest_' + Date.now(),
      name: 'AKSelling Guest',
      phone: '',
      email: '',
      avatar: '',
      language: 'English',
      notificationEnabled: true,
      addresses: [],
      savedCards: [],
      devices: [
        { id: 'd1', name: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Browser', lastActive: 'Active now' }
      ],
    };
    setUser(guestUser);
    saveLocalUser(guestUser);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const updated = { ...base, ...updates };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  const addAddress = useCallback(async (address: Omit<AddressEntry, 'id'>) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const newAddr = { ...address, id: 'addr_' + Date.now() };
      const updated = { ...base, addresses: [...base.addresses, newAddr] };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const updated = { ...base, addresses: base.addresses.filter(a => a.id !== id) };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  const addCard = useCallback(async (card: Omit<CardEntry, 'id'>) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const newCard = { ...card, id: 'card_' + Date.now() };
      const updated = { ...base, savedCards: [...base.savedCards, newCard] };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  const removeCard = useCallback(async (id: string) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const updated = { ...base, savedCards: base.savedCards.filter(c => c.id !== id) };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  const removeDevice = useCallback(async (id: string) => {
    setUser(prev => {
      const base = prev || defaultProfileTemplate;
      const updated = { ...base, devices: base.devices.filter(d => d.id !== id) };
      saveLocalUser(updated);
      saveUserProfileToFirestore(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authInitialized,
        isAuthenticating,
        sendPhoneOTP,
        confirmPhoneOTP,
        signInWithGoogle,
        signInWithDirectCredentials,
        signOut,
        continueAsGuest,
        updateProfile,
        addAddress,
        removeAddress,
        addCard,
        removeCard,
        removeDevice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
