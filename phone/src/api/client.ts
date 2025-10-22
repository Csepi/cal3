import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG } from '@constants/config';

/**
 * API Client - Base HTTP client for Cal3 backend API
 *
 * Features:
 * - Automatic JWT token injection
 * - Request/response interceptors
 * - Error handling
 * - Token refresh on 401
 * - Timeout configuration
 */

export class ApiClient {
  private client: AxiosInstance;
  private tokenProvider?: () => Promise<string | null>;
  private onUnauthorized?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set the function that provides the JWT token
   */
  setTokenProvider(provider: () => Promise<string | null>) {
    this.tokenProvider = provider;
  }

  /**
   * Set the function to call when unauthorized (401)
   */
  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor: Add JWT token to headers
    this.client.interceptors.request.use(
      async config => {
        if (this.tokenProvider) {
          const token = await this.tokenProvider();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle errors
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
