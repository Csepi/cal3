import { useMemo, useState } from 'react';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import type {
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '../../types/Automation';
import { AutomationList } from './AutomationList';
import { AutomationRuleModal } from './AutomationRuleModal';
import { AutomationDetailView } from './AutomationDetailView';
import { DeleteRuleDialog } from './dialogs/DeleteRuleDialog';
import { getThemeConfig } from '../../constants/theme';
import { useScreenSize } from '../../hooks/useScreenSize';

interface AutomationPanelProps {
  themeColor?: string;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized.padEnd(6, '0').slice(0, 6);
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const STATUS_OPTIONS: Array<{ label: string; value: 'all' | 'enabled' | 'disabled' }> = [
  { label: 'All', value: 'all' },
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' },
];

export function AutomationPanel({ themeColor = '#3b82f6' }: AutomationPanelProps) {
  const { isMobile } = useScreenSize();
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
  const [editingRule, setEditingRule] = useState<AutomationRuleDetailDto | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [deleteDialogRule, setDeleteDialogRule] = useState<AutomationRuleDetailDto | null>(null);

  const theme = useMemo(() => getThemeConfig(themeColor), [themeColor]);
  const gradientBackground = `bg-gradient-to-br ${theme.gradient.background}`;
  const borderTint = hexToRgba(themeColor, 0.25);
  const accentTint = hexToRgba(themeColor, 0.12);
  const activeFilterShadow = `0 18px 40px ${hexToRgba(themeColor, 0.24)}`;

  const handleViewRule = (ruleId: number) => {
    fetchRuleById(ruleId);
  };

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setModalOpen(true);
  };

  const handleEditRule = async (ruleId: number) => {
    const fullRule = await fetchRuleById(ruleId);
    if (fullRule) {
      setEditingRule(fullRule);
      setModalOpen(true);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setDeleteDialogRule(rule as AutomationRuleDetailDto);
    }
  };

  const confirmDeleteRule = async () => {
    if (!deleteDialogRule) {
      return;
    }

    try {
      await deleteRule(deleteDialogRule.id);
      setDeleteDialogRule(null);
    } catch (err) {
      console.error('Failed to delete rule:', err);
      throw err;
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      await toggleRule(ruleId, enabled);
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

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

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRule(undefined);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({ search: value });
  };

  const handleStatusFilterChange = (status: 'all' | 'enabled' | 'disabled') => {
    setFilters({ statusFilter: status });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleResetFilters = () => {
    setSearchValue('');
    resetFilters();
  };

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

  const hasActiveFilters = filters.statusFilter !== 'all' || searchValue.trim().length > 0;

  return (
    <div className={`relative min-h-screen ${isMobile ? 'bg-gray-50' : gradientBackground}`}>
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-30"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.4)} 0%, transparent 70%)` }}
          />
          <div
            className="absolute -bottom-44 -left-40 h-80 w-80 animate-pulse rounded-full blur-3xl opacity-25 animation-delay-2000"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.35)} 0%, transparent 70%)` }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-3xl opacity-20 animation-delay-4000"
            style={{ background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.3)} 0%, transparent 75%)` }}
          />
        </div>
      )}

      <header
        className={`relative z-10 border-b bg-white/70 backdrop-blur-sm ${isMobile ? 'py-4' : 'py-6'}`}
        style={{ borderColor: borderTint }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold" style={{ color: themeColor }}>
              Automation Rules
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              Monitor, compose, and optimise rule-driven workflows across your organization.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateRule}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${theme.button} ${theme.focus}`}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              +
            </span>
            <span>Create rule</span>
          </button>
        </div>
      </header>

      <main className={`relative z-10 mx-auto max-w-7xl ${isMobile ? 'p-4 pt-6' : 'p-6 mt-6'}`}>
        <div
          className="rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-white/90"
          style={{ borderColor: borderTint }}
        >
          <section
            className="rounded-2xl border bg-white/70 p-6 shadow-sm"
            style={{ borderColor: borderTint }}
            aria-labelledby="automation-filters"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full lg:max-w-md">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="automation-search">
                  Search rules
                </label>
                <input
                  id="automation-search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, trigger, or action…"
                  className={`mt-2 w-full rounded-xl border bg-white/90 px-4 py-2.5 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 ${theme.focus}`}
                  style={{ borderColor: borderTint }}
                />
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span id="automation-filters" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </span>
                {STATUS_OPTIONS.map((option) => {
                  const isActive = filters.statusFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusFilterChange(option.value)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${
                        isActive ? 'text-white' : 'text-slate-600 hover:-translate-y-0.5'
                      } ${theme.focus}`}
                      style={
                        isActive
                          ? { backgroundColor: themeColor, borderColor: themeColor, boxShadow: activeFilterShadow }
                          : { borderColor: borderTint, backgroundColor: 'rgba(255,255,255,0.9)' }
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline focus:outline-none"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            <div
              className="mt-6 flex flex-wrap gap-4 rounded-xl border px-4 py-3 text-sm text-slate-600 shadow-inner"
              style={{ borderColor: borderTint, backgroundColor: accentTint }}
            >
              <span>
                Total: <strong className="text-slate-900">{pagination.total}</strong>
              </span>
              <span>
                Enabled: <strong className="text-slate-900">{rules.filter((rule) => rule.isEnabled).length}</strong>
              </span>
              <span>
                Disabled: <strong className="text-slate-900">{rules.filter((rule) => !rule.isEnabled).length}</strong>
              </span>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-red-900">Automation service error</p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-sm font-medium text-red-600 transition hover:text-red-700 focus:outline-none focus:underline"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <section
            className="mt-6 rounded-2xl border bg-white/70 p-6 shadow-sm"
            style={{ borderColor: borderTint }}
            aria-live="polite"
          >
            <AutomationList
              rules={rules}
              isLoading={isLoading}
              themeColor={themeColor}
              onView={handleViewRule}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
              onToggle={handleToggleRule}
            />
          </section>

          {pagination.totalPages > 1 && (
            <nav
              className="mt-6 flex flex-col gap-3 rounded-2xl border bg-white/70 px-6 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: borderTint }}
              aria-label="Automation pagination"
            >
              <div>
                Page <strong className="text-slate-900">{pagination.page}</strong> of{' '}
                <strong className="text-slate-900">{pagination.totalPages}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`rounded-lg border px-3 py-1.5 font-medium transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.focus}`}
                  style={{ borderColor: borderTint }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`rounded-lg border px-3 py-1.5 font-medium transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.focus}`}
                  style={{ borderColor: borderTint }}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </main>

      {modalOpen && (
        <AutomationRuleModal
          rule={editingRule}
          onClose={handleCloseModal}
          onSave={handleSaveRule}
          themeColor={themeColor}
        />
      )}

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

