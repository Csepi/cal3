import type { AutomationRuleDto } from '../../types/Automation';
import { useAutomationMetadata } from '../../hooks/useAutomationMetadata';
import { formatRelativeTime } from '../../services/automationService';

import { tStatic } from '../../i18n';

interface AutomationRuleCardProps {
  rule: AutomationRuleDto;
  themeColor: string;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

export function AutomationRuleCard({
  rule,
  themeColor,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: AutomationRuleCardProps) {
  const { getTriggerTypeLabel } = useAutomationMetadata();

  const triggerLabel = getTriggerTypeLabel(rule.triggerType);
  const triggerIcon = getTriggerIcon(rule.triggerType);

  // Calculate opacity for disabled rules
  const cardOpacity = rule.isEnabled ? 'opacity-100' : 'opacity-60';
  const isEnabledClass = rule.isEnabled ? '' : 'grayscale';

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${cardOpacity}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Toggle Switch */}
          <button
            onClick={() => onToggle(rule.id, !rule.isEnabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              rule.isEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={rule.isEnabled ? 'Enabled' : 'Disabled'}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                rule.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Rule Name */}
          <h3
            className={`text-lg font-semibold text-gray-900 cursor-pointer hover:underline ${isEnabledClass}`}
            onClick={() => onView(rule.id)}
          >
            {rule.name}
          </h3>
        </div>

        {/* Actions Menu */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(rule.id)}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title={tStatic('common:auto.frontend.k5301648dcf6b')}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title={tStatic('common:auto.frontend.kf6fdbe48dc54')}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Divider with gradient */}
      <div
        className={`h-0.5 mb-3 ${isEnabledClass}`}
        style={{
          background: rule.isEnabled
            ? `linear-gradient(to right, ${themeColor}, transparent)`
            : 'linear-gradient(to right, #9ca3af, transparent)',
        }}
      />

      {/* Description */}
      {rule.description && (
        <p className={`text-sm text-gray-600 mb-3 ${isEnabledClass}`}>
          {rule.description}
        </p>
      )}

      {/* Trigger Info */}
      <div className={`flex items-center gap-2 mb-3 ${isEnabledClass}`}>
        <span className="text-lg">{triggerIcon}</span>
        <span className="text-sm font-medium text-gray-700">{triggerLabel}</span>
        {rule.triggerConfig && Object.keys(rule.triggerConfig).length > 0 && (
          <span className="text-xs text-gray-500">
            ({formatTriggerConfig(rule.triggerConfig)})
          </span>
        )}
      </div>

      {/* Conditions and Actions Summary */}
      <div className={`flex items-center gap-4 text-sm text-gray-600 mb-3 ${isEnabledClass}`}>
        <div className="flex items-center gap-1">
          <span>✓</span>
          <span>
            {rule.conditionLogic === 'AND' ? 'All' : 'Any'} {tStatic('common:auto.frontend.kf8eb525d26e1')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚡</span>
          <span>{tStatic('common:auto.frontend.k00a3a8000a9b')}</span>
        </div>
      </div>

      {/* Execution Stats */}
      <div className={`flex items-center gap-4 text-xs text-gray-500 ${isEnabledClass}`}>
        <div className="flex items-center gap-1">
          <span>📊</span>
          <span>
            {rule.executionCount} {tStatic('common:auto.frontend.k1e2147459888')}{rule.executionCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>⏱️</span>
          <span>{tStatic('common:auto.frontend.k32261df5e59a')}{formatRelativeTime(rule.lastExecutedAt)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onView(rule.id)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          {tStatic('common:auto.frontend.k907b3bee2778')}</button>
        <button
          onClick={() => onEdit(rule.id)}
          className="px-3 py-1 text-sm text-white rounded hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          {tStatic('common:auto.frontend.k5301648dcf6b')}</button>
      </div>
    </div>
  );
}

// Helper function to get trigger icon
function getTriggerIcon(triggerType: string): string {
  const icons: Record<string, string> = {
    'event.created': '📅',
    'event.updated': '✏️',
    'event.deleted': '🗑️',
    'event.starts_in': '⏰',
    'event.ends_in': '⏱️',
    'calendar.imported': '🔄',
    'scheduled.time': '⏲️',
  };
  return icons[triggerType] || '🤖';
}

// Helper function to format trigger config
function formatTriggerConfig(config: Record<string, any>): string {
  if (typeof config.minutes === 'number') {
    const hours = Math.floor(config.minutes / 60);
    const mins = config.minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m before`;
    } else if (hours > 0) {
      return `${hours}h before`;
    } else {
      return `${mins}m before`;
    }
  }
  if (config.cronExpression) {
    return String(config.cronExpression);
  }
  return JSON.stringify(config);
}


