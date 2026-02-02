export interface ReservationCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface ReservationOrganization {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export interface ReservationResourceType {
  id: number;
  name: string;
  description?: string;
  organisationId?: number;
  organizationId?: number;
  minBookingDuration?: number;
  bufferTime?: number;
  isActive?: boolean;
  color?: string;
}

export interface ReservationResource {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  resourceTypeId?: number;
  resourceType?: ReservationResourceType;
  publicBookingToken?: string;
  isActive?: boolean;
}

export interface ReservationUserSummary {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface ReservationRecord {
  id: number;
  startTime: string;
  endTime: string;
  quantity: number;
  status: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  customerInfo?: ReservationCustomerInfo;
  resourceId?: number;
  resource?: ReservationResource;
  createdBy?: ReservationUserSummary;
}
