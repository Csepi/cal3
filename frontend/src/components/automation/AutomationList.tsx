import type { AutomationRuleDto } from '../../types/Automation';
import { AutomationRuleCard } from './AutomationRuleCard';

import { tStatic } from '../../i18n';

interface AutomationListProps {
  rules: AutomationRuleDto[];
  isLoading: boolean;
  themeColor: string;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}

export function AutomationList({
  rules,
  isLoading,
  themeColor,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: AutomationListProps) {
  // Loading state
  if (isLoading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div
            className="inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
            style={{ borderTopColor: themeColor }}
          />
          <p className="mt-4 text-gray-600">{tStatic('common:auto.frontend.k5571ca76c61a')}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {tStatic('common:auto.frontend.ke427e71e398a')}</h3>
          <p className="text-gray-600">
            {tStatic('common:auto.frontend.k2dbf6dfeddb6')}</p>
          <p className="text-sm text-gray-500 mt-4">
            {tStatic('common:auto.frontend.k69f563729f25')}</p>
        </div>
      </div>
    );
  }

  // Rules list
  return (
    <div className="p-6 space-y-4">
      {rules.map((rule) => (
        <AutomationRuleCard
          key={rule.id}
          rule={rule}
          themeColor={themeColor}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}

      {/* Loading indicator for pagination */}
      {isLoading && rules.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div
            className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
            style={{ borderTopColor: themeColor }}
          />
        </div>
      )}
    </div>
  );
}
