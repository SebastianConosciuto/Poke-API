/**
 * ProtectedRoute - gate any page behind a valid auth token.
 *
 * Behaviour on mount (covers the page-reload case):
 *   1. If there's no token, redirect to /login.
 *   2. If there IS a token, fire checkAuth() exactly once to validate it
 *      against the backend. We dispatch even when isAuthenticated is already
 *      true - that flag is restored optimistically from localStorage in the
 *      slice's initial state, so it can lie about a token that has actually
 *      expired. checkAuth either confirms the token (and refreshes the user
 *      object) or flips isAuthenticated false, which triggers the redirect.
 *
 * While the validation is in flight we render a loading state instead of
 * bouncing the user, so reloads on a protected page don't flash the login
 * screen for a split second.
 */

import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { checkAuth } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import PokeballLoading from '../common/PokeballLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, token } = useAppSelector(
    (state) => state.auth,
  );

  const hasValidated = useRef(false);

  useEffect(() => {
    if (token && !hasValidated.current) {
      hasValidated.current = true;
      dispatch(checkAuth());
    }
  }, [dispatch, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#F5F5F5',
        }}
      >
        <PokeballLoading message="Verifying Trainer..." />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
