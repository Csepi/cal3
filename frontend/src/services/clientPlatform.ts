import { Capacitor } from '@capacitor/core';

export const NATIVE_CLIENT_HEADER = 'X-PrimeCal-Client';
export const NATIVE_CLIENT_VALUE = 'mobile-native';

export const isNativeClient = (): boolean => Capacitor.isNativePlatform();
