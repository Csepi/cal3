import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { UserPermissionsService, type UserPermissions } from '../services/userPermissions';
import { sessionManager } from '../services/sessionManager';

interface PermissionsContextValue {
  userPermissions: string[];
  permissions: UserPermissions;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  resetPermissions: () => void;
  hasPermission: (permission: string) => boolean;
  canViewResource: (resourceId: number | string) => boolean;
  canEditResource: (resourceId: number | string) => boolean;
  canAccessReservations: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const buildPermissionList = (permissions: UserPermissions): string[] => {
  const list: string[] = [];
  if (permissions.canAccessReservations) {
    list.push('reservations.access');
  }
  if (permissions.isSuperAdmin) {
    list.push('superadmin');
  }
  permissions.accessibleOrganizationIds.forEach((id) => {
    list.push(`org.access:${id}`);
  });
  permissions.adminOrganizationIds.forEach((id) => {
    list.push(`org.admin:${id}`);
  });
  permissions.editableReservationCalendarIds.forEach((id) => {
    list.push(`calendar.edit:${id}`);
  });
  permissions.viewableReservationCalendarIds.forEach((id) => {
    list.push(`calendar.view:${id}`);
  });
  return list;
};

const defaultPermissions: UserPermissions = {
  canAccessReservations: false,
  accessibleOrganizationIds: [],
  adminOrganizationIds: [],
  editableReservationCalendarIds: [],
  viewableReservationCalendarIds: [],
  isSuperAdmin: false,
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshPermissions = useCallback(async () => {
    if (!sessionManager.hasActiveSession()) {
      setPermissions(defaultPermissions);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetched = await UserPermissionsService.getUserPermissions();
      setPermissions(fetched);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPermissions = useCallback(() => {
    UserPermissionsService.clearCache();
    setPermissions(defaultPermissions);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshPermissions().catch(() => {
      setPermissions(defaultPermissions);
      setLoading(false);
    });
  }, [refreshPermissions]);

  const permissionList = useMemo(() => buildPermissionList(permissions), [permissions]);

  const hasPermission = useCallback((permission: string) => {
    return permissionList.includes(permission) || permissionList.includes('superadmin');
  }, [permissionList]);

  const canViewResource = useCallback((resourceId: number | string) => {
    if (permissions.isSuperAdmin) {
      return true;
    }
    const id = Number(resourceId);
    return permissions.viewableReservationCalendarIds.includes(id)
      || permissions.editableReservationCalendarIds.includes(id);
  }, [permissions]);

  const canEditResource = useCallback((resourceId: number | string) => {
    if (permissions.isSuperAdmin) {
      return true;
    }
    const id = Number(resourceId);
    return permissions.editableReservationCalendarIds.includes(id);
  }, [permissions]);

  const contextValue = useMemo<PermissionsContextValue>(() => ({
    userPermissions: permissionList,
    permissions,
    loading,
    refreshPermissions,
    resetPermissions,
    hasPermission,
    canViewResource,
    canEditResource,
    canAccessReservations: permissions.canAccessReservations,
  }), [
    permissionList,
    permissions,
    loading,
    refreshPermissions,
    resetPermissions,
    hasPermission,
    canViewResource,
    canEditResource,
  ]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
