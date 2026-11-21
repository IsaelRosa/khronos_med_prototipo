/**
 * Authentication Hook
 * Manages user authentication state and token handling
 */

import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getToken, setToken, clearToken } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar usuário do token ao montar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = getToken();
        if (token) {
          // Decodificar JWT (simples - em produção usar jwt-decode)
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
          });
        }
      } catch (err) {
        clearToken();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await auth.login(email, password);
      setToken(response.token);
      setUser(response.user);
      navigate('/painel');
    } catch (err: any) {
      const message = err.message || 'Falha ao fazer login';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const register = useCallback(
    async (email: string, name: string, password: string, role: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await auth.register(email, name, password, role);
        setToken(response.token);
        setUser(response.user);
        navigate('/painel');
      } catch (err: any) {
        const message = err.message || 'Falha ao registrar';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}
