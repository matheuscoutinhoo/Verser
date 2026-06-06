import { config } from '../config/env';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

type TokenProvider = () => string | null;
type TokenSetter = (token: string | null) => void;
type RefreshFn = () => Promise<string | null>;

export class ApiClient {
  private getToken: TokenProvider = () => null;
  private setToken: TokenSetter = () => undefined;
  private refresh: RefreshFn = async () => null;
  private refreshPromise: Promise<string | null> | null = null;

  configure(opts: { getToken: TokenProvider; setToken: TokenSetter; refresh: RefreshFn }): void {
    this.getToken = opts.getToken;
    this.setToken = opts.setToken;
    this.refresh = opts.refresh;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (!options.skipAuth) {
      const token = this.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    if (response.status === 401 && !options.skipRefresh && !options.skipAuth) {
      const newToken = await this.refreshOnce();
      if (newToken) {
        return this.request<T>(path, { ...options, skipRefresh: true });
      }
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as { data?: T; error?: ApiErrorPayload }) : {};

    if (!response.ok) {
      const error = parsed.error ?? { code: 'UNKNOWN', message: response.statusText };
      throw new ApiClientError(response.status, error);
    }

    return parsed.data as T;
  }

  private async refreshOnce(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    const token = await this.refreshPromise;
    if (token) this.setToken(token);
    return token;
  }

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }
  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }
  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }
  delete<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE', body });
  }

  /**
   * POSTs a single file as `multipart/form-data` (field name = "file") and
   * unwraps the standard `{ data }` envelope. Handles 401 → refresh retry.
   */
  async uploadFile<T>(path: string, file: File, fieldName = 'file'): Promise<T> {
    const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
    const form = new FormData();
    form.append(fieldName, file);

    const sendOnce = async (token: string | null): Promise<Response> =>
      fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
        body: form,
      });

    let response = await sendOnce(this.getToken());
    if (response.status === 401) {
      const refreshed = await this.refreshOnce();
      if (refreshed) response = await sendOnce(refreshed);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as { data?: T; error?: ApiErrorPayload }) : {};
    if (!response.ok) {
      const error = parsed.error ?? { code: 'UNKNOWN', message: response.statusText };
      throw new ApiClientError(response.status, error);
    }
    return parsed.data as T;
  }
}

export const apiClient = new ApiClient();
