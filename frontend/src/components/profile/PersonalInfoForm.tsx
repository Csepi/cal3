import React from 'react';
import { TIMEZONE_OPTIONS, TIME_FORMAT_OPTIONS } from '../../constants';
import { Card, CardHeader, Input, Button } from '../ui';

/**
 * PersonalInfoForm component for editing user profile information
 *
 * This component provides a form interface for users to update their personal
 * information including basic details, timezone preferences, and time format settings.
 */

export interface PersonalInfoFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  timeFormat: string;
  hideReservationsTab?: boolean; // Optional, to hide the Reservations tab
  usagePlans?: string[]; // Optional, for display purposes only
}

export interface PersonalInfoFormProps {
  /** Current form data */
  formData: PersonalInfoFormData;
  /** Function to update form data */
  onFormDataChange: (field: string, value: string | boolean) => void;
  /** Function to handle form submission */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether the form is currently submitting */
  loading?: boolean;
  /** Current theme color for styling */
  themeColor?: string;
  /** Form validation errors */
  errors?: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Comprehensive form for editing user personal information and preferences
 */
export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  loading = false,
  themeColor,
  errors = {},
  className = ''
}) => {
  return (
    <Card
      className={className}
      themeColor={themeColor}
      padding="lg"
      header={
        <CardHeader>
          👤 Personal Information
        </CardHeader>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2">
            Basic Information
          </h4>

          {/* Username and Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => onFormDataChange('username', e.target.value)}
              error={errors.username}
              required
              themeColor={themeColor}
              placeholder="Enter your username"
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange('email', e.target.value)}
              error={errors.email}
              required
              themeColor={themeColor}
              placeholder="Enter your email"
            />
          </div>

          {/* First Name and Last Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={formData.firstName}
              onChange={(e) => onFormDataChange('firstName', e.target.value)}
              error={errors.firstName}
              themeColor={themeColor}
              placeholder="Enter your first name"
            />

            <Input
              label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={(e) => onFormDataChange('lastName', e.target.value)}
              error={errors.lastName}
              themeColor={themeColor}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2">
            Preferences
          </h4>

          {/* Timezone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => onFormDataChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select a timezone...</option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.name}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.timezone}
              </p>
            )}
          </div>

          {/* Time Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <div className="space-y-2">
              {TIME_FORMAT_OPTIONS.map((format) => (
                <label key={format.value} className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value={format.value}
                    checked={formData.timeFormat === format.value}
                    onChange={(e) => onFormDataChange('timeFormat', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{format.label}</span>
                </label>
              ))}
            </div>
            {errors.timeFormat && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.timeFormat}
              </p>
            )}
          </div>

          {/* Hide Reservations Tab Checkbox */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hideReservationsTab || false}
                onChange={(e) => onFormDataChange('hideReservationsTab', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">Hide Reservations tab</span>
            </label>
            <p className="mt-1 ml-7 text-xs text-gray-500">
              When enabled, the Reservations tab will be hidden from the main dashboard
            </p>
          </div>
        </div>

        {/* Usage Plans Display (Read-only) */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2">
            Account Information
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Plans
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.usagePlans?.map((plan) => (
                <span
                  key={plan}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Usage plans are managed by administrators and control your access to features.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            type="submit"
            loading={loading}
            themeColor={themeColor}
            size="lg"
            fullWidth
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};