import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OptimizedRouteScreen } from '../../modules/deliveries/screens/OptimizedRouteScreen';
import { AppStackParamList } from './types';
import { AppTabs } from './AppTabs';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, headerTitleAlign: 'center' }}>
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="OptimizedRoute" component={OptimizedRouteScreen} />
    </Stack.Navigator>
  );
}
