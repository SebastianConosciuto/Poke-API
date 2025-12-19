import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { pokemonService } from '../../services/pokemonService';
import type {
  PokemonBasic,
  PokemonDetail,
  PokemonListParams,
} from '../../services/pokemonService';

interface PokemonState {
  list: PokemonBasic[];
  currentPokemon: PokemonDetail | null;
  availableTypes: string[];
  filters: {
    types: string[];
    sortBy: 'id' | 'name' | 'height' | 'weight' | 'stats_total' | null;
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingDetail: boolean;
  error: string | null;
}

const initialState: PokemonState = {
  list: [],
  currentPokemon: null,
  availableTypes: [],
  filters: {
    types: [],
    sortBy: null,
    sortOrder: 'asc',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
  },
  isLoading: false,
  isLoadingMore: false,
  isLoadingDetail: false,
  error: null,
};

// Async thunks
export const fetchTypes = createAsyncThunk(
  'pokemon/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await pokemonService.getTypes();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch types'
      );
    }
  }
);

export const fetchPokemonList = createAsyncThunk(
  'pokemon/fetchList',
  async (params: PokemonListParams, { rejectWithValue }) => {
    try {
      return await pokemonService.getList(params);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch Pokemon list'
      );
    }
  }
);

export const fetchMorePokemon = createAsyncThunk(
  'pokemon/fetchMore',
  async (params: PokemonListParams, { rejectWithValue }) => {
    try {
      return await pokemonService.getList(params);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch more Pokemon'
      );
    }
  }
);

export const fetchPokemonDetail = createAsyncThunk(
  'pokemon/fetchDetail',
  async (pokemonId: number, { rejectWithValue }) => {
    try {
      return await pokemonService.getDetail(pokemonId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch Pokemon detail'
      );
    }
  }
);

const pokemonSlice = createSlice({
  name: 'pokemon',
  initialState,
  reducers: {
    setTypeFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.types = action.payload;
      state.list = [];
      state.pagination.currentPage = 1;
    },
    setSortBy: (
      state,
      action: PayloadAction<'id' | 'name' | 'height' | 'weight' | 'stats_total' | null>
    ) => {
      state.filters.sortBy = action.payload;
      state.list = [];
      state.pagination.currentPage = 1;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.filters.sortOrder = action.payload;
      state.list = [];
      state.pagination.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.list = [];
      state.pagination.currentPage = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPokemon: (state) => {
      state.currentPokemon = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch types
      .addCase(fetchTypes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableTypes = action.payload;
      })
      .addCase(fetchTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Pokemon list
      .addCase(fetchPokemonList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPokemonList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.pokemon;
        state.pagination = {
          currentPage: action.payload.page,
          pageSize: action.payload.page_size,
          total: action.payload.total,
          hasMore: action.payload.has_more,
        };
      })
      .addCase(fetchPokemonList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch more Pokemon (infinite scroll)
      .addCase(fetchMorePokemon.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMorePokemon.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        state.list = [...state.list, ...action.payload.pokemon];
        state.pagination = {
          currentPage: action.payload.page,
          pageSize: action.payload.page_size,
          total: action.payload.total,
          hasMore: action.payload.has_more,
        };
      })
      .addCase(fetchMorePokemon.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      // Fetch Pokemon detail
      .addCase(fetchPokemonDetail.pending, (state) => {
        state.isLoadingDetail = true;
        state.error = null;
      })
      .addCase(fetchPokemonDetail.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.currentPokemon = action.payload;
      })
      .addCase(fetchPokemonDetail.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setTypeFilter,
  setSortBy,
  setSortOrder,
  clearFilters,
  clearError,
  clearCurrentPokemon,
} = pokemonSlice.actions;

export default pokemonSlice.reducer;