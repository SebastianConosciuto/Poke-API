import api from './api';

export type CatchRequest = {
  region: string;
  habitat: string;
  difficulty: 'weak' | 'easy' | 'medium' | 'hard' | 'legendary' | 'mythical';
}

export type ButtonSequence = {
  buttons: string[];
  time_per_button: number;
  total_buttons: number;
}

export type CatchChallenge = {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  stats_total: number;
  sequence: ButtonSequence;
  difficulty: string;
}

export type CatchAttemptResult = {
  pokemon_id: number;
  success: boolean;
  buttons_correct: number;
  total_buttons: number;
  time_taken: number;
  perfect: boolean;
}

export type CatchResult = {
  success: boolean;
  message: string;
  pokemon_name: string;
  accuracy: number;
  perfect: boolean;
  reward_message: string;
  xp_awarded: number;
  new_level: number;
  leveled_up: boolean;
}

export const catchService = {
  getRegions: async (): Promise<string[]> => {
    const response = await api.get('/catch/regions');
    return response.data;
  },

  getHabitats: async (region?: string): Promise<string[]> => {
    const params = region ? { region } : {};
    const response = await api.get('/catch/habitats', { params });
    return response.data;
  },

  getDifficulties: async (region?: string, habitat?: string): Promise<string[]> => {
    const params: any = {};
    if (region) params.region = region;
    if (habitat) params.habitat = habitat;
    const response = await api.get('/catch/difficulties', { params });
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