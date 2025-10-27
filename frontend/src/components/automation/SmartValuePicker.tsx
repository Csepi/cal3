import React, { useState, useEffect } from 'react';
import { TriggerType } from '../../types/Automation';

interface SmartValue {
  field: string;
  label: string;
  description: string;
  category: string;
}

interface SmartValuePickerProps {
  triggerType: TriggerType | null;
  onInsert: (smartValue: string) => void;
}

export const SmartValuePicker: React.FC<SmartValuePickerProps> = ({
  triggerType,
  onInsert,
}) => {
  const [smartValues, setSmartValues] = useState<SmartValue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch smart values when trigger type changes
  useEffect(() => {
    if (triggerType && isOpen) {
      fetchSmartValues();
    }
  }, [triggerType, isOpen]);

  const fetchSmartValues = async () => {
    if (!triggerType) return;

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        `${baseUrl}/api/automation/smart-values/${triggerType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSmartValues(data);
      }
    } catch (error) {
      console.error('Failed to fetch smart values:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (field: string) => {
    onInsert(`{{${field}}}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredValues = smartValues.filter(
    (sv) =>
      sv.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sv.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sv.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedValues = filteredValues.reduce((acc, sv) => {
    if (!acc[sv.category]) {
      acc[sv.category] = [];
    }
    acc[sv.category].push(sv);
    return acc;
  }, {} as Record<string, SmartValue[]>);

  if (!triggerType) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
      >
        <span>✨</span>
        <span>Insert Smart Value</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Panel */}
          <div className="absolute top-full left-0 mt-2 w-96 max-h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Smart Values
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search smart values..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading smart values...
                </div>
              ) : filteredValues.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No smart values found
                </div>
              ) : (
                Object.entries(groupedValues).map(([category, values]) => (
                  <div key={category} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {category}
                    </div>
                    {values.map((sv) => (
                      <button
                        key={sv.field}
                        type="button"
                        onClick={() => handleInsert(sv.field)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {sv.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                            {`{{${sv.field}}}`}
                          </code>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sv.description}
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Smart values are replaced with actual data when the action executes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
