import api from './api';

export interface PokemonType {
  name: string;
  url: string;
}

export interface PokemonBasic {
  id: number;
  name: string;
  types: string[];
  sprite: string | null;
  height: number;
  weight: number;
  stats_total: number;
}

export interface PokemonStat {
  name: string;
  base_stat: number;
}

export interface PokemonDetail {
  id: number;
  name: string;
  types: string[];
  sprites: any;
  height: number;
  weight: number;
  stats: PokemonStat[];
  stats_total: number;
  abilities: Array<{ name: string; is_hidden: boolean }>;
  base_experience: number | null;
}

export interface PokemonListResponse {
  pokemon: PokemonBasic[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  total_pages: number;
}

export interface PokemonListParams {
  page?: number;
  page_size?: number;
  types?: string;  // Comma-separated type names
  sort_by?: 'id' | 'name' | 'height' | 'weight' | 'stats_total';
  sort_order?: 'asc' | 'desc';
}

export const pokemonService = {
  getTypes: async (): Promise<string[]> => {
    const response = await api.get('/pokemon/types');
    return response.data;
  },

  getList: async (params: PokemonListParams): Promise<PokemonListResponse> => {
    const response = await api.get('/pokemon/', { params });
    return response.data;
  },

  getDetail: async (pokemonId: number): Promise<PokemonDetail> => {
    const response = await api.get(`/pokemon/${pokemonId}`);
    return response.data;
  },
};