import api from './api';

export interface CatchRequest {
  region: string;
  habitat: string;
  difficulty: 'weak' | 'easy' | 'medium' | 'hard' | 'legendary' | 'mythical';
}

export interface ButtonSequence {
  buttons: string[];
  time_per_button: number;
  total_buttons: number;
}

export interface CatchChallenge {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  stats_total: number;
  sequence: ButtonSequence;
  difficulty: string;
}

export interface CatchAttemptResult {
  pokemon_id: number;
  success: boolean;
  buttons_correct: number;
  total_buttons: number;
  time_taken: number;
  perfect: boolean;
}

export interface CatchResult {
  success: boolean;
  message: string;
  pokemon_name: string;
  accuracy: number;
  perfect: boolean;
  reward_message: string;
}

export const catchService = {
  getRegions: async (): Promise<string[]> => {
    const response = await api.get('/catch/regions');
    return response.data;
  },

  getHabitats: async (): Promise<string[]> => {
    const response = await api.get('/catch/habitats');
    return response.data;
  },

  startCatch: async (request: CatchRequest): Promise<CatchChallenge> => {
    const response = await api.post('/catch/start', request);
    return response.data;
  },

  completeCatch: async (attempt: CatchAttemptResult): Promise<CatchResult> => {
    const response = await api.post('/catch/complete', attempt);
    return response.data;
  },
};