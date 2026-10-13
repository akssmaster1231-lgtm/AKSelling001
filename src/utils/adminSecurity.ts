import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { ADMIN_MASTER_PASSCODE } from './sellerWhitelist';

const LOCAL_ADMIN_PASSWORD_KEY = 'akselling_admin_custom_password';
const SESSION_UNLOCKED_KEY = 'akselling_admin_session_unlocked';
const DEFAULT_FALLBACK_PASSCODES = ['7290'];

/**
 * Checks if a custom password has been explicitly configured by the admin
 */
export function isCustomPasswordSet(): boolean {
  try {
    const custom = localStorage.getItem(LOCAL_ADMIN_PASSWORD_KEY);
    return Boolean(custom && custom.trim());
  } catch {
    return false;
  }
}

/**
 * Retrieves the currently configured Admin Panel password
 */
export function getStoredAdminPassword(): string {
  try {
    const custom = localStorage.getItem(LOCAL_ADMIN_PASSWORD_KEY);
    if (custom && custom.trim()) {
      return custom.trim();
    }
  } catch {
    // fallback
  }
  return ADMIN_MASTER_PASSCODE; // Default locked master password: @@AKSS1#aKSS$$$
}

/**
 * Checks if the Admin Panel is currently unlocked in this browser session
 */
export function isAdminSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets session unlocked state
 */
export function setAdminSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    } else {
      sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
      sessionStorage.removeItem('akselling_admin_unlocked');
    }
  } catch {
    // fallback
  }
}

/**
 * Locks the Admin Panel immediately (requires entering password again)
 */
export function lockAdminPanelSession(): void {
  try {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    sessionStorage.removeItem('akselling_admin_unlocked');
    localStorage.removeItem('akselling_admin_unlocked');
  } catch {
    // fallback
  }
}

// Ensure session is strictly locked on browser start / fresh load
if (typeof window !== 'undefined') {
  try {
    sessionStorage.removeItem('akselling_admin_unlocked');
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    localStorage.removeItem('akselling_admin_unlocked');
  } catch {
    // ignore
  }
}

/**
 * Verifies if entered password matches either:
 * 1. The custom user-defined admin password
 * 2. The master passcode (@@AKSS1#aKSS$$$)
 * 3. Default fallback passcodes (1234, admin, 7290)
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  const cleanInput = (inputPassword || '').trim();
  if (!cleanInput) return false;

  const currentCustom = getStoredAdminPassword();
  if (cleanInput === currentCustom) return true;

  // Master passcode
  if (cleanInput === ADMIN_MASTER_PASSCODE) return true;

  // Standard owner aliases
  if (DEFAULT_FALLBACK_PASSCODES.includes(cleanInput.toLowerCase()) || DEFAULT_FALLBACK_PASSCODES.includes(cleanInput)) {
    return true;
  }

  return false;
}

/**
 * Saves a new custom password for the Admin Panel in localStorage and Firestore
 */
export async function saveAdminCustomPassword(newPassword: string): Promise<boolean> {
  const clean = (newPassword || '').trim();
  if (!clean || clean.length < 3) {
    throw new Error('Password must be at least 3 characters long.');
  }

  try {
    localStorage.setItem(LOCAL_ADMIN_PASSWORD_KEY, clean);

    if (isFirebaseConfigured) {
      const secDocRef = doc(db, 'settings', 'admin_security');
      await setDoc(
        secDocRef,
        {
          adminPassword: clean,
          updatedAt: new Date().toISOString(),
          updatedBy: 'anojkumaryadav7290@gmail.com',
        },
        { merge: true }
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akselling_admin_password_updated', { detail: { password: clean } }));
    }

    return true;
  } catch (err) {
    console.warn('saveAdminCustomPassword error:', err);
    // Still saved to localStorage
    return true;
  }
}

/**
 * Subscribes to real-time Admin Password updates from Firestore
 */
export function subscribeAdminSecurityPassword(callback: (pwd: string) => void): () => void {
  if (!isFirebaseConfigured) {
    callback(getStoredAdminPassword());
    return () => {};
  }

  try {
    const secDocRef = doc(db, 'settings', 'admin_security');
    return onSnapshot(
      secDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.adminPassword === 'string' && data.adminPassword.trim()) {
            const pwd = data.adminPassword.trim();
            localStorage.setItem(LOCAL_ADMIN_PASSWORD_KEY, pwd);
            callback(pwd);
            return;
          }
        }
        callback(getStoredAdminPassword());
      },
      () => {
        callback(getStoredAdminPassword());
      }
    );
  } catch {
    callback(getStoredAdminPassword());
    return () => {};
  }
}
