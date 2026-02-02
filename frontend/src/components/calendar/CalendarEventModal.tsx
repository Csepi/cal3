// @ts-nocheck
/**
 * CalendarEventModal component for creating and editing calendar events
 *
 * This component provides a comprehensive modal interface for event management,
 * including form validation, recurrence patterns, and theme integration.
 * It replaces the inline modal logic from the monolithic Calendar component.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, SimpleModal } from '../ui';
import { IconPicker } from '../ui/IconPicker';
import { THEME_COLOR_OPTIONS } from '../../constants';
import type { Event, CreateEventRequest, UpdateEventRequest, RecurrencePattern } from '../../types/Event';
import type { Calendar as CalendarType } from '../../types/Calendar';
import RecurrenceSelector from '../RecurrenceSelector';
import { EventCommentsPanel } from './EventCommentsPanel';

export interface CalendarEventModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to save the event */
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  /** Function to delete the event (optional, for edit mode) */
  onDelete?: (eventId: number) => Promise<void>;
  /** Event being edited (null for creating new event) */
  editingEvent?: Event | null;
  /** Available calendars for selection */
  calendars: CalendarType[];
  /** Selected date (for new events) */
  selectedDate?: Date | null;
  /** Current theme color */
  themeColor: string;
  /** Error message to display */
  error?: string | null;
  /** Whether the form is currently submitting */
  loading?: boolean;
}

/**
 * Modal component for comprehensive event creation and editing
 * Updated to use SimpleModal for better rendering
 */
export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingEvent,
  calendars,
  selectedDate,
  themeColor,
  error,
  loading = false
}) => {

  // Form state
  const [eventForm, setEventForm] = useState<Partial<CreateEventRequest>>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    location: '',
    color: themeColor,
    icon: undefined,
    calendarId: undefined
  });

  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /**
   * Initialize form data when modal opens or editing event changes
   */
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // Editing existing event
        setEventForm({
          title: editingEvent.title,
          description: editingEvent.description || '',
          startDate: editingEvent.startDate,
          startTime: editingEvent.startTime || '',
          endDate: editingEvent.endDate,
          endTime: editingEvent.endTime || '',
          isAllDay: editingEvent.isAllDay,
          location: editingEvent.location || '',
          color: editingEvent.color,
          icon: editingEvent.icon,
          calendarId: editingEvent.calendar.id
        });

        // Set recurrence pattern if event has recurrence
        if (editingEvent.recurrencePattern) {
          setRecurrencePattern(editingEvent.recurrencePattern);
        } else {
          setRecurrencePattern(null);
        }
      } else {
        // Creating new event
        const defaultCalendar = calendars.find(cal => cal.name === 'Personal') || calendars[0];
        const startDate = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        setEventForm({
          title: '',
          description: '',
          startDate,
          startTime: '09:00',
          endDate: startDate,
          endTime: '10:00',
          isAllDay: false,
          location: '',
          color: themeColor,
          icon: undefined,
          calendarId: defaultCalendar?.id
        });
        setRecurrencePattern(null);
      }

      // Clear form errors
      setFormErrors({});
    }
  }, [isOpen, editingEvent, calendars, selectedDate, themeColor]);

  /**
   * Handle form field changes
   */
  const handleFormChange = <K extends keyof CreateEventRequest>(
    field: K,
    value: CreateEventRequest[K],
  ) => {
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Auto-adjust end date when start date changes
    if (field === 'startDate' && eventForm.endDate === eventForm.startDate) {
      setEventForm(prev => ({
        ...prev,
        endDate: value
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!eventForm.title?.trim()) {
      errors.title = 'Event title is required';
    }

    if (!eventForm.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!eventForm.endDate) {
      errors.endDate = 'End date is required';
    }

    if (!eventForm.calendarId) {
      errors.calendarId = 'Please select a calendar';
    }

    // Date validation
    if (eventForm.startDate && eventForm.endDate) {
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime || '00:00'}`);
      const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime || '23:59'}`);

      if (endDateTime < startDateTime) {
        errors.endDate = 'End date must be after start date';
      }
    }

    // Time validation for non-all-day events
    if (!eventForm.isAllDay) {
      if (!eventForm.startTime) {
        errors.startTime = 'Start time is required';
      }
      if (!eventForm.endTime) {
        errors.endTime = 'End time is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle event deletion
   */
  const handleDelete = async () => {
    if (!editingEvent || !onDelete) return;

    if (confirm(`Are you sure you want to delete "${editingEvent.title}"?`)) {
      try {
        await onDelete(editingEvent.id);
        handleClose();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Transform recurrence pattern to backend format
      const recurrenceData = recurrencePattern ? {
        recurrenceType: recurrencePattern.type,
        recurrenceRule: {
          interval: recurrencePattern.interval,
          daysOfWeek: recurrencePattern.daysOfWeek,
          endType: recurrencePattern.endType,
          count: recurrencePattern.count,
          endDate: recurrencePattern.endDate
        }
      } : {};

      const eventData = {
        ...eventForm,
        ...recurrenceData
      } as CreateEventRequest | UpdateEventRequest;

      await onSave(eventData);
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error('Error saving event:', err);
    }
  };

  /**
   * Handle modal close with confirmation if form has changes
   */
  const handleClose = () => {
    const editingEventRecord =
      editingEvent as unknown as Record<string, unknown> | null;
    const hasChanges = editingEvent
      ? Object.keys(eventForm).some(
          (key) =>
            eventForm[key as keyof typeof eventForm] !==
            editingEventRecord?.[key],
        )
      : Object.values(eventForm).some(value => value !== '' && value !== false && value !== undefined);

    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }

    onClose();
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingEvent ? 'Edit Event' : 'Create New Event'}
      size="md"
      fullScreenOnMobile={true}
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">📝 Event Details</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            {/* Event Title */}
            <Input
              label="Event Title"
              value={eventForm.title || ''}
              onChange={(e) => handleFormChange('title', e.target.value)}
              error={formErrors.title}
              required
              themeColor={themeColor}
              placeholder="Enter event title..."
            />

            {/* Calendar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calendar <span className="text-red-500">*</span>
              </label>
              <select
                value={eventForm.calendarId || ''}
                onChange={(e) => handleFormChange('calendarId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a calendar...</option>
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
              {formErrors.calendarId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.calendarId}</p>
              )}
            </div>

            {/* Description */}
            <Input
              label="Description"
              value={eventForm.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
              themeColor={themeColor}
              placeholder="Enter event description..."
              multiline
              rows={3}
            />

            {/* Location */}
            <Input
              label="Location"
              value={eventForm.location || ''}
              onChange={(e) => handleFormChange('location', e.target.value)}
              themeColor={themeColor}
              placeholder="Enter event location..."
            />

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Icon (Optional)
              </label>
              <IconPicker
                value={eventForm.icon}
                onChange={(icon) => handleFormChange('icon', icon || '')}
                category="all"
                placeholder="Select an event icon..."
              />
            </div>
          </div>
        </Card>

        {/* Date & Time */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">🕒 Date & Time</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            {/* All Day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAllDay"
                checked={eventForm.isAllDay || false}
                onChange={(e) => handleFormChange('isAllDay', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="ml-3 text-sm text-gray-700">
                All day event
              </label>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={eventForm.startDate || ''}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                error={formErrors.startDate}
                required
                themeColor={themeColor}
              />

              {!eventForm.isAllDay && (
                <Input
                  label="Start Time"
                  type="time"
                  value={eventForm.startTime || ''}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  error={formErrors.startTime}
                  required
                  themeColor={themeColor}
                />
              )}
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="End Date"
                type="date"
                value={eventForm.endDate || ''}
                onChange={(e) => handleFormChange('endDate', e.target.value)}
                error={formErrors.endDate}
                required
                themeColor={themeColor}
              />

              {!eventForm.isAllDay && (
                <Input
                  label="End Time"
                  type="time"
                  value={eventForm.endTime || ''}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  error={formErrors.endTime}
                  required
                  themeColor={themeColor}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Event Color */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">🎨 Event Color</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose a color to help identify this event visually
            </p>

            {/* Color Grid */}
            <div className="grid grid-cols-4 gap-3">
              {THEME_COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => handleFormChange('color', colorOption.value)}
                  disabled={loading}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105
                    ${eventForm.color === colorOption.value
                      ? 'border-gray-800 shadow-lg ring-2 ring-offset-2 ring-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  title={`Select ${colorOption.name} color`}
                >
                  {/* Color Preview Circle */}
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2 shadow-md"
                    style={{ backgroundColor: colorOption.value }}
                  />

                  {/* Color Name */}
                  <div className="text-xs font-medium text-gray-700 text-center">
                    {colorOption.name}
                  </div>

                  {/* Selected Indicator */}
                  {eventForm.color === colorOption.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="pt-4 border-t border-gray-200">
              <Input
                label="Custom Color"
                type="color"
                value={eventForm.color || themeColor}
                onChange={(e) => handleFormChange('color', e.target.value)}
                themeColor={themeColor}
              />
            </div>

            {/* Color Preview */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: eventForm.color || themeColor }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Preview</p>
                  <p className="text-xs text-gray-500">
                    This color will be used for this event
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recurrence Pattern */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">🔄 Repeat Event</h3>}
          padding="lg"
          themeColor={themeColor}
        >
        <RecurrenceSelector
          value={recurrencePattern}
          onChange={setRecurrencePattern}
          themeColor={themeColor}
        />
      </Card>

      <EventCommentsPanel
        eventId={editingEvent?.id}
        eventTitle={editingEvent?.title}
        eventVisibility={editingEvent?.calendar?.visibility}
        themeColor={themeColor}
        isOpen={isOpen}
      />

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div>
            {editingEvent && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                themeColor="#ef4444"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                🗑️ Delete Event
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              themeColor={themeColor}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              themeColor={themeColor}
            >
              {loading
                ? (editingEvent ? 'Updating...' : 'Creating...')
                : (editingEvent ? 'Update Event' : 'Create Event')
              }
            </Button>
          </div>
        </div>
      </div>

      {editingEvent && (
        <div className="pt-3 text-center text-[11px] text-gray-400">
          Event ID: {editingEvent.id}
        </div>
      )}
    </SimpleModal>
  );
};

