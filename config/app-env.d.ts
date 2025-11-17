export interface ResolvedAppEnv {
  baseUrl: string;
  frontendUrl: string;
  backendUrl: string;
  apiUrl: string;
  frontendPort: string;
  backendPort: string;
  source?: string;
}

export declare function resolveAppEnv(
  overrides?: Partial<Record<string, string>>,
): ResolvedAppEnv;
