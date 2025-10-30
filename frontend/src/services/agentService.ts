import { API_BASE_URL } from '../config/apiConfig';
import { secureFetch, authErrorHandler } from './authErrorHandler';
import type {
  AgentSummary,
  AgentDetail,
  AgentCatalogResponse,
  CreateAgentPayload,
  UpdateAgentPayload,
  UpdateAgentPermissionsPayload,
  AgentKey,
  CreatedAgentKey,
} from '../types/agent';

class AgentService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await secureFetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (authErrorHandler.isAuthError(response)) {
      throw new Error(`Authentication error: ${response.status}`);
    }

    if (!response.ok) {
      let message = `Request to ${endpoint} failed with status ${response.status}`;
      try {
        const body = await response.json();
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  listAgents(): Promise<AgentSummary[]> {
    return this.request<AgentSummary[]>('/agents');
  }

  getAgent(agentId: number): Promise<AgentDetail> {
    return this.request<AgentDetail>(`/agents/${agentId}`);
  }

  createAgent(payload: CreateAgentPayload): Promise<AgentSummary> {
    return this.request<AgentSummary>('/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateAgent(agentId: number, payload: UpdateAgentPayload): Promise<AgentSummary> {
    return this.request<AgentSummary>(`/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  disableAgent(agentId: number): Promise<void> {
    return this.request<void>(`/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  updatePermissions(
    agentId: number,
    payload: UpdateAgentPermissionsPayload,
  ): Promise<AgentDetail['permissions']> {
    return this.request(`/agents/${agentId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  listKeys(agentId: number): Promise<AgentKey[]> {
    return this.request<AgentKey[]>(`/agents/${agentId}/keys`);
  }

  createKey(agentId: number, label: string): Promise<CreatedAgentKey> {
    return this.request<CreatedAgentKey>(`/agents/${agentId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }

  revokeKey(agentId: number, keyId: number): Promise<void> {
    return this.request<void>(`/agents/${agentId}/keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  getCatalog(): Promise<AgentCatalogResponse> {
    return this.request<AgentCatalogResponse>('/agents/catalog');
  }
}

export const agentService = new AgentService();
