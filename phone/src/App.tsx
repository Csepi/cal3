import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, Platform } from 'react-native';

/**
 * Cal3 Mobile - Main App Component
 * Phase 1: Basic setup with placeholder UI
 */
function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <Text style={styles.title}>Cal3 Mobile</Text>
        <Text style={styles.subtitle}>Android Calendar & Reservation App</Text>
        <Text style={styles.version}>Version 0.1.0 - Phase 1</Text>
        <Text style={styles.platform}>Platform: {Platform.OS} {Platform.Version}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
  },
  version: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  platform: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});

export default App;
