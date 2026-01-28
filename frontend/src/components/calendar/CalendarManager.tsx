/**
 * CalendarManager component for calendar CRUD operations
 *
 * This component provides comprehensive calendar management functionality
 * including creation, editing, deletion, and color management.
 * It encapsulates all calendar-related operations in a reusable component.
 */

import React, { useState, useEffect } from 'react';
import { SimpleModal, Button, Input, Card } from '../ui';
import { IconPicker } from '../ui/IconPicker';
import { THEME_COLOR_OPTIONS } from '../../constants';
import type { Calendar as CalendarType, CreateCalendarRequest, UpdateCalendarRequest } from '../../types/Calendar';
import type { CalendarGroupWithCalendars } from '../../types/CalendarGroup';
import { apiService } from '../../services/api';

export interface CalendarManagerProps {
  /** Whether the calendar modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to refresh calendar list */
  onCalendarChange: () => void;
  /** Calendar being edited (null for creating new calendar) */
  editingCalendar?: CalendarType | null;
  /** Current theme color */
  themeColor: string;
  /** Error message to display */
  error?: string | null;
}

/**
 * Comprehensive calendar management modal component
 * Updated to use SimpleModal for better rendering
 */
export const CalendarManager: React.FC<CalendarManagerProps> = ({
  isOpen,
  onClose,
  onCalendarChange,
  editingCalendar,
  themeColor,
  error
}) => {
  // Form state
  const [calendarForm, setCalendarForm] = useState<Partial<CreateCalendarRequest>>({
    name: '',
    description: '',
    color: themeColor,
    icon: undefined,
    groupId: undefined,
  });

  const [calendarGroups, setCalendarGroups] = useState<CalendarGroupWithCalendars[]>([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /**
   * Initialize form data when modal opens or editing calendar changes
   */
  useEffect(() => {
    if (isOpen) {
      apiService.getCalendarGroups().then(setCalendarGroups).catch(() => setCalendarGroups([]));

      if (editingCalendar) {
        // Editing existing calendar
        setCalendarForm({
          name: editingCalendar.name,
          description: editingCalendar.description || '',
          color: editingCalendar.color,
          icon: editingCalendar.icon,
          groupId: editingCalendar.groupId ?? undefined,
        });
      } else {
        // Creating new calendar
        setCalendarForm({
          name: '',
          description: '',
          color: themeColor,
          icon: undefined,
          groupId: undefined,
        });
      }

      // Clear form errors
      setFormErrors({});
    }
  }, [isOpen, editingCalendar, themeColor]);

  /**
   * Handle form field changes
   */
  const handleFormChange = (field: string, value: string) => {
    setCalendarForm(prev => ({
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
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!calendarForm.name?.trim()) {
      errors.name = 'Calendar name is required';
    } else if (calendarForm.name.trim().length < 2) {
      errors.name = 'Calendar name must be at least 2 characters';
    }

    if (!calendarForm.color) {
      errors.color = 'Please select a color';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingCalendar) {
        // Update existing calendar
        const updateData: UpdateCalendarRequest = {
          name: calendarForm.name!,
          description: calendarForm.description || '',
          color: calendarForm.color!,
          icon: calendarForm.icon || undefined,
          groupId: calendarForm.groupId ?? null,
        };
        await apiService.updateCalendar(editingCalendar.id, updateData);
      } else {
        // Create new calendar
        const createData: CreateCalendarRequest = {
          name: calendarForm.name!,
          description: calendarForm.description || '',
          color: calendarForm.color!,
          icon: calendarForm.icon || undefined,
          groupId: calendarForm.groupId,
        };
        await apiService.createCalendar(createData);
      }

      onCalendarChange();
      onClose();
    } catch (err) {
      console.error('Error saving calendar:', err);
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle calendar deletion
   */
  const handleDelete = async () => {
    if (!editingCalendar) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the calendar "${editingCalendar.name}"? This will also delete all events in this calendar. This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      await apiService.deleteCalendar(editingCalendar.id);
      onCalendarChange();
      onClose();
    } catch (err) {
      console.error('Error deleting calendar:', err);
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal close with confirmation if form has changes
   */
  const handleClose = () => {
    const hasChanges = editingCalendar
      ? Object.keys(calendarForm).some(key => calendarForm[key as keyof typeof calendarForm] !== (editingCalendar as any)[key])
      : Object.values(calendarForm).some(value => value !== '' && value !== themeColor);

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
      title={editingCalendar ? 'Edit Calendar' : 'Create New Calendar'}
      size="md"
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
          header={<h3 className="text-lg font-semibold text-gray-800">📅 Calendar Information</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            {/* Calendar Name */}
            <Input
              label="Calendar Name"
              value={calendarForm.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              error={formErrors.name}
              required
              themeColor={themeColor}
              placeholder="Enter calendar name..."
              maxLength={100}
            />

            {/* Description */}
            <Input
              label="Description"
              value={calendarForm.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
              themeColor={themeColor}
              placeholder="Enter calendar description..."
              multiline
              rows={3}
              maxLength={500}
            />

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calendar Icon (Optional)
              </label>
              <IconPicker
                value={calendarForm.icon}
                onChange={(icon) => handleFormChange('icon', icon || '')}
                category="all"
                placeholder="Select a calendar icon..."
              />
            </div>
          </div>
        </Card>

        {/* Color Selection */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">🎨 Calendar Color</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose a color to help identify this calendar visually
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
                    ${calendarForm.color === colorOption.value
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
                  {calendarForm.color === colorOption.value && (
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
                value={calendarForm.color || themeColor}
                onChange={(e) => handleFormChange('color', e.target.value)}
                error={formErrors.color}
                themeColor={themeColor}
              />
            </div>

            {/* Color Preview */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: calendarForm.color || themeColor }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Preview</p>
                  <p className="text-xs text-gray-500">
                    This color will be used for events in this calendar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Calendar Group */}
        <Card className="border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">🗂 Calendar Group</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const name = window.prompt('New group name?');
                if (!name || name.trim().length < 2) return;
                const created = await apiService.createCalendarGroup({ name: name.trim(), isVisible: true });
                const groups = await apiService.getCalendarGroups().catch(() => []);
                setCalendarGroups(groups);
                setCalendarForm((prev) => ({ ...prev, groupId: created.id }));
              }}
            >
              + New Group
            </Button>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-700">Assign to group (optional)</label>
            <select
              value={calendarForm.groupId ?? ''}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  groupId: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
              className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No group</option>
              {calendarGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          {/* Delete Button (only for editing) */}
          {editingCalendar && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Delete Calendar
            </Button>
          )}

          {/* Main Actions */}
          <div className={`flex space-x-3 ${editingCalendar ? '' : 'ml-auto'}`}>
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
                ? (editingCalendar ? 'Updating...' : 'Creating...')
                : (editingCalendar ? 'Update Calendar' : 'Create Calendar')
              }
            </Button>
          </div>
        </div>

        {/* Additional Information */}
        {editingCalendar && (
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <span>Created: {new Date(editingCalendar.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span>ID: {editingCalendar.id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleModal>
  );
};
