import { useEffect } from 'react';
import { auth, firestore, hasFirebaseApp } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useAuthBootstrap() {
  const { setUser, setPhoneVerified, setOtpPending, setBootstrapping } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    let unsubAuth: (() => void) | undefined;

    const startBootstrap = async () => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (hasFirebaseApp()) {
          break;
        }
        await wait(250);
      }

      if (cancelled) {
        return;
      }

      try {
        unsubAuth = auth().onAuthStateChanged(async firebaseUser => {
          if (!firebaseUser) {
            if (!cancelled) {
              setUser(null);
              setPhoneVerified(false);
              setOtpPending(false);
              setBootstrapping(false);
            }
            return;
          }

          try {
            const profileSnapshot = await firestore().collection('users').doc(firebaseUser.uid).get();
            const profile = profileSnapshot.data() as { phoneVerified?: boolean; name?: string | null } | undefined;
            const phoneVerified = Boolean(profile?.phoneVerified);
            const otpAlreadyPending = useAuthStore.getState().isOtpPending;
            const shouldStayInOtpFlow = otpAlreadyPending || !phoneVerified;

            if (!cancelled) {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: profile?.name ?? null });
              setPhoneVerified(!shouldStayInOtpFlow);
              setOtpPending(shouldStayInOtpFlow);
              setBootstrapping(false);
            }
          } catch {
            if (!cancelled) {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: null });
              setPhoneVerified(false);
              setOtpPending(true);
              setBootstrapping(false);
            }
          }
        });
      } catch {
        if (!cancelled) {
          setUser(null);
          setPhoneVerified(false);
          setOtpPending(false);
          setBootstrapping(false);
        }
      }
    };

    startBootstrap().catch(() => {});

    return () => {
      cancelled = true;
      unsubAuth?.();
    };
  }, [setBootstrapping, setOtpPending, setPhoneVerified, setUser]);
}
