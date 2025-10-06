import { useState, useEffect, useCallback } from 'react';
import {
  AutomationRuleDto,
  AutomationRuleDetailDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  PaginationState,
  AutomationFilters,
  TriggerType,
} from '../types/Automation';
import {
  getAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  executeRuleNow,
} from '../services/automationService';

interface UseAutomationRulesReturn {
  // Data
  rules: AutomationRuleDto[];
  selectedRule: AutomationRuleDetailDto | null;
  isLoading: boolean;
  error: string | null;

  // Pagination
  pagination: PaginationState;

  // Filters
  filters: AutomationFilters;

  // Actions
  fetchRules: () => Promise<void>;
  fetchRuleById: (ruleId: number) => Promise<void>;
  createRule: (ruleData: CreateAutomationRuleDto, runRetroactively?: boolean) => Promise<AutomationRuleDetailDto>;
  updateRule: (ruleId: number, updateData: UpdateAutomationRuleDto) => Promise<AutomationRuleDetailDto>;
  deleteRule: (ruleId: number) => Promise<void>;
  toggleRule: (ruleId: number, enabled: boolean) => Promise<void>;
  executeRule: (ruleId: number) => Promise<{ message: string; executionCount: number }>;

  // Filter/Pagination actions
  setPage: (page: number) => void;
  setFilters: (filters: Partial<AutomationFilters>) => void;
  resetFilters: () => void;

  // UI state
  clearError: () => void;
  clearSelectedRule: () => void;
}

const initialFilters: AutomationFilters = {
  search: '',
  statusFilter: 'all',
  triggerTypeFilter: 'all',
};

const initialPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export function useAutomationRules(): UseAutomationRulesReturn {
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRuleDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [filters, setFiltersState] = useState<AutomationFilters>(initialFilters);

  // Fetch rules with current pagination and filters
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const enabledFilter =
        filters.statusFilter === 'enabled'
          ? true
          : filters.statusFilter === 'disabled'
            ? false
            : undefined;

      const response = await getAutomationRules(
        pagination.page,
        pagination.limit,
        enabledFilter
      );

      // Apply client-side filtering for search and trigger type
      let filteredRules = response.data;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredRules = filteredRules.filter(
          (rule) =>
            rule.name.toLowerCase().includes(searchLower) ||
            rule.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.triggerTypeFilter !== 'all') {
        filteredRules = filteredRules.filter(
          (rule) => rule.triggerType === filters.triggerTypeFilter
        );
      }

      setRules(filteredRules);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
      console.error('Error fetching automation rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch a single rule by ID
  const fetchRuleById = useCallback(async (ruleId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const rule = await getAutomationRule(ruleId);
      setSelectedRule(rule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rule');
      console.error('Error fetching automation rule:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new rule
  const createRule = useCallback(
    async (
      ruleData: CreateAutomationRuleDto,
      runRetroactively: boolean = false
    ): Promise<AutomationRuleDetailDto> => {
      setIsLoading(true);
      setError(null);

      try {
        const newRule = await createAutomationRule(ruleData);

        // Execute retroactively if requested
        if (runRetroactively && newRule.id) {
          try {
            await executeRuleNow(newRule.id);
          } catch (execErr) {
            console.error('Retroactive execution failed:', execErr);
            // Don't fail the creation, just log the error
          }
        }

        // Refresh the rules list
        await fetchRules();

        return newRule;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create rule';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRules]
  );

  // Update an existing rule
  const updateRule = useCallback(
    async (
      ruleId: number,
      updateData: UpdateAutomationRuleDto
    ): Promise<AutomationRuleDetailDto> => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedRule = await updateAutomationRule(ruleId, updateData);

        // Update the rule in the list
        setRules((prevRules) =>
          prevRules.map((rule) => (rule.id === ruleId ? updatedRule : rule))
        );

        // Update selected rule if it's the one being updated
        if (selectedRule?.id === ruleId) {
          setSelectedRule(updatedRule);
        }

        return updatedRule;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update rule';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRule]
  );

  // Delete a rule
  const deleteRule = useCallback(
    async (ruleId: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await deleteAutomationRule(ruleId);

        // Remove the rule from the list
        setRules((prevRules) => prevRules.filter((rule) => rule.id !== ruleId));

        // Clear selected rule if it's the one being deleted
        if (selectedRule?.id === ruleId) {
          setSelectedRule(null);
        }

        // Refresh to update pagination
        await fetchRules();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete rule';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRules, selectedRule]
  );

  // Toggle rule enabled/disabled
  const toggleRule = useCallback(
    async (ruleId: number, enabled: boolean): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedRule = await toggleAutomationRule(ruleId, enabled);

        // Update the rule in the list
        setRules((prevRules) =>
          prevRules.map((rule) => (rule.id === ruleId ? updatedRule : rule))
        );

        // Update selected rule if it's the one being toggled
        if (selectedRule?.id === ruleId) {
          setSelectedRule(updatedRule);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to toggle rule';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedRule]
  );

  // Execute rule retroactively
  const executeRule = useCallback(
    async (ruleId: number): Promise<{ message: string; executionCount: number }> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await executeRuleNow(ruleId);

        // Refresh the rule to update execution stats
        await fetchRuleById(ruleId);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute rule';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRuleById]
  );

  // Set page number
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<AutomationFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setPagination(initialPagination);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear selected rule
  const clearSelectedRule = useCallback(() => {
    setSelectedRule(null);
  }, []);

  // Fetch rules on mount and when pagination/filters change
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    // Data
    rules,
    selectedRule,
    isLoading,
    error,

    // Pagination
    pagination,

    // Filters
    filters,

    // Actions
    fetchRules,
    fetchRuleById,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    executeRule,

    // Filter/Pagination actions
    setPage,
    setFilters,
    resetFilters,

    // UI state
    clearError,
    clearSelectedRule,
  };
}
