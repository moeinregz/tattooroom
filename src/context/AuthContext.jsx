import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => localStorage.getItem('tattooroom_user') || '');
  const [token, setToken] = useState(() => localStorage.getItem('tattooroom_token') || '');

  const login = useCallback(async (u, p) => {
    const data = await api.login(u, p);
    localStorage.setItem('tattooroom_token', data.token);
    localStorage.setItem('tattooroom_user', data.username);
    setToken(data.token);
    setUsername(data.username);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tattooroom_token');
    localStorage.removeItem('tattooroom_user');
    setToken('');
    setUsername('');
  }, []);

  return (
    <AuthContext.Provider value={{ username, token, isAuthed: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
