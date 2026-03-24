export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PhoneVerification: { phoneNumber?: string; name?: string; email?: string } | undefined;
  OtpVerify: { verificationId: string; phoneNumber: string; name?: string; email?: string };
};

export type AppStackParamList = {
  MainTabs: undefined;
  OptimizedRoute: undefined;
};

export type AppTabParamList = {
  PendingOrders: undefined;
  DeliveredOrders: undefined;
  Profile: undefined;
};
