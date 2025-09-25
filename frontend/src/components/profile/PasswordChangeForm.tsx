import React from 'react';
import { Card, CardHeader, Input, Button } from '../ui';

/**
 * PasswordChangeForm component for updating user passwords
 *
 * This component provides a secure form interface for users to change their password
 * with proper validation and security measures in place.
 */

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeFormProps {
  /** Current password form data */
  formData: PasswordFormData;
  /** Function to update password form data */
  onFormDataChange: (field: string, value: string) => void;
  /** Function to handle password change submission */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether the form is currently submitting */
  loading?: boolean;
  /** Current theme color for styling */
  themeColor?: string;
  /** Form validation errors */
  errors?: Record<string, string>;
  /** Function to cancel password change */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Secure password change form with validation and confirmation
 */
export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  loading = false,
  themeColor,
  errors = {},
  onCancel,
  className = ''
}) => {
  // Password strength indicator
  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^a-zA-Z0-9]/.test(password)
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 1) return { strength, text: 'Very Weak', color: 'text-red-600' };
    if (strength <= 2) return { strength, text: 'Weak', color: 'text-orange-600' };
    if (strength <= 3) return { strength, text: 'Fair', color: 'text-yellow-600' };
    if (strength <= 4) return { strength, text: 'Good', color: 'text-green-600' };
    return { strength, text: 'Strong', color: 'text-green-700' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Card
      className={className}
      themeColor={themeColor}
      padding="lg"
      header={
        <CardHeader>
          🔒 Change Password
        </CardHeader>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Password Security Requirements
              </h4>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Minimum 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Password */}
        <Input
          label="Current Password"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => onFormDataChange('currentPassword', e.target.value)}
          error={errors.currentPassword}
          required
          themeColor={themeColor}
          placeholder="Enter your current password"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* New Password */}
        <div>
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => onFormDataChange('newPassword', e.target.value)}
            error={errors.newPassword}
            required
            themeColor={themeColor}
            placeholder="Enter your new password"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
          />

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Password strength:</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.strength <= 1 ? 'bg-red-500' :
                    passwordStrength.strength <= 2 ? 'bg-orange-500' :
                    passwordStrength.strength <= 3 ? 'bg-yellow-500' :
                    passwordStrength.strength <= 4 ? 'bg-green-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          label="Confirm New Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => onFormDataChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
          themeColor={themeColor}
          placeholder="Confirm your new password"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Password Match Indicator */}
        {formData.newPassword && formData.confirmPassword && (
          <div className="flex items-center text-sm">
            {formData.newPassword === formData.confirmPassword ? (
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Passwords match
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Passwords do not match
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-6 border-t border-gray-200 flex space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              themeColor={themeColor}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            themeColor={themeColor}
            className="flex-1"
            disabled={
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword ||
              passwordStrength.strength < 3
            }
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Card>
  );
};