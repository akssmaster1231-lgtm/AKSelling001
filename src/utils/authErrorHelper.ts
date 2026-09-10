/**
 * Bulletproof Firebase Authentication Error Parsing & Domain Guidance Utility
 */

export interface ParsedAuthError {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  isPopupBlocked: boolean;
  isPopupClosed: boolean;
  isQuotaExceeded: boolean;
  hostname: string;
  suggestedAction: string;
}

export function parseFirebaseAuthError(
  err: unknown,
  context: 'google' | 'phone_send' | 'phone_verify' = 'phone_send'
): ParsedAuthError {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
  let rawMsg = '';
  let code = '';

  if (typeof err === 'object' && err !== null) {
    if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
      code = (err as { code: string }).code;
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      rawMsg = (err as { message: string }).message;
    }
  } else if (typeof err === 'string') {
    rawMsg = err;
  }

  const isUnauthorizedDomain =
    code.includes('unauthorized-domain') ||
    rawMsg.includes('unauthorized-domain') ||
    rawMsg.includes('auth/unauthorized-domain');
  const isPopupBlocked =
    code.includes('popup-blocked') ||
    rawMsg.includes('popup-blocked') ||
    rawMsg.includes('auth/popup-blocked');
  const isPopupClosed =
    code.includes('popup-closed-by-user') ||
    rawMsg.includes('popup-closed-by-user') ||
    rawMsg.includes('auth/popup-closed-by-user');
  const isQuotaExceeded =
    code.includes('quota-exceeded') ||
    rawMsg.includes('quota-exceeded') ||
    rawMsg.includes('auth/quota-exceeded');

  if (isUnauthorizedDomain) {
    return {
      code: 'auth/unauthorized-domain',
      message: `Firebase Domain Authorization Required: The current domain "${hostname}" is not authorized in Firebase Authentication.`,
      isUnauthorizedDomain: true,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: `Go to Firebase Console -> Authentication -> Settings -> Authorized domains -> Add "${hostname}". In the meantime, use Direct 1-Tap Login below.`,
    };
  }

  if (isPopupBlocked) {
    return {
      code: 'auth/popup-blocked',
      message: 'Browser blocked the Google sign-in pop-up window.',
      isUnauthorizedDomain: false,
      isPopupBlocked: true,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Please allow pop-ups for this domain or use Direct 1-Tap Sign In.',
    };
  }

  if (isPopupClosed) {
    return {
      code: 'auth/popup-closed-by-user',
      message: 'Google Sign-In pop-up was closed before completing.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: true,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Click Google Sign-In again to continue.',
    };
  }

  if (code.includes('operation-not-allowed') || rawMsg.includes('operation-not-allowed')) {
    return {
      code: 'auth/operation-not-allowed',
      message: 'This authentication provider is not enabled in Firebase Console.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Enable Google and Phone Authentication under Firebase Console -> Authentication -> Sign-in method.',
    };
  }

  if (code.includes('invalid-phone-number') || rawMsg.includes('invalid-phone-number')) {
    return {
      code: 'auth/invalid-phone-number',
      message: 'Invalid phone number format. Please enter a valid 10-digit mobile number.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Enter a valid 10-digit Indian phone number (e.g. 9893598920).',
    };
  }

  if (isQuotaExceeded) {
    return {
      code: 'auth/quota-exceeded',
      message: 'Firebase SMS daily quota limit reached for this project.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: true,
      hostname,
      suggestedAction: 'Please use Google Sign-in or Direct 1-Tap Login.',
    };
  }

  if (code.includes('too-many-requests') || rawMsg.includes('too-many-requests')) {
    return {
      code: 'auth/too-many-requests',
      message: 'Too many requests sent. Firebase temporarily slowed down requests.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Please wait a moment before trying again.',
    };
  }

  if (code.includes('invalid-verification-code') || rawMsg.includes('invalid-verification-code')) {
    return {
      code: 'auth/invalid-verification-code',
      message: 'Incorrect 6-digit OTP code entered.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Please double-check the 6-digit verification code.',
    };
  }

  if (code.includes('code-expired') || rawMsg.includes('code-expired')) {
    return {
      code: 'auth/code-expired',
      message: 'The verification code has expired.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Please click Resend OTP to get a new code.',
    };
  }

  if (
    code.includes('captcha-check-failed') ||
    rawMsg.includes('captcha-check-failed') ||
    rawMsg.includes('app-verification-failed')
  ) {
    return {
      code: 'auth/captcha-check-failed',
      message: 'reCAPTCHA verification failed or domain is not authorized.',
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isQuotaExceeded: false,
      hostname,
      suggestedAction: 'Check domain authorization in Firebase or network connection.',
    };
  }

  // Clean raw message without leaving just dots or punctuation
  let cleaned = rawMsg.replace(/Firebase:?\s*Error\s*\(auth\/[^)]+\):?\s*/gi, '').trim();
  cleaned = cleaned.replace(/^[.:\s]+|[.:\s]+$/g, '').trim();

  if (!cleaned || cleaned.length < 3) {
    cleaned =
      context === 'google'
        ? 'Google Sign-In failed. Please check your network or try direct login.'
        : context === 'phone_send'
        ? 'Could not send SMS OTP. Please check your mobile number or domain authorization.'
        : 'Invalid OTP verification code. Please re-enter the code.';
  }

  return {
    code,
    message: cleaned,
    isUnauthorizedDomain: false,
    isPopupBlocked: false,
    isPopupClosed: false,
    isQuotaExceeded: false,
    hostname,
    suggestedAction: 'Please try again or use direct login.',
  };
}
