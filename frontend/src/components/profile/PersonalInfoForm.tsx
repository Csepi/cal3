import React from 'react';
import {
  TIMEZONE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../../constants';
import { Card, CardHeader, Input, Button } from '../ui';
import { useAppTranslation } from '../../i18n/useAppTranslation';
import { SUPPORTED_LANGUAGES } from '../../i18n';

import { tStatic } from '../../i18n';

export interface PersonalInfoFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  timeFormat: string;
  language: string;
  hideReservationsTab?: boolean;
  hiddenLiveFocusTags?: string;
  usagePlans?: string[];
  defaultTasksCalendarId?: string;
}

export interface PersonalInfoFormProps {
  formData: PersonalInfoFormData;
  onFormDataChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  themeColor?: string;
  errors?: Record<string, string>;
  className?: string;
  tasksCalendars?: Array<{
    id: number;
    name: string;
    isTasksCalendar?: boolean;
    ownerId?: number;
  }>;
  tasksCalendarsLoading?: boolean;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  loading = false,
  themeColor,
  errors = {},
  className = '',
  tasksCalendars = [],
  tasksCalendarsLoading = false,
}) => {
  const { t } = useAppTranslation(['settings', 'auth', 'validation', 'common']);

  return (
    <Card
      className={className}
      themeColor={themeColor}
      padding="lg"
      header={<CardHeader>{t('settings:profile.personalInformation')}</CardHeader>}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-md border-b border-gray-200 pb-2 font-semibold text-gray-700">
            {t('settings:profile.personalInformation')}
          </h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t('auth:labels.username')}
              type="text"
              value={formData.username}
              onChange={(event) => onFormDataChange('username', event.target.value)}
              error={errors.username}
              required
              themeColor={themeColor}
              placeholder={t('auth:placeholders.username')}
            />

            <Input
              label={t('auth:labels.email')}
              type="email"
              value={formData.email}
              onChange={(event) => onFormDataChange('email', event.target.value)}
              error={errors.email}
              required
              themeColor={themeColor}
              placeholder={t('auth:placeholders.email')}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('settings:profile.defaultTasksCalendar')}
            </label>
            {tasksCalendarsLoading ? (
              <div className="text-sm text-gray-500">{t('common:app.loading')}</div>
            ) : (
              <select
                value={formData.defaultTasksCalendarId ?? ''}
                onChange={(event) =>
                  onFormDataChange('defaultTasksCalendarId', event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t('common:app.title')} {t('navigation.tasks', { defaultValue: 'Tasks' })} {tStatic('common:auto.frontend.k0b3507e5e887')}</option>
                {tasksCalendars.map((calendar) => (
                  <option key={calendar.id} value={String(calendar.id)}>
                    {calendar.name}
                    {calendar.isTasksCalendar
                      ? ` (${t('navigation.tasks', { defaultValue: 'Tasks' })})`
                      : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('settings:profile.defaultTasksCalendarHelp')}
            </p>
            {errors.defaultTasksCalendarId && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.defaultTasksCalendarId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t('auth:labels.firstName')}
              type="text"
              value={formData.firstName}
              onChange={(event) => onFormDataChange('firstName', event.target.value)}
              error={errors.firstName}
              themeColor={themeColor}
              placeholder={t('auth:placeholders.firstName')}
            />

            <Input
              label={t('auth:labels.lastName')}
              type="text"
              value={formData.lastName}
              onChange={(event) => onFormDataChange('lastName', event.target.value)}
              error={errors.lastName}
              themeColor={themeColor}
              placeholder={t('auth:placeholders.lastName')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-md border-b border-gray-200 pb-2 font-semibold text-gray-700">
            {t('settings:sections.preferences')}
          </h4>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('settings:preferences.timezone')}
            </label>
            <select
              value={formData.timezone}
              onChange={(event) => onFormDataChange('timezone', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                {t('validation:timezoneRequired', {
                  defaultValue: 'Select a timezone...',
                })}
              </option>
              {TIMEZONE_OPTIONS.map((timezoneOption) => (
                <option key={timezoneOption.value} value={timezoneOption.value}>
                  {timezoneOption.name}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.timezone}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('settings:preferences.timeFormat')}
            </label>
            <div className="space-y-2">
              {TIME_FORMAT_OPTIONS.map((format) => (
                <label key={format.value} className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value={format.value}
                    checked={formData.timeFormat === format.value}
                    onChange={(event) =>
                      onFormDataChange('timeFormat', event.target.value)
                    }
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('settings:preferences.language')}
            </label>
            <select
              value={formData.language}
              onChange={(event) => onFormDataChange('language', event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                {t('validation:languageRequired', {
                  defaultValue: 'Select a language...',
                })}
              </option>
              {LANGUAGE_OPTIONS.map((languageOption) => (
                SUPPORTED_LANGUAGES.includes(languageOption.value as (typeof SUPPORTED_LANGUAGES)[number]) ? (
                  <option key={languageOption.value} value={languageOption.value}>
                    {languageOption.flag} {languageOption.label}
                  </option>
                ) : null
              ))}
            </select>
            {errors.language && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.language}
              </p>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={formData.hideReservationsTab || false}
                onChange={(event) =>
                  onFormDataChange('hideReservationsTab', event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                {t('settings:preferences.hideReservationsTab')}
              </span>
            </label>
            <p className="ml-7 mt-1 text-xs text-gray-500">
              {t('settings:preferences.hideReservationsTabHelp')}
            </p>
          </div>

          <div>
            <Input
              label={t('settings:preferences.hiddenLiveFocusTags')}
              type="text"
              value={formData.hiddenLiveFocusTags || ''}
              onChange={(event) =>
                onFormDataChange('hiddenLiveFocusTags', event.target.value)
              }
              error={errors.hiddenLiveFocusTags}
              themeColor={themeColor}
              placeholder={t('settings:preferences.hiddenLiveFocusTagsPlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('settings:preferences.hiddenLiveFocusTagsHelp')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-md border-b border-gray-200 pb-2 font-semibold text-gray-700">
            {t('common:common.account', { defaultValue: 'Account Information' })}
          </h4>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('settings:organization.usagePlans')}
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.usagePlans?.map((plan) => (
                <span
                  key={plan}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings:organization.usagePlansHelp')}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <Button
            type="submit"
            loading={loading}
            themeColor={themeColor}
            size="lg"
            fullWidth
          >
            {loading ? t('common:app.saving') : t('settings:profile.updateProfile')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
