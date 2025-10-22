import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens/Auth/LoginScreen';
import { RegisterScreen } from '@screens/Auth/RegisterScreen';
import type { AuthStackParamList } from './types';

/**
 * Auth Stack Navigator
 * Handles authentication flow (Login → Register)
 */

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Register',
        }}
      />
    </Stack.Navigator>
  );
};
