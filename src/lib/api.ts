const API_BASE_URL = 'https://nyamix.up.railway.app/api/v1.0';
const IMAGE_BASE_URL = 'https://res.cloudinary.com/dqlnpyxr4/';
const API_VERSION = '?version=v1';

interface ApiError {
  message: string;
  status?: number;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string, timeout = 20000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getAuthHeaders(isFormData = false): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Token ${token}`;
    }

    return headers;
  }

  private async fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;

        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || parsedError.detail || 'An error occurred';
        } catch {
          errorMessage = errorData || `HTTP ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T | string | null> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    } else if (contentType && contentType.includes('text/')) {
      return response.text() as unknown as T;
    }
    return null;
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T | string | null> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.parseResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T | string | null> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.parseResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T | string | null> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.parseResponse<T>(response);
  }

  async patch<T>(endpoint: string, body: any, options?: FetchOptions): Promise<T | string | null> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = body instanceof FormData;

    const response = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
      headers: this.getAuthHeaders(isFormData),
      ...options,
    });

    return this.parseResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T | string | null> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.parseResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { API_BASE_URL, IMAGE_BASE_URL, API_VERSION };
export type { ApiError };
