/**
 * Standard pagination query parameters accepted by list endpoints.
 */
export interface PaginationQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
  readonly search?: string;
}

/**
 * Generic paginated payload used outside API envelope types.
 */
export interface PaginatedList<T> {
  readonly items: T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
