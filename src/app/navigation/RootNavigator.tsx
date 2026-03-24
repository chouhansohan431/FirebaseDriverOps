import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { useAuthStore } from '../../store/authStore';
import { createNavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function RootNavigator() {
  const { user, phoneVerified, isOtpPending, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user && phoneVerified && !isOtpPending ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
