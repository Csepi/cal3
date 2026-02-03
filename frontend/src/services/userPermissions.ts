import { apiService } from './api';

export interface UserPermissions {
  canAccessReservations: boolean;
  accessibleOrganizationIds: number[];
  adminOrganizationIds: number[];
  editableReservationCalendarIds: number[];
  viewableReservationCalendarIds: number[];
  isSuperAdmin: boolean;
}

export interface AccessibleOrganization {
  id: number;
  name: string;
  description?: string;
}

export interface AccessibleReservationCalendar {
  id: number;
  name?: string;
  organisationId?: number;
  role?: string;
}

export class UserPermissionsService {
  private static permissions: UserPermissions | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user permissions with caching
   */
  static async getUserPermissions(): Promise<UserPermissions> {
    const now = Date.now();

    // Return cached permissions if still valid
    if (this.permissions && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.permissions;
    }

    try {
      const response = await apiService.get<UserPermissions>('/user-permissions');
      this.permissions = response;
      this.lastFetch = now;
      return response;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      // Return default permissions if fetch fails
      return {
        canAccessReservations: false,
        accessibleOrganizationIds: [],
        adminOrganizationIds: [],
        editableReservationCalendarIds: [],
        viewableReservationCalendarIds: [],
        isSuperAdmin: false,
      };
    }
  }

  /**
   * Check if user can access reservation features
   */
  static async canAccessReservations(): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.canAccessReservations;
  }

  /**
   * Check if user can access a specific organization
   */
  static async canAccessOrganization(organizationId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.accessibleOrganizationIds.includes(organizationId);
  }

  /**
   * Check if user is admin of a specific organization
   */
  static async isOrganizationAdmin(organizationId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.adminOrganizationIds.includes(organizationId);
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.isSuperAdmin;
  }

  /**
   * Get accessible organizations
   */
  static async getAccessibleOrganizations(): Promise<AccessibleOrganization[]> {
    try {
      return await apiService.get<AccessibleOrganization[]>('/user-permissions/accessible-organizations');
    } catch (error) {
      console.error('Failed to fetch accessible organizations:', error);
      return [];
    }
  }

  /**
   * Get accessible reservation calendars
   */
  static async getAccessibleReservationCalendars(): Promise<AccessibleReservationCalendar[]> {
    try {
      return await apiService.get<AccessibleReservationCalendar[]>('/user-permissions/accessible-reservation-calendars');
    } catch (error) {
      console.error('Failed to fetch accessible reservation calendars:', error);
      return [];
    }
  }

  /**
   * Clear cached permissions (call when user logs out or permissions change)
   */
  static clearCache(): void {
    this.permissions = null;
    this.lastFetch = 0;
  }

  /**
   * Force refresh permissions from server
   */
  static async refreshPermissions(): Promise<UserPermissions> {
    this.clearCache();
    return await this.getUserPermissions();
  }
}

