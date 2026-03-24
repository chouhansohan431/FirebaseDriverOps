import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth, firestore } from './firebase';

const TEST_PHONE_NUMBER = '+911234567890';
const DUMMY_OTP = '123456';

async function upsertUserProfile(
  uid: string,
  email: string | null,
  phoneVerified: boolean,
  phoneNumber: string = TEST_PHONE_NUMBER,
  name: string | null = null,
) {
  await firestore().collection('users').doc(uid).set(
    {
      uid,
      email,
      name,
      phoneNumber,
      phoneVerified,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      ...(phoneVerified ? {} : { createdAt: firestore.FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
}

async function ensureUserProfileOnLogin(uid: string, email: string | null) {
  const docRef = firestore().collection('users').doc(uid);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    await upsertUserProfile(uid, email, false);
    return;
  }

  await docRef.set(
    {
      email,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]);
}

export const authService = {
  signInWithEmail: (email: string, password: string) =>
    auth().signInWithEmailAndPassword(email.trim(), password),

  signInWithEmailPassword: async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    const credential = await withTimeout(
      auth().signInWithEmailAndPassword(normalizedEmail, password),
      20000,
      'Login timed out. Please try again.',
    );
    withTimeout(
      ensureUserProfileOnLogin(credential.user.uid, credential.user.email ?? normalizedEmail),
      8000,
      'Profile sync timed out.',
    ).catch(() => {});
    return credential;
  },

  signUpWithEmailPassword: async (name: string, email: string, password: string, phoneNumber: string) => {
    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    const normalizedPhone = phoneNumber.trim();

    const credential = await withTimeout(
      auth().createUserWithEmailAndPassword(normalizedEmail, password),
      60000,
      'Account creation timed out. Please try again.',
    );

    withTimeout(
      upsertUserProfile(
        credential.user.uid,
        credential.user.email ?? normalizedEmail,
        false,
        normalizedPhone ? `+91${normalizedPhone}` : TEST_PHONE_NUMBER,
        normalizedName || null,
      ),
      15000,
      'Profile setup timed out. Please try again.',
    ).catch(() => {});

    return credential;
  },

  getUserProfile: async (uid: string): Promise<{ phoneVerified: boolean; phoneNumber: string | null; name: string | null }> => {
    const snapshot = await firestore().collection('users').doc(uid).get();
    const data = snapshot.data() as { phoneVerified?: boolean; phoneNumber?: string; name?: string } | undefined;
    return {
      phoneVerified: Boolean(data?.phoneVerified),
      phoneNumber: data?.phoneNumber ?? null,
      name: data?.name ?? null,
    };
  },

  sendDummyOtp: async (phoneNumber: string): Promise<{ verificationId: string }> => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      throw new Error('Phone number must be exactly 10 digits.');
    }

    await new Promise<void>(resolve => setTimeout(() => resolve(), 400));
    return { verificationId: 'dummy-verification-id' };
  },

  verifyDummyOtp: async (phoneNumber: string, code: string): Promise<void> => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      throw new Error('Phone number must be exactly 10 digits.');
    }
    if (code !== DUMMY_OTP) {
      throw new Error('Invalid OTP. Use 123456.');
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const formattedPhone = `+91${phoneNumber}`;
    upsertUserProfile(currentUser.uid, currentUser.email ?? null, true, formattedPhone).catch(() => {});
  },

  sendOtp: async (phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    if (__DEV__) {
      auth().settings.appVerificationDisabledForTesting = true;
    }

    return withTimeout(
      auth().signInWithPhoneNumber(phoneNumber),
      30000,
      'OTP request timed out. Please retry.',
    );
  },

  verifyOtp: async (
    verificationId: string,
    code: string,
    profile?: { phoneNumber?: string; name?: string | null },
  ) => {
    const credential = auth.PhoneAuthProvider.credential(verificationId, code);
    const currentUser = auth().currentUser;

    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    await withTimeout(
      currentUser.linkWithCredential(credential),
      20000,
      'OTP verification timed out. Please retry.',
    )
      .catch(async (error: any) => {
        if (error?.code === 'auth/provider-already-linked') {
          return;
        }

        if (error?.code === 'auth/credential-already-in-use') {
          await withTimeout(
            auth().signInWithCredential(credential),
            20000,
            'OTP verification timed out. Please retry.',
          );
          return;
        }

        throw error;
      });

    const userAfterVerification = auth().currentUser;
    if (!userAfterVerification) {
      throw new Error('Verification succeeded but no authenticated user was found.');
    }

    const normalizedPhone = profile?.phoneNumber?.trim();
    const e164Phone = normalizedPhone
      ? normalizedPhone.startsWith('+')
        ? normalizedPhone
        : `+91${normalizedPhone}`
      : TEST_PHONE_NUMBER;

    upsertUserProfile(
      userAfterVerification.uid,
      userAfterVerification.email ?? null,
      true,
      e164Phone,
      profile?.name ?? null,
    ).catch(() => {});
  },

  signOut: () => auth().signOut(),
};
