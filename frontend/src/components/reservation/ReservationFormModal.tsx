// @ts-nocheck
/**
 * ReservationFormModal component for creating and editing reservations
 *
 * This component provides a comprehensive modal interface for reservation management,
 * including form validation, multi-day reservations, and customer information.
 * It uses the modular UI components and centralized theme system.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Card } from '../ui';
import type {
  ReservationCustomerInfo,
  ReservationRecord,
  ReservationResource,
} from '../../types/reservation';

export interface ReservationFormData {
  startTime: string;
  endTime: string;
  quantity: number;
  customerInfo: ReservationCustomerInfo;
  notes: string;
  resourceId: number;
  // Multi-day fields
  startDate: string;
  endDate: string;
  startTimeOnly: string;
  endTimeOnly: string;
}

export interface ReservationFormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to save the reservation */
  onSave: (formData: ReservationFormData) => Promise<void>;
  /** Reservation being edited (null for creating new reservation) */
  editingReservation?: ReservationRecord | null;
  /** Available resources for selection */
  resources: ReservationResource[];
  /** Current theme color */
  themeColor: string;
  /** Error message to display */
  error?: string | null;
  /** Whether the form is currently submitting */
  loading?: boolean;
}

/**
 * Modal component for comprehensive reservation creation and editing
 */
export const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReservation,
  resources,
  themeColor,
  error,
  loading = false
}) => {
  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    startTime: '',
    endTime: '',
    quantity: 1,
    customerInfo: {},
    notes: '',
    resourceId: 0,
    startDate: '',
    endDate: '',
    startTimeOnly: '',
    endTimeOnly: ''
  });

  // Multi-day reservation toggle
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Initialize form data when modal opens or editing reservation changes
   */
  useEffect(() => {
    if (isOpen) {
      if (editingReservation) {
        // Editing existing reservation
        const startDateTime = new Date(editingReservation.startTime);
        const endDateTime = new Date(editingReservation.endTime);

        // Check if it's a multi-day reservation
        const isMultiDayReservation = startDateTime.toDateString() !== endDateTime.toDateString();

        setFormData({
          startTime: isMultiDayReservation ? '' : editingReservation.startTime,
          endTime: isMultiDayReservation ? '' : editingReservation.endTime,
          quantity: editingReservation.quantity || 1,
          customerInfo: editingReservation.customerInfo || {},
          notes: editingReservation.notes || '',
          resourceId: editingReservation.resource?.id || 0,
          startDate: isMultiDayReservation ? startDateTime.toISOString().split('T')[0] : '',
          endDate: isMultiDayReservation ? endDateTime.toISOString().split('T')[0] : '',
          startTimeOnly: isMultiDayReservation ? startDateTime.toTimeString().slice(0, 5) : '',
          endTimeOnly: isMultiDayReservation ? endDateTime.toTimeString().slice(0, 5) : ''
        });

        setIsMultiDay(isMultiDayReservation);
      } else {
        // Creating new reservation
        const now = new Date();
        const defaultStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // 2 hours from now

        setFormData({
          startTime: defaultStart.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
          endTime: defaultEnd.toISOString().slice(0, 16),
          quantity: 1,
          customerInfo: {},
          notes: '',
          resourceId: resources.length > 0 ? resources[0].id : 0,
          startDate: '',
          endDate: '',
          startTimeOnly: '',
          endTimeOnly: ''
        });

        setIsMultiDay(false);
      }

      // Clear validation errors
      setValidationErrors({});
    }
  }, [isOpen, editingReservation, resources]);

  /**
   * Handle form field changes
   */
  const handleFormChange = (
    field: keyof ReservationFormData,
    value: ReservationFormData[keyof ReservationFormData],
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Handle customer info changes
   */
  const handleCustomerInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value
      }
    }));
  };

  /**
   * Toggle multi-day reservation mode
   */
  const handleMultiDayToggle = (checked: boolean) => {
    setIsMultiDay(checked);

    if (checked) {
      // Convert single datetime to date + time
      if (formData.startTime) {
        const startDate = new Date(formData.startTime);
        setFormData(prev => ({
          ...prev,
          startDate: startDate.toISOString().split('T')[0],
          startTimeOnly: startDate.toTimeString().slice(0, 5),
          startTime: '',
          endTime: ''
        }));
      }
    } else {
      // Convert date + time to single datetime
      if (formData.startDate && formData.startTimeOnly) {
        const startDateTime = `${formData.startDate}T${formData.startTimeOnly}`;
        const endDateTime = formData.endDate && formData.endTimeOnly
          ? `${formData.endDate}T${formData.endTimeOnly}`
          : '';

        setFormData(prev => ({
          ...prev,
          startTime: startDateTime,
          endTime: endDateTime,
          startDate: '',
          endDate: '',
          startTimeOnly: '',
          endTimeOnly: ''
        }));
      }
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Resource validation
    if (!formData.resourceId) {
      errors.resourceId = 'Please select a resource';
    }

    // Quantity validation
    if (formData.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }

    // Time validation
    if (isMultiDay) {
      if (!formData.startDate) {
        errors.startDate = 'Start date is required';
      }
      if (!formData.endDate) {
        errors.endDate = 'End date is required';
      }
      if (!formData.startTimeOnly) {
        errors.startTimeOnly = 'Start time is required';
      }
      if (!formData.endTimeOnly) {
        errors.endTimeOnly = 'End time is required';
      }

      // Date logic validation
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (endDate < startDate) {
          errors.endDate = 'End date must be after start date';
        }
      }
    } else {
      if (!formData.startTime) {
        errors.startTime = 'Start time is required';
      }
      if (!formData.endTime) {
        errors.endTime = 'End time is required';
      }

      // Time logic validation
      if (formData.startTime && formData.endTime) {
        const startDateTime = new Date(formData.startTime);
        const endDateTime = new Date(formData.endTime);

        if (endDateTime <= startDateTime) {
          errors.endTime = 'End time must be after start time';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      // Error is handled by parent component
      console.error('Error saving reservation:', err);
    }
  };

  /**
   * Handle modal close with confirmation if form has changes
   */
  const handleClose = () => {
    const hasChanges = editingReservation
      ? Object.keys(formData).some(key => {
          const currentValue = formData[key as keyof ReservationFormData];
          const originalValue =
            editingReservation[key as keyof ReservationRecord];
          return currentValue !== originalValue;
        })
      : Object.values(formData).some(value =>
          value !== '' && value !== 0 && value !== 1 && JSON.stringify(value) !== '{}'
        );

    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingReservation ? 'Edit Reservation' : 'Create New Reservation'}
      size="lg"
      themeColor={themeColor}
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
          header={<h3 className="text-lg font-semibold text-gray-800">🏢 Reservation Details</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            {/* Resource Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.resourceId}
                onChange={(e) => handleFormChange('resourceId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select a resource...</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.resourceType?.name || 'Unknown Type'})
                  </option>
                ))}
              </select>
              {validationErrors.resourceId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.resourceId}</p>
              )}
            </div>

            {/* Quantity */}
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity.toString()}
              onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 1)}
              error={validationErrors.quantity}
              required
              min={1}
              themeColor={themeColor}
            />
          </div>
        </Card>

        {/* Date & Time */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">📅 Date & Time</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            {/* Multi-day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isMultiDay"
                checked={isMultiDay}
                onChange={(e) => handleMultiDayToggle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isMultiDay" className="ml-3 text-sm text-gray-700">
                Multi-day reservation
              </label>
            </div>

            {isMultiDay ? (
              // Multi-day form
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    error={validationErrors.startDate}
                    required
                    themeColor={themeColor}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                    error={validationErrors.endDate}
                    required
                    themeColor={themeColor}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData.startTimeOnly}
                    onChange={(e) => handleFormChange('startTimeOnly', e.target.value)}
                    error={validationErrors.startTimeOnly}
                    required
                    themeColor={themeColor}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={formData.endTimeOnly}
                    onChange={(e) => handleFormChange('endTimeOnly', e.target.value)}
                    error={validationErrors.endTimeOnly}
                    required
                    themeColor={themeColor}
                  />
                </div>
              </div>
            ) : (
              // Single day form
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date & Time"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  error={validationErrors.startTime}
                  required
                  themeColor={themeColor}
                />
                <Input
                  label="End Date & Time"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  error={validationErrors.endTime}
                  required
                  themeColor={themeColor}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Customer Information */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">👤 Customer Information</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                value={formData.customerInfo.name || ''}
                onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                themeColor={themeColor}
                placeholder="Enter customer name"
              />
              <Input
                label="Email"
                type="email"
                value={formData.customerInfo.email || ''}
                onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                themeColor={themeColor}
                placeholder="Enter customer email"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={formData.customerInfo.phone || ''}
                onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                themeColor={themeColor}
                placeholder="Enter customer phone"
              />
              <Input
                label="Organization"
                value={formData.customerInfo.organization || ''}
                onChange={(e) => handleCustomerInfoChange('organization', e.target.value)}
                themeColor={themeColor}
                placeholder="Enter organization"
              />
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card
          header={<h3 className="text-lg font-semibold text-gray-800">📝 Additional Notes</h3>}
          padding="lg"
          themeColor={themeColor}
        >
          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            themeColor={themeColor}
            placeholder="Enter any additional notes or special requirements..."
            multiline
            rows={3}
          />
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              ? (editingReservation ? 'Updating...' : 'Creating...')
              : (editingReservation ? 'Update Reservation' : 'Create Reservation')
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

