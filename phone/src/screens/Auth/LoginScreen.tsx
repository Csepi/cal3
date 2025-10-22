import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '@hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Login Screen
 * Allows users to authenticate with username/password
 *
 * Features:
 * - Material Design 3 UI
 * - Form validation
 * - Error handling
 * - Loading states
 * - Navigation to Register screen
 */

type Props = NativeStackScreenProps<any, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { login, isLoading, error, clearError } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation state
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setUsernameError('');
    setPasswordError('');
    clearError();

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle login submission
   */
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({ username: username.trim(), password });
      // Navigation will be handled automatically by auth state change
    } catch (err) {
      // Error is handled in the store and displayed below
      console.error('Login error:', err);
    }
  };

  /**
   * Navigate to Register screen
   */
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              📅
            </Text>
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Cal3 Mobile
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Calendar & Reservation Management
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Username Input */}
          <TextInput
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameError('');
              clearError();
            }}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!usernameError}
            disabled={isLoading}
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
          />
          <HelperText type="error" visible={!!usernameError}>
            {usernameError}
          </HelperText>

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              clearError();
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            error={!!passwordError}
            disabled={isLoading}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>

          {/* API Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={handleRegister}
              disabled={isLoading}
              compact
            >
              Register
            </Button>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Version 0.1.0
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
});
