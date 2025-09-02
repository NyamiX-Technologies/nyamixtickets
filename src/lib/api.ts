import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_BASE_URL = 'https://nyamix.up.railway.app/api/v1.0';
export const IMAGE_BASE_URL = 'https://res.cloudinary.com/dqlnpyxr4/';
export const API_VERSION = '?version=v1.0';

export interface ApiError {
  [key: string]: string[] | string | number;
  message?: string;
  status?: number;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, timeout = 20000) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // ✅ Attach token automatically if exists
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Ensure config.headers is an AxiosHeaders instance.
        // If it's undefined, initialize it. Otherwise, use the existing one.
        config.headers = config.headers || new axios.AxiosHeaders();
        // Set the Authorization header using the type-safe 'set' method.
        config.headers.set('Authorization', `Token ${token}`);
      }
      return config;
    });

    // ✅ Handle errors globally
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response && error.response.data) {
          return Promise.reject(error.response.data);
        }
        return Promise.reject({ detail: error.message || 'Network Error' });
      }
    );
  }

  async get<T>(url: string) {
    const response = await this.axiosInstance.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: unknown) {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.axiosInstance.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string) {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }
}

// ✅ Export a ready-to-use instance
export const apiClient = new ApiClient(API_BASE_URL);
