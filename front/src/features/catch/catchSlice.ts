import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { catchService } from '../../services/catchService';
import type {
  CatchRequest,
  CatchChallenge,
  CatchAttemptResult,
  CatchResult,
} from '../../services/catchService';

interface CatchState {
  regions: string[];
  habitats: string[];
  currentChallenge: CatchChallenge | null;
  lastResult: CatchResult | null;
  isLoading: boolean;
  isLoadingOptions: boolean;
  error: string | null;
}

const initialState: CatchState = {
  regions: [],
  habitats: [],
  currentChallenge: null,
  lastResult: null,
  isLoading: false,
  isLoadingOptions: false,
  error: null,
};

// Async thunks
export const fetchCatchOptions = createAsyncThunk(
  'catch/fetchOptions',
  async (_, { rejectWithValue }) => {
    try {
      const [regions, habitats] = await Promise.all([
        catchService.getRegions(),
        catchService.getHabitats(),
      ]);
      return { regions, habitats };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch catch options'
      );
    }
  }
);

export const startCatchAttempt = createAsyncThunk(
  'catch/startAttempt',
  async (request: CatchRequest, { rejectWithValue }) => {
    try {
      return await catchService.startCatch(request);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to start catch attempt'
      );
    }
  }
);

export const completeCatchAttempt = createAsyncThunk(
  'catch/completeAttempt',
  async (attempt: CatchAttemptResult, { rejectWithValue }) => {
    try {
      return await catchService.completeCatch(attempt);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to complete catch attempt'
      );
    }
  }
);

const catchSlice = createSlice({
  name: 'catch',
  initialState,
  reducers: {
    clearChallenge: (state) => {
      state.currentChallenge = null;
    },
    clearResult: (state) => {
      state.lastResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch catch options
      .addCase(fetchCatchOptions.pending, (state) => {
        state.isLoadingOptions = true;
        state.error = null;
      })
      .addCase(fetchCatchOptions.fulfilled, (state, action) => {
        state.isLoadingOptions = false;
        state.regions = action.payload.regions;
        state.habitats = action.payload.habitats;
      })
      .addCase(fetchCatchOptions.rejected, (state, action) => {
        state.isLoadingOptions = false;
        state.error = action.payload as string;
      })
      // Start catch attempt
      .addCase(startCatchAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startCatchAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChallenge = action.payload;
      })
      .addCase(startCatchAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Complete catch attempt
      .addCase(completeCatchAttempt.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeCatchAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastResult = action.payload;
        state.currentChallenge = null;
      })
      .addCase(completeCatchAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearChallenge, clearResult, clearError } = catchSlice.actions;
export default catchSlice.reducer;