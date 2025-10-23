import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  Text,
  useTheme,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { ColorPicker } from '@components/common';
import { useCreateEvent } from '@hooks/useEvents';
import { useCalendars } from '@hooks/useCalendars';
import type { RootStackScreenProps } from '@navigation/types';
import type { CalendarColor } from '@constants/theme';

/**
 * Create Event Screen
 * Form for creating a new event
 *
 * Features:
 * - Title, description, location inputs
 * - Start/end date/time pickers (TODO: native pickers in Phase 4.5)
 * - All-day toggle
 * - Color picker
 * - Calendar selection
 * - Form validation
 * - Loading states
 * - Success/error feedback
 */

type Props = RootStackScreenProps<'CreateEvent'>;

export const CreateEventScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const createEventMutation = useCreateEvent();
  const { data: calendars = [] } = useCalendars();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedColor, setSelectedColor] = useState<CalendarColor>('blue');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // UI state
  const [titleError, setTitleError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Get default calendar
  const defaultCalendar = calendars.find((cal) => cal.isDefault) || calendars[0];

  const validateForm = (): boolean => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (endDate < startDate) {
      setSnackbarMessage('End date must be after start date');
      setSnackbarVisible(true);
      isValid = false;
    }

    return isValid;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    if (!defaultCalendar) {
      setSnackbarMessage('No calendar available');
      setSnackbarVisible(true);
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay,
        color: selectedColor,
        calendarId: defaultCalendar.id,
        status: 'confirmed',
      });

      setSnackbarMessage('Event created successfully');
      setSnackbarVisible(true);

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      setSnackbarMessage(
        error.response?.data?.message || 'Failed to create event'
      );
      setSnackbarVisible(true);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <TextInput
            label="Event Title *"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError('');
            }}
            mode="outlined"
            error={!!titleError}
            style={styles.input}
          />
          <HelperText type="error" visible={!!titleError}>
            {titleError}
          </HelperText>

          {/* Description */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Location */}
          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker" />}
            style={styles.input}
          />

          {/* Date/Time Pickers Placeholder */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Date & Time
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Native date/time pickers coming in Phase 4.5
            </Text>
            <Text variant="bodySmall" style={{ marginTop: 8 }}>
              Start: {startDate.toLocaleString()}
            </Text>
            <Text variant="bodySmall">
              End: {endDate.toLocaleString()}
            </Text>
          </View>

          {/* All Day Toggle */}
          <View style={styles.row}>
            <Text variant="bodyLarge">All Day Event</Text>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              color={theme.colors.primary}
            />
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <ColorPicker
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              label="Event Color"
            />
          </View>

          {/* Calendar Display */}
          {defaultCalendar && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Calendar
              </Text>
              <Text variant="bodyMedium">{defaultCalendar.name}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.button}
              disabled={createEventMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              style={styles.button}
              loading={createEventMutation.isPending}
              disabled={createEventMutation.isPending}
            >
              Create Event
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
