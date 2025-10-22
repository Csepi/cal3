import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CalendarScreen } from '@screens/Calendar/CalendarScreen';
import { EventsScreen } from '@screens/Events/EventsScreen';
import { ProfileScreen } from '@screens/Profile/ProfileScreen';
import type { MainTabParamList } from './types';

/**
 * Main Tab Navigator
 * Bottom tabs for authenticated users
 *
 * Tabs:
 * - Calendar: Monthly/weekly calendar view
 * - Events: Upcoming events list
 * - Profile: User profile and settings
 *
 * Note: Automation and Reservations will be added in Phase 4
 */

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
