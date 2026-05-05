import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import type { LoginCredentials, RegisterCredentials, User } from '../../services/authService';

// ---------------------------------------------------------------------- //
// localStorage persistence helpers
//
// We persist BOTH the token and the user object. Storing just the token
// (the previous behaviour) meant that on reload, isAuthenticated was true
// but `user` was null until checkAuth resolved — the UI flashed an empty
// "Welcome, !" while waiting, and any component depending on user data
// looked logged-out.
// ---------------------------------------------------------------------- //

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    // Corrupt JSON — wipe and start fresh.
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const persistUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

const clearAuthStorage = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ---------------------------------------------------------------------- //
// State
// ---------------------------------------------------------------------- //

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True until the boot-time token validation finishes. */
  isLoading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem(TOKEN_KEY);
const storedUser = readStoredUser();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  // Optimistic: if both token and user are in storage, we render as logged-in
  // immediately so the UI doesn't flash. The boot-time `checkAuth` will
  // demote us to logged-out if the token has actually expired.
  isAuthenticated: !!(storedToken && storedUser),
  // Mark as loading on boot whenever there's a token to validate, so
  // ProtectedRoute renders the loading spinner instead of bouncing the
  // user to /login while we're still figuring out whether they're valid.
  isLoading: !!storedToken,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.access_token);

      const user = await authService.getCurrentUser();
      persistUser(user);
      return { token: response.access_token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Login failed. Please try again.',
      );
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const user = await authService.register(credentials);

      // Automatically login after registration
      const loginResponse = await authService.login(credentials);
      localStorage.setItem(TOKEN_KEY, loginResponse.access_token);
      persistUser(user);

      return { token: loginResponse.access_token, user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Registration failed. Please try again.',
      );
    }
  },
);

/**
 * Validate the persisted token on app boot (or after a manual reload).
 *
 * If the token is still valid, the response refreshes our local user
 * object. If it's not, we wipe both the token and the cached user — the
 * ProtectedRoute will redirect to /login on the next render because
 * `isAuthenticated` flips false in the rejected handler.
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      persistUser(user);
      return user;
    } catch {
      clearAuthStorage();
      return rejectWithValue('Session expired');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout();
  clearAuthStorage();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Check Auth (boot-time token validation)
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        // Token was invalid - flip to logged-out so ProtectedRoute redirects.
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
