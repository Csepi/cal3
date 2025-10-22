import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Divider, Snackbar } from 'react-native-paper';
import { useAuth } from '@hooks/useAuth';
import { ColorPicker } from '@components/common';
import { authApi } from '@api/auth';
import type { MainTabScreenProps } from '@navigation/types';
import type { CalendarColor } from '@constants/theme';

/**
 * Enhanced Profile Screen
 * Shows user profile, theme color selector, and logout
 *
 * Features:
 * - User information display
 * - Theme color selector
 * - Logout functionality
 */

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const { user, logout, isLoading, refresh } = useAuth();

  const [selectedColor, setSelectedColor] = useState<CalendarColor>(
    (user?.themeColor as CalendarColor) || 'blue'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  const handleColorChange = async (color: CalendarColor) => {
    setSelectedColor(color);
    setIsSaving(true);

    try {
      await authApi.updateProfile({ themeColor: color });
      await refresh();
      setSnackbarMessage('Theme color updated successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(
        error.response?.data?.message || 'Failed to update theme color'
      );
      setSnackbarVisible(true);
      // Revert to previous color
      setSelectedColor((user?.themeColor as CalendarColor) || 'blue');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text variant="headlineMedium" style={styles.username}>
              {user?.username || 'User'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* User Info */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Information
            </Text>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                User ID:
              </Text>
              <Text variant="bodyMedium">{user?.id || 'N/A'}</Text>
            </View>

            {user?.timezone && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Timezone:
                </Text>
                <Text variant="bodyMedium">{user.timezone}</Text>
              </View>
            )}

            {user?.timeFormat && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Time Format:
                </Text>
                <Text variant="bodyMedium">{user.timeFormat}</Text>
              </View>
            )}

            {user?.isAdmin && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Role:
                </Text>
                <Text variant="bodyMedium">Administrator</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Theme Color Selector */}
          <View style={styles.section}>
            <ColorPicker
              selectedColor={selectedColor}
              onSelectColor={handleColorChange}
              label="Theme Color"
            />
            {isSaving && (
              <Text
                variant="bodySmall"
                style={[styles.savingText, { color: theme.colors.primary }]}
              >
                Saving...
              </Text>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Settings Placeholder */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Settings
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              More settings coming in Phase 4
            </Text>
          </View>

          {/* Logout Button */}
          <Button
            mode="contained"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
            style={styles.logoutButton}
            buttonColor={theme.colors.error}
          >
            Logout
          </Button>

          {/* Version Info */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Cal3 Mobile v0.1.0
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  savingText: {
    marginTop: 8,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
});
