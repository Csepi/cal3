/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/**
 * Auth Stack Navigator
 * Handles authentication flow (Login, Register)
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

/**
 * Main Tab Navigator
 * Bottom tabs for main app features
 */
export type MainTabParamList = {
  Calendar: undefined;
  Events: undefined;
  Automation: undefined;
  Reservations: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

/**
 * Root Stack Navigator
 * Top-level navigator that switches between Auth and Main
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  // Modal screens
  EventDetail: { eventId: number };
  CreateEvent: undefined;
  EditEvent: { eventId: number };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Helper type for screens that need both stack and tab props
 */
export type CompositeProps<
  T extends keyof MainTabParamList,
  U extends keyof RootStackParamList = never
> = CompositeScreenProps<
  MainTabScreenProps<T>,
  RootStackScreenProps<U>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
