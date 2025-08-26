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

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      // No Bearer prefix as per requirements
      headers.Authorization = token;
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
        headers: {
          ...this.getAuthHeaders(),
          ...fetchOptions.headers,
        },
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

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      ...options,
    });
    
    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return response.json();
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'DELETE',
      ...options,
    });
    
    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { API_BASE_URL, IMAGE_BASE_URL, API_VERSION };
export type { ApiError };