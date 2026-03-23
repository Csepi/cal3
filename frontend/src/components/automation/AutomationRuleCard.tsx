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

  const cardOpacity = rule.isEnabled ? 'opacity-100' : 'opacity-60';
  const isEnabledClass = rule.isEnabled ? '' : 'grayscale';

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${cardOpacity}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
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

          <h3
            className={`text-lg font-semibold text-gray-900 cursor-pointer hover:underline ${isEnabledClass}`}
            onClick={() => onView(rule.id)}
          >
            {rule.name}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(rule.id)}
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title={tStatic('common:auto.frontend.k5301648dcf6b')}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="text-gray-500 hover:text-red-600 transition-colors"
            title={tStatic('common:auto.frontend.kf6fdbe48dc54')}
          >
            Delete
          </button>
        </div>
      </div>

      <div
        className={`h-0.5 mb-3 ${isEnabledClass}`}
        style={{
          background: rule.isEnabled
            ? `linear-gradient(to right, ${themeColor}, transparent)`
            : 'linear-gradient(to right, #9ca3af, transparent)',
        }}
      />

      {rule.description && (
        <p className={`text-sm text-gray-600 mb-3 ${isEnabledClass}`}>
          {rule.description}
        </p>
      )}

      <div className={`flex items-center gap-2 mb-3 ${isEnabledClass}`}>
        <span className="text-lg">{triggerIcon}</span>
        <span className="text-sm font-medium text-gray-700">{triggerLabel}</span>
        {rule.triggerConfig && Object.keys(rule.triggerConfig).length > 0 && (
          <span className="text-xs text-gray-500">
            ({formatTriggerConfig(rule.triggerConfig)})
          </span>
        )}
      </div>

      <div className={`flex items-center gap-4 text-sm text-gray-600 mb-3 ${isEnabledClass}`}>
        <div className="flex items-center gap-1">
          <span>{rule.conditionLogic === 'AND' ? 'All' : 'Any'} conditions</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Actions configured</span>
        </div>
      </div>

      <div className={`flex items-center gap-4 text-xs text-gray-500 ${isEnabledClass}`}>
        <div className="flex items-center gap-1">
          <span>{rule.executionCount} runs</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Last run: {formatRelativeTime(rule.lastExecutedAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onView(rule.id)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          {tStatic('common:auto.frontend.k907b3bee2778')}
        </button>
        <button
          onClick={() => onEdit(rule.id)}
          className="px-3 py-1 text-sm text-white rounded hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          {tStatic('common:auto.frontend.k5301648dcf6b')}
        </button>
      </div>
    </div>
  );
}

function getTriggerIcon(triggerType: string): string {
  const icons: Record<string, string> = {
    'event.created': 'E+',
    'event.updated': 'E*',
    'event.deleted': 'E-',
    'event.starts_in': 'T-',
    'event.ends_in': 'T!',
    relative_time_to_event: 'RT',
    'calendar.imported': 'CI',
    'scheduled.time': 'CRON',
  };
  return icons[triggerType] || 'AUTO';
}

function formatTriggerConfig(config: Record<string, any>): string {
  if (config.offset && typeof config.offset === 'object') {
    const offset = config.offset as {
      value?: number;
      unit?: string;
      direction?: string;
    };
    const referenceTime =
      config.referenceTime && typeof config.referenceTime === 'object'
        ? (config.referenceTime as { base?: string })
        : undefined;
    const calendarCount = Array.isArray(config.eventFilter?.calendarIds)
      ? config.eventFilter.calendarIds.length
      : 0;

    const value = Number.isFinite(offset.value) ? Number(offset.value) : 0;
    const unit = typeof offset.unit === 'string' ? offset.unit : 'minutes';
    const direction = offset.direction === 'after' ? 'after' : 'before';
    const base = referenceTime?.base === 'end' ? 'end' : 'start';
    const calendarText =
      calendarCount > 0
        ? `, ${calendarCount} calendar${calendarCount === 1 ? '' : 's'}`
        : '';
    return `${value} ${unit} ${direction} ${base}${calendarText}`;
  }

  if (typeof config.minutes === 'number') {
    const hours = Math.floor(config.minutes / 60);
    const mins = config.minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m before`;
    }
    if (hours > 0) {
      return `${hours}h before`;
    }
    return `${mins}m before`;
  }

  if (config.cronExpression) {
    return String(config.cronExpression);
  }

  return JSON.stringify(config);
}
