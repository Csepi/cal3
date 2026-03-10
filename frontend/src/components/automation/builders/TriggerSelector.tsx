import React from 'react';
import { TriggerType } from '../../../types/Automation';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';

import { tStatic } from '../../../i18n';

interface TriggerSelectorProps {
  selectedTrigger: TriggerType | null;
  triggerConfig: Record<string, any>;
  onTriggerChange: (trigger: TriggerType) => void;
  onConfigChange: (config: Record<string, any>) => void;
  disabled?: boolean;
}

export const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  selectedTrigger,
  triggerConfig,
  onTriggerChange,
  onConfigChange,
  disabled = false,
}) => {
  const { triggerTypes } = useAutomationMetadata();

  const selectedTriggerMeta = triggerTypes.find((t) => t.value === selectedTrigger);

  const handleTriggerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrigger = e.target.value as TriggerType;
    onTriggerChange(newTrigger);
    // Reset config when trigger changes
    onConfigChange({});
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value) || 30;
    onConfigChange({ minutes });
  };

  const handleCronChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ cronExpression: e.target.value });
  };

  return (
    <div className="space-y-4">
      {/* Trigger Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {tStatic('common:auto.frontend.k07c06ad02843')}</label>
        <select
          value={selectedTrigger || ''}
          onChange={handleTriggerChange}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{tStatic('common:auto.frontend.k9112dc94c2b4')}</option>
          {triggerTypes.map((trigger) => (
            <option key={trigger.value} value={trigger.value}>
              {trigger.icon} {trigger.label}
            </option>
          ))}
        </select>
        {selectedTriggerMeta && (
          <p className="mt-2 text-sm text-gray-600">{selectedTriggerMeta.description}</p>
        )}
      </div>

      {/* Trigger Configuration */}
      {selectedTrigger && selectedTriggerMeta?.requiresConfig && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">{tStatic('common:auto.frontend.kd8b93ca98bd6')}</h4>

          {/* EVENT_STARTS_IN Configuration */}
          {selectedTrigger === TriggerType.EVENT_STARTS_IN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.kc1075a1902a4')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={triggerConfig.minutes || 30}
                  onChange={handleMinutesChange}
                  min={1}
                  max={10080}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{tStatic('common:auto.frontend.kbe2e2bb698c7')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {tStatic('common:auto.frontend.k16ba14395eb7')}</p>
              <div className="mt-2 text-xs text-gray-600">
                <div className="font-medium mb-1">{tStatic('common:auto.frontend.k13cebeb9705b')}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 5 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.kb45ebd80dec0')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 15 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.k1028d69a2fee')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 30 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.kd3ddf7a34d22')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 60 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.kf030c3d66765')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 1440 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.k2d8a6f7c3446')}</button>
                </div>
              </div>
            </div>
          )}

          {/* EVENT_ENDS_IN Configuration */}
          {selectedTrigger === TriggerType.EVENT_ENDS_IN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.k8f6459a3077f')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={triggerConfig.minutes || 15}
                  onChange={handleMinutesChange}
                  min={1}
                  max={10080}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{tStatic('common:auto.frontend.kbe2e2bb698c7')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {tStatic('common:auto.frontend.k16ba14395eb7')}</p>
              <div className="mt-2 text-xs text-gray-600">
                <div className="font-medium mb-1">{tStatic('common:auto.frontend.k13cebeb9705b')}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 5 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.kb45ebd80dec0')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 10 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.k4605ee7759dc')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 15 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.k1028d69a2fee')}</button>
                  <button
                    type="button"
                    onClick={() => onConfigChange({ minutes: 30 })}
                    className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs"
                  >
                    {tStatic('common:auto.frontend.kd3ddf7a34d22')}</button>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULED_TIME Configuration */}
          {selectedTrigger === TriggerType.SCHEDULED_TIME && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.ke2702556b274')}</label>
              <input
                type="text"
                value={triggerConfig.cronExpression || ''}
                onChange={handleCronChange}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {tStatic('common:auto.frontend.kf6d94be269ad')}</p>
              <div className="mt-2 text-xs text-gray-600">
                <div className="font-medium mb-1">{tStatic('common:auto.frontend.kdc540ff7034f')}</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">0 9 * * *</span>
                    <span className="text-gray-500">{tStatic('common:auto.frontend.ka342b4341cfd')}</span>
                    <button
                      type="button"
                      onClick={() => onConfigChange({ cronExpression: '0 9 * * *' })}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      {tStatic('common:auto.frontend.k1d4d43cc6f3a')}</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">0 9 * * 1-5</span>
                    <span className="text-gray-500">{tStatic('common:auto.frontend.k5d5d7d5d5533')}</span>
                    <button
                      type="button"
                      onClick={() => onConfigChange({ cronExpression: '0 9 * * 1-5' })}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      {tStatic('common:auto.frontend.k1d4d43cc6f3a')}</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">0 0 1 * *</span>
                    <span className="text-gray-500">{tStatic('common:auto.frontend.k424ea84adf15')}</span>
                    <button
                      type="button"
                      onClick={() => onConfigChange({ cronExpression: '0 0 1 * *' })}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      {tStatic('common:auto.frontend.k1d4d43cc6f3a')}</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">0 */6 * * *</span>
                    <span className="text-gray-500">{tStatic('common:auto.frontend.kd146d2a201f4')}</span>
                    <button
                      type="button"
                      onClick={() => onConfigChange({ cronExpression: '0 */6 * * *' })}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      {tStatic('common:auto.frontend.k1d4d43cc6f3a')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info for triggers without config */}
      {selectedTrigger &&
        !selectedTriggerMeta?.requiresConfig &&
        (selectedTrigger === TriggerType.EVENT_CREATED ||
          selectedTrigger === TriggerType.EVENT_UPDATED ||
          selectedTrigger === TriggerType.EVENT_DELETED) && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              {tStatic('common:auto.frontend.kc39c00fb0169')}</p>
          </div>
        )}

      {selectedTrigger && selectedTrigger === TriggerType.CALENDAR_IMPORTED && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            {tStatic('common:auto.frontend.k735aea049a47')}</p>
        </div>
      )}
    </div>
  );
};


