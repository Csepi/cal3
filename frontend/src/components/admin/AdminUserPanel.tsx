
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader, Button, Input, Modal, Badge } from "../ui";
import {
  loadAdminData,
  formatAdminError,
  bulkUpdateUsagePlans,
  bulkDelete,
  adminApiCall,
} from "./adminApiService";
import type { User, Organisation } from "./types";
import { USAGE_PLAN_OPTIONS } from "../../constants";

import { tStatic } from '../../i18n';

export interface AdminUserPanelProps {
  themeColor?: string;
  isActive?: boolean;
  onDataChange?: () => void;
}

type Filters = {
  search: string;
  role: "all" | string;
  status: "all" | "active" | "inactive";
  plan: "all" | string;
};

type Feedback = { type: "success" | "error"; message: string } | null;

type UsagePlanOperation = "set" | "add" | "remove";

const normalizePlan = (plan: string) => plan.toLowerCase();

const hasRequiredOrgPlan = (plans: string[]) =>
  plans.some((plan) => ["store", "enterprise"].includes(normalizePlan(plan)));

const resolvePlanLabel = (value: string) =>
  USAGE_PLAN_OPTIONS.find((option) => normalizePlan(option.value) === normalizePlan(value))?.label ?? value;

const toPayloadPlans = (plans: string[]) =>
  plans.map((plan) => normalizePlan(plan));

const getDisplayName = (user: User) => {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.username || user.email || `User #${user.id}`;
};
export const AdminUserPanel: React.FC<AdminUserPanelProps> = ({
  themeColor = "#3b82f6",
  isActive = false,
  onDataChange,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    role: "all",
    status: "all",
    plan: "all",
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [profileDraft, setProfileDraft] = useState<User | null>(null);
  const [plansDraft, setPlansDraft] = useState<string[]>([]);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPlans, setBulkPlans] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<UsagePlanOperation>("set");

  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgAssignments, setOrgAssignments] = useState<Array<Organisation & { role?: string }>>([]);
  const [orgOptions, setOrgOptions] = useState<Organisation[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);

  const selectedUser = useMemo(
    () => (selectedUserId ? users.find((user) => user.id === selectedUserId) ?? null : null),
    [users, selectedUserId],
  );

  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      if (query) {
        const matches =
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (filters.role !== "all" && user.role !== filters.role) return false;
      if (filters.status === "active" && !user.isActive) return false;
      if (filters.status === "inactive" && user.isActive) return false;
      if (
        filters.plan !== "all" &&
        !(user.usagePlans ?? []).some((plan) => normalizePlan(plan) === filters.plan)
      ) {
        return false;
      }
      return true;
    });
  }, [users, filters]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const admins = users.filter((user) => user.role === "admin").length;
    return { total, active, admins };
  }, [users]);

  const setError = (error: unknown) => setFeedback({ type: "error", message: formatAdminError(error) });
  const setSuccess = (message: string) => setFeedback({ type: "success", message });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadAdminData<User[]>("/admin/users");
      setUsers(data);
      onDataChange?.();
      setSelectedUserId((current) => {
        if (current !== null && data.some((user) => user.id === current)) {
          return current;
        }
        return data.length > 0 ? data[0].id : null;
      });
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [onDataChange]);

  useEffect(() => {
    if (isActive) void loadUsers();
  }, [isActive, loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      setProfileDraft({
        ...selectedUser,
        usagePlans: selectedUser.usagePlans ?? [],
      });
      setPlansDraft(selectedUser.usagePlans ?? []);
    } else {
      setProfileDraft(null);
      setPlansDraft([]);
    }
  }, [selectedUser]);
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSelection = (userId: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, userId])) : prev.filter((id) => id !== userId),
    );
  };

  const toggleSelectAll = () => {
    if (filteredUsers.every((user) => selectedIds.includes(user.id))) {
      const ids = new Set(filteredUsers.map((user) => user.id));
      setSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredUsers.map((user) => user.id)])));
    }
  };

  const handleSaveProfile = async () => {
    if (!profileDraft) return;
    try {
      setSavingProfile(true);
      await adminApiCall({
        endpoint: `/admin/users/${profileDraft.id}`,
        method: "PATCH",
        data: {
          username: profileDraft.username,
          email: profileDraft.email,
          firstName: profileDraft.firstName,
          lastName: profileDraft.lastName,
          role: profileDraft.role,
          isActive: profileDraft.isActive,
        },
      });
      setSuccess(tStatic('common:auto.frontend.kbcf7629607f8'));
      await loadUsers();
    } catch (error) {
      setError(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePlans = async () => {
    if (!selectedUser) return;
    try {
      setSavingPlans(true);
      const updatedUser = await adminApiCall({
        endpoint: `/admin/users/${selectedUser.id}/usage-plans`,
        method: "PATCH",
        data: {
          usagePlans: toPayloadPlans(plansDraft),
        },
      });
      if (!updatedUser || typeof updatedUser.id !== "number") {
        throw new Error("Plan update failed");
      }
      setSuccess(tStatic('common:auto.frontend.k6938e9c0dfa8'));
      await loadUsers();
    } catch (error) {
      setError(error);
    } finally {
      setSavingPlans(false);
    }
  };

  const handleBulkPlans = async () => {
    if (selectedIds.length === 0 || bulkPlans.length === 0) return;
    try {
      setBulkProcessing(true);
      const result = await bulkUpdateUsagePlans(selectedIds, toPayloadPlans(bulkPlans), bulkOperation);
      if (result.failed > 0) {
        setError(`Updated ${result.success} user(s); ${result.failed} failed.`);
      } else {
        setSuccess(`Updated ${result.success} user(s).`);
      }
      setBulkPlans([]);
      setBulkModalOpen(false);
      await loadUsers();
    } catch (error) {
      setError(error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)?`)) return;
    try {
      setBulkProcessing(true);
      const result = await bulkDelete("/admin/users", selectedIds);
      if (result.failed > 0) {
        setError(`Deleted ${result.success} user(s); ${result.failed} failed.`);
      } else {
        setSuccess(`Deleted ${result.success} user(s).`);
      }
      setSelectedIds([]);
      await loadUsers();
    } catch (error) {
      setError(error);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (!window.confirm(`Delete ${getDisplayName(user)}? This cannot be undone.`)) return;
    try {
      await adminApiCall({ endpoint: `/admin/users/${userId}`, method: "DELETE" });
      setSuccess(tStatic('common:auto.frontend.k0ba72d0bcef3'));
      await loadUsers();
    } catch (error) {
      setError(error);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      setResettingPassword(true);
      await adminApiCall({
        endpoint: `/admin/users/${selectedUser.id}/reset-password`,
        method: "POST",
      });
      setSuccess(tStatic('common:auto.frontend.kf83f6833ecee'));
    } catch (error) {
      setError(error);
    } finally {
      setResettingPassword(false);
    }
  };

  const loadOrganisations = async (contextUser?: User) => {
    const targetUser = contextUser ?? selectedUser;
    if (!targetUser) return;
    try {
      setOrgLoading(true);
      const [assigned, available] = await Promise.all([
        adminApiCall({ endpoint: `/admin/users/${targetUser.id}/organizations` }),
        adminApiCall({ endpoint: "/admin/organizations" }),
      ]);
      setOrgAssignments(assigned as Array<Organisation & { role?: string }>);
      setOrgOptions(available as Organisation[]);
      setOrgModalOpen(true);
    } catch (error) {
      setError(error);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleAddToOrganisation = async (organisationId: number, role: "admin" | "editor" | "user") => {
    if (!selectedUser) return;
    if (!hasRequiredOrgPlan(plansDraft)) {
      setError(tStatic('common:auto.frontend.kb304cc95467a'));
      return;
    }
    try {
      setOrgLoading(true);
      await adminApiCall({
        endpoint: `/admin/organizations/${organisationId}/users`,
        method: "POST",
        data: { userId: selectedUser.id, role },
      });
      await loadOrganisations();
      await loadUsers();
      setSuccess(tStatic('common:auto.frontend.k38eeb0c37adb'));
    } catch (error) {
      setError(error);
      setOrgLoading(false);
    }
  };

  const handleRemoveFromOrganisation = async (organisationId: number) => {
    if (!selectedUser) return;
    if (!window.confirm(tStatic('common:auto.frontend.k08c3f6da58e6'))) return;
    try {
      setOrgLoading(true);
      await adminApiCall({
        endpoint: `/admin/organizations/${organisationId}/users/${selectedUser.id}`,
        method: "DELETE",
      });
      await loadOrganisations();
      await loadUsers();
      setSuccess(tStatic('common:auto.frontend.k44e59001ed56'));
    } catch (error) {
      setError(error);
      setOrgLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <Card
        themeColor={themeColor}
        padding="lg"
        header={
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.k455e3d3b9905')}</p>
                <h2 className="text-2xl font-semibold text-gray-800">{tStatic('common:auto.frontend.kf2b0141d7883')}</h2>
              </div>
              <div className="flex gap-2">
                <Badge variant="info">{tStatic('common:auto.frontend.kb25928c69902')}{stats.total}</Badge>
                <Badge variant="success">{tStatic('common:auto.frontend.ka733b809d2f1')}{stats.active}</Badge>
                <Badge variant="primary">{tStatic('common:auto.frontend.ked6b52430295')}{stats.admins}</Badge>
              </div>
            </div>
          </CardHeader>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {selectedIds.length ? `${selectedIds.length} user(s) selected` : "No selection"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              <Button
                variant="outline"
                themeColor={themeColor}
                onClick={() => setBulkModalOpen(true)}
                disabled={selectedIds.length === 0}
              >
                {tStatic('common:auto.frontend.ka8b368e79f45')}</Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => void handleBulkDelete()}
                disabled={selectedIds.length === 0 || bulkProcessing}
              >
                {bulkProcessing ? "Working…" : "Delete selected"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder={tStatic('common:auto.frontend.kdb074aa7303e')}
            value={filters.search}
            onChange={(event) => handleFilterChange("search", event.target.value)}
            themeColor={themeColor}
          />
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.role}
            onChange={(event) => handleFilterChange("role", event.target.value)}
          >
            <option value="all">{tStatic('common:auto.frontend.k0caca0d6c549')}</option>
            <option value="user">{tStatic('common:auto.frontend.k57f2b181d0a5')}</option>
            <option value="admin">{tStatic('common:auto.frontend.ked6b52430295')}</option>
          </select>
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.status}
            onChange={(event) => handleFilterChange("status", event.target.value)}
          >
            <option value="all">{tStatic('common:auto.frontend.k6405179d241b')}</option>
            <option value="active">{tStatic('common:auto.frontend.ka733b809d2f1')}</option>
            <option value="inactive">{tStatic('common:auto.frontend.k09af574c7f20')}</option>
          </select>
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.plan}
            onChange={(event) => handleFilterChange("plan", event.target.value)}
          >
            <option value="all">{tStatic('common:auto.frontend.k34a5adb1782c')}</option>
            {USAGE_PLAN_OPTIONS.map((option) => (
              <option key={option.value} value={normalizePlan(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card themeColor={themeColor} padding="lg" className="border border-blue-200 bg-white/85">
          <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
            <span>{filteredUsers.length} {tStatic('common:auto.frontend.k381d833509a1')}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={
                  filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.includes(user.id))
                }
                onChange={toggleSelectAll}
              />
              {tStatic('common:auto.frontend.kd88560ec4c0c')}</label>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">{tStatic('common:auto.frontend.kb6443c996d50')}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
                <span className="text-3xl">??</span>
                <p>{tStatic('common:auto.frontend.k142e017bb44a')}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredUsers.map((user) => {
                  const checked = selectedIds.includes(user.id);
                  const active = selectedUserId === user.id;
                  return (
                    <li
                      key={user.id}
                      className={`rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:shadow-md ${
                        active ? "ring-2 ring-blue-400 ring-offset-2" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={(event) => toggleSelection(user.id, event.target.checked)}
                        />
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className="text-left text-base font-semibold text-gray-800 hover:text-blue-600"
                          >
                            {getDisplayName(user)}
                          </button>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <Badge variant={user.role === "admin" ? "primary" : "default"}>{user.role}</Badge>
                            <Badge variant={user.isActive ? "success" : "danger"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {(user.usagePlans ?? []).length === 0 ? (
                              <Badge variant="default">{tStatic('common:auto.frontend.ke71f35adbc66')}</Badge>
                            ) : (
                              user.usagePlans?.map((plan) => (
                                <Badge key={`${user.id}-${plan}`} variant="info">
                                  {resolvePlanLabel(plan)}
                                </Badge>
                              ))
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              themeColor={themeColor}
                              onClick={() => {
                                setSelectedUserId(user.id);
                                void loadOrganisations(user);
                              }}
                            >
                              {tStatic('common:auto.frontend.k0e0572f90cef')}</Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => void handleDeleteUser(user.id)}
                            >
                              {tStatic('common:auto.frontend.kf6fdbe48dc54')}</Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
        <Card themeColor={themeColor} padding="lg" className="border border-blue-200 bg-white/85">
          {!profileDraft ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-gray-500">
              <span className="text-4xl">??</span>
              <p>{tStatic('common:auto.frontend.ka4d68f92a9eb')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">{tStatic('common:auto.frontend.kff4fc0276e96')}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label={tStatic('common:auto.frontend.k84c29015de33')}
                    value={profileDraft.username ?? ""}
                    onChange={(event) =>
                      setProfileDraft((prev) => prev && { ...prev, username: event.target.value })
                    }
                    themeColor={themeColor}
                  />
                  <Input
                    label={tStatic('common:auto.frontend.k84add5b29527')}
                    type="email"
                    value={profileDraft.email ?? ""}
                    onChange={(event) =>
                      setProfileDraft((prev) => prev && { ...prev, email: event.target.value })
                    }
                    themeColor={themeColor}
                  />
                  <Input
                    label={tStatic('common:auto.frontend.k7e568a90221d')}
                    value={profileDraft.firstName ?? ""}
                    onChange={(event) =>
                      setProfileDraft((prev) => prev && { ...prev, firstName: event.target.value })
                    }
                    themeColor={themeColor}
                  />
                  <Input
                    label={tStatic('common:auto.frontend.kadec36a821f8')}
                    value={profileDraft.lastName ?? ""}
                    onChange={(event) =>
                      setProfileDraft((prev) => prev && { ...prev, lastName: event.target.value })
                    }
                    themeColor={themeColor}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.kc3f104d13657')}</label>
                    <select
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={profileDraft.role}
                      onChange={(event) =>
                        setProfileDraft((prev) => prev && { ...prev, role: event.target.value })
                      }
                    >
                      <option value="user">{tStatic('common:auto.frontend.k9f8a2389a20c')}</option>
                      <option value="admin">{tStatic('common:auto.frontend.k4e7afebcfbae')}</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      themeColor={themeColor}
                      onClick={() =>
                        setProfileDraft((prev) => prev && { ...prev, isActive: !prev.isActive })
                      }
                    >
                      {profileDraft.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button themeColor={themeColor} onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">{tStatic('common:auto.frontend.k61628f5a1228')}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {USAGE_PLAN_OPTIONS.map((option) => {
                    const checked = plansDraft.some(
                      (plan) => normalizePlan(plan) === normalizePlan(option.value),
                    );
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-3 text-sm transition ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={(event) =>
                            setPlansDraft((prev) =>
                              event.target.checked
                                ? Array.from(new Set([...prev, option.value]))
                                : prev.filter((plan) => normalizePlan(plan) !== normalizePlan(option.value)),
                            )
                          }
                        />
                        <div>
                          <div className="font-semibold text-gray-800">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <Button themeColor={themeColor} onClick={() => void handleSavePlans()} disabled={savingPlans}>
                  {savingPlans ? "Saving…" : "Save plans"}
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">{tStatic('common:auto.frontend.k4934c20c02cd')}</h3>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {tStatic('common:auto.frontend.k75ec7abc577a')}</div>
                    <Button variant="outline" themeColor={themeColor} onClick={() => void loadOrganisations()}>
                      {tStatic('common:auto.frontend.k0e0572f90cef')}</Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">{tStatic('common:auto.frontend.k7f1748f4c04e')}</div>
                    <Button variant="outline" onClick={() => void handleResetPassword()} disabled={resettingPassword}>
                      {resettingPassword ? "Sending…" : "Send reset"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Bulk update plans (${selectedIds.length})`}
        themeColor={themeColor}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkModalOpen(false)} disabled={bulkProcessing}>
              {tStatic('common:auto.frontend.k77dfd2135f4d')}</Button>
            <Button
              themeColor={themeColor}
              onClick={() => void handleBulkPlans()}
              disabled={bulkPlans.length === 0 || bulkProcessing}
            >
              {bulkProcessing ? "Updating…" : "Apply"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{tStatic('common:auto.frontend.k430d32076eb2')}</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={bulkOperation}
              onChange={(event) => setBulkOperation(event.target.value as UsagePlanOperation)}
            >
              <option value="set">{tStatic('common:auto.frontend.kdd700d608129')}</option>
              <option value="add">{tStatic('common:auto.frontend.k61cc55aa0453')}</option>
              <option value="remove">{tStatic('common:auto.frontend.ke963907dac5c')}</option>
            </select>
          </div>
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3">
            {USAGE_PLAN_OPTIONS.map((option) => {
              const checked = bulkPlans.some((plan) => normalizePlan(plan) === normalizePlan(option.value));
              return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={checked}
                    onChange={(event) =>
                      setBulkPlans((prev) =>
                        event.target.checked
                          ? Array.from(new Set([...prev, option.value]))
                          : prev.filter((plan) => normalizePlan(plan) !== normalizePlan(option.value)),
                      )
                    }
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        title={tStatic('common:auto.frontend.kb26a310064f3')}
        themeColor={themeColor}
        size="lg"
      >
        {orgLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">{tStatic('common:auto.frontend.k33ce417454bf')}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.ke24e824b6811')}</h4>
              {orgAssignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                  {tStatic('common:auto.frontend.k0b337326dece')}</div>
              ) : (
                orgAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{assignment.name}</div>
                      {assignment.role && <div className="text-xs text-gray-500">{tStatic('common:auto.frontend.k61e4c27b1cb8')}{assignment.role}</div>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => void handleRemoveFromOrganisation(assignment.id)}
                    >
                      {tStatic('common:auto.frontend.ke963907dac5c')}</Button>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{tStatic('common:auto.frontend.k7c62a1424469')}</h4>
              {orgOptions
                .filter((option) => !orgAssignments.some((assignment) => assignment.id === option.id))
                .map((option) => (
                  <div
                    key={option.id}
                    className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div className="font-semibold text-gray-800">{option.name}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {(["user", "editor", "admin"] as Array<"user" | "editor" | "admin">).map((role) => (
                        <Button
                          key={role}
                          variant="outline"
                          size="sm"
                          className={
                            hasRequiredOrgPlan(plansDraft)
                              ? "border-blue-300 text-blue-600 hover:bg-blue-50"
                              : "border-gray-300 text-gray-400"
                          }
                          disabled={!hasRequiredOrgPlan(plansDraft)}
                          onClick={() => void handleAddToOrganisation(option.id, role)}
                        >
                          {tStatic('common:auto.frontend.k3d134f3d5896')}{role}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              {orgOptions.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                  {tStatic('common:auto.frontend.k232e80a6c640')}</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

