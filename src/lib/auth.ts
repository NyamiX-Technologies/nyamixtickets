import { apiClient, API_VERSION } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  auth_token: string;
  user: User;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `/auth/token/login/${API_VERSION}`,
      data
    );
    
    // Store token in localStorage
    localStorage.setItem('auth_token', response.auth_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  async signup(data: SignupData): Promise<User> {
    const response = await apiClient.post<User>(
      `/auth/users/${API_VERSION}`,
      data
    );
    
    return response;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  async getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async getMe(): Promise<User> {
    return apiClient.get<User>(`/auth/users/me/${API_VERSION}`);
  }
};