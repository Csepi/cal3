import React, { useState } from 'react';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import type { AutomationRuleDetailDto, CreateAutomationRuleDto, UpdateAutomationRuleDto } from '../../types/Automation';
import { AutomationList } from './AutomationList';
import { AutomationRuleModal } from './AutomationRuleModal';
import { AutomationDetailView } from './AutomationDetailView';
import { DeleteRuleDialog } from './dialogs/DeleteRuleDialog';

interface AutomationPanelProps {
  themeColor?: string;
}

export function AutomationPanel({ themeColor = '#3b82f6' }: AutomationPanelProps) {
  const {
    rules,
    selectedRule,
    isLoading,
    error,
    pagination,
    filters,
    fetchRules,
    fetchRuleById,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    setPage,
    setFilters,
    resetFilters,
    clearError,
    clearSelectedRule,
  } = useAutomationRules();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRuleDetailDto | undefined>(undefined);
  const [searchValue, setSearchValue] = useState('');
  const [deleteDialogRule, setDeleteDialogRule] = useState<AutomationRuleDetailDto | null>(null);

  // Handle view rule details
  const handleViewRule = (ruleId: number) => {
    fetchRuleById(ruleId);
  };

  // Handle create new rule
  const handleCreateRule = () => {
    setEditingRule(undefined);
    setModalOpen(true);
  };

  // Handle edit rule
  const handleEditRule = async (ruleId: number) => {
    // Fetch full rule details (includes conditions and actions)
    const fullRule = await fetchRuleById(ruleId);
    if (fullRule) {
      setEditingRule(fullRule);
      setModalOpen(true);
    }
  };

  // Handle delete rule - open dialog
  const handleDeleteRule = async (ruleId: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setDeleteDialogRule(rule as AutomationRuleDetailDto);
    }
  };

  // Confirm delete from dialog
  const confirmDeleteRule = async () => {
    if (deleteDialogRule) {
      try {
        await deleteRule(deleteDialogRule.id);
        setDeleteDialogRule(null);
      } catch (err) {
        console.error('Failed to delete rule:', err);
        throw err;
      }
    }
  };

  // Handle toggle rule
  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      await toggleRule(ruleId, enabled);
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  // Handle save rule (create or update)
  const handleSaveRule = async (ruleData: CreateAutomationRuleDto | UpdateAutomationRuleDto) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, ruleData as UpdateAutomationRuleDto);
      } else {
        await createRule(ruleData as CreateAutomationRuleDto);
      }
      setModalOpen(false);
      setEditingRule(undefined);
    } catch (err) {
      console.error('Failed to save rule:', err);
      throw err;
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRule(undefined);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({ search: value });
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: 'all' | 'enabled' | 'disabled') => {
    setFilters({ statusFilter: status });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  // Show detail view if a rule is selected
  if (selectedRule) {
    return (
      <AutomationDetailView
        rule={selectedRule}
        onBack={clearSelectedRule}
        onUpdate={fetchRules}
        onSave={updateRule}
        onToggle={(enabled) => handleToggleRule(selectedRule.id, enabled)}
        onDelete={async () => {
          await handleDeleteRule(selectedRule.id);
          clearSelectedRule();
        }}
        themeColor={themeColor}
      />
    );
  }

  return (
    <div className="automation-panel h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Automation Rules</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create rules to automate your calendar workflows
            </p>
          </div>
          <button
            onClick={handleCreateRule}
            style={{ backgroundColor: themeColor }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>New Rule</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search rules by name or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.statusFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilterChange('enabled')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.statusFilter === 'enabled'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Enabled
            </button>
            <button
              onClick={() => handleStatusFilterChange('disabled')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.statusFilter === 'disabled'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span>
            Total: <strong>{pagination.total}</strong>
          </span>
          <span>
            Enabled: <strong>{rules.filter((r) => r.isEnabled).length}</strong>
          </span>
          <span>
            Disabled: <strong>{rules.filter((r) => !r.isEnabled).length}</strong>
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto">
        <AutomationList
          rules={rules}
          isLoading={isLoading}
          themeColor={themeColor}
          onView={(id) => handleViewRule(id)}
          onEdit={(id) => handleEditRule(id)}
          onDelete={(id) => handleDeleteRule(id)}
          onToggle={(id, enabled) => handleToggleRule(id, enabled)}
        />
      </div>
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <AutomationRuleModal
          rule={editingRule}
          onClose={handleCloseModal}
          onSave={handleSaveRule}
          themeColor={themeColor}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogRule && (
        <DeleteRuleDialog
          rule={deleteDialogRule}
          onConfirm={confirmDeleteRule}
          onCancel={() => setDeleteDialogRule(null)}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}
