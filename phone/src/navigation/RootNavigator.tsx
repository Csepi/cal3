import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { CreateEventScreen } from '@screens/Events/CreateEventScreen';
import type { RootStackParamList } from './types';

/**
 * Root Navigator
 * Top-level navigator that switches between Auth and Main stacks
 * based on authentication state
 *
 * Flow:
 * - Show loading screen while initializing
 * - Show Auth stack if not authenticated
 * - Show Main tabs if authenticated
 */

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack (Login, Register)
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{
              animationTypeForReplace: 'pop',
            }}
          />
        ) : (
          <>
            {/* Main App (Tabs) */}
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{
                animationTypeForReplace: 'push',
              }}
            />
            {/* Modal Screens */}
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Create Event',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
