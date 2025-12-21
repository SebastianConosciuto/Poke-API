import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import pokemonReducer from '../features/pokemon/pokemonSlice';
import catchReducer from '../features/catch/catchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pokemon: pokemonReducer,
    catch: catchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;