import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
 * Register Screen
 * Allows new users to create an account
 *
 * Features:
 * - Material Design 3 UI
 * - Form validation
 * - Email validation
 * - Password confirmation
 * - Error handling
 * - Loading states
 */

type Props = NativeStackScreenProps<any, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { register, isLoading, error, clearError } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation state
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (username.length > 20) {
      setUsernameError('Username must be at most 20 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else if (password.length > 50) {
      setPasswordError('Password must be at most 50 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle registration submission
   */
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      // Navigation will be handled automatically by auth state change
    } catch (err) {
      // Error is handled in the store and displayed below
      console.error('Registration error:', err);
    }
  };

  /**
   * Navigate back to Login screen
   */
  const handleBackToLogin = () => {
    navigation.goBack();
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
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              📅
            </Text>
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Join Cal3 Mobile
          </Text>
        </View>

        {/* Registration Form */}
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

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              clearError();
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!emailError}
            disabled={isLoading}
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
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

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
              clearError();
            }}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            error={!!confirmPasswordError}
            disabled={isLoading}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!confirmPasswordError}>
            {confirmPasswordError}
          </HelperText>

          {/* API Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          )}

          {/* Register Button */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={handleBackToLogin}
              disabled={isLoading}
              compact
            >
              Login
            </Button>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            By registering, you agree to our Terms of Service
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
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
});
