import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Divider } from 'react-native-paper';
import { useAuth } from '@hooks/useAuth';
import type { MainTabScreenProps } from '@navigation/types';

/**
 * Profile Screen
 * Shows user profile and allows logout
 */

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = () => {
  const theme = useTheme();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
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

        {/* Settings Placeholder */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Settings
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Profile editing and settings coming in Phase 4
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
  logoutButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
});
