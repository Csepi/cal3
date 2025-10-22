/**
 * Cal3 Mobile App
 * Main application entry point
 *
 * Features:
 * - React Native Paper (Material Design 3)
 * - React Navigation
 * - TanStack Query for server state
 * - Zustand for global state
 * - JWT authentication
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@config/react-query';
import { RootNavigator } from '@navigation/RootNavigator';
import { theme } from '@constants/theme';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.background}
          />
          <RootNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

export default App;
