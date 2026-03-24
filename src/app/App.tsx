import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export function AppRoot() {
  useAuthBootstrap();

  useEffect(() => {
    notificationService.bootstrap().catch(() => {
      
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
