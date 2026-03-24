type FirebaseError = {
  code?: string;
  message?: string;
};

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

const MESSAGE_MAP: Record<string, string> = {
  'auth/configuration-not-found':
    'Firebase Authentication is not configured yet. Enable Email/Password and Phone in Firebase Console, then download and replace google-services.json.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-login-credentials': 'Invalid email or password.',
  'auth/user-not-found': 'No account found for this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/invalid-phone-number': 'Phone number format is invalid. Use E.164 format like +15551234567.',
  'auth/invalid-verification-code': 'The OTP code is invalid.',
  'auth/code-expired': 'The OTP code has expired. Request a new one.',
  'auth/email-already-in-use': 'This email is already registered. Try logging in again.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/billing-not-enabled':
    'Phone authentication requires billing. Enable Blaze plan in Firebase/Google Cloud and retry OTP.',
  'auth/missing-phone-number': 'Please enter a valid phone number in E.164 format, like +911234567890.',
  'auth/credential-already-in-use':
    'This phone number is already linked with another account. For testing, use a different test number or continue with the same account.',
};

export function getAuthErrorMessage(error: unknown): string {
  const e = error as FirebaseError;
  if (!e?.code) {
    if (e?.message === 'OTP request timed out. Please retry.') {
      return 'OTP request timed out. On test mode, verify test phone number/code in Firebase Console and try again.';
    }
    if (e?.message === 'OTP verification timed out. Please retry.') {
      return 'OTP verification timed out. Please retry once; if it repeats, resend OTP and verify again.';
    }
    return e?.message || DEFAULT_ERROR;
  }

  return MESSAGE_MAP[e.code] ?? e.message ?? DEFAULT_ERROR;
}
