import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../modules/auth/screens/LoginScreen';
import { SignupScreen } from '../../modules/auth/screens/SignupScreen';
import { PhoneVerificationScreen } from '../../modules/auth/screens/PhoneVerificationScreen';
import { OtpVerifyScreen } from '../../modules/auth/screens/OtpVerifyScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, headerTitleAlign: 'center' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
