import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppTabParamList } from './types';
import { PendingOrdersScreen } from '../../modules/deliveries/screens/PendingOrdersScreen';
import { DeliveredOrdersScreen } from '../../modules/deliveries/screens/DeliveredOrdersScreen';
import { ProfileScreen } from '../../modules/auth/screens/ProfileScreen';
import { colors } from '../../theme/colors';
import { rs } from '../../theme/responsive';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: rs(62),
          paddingTop: rs(6),
        },
        tabBarLabelStyle: {
          fontSize: rs(12),
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="PendingOrders"
        component={PendingOrdersScreen}
        options={{
          title: 'Pending Orders',
          tabBarLabel: 'Pending',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" color={color} size={size ?? rs(18)} />
          ),
        }}
      />
      <Tab.Screen
        name="DeliveredOrders"
        component={DeliveredOrdersScreen}
        options={{
          title: 'Delivered Orders',
          tabBarLabel: 'Delivered',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle-outline" color={color} size={size ?? rs(18)} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={size ?? rs(18)} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
