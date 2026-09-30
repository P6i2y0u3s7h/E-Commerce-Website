/**
 * Authentication context — manages auth state across the app.
 * Persists JWT in localStorage and loads user on refresh.
 *
 * Fix for "Not Authenticated" bug:
 *  - isLoading=true is held until /auth/me resolves (or token is absent).
 *  - ProtectedRoute reads isLoading before deciding to redirect.
 *  - The 401 response interceptor in api.ts dispatches an 'auth:logout'
 *    event which this context listens to and clears state cleanly.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, AuthState, LoginRequest, RegisterRequest } from '../types';
import { authApi, getErrorMessage } from '../services/api';

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('access_token'),
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true, // Start true so ProtectedRoute waits for init
  });

  /**
   * Load current user from the backend using the stored token.
   * Called once on mount (page refresh) and after explicit login.
   */
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
      return;
    }

    try {
      const user = await authApi.getCurrentUser();
      setState({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
      });
    } catch {
      // Token is invalid or expired — clear everything
      localStorage.removeItem('access_token');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  }, []);

  // Run on first mount to restore session from localStorage
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Listen for the global 'auth:logout' event dispatched by the Axios
   * 401 interceptor in api.ts. This ensures any expired-token 401
   * from any API call clears the auth state consistently.
   */
  useEffect(() => {
    const handleForcedLogout = () => {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  /** Login: get token → store → fetch user profile */
  const login = async (data: LoginRequest): Promise<void> => {
    const tokenResponse = await authApi.login(data);
    localStorage.setItem('access_token', tokenResponse.access_token);
    // Fetch user with the fresh token (interceptor will attach it)
    const user = await authApi.getCurrentUser();
    setState({
      user,
      token: tokenResponse.access_token,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
      isLoading: false,
    });
  };

  /** Register: create account → auto-login */
  const register = async (data: RegisterRequest): Promise<void> => {
    await authApi.register(data);
    // Auto-login after successful registration
    await login({ email: data.email, password: data.password });
  };

  /** Logout: clear token → reset state */
  const logout = () => {
    localStorage.removeItem('access_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
