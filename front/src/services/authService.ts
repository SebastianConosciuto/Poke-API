import api from './api';

export type LoginCredentials = {
  trainer_id: string;
  password: string;
}

export type RegisterCredentials = {
  trainer_id: string;
  password: string;
}

export type AuthResponse = {
  access_token: string;
  token_type: string;
}

export type User = {
  trainer_id: string;
  created_at?: string;
  level: number;
  experience: number;
}

export type UserStats = {
  trainer_id: string;
  level: number;
  experience: number;
  experience_in_level: number;
  experience_to_next_level: number;
  pokemon_captured: number;
  pokedex_completion: number;
  total_pokemon: number;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/auth/stats');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};