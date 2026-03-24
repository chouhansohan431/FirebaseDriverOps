import { create } from 'zustand';
import { AppUser } from '../types/models';

type AuthState = {
  user: AppUser | null;
  phoneVerified: boolean;
  isOtpPending: boolean;
  isBootstrapping: boolean;
  setUser: (user: AppUser | null) => void;
  setPhoneVerified: (verified: boolean) => void;
  setOtpPending: (value: boolean) => void;
  setBootstrapping: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  phoneVerified: false,
  isOtpPending: false,
  isBootstrapping: true,
  setUser: user => set({ user }),
  setPhoneVerified: phoneVerified => set({ phoneVerified }),
  setOtpPending: isOtpPending => set({ isOtpPending }),
  setBootstrapping: isBootstrapping => set({ isBootstrapping }),
}));
