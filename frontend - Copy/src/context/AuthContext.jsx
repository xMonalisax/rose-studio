import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('roseStudioUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('roseStudioToken');
    if (!token) return;

    setLoading(true);
    apiRequest('/auth/me')
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem('roseStudioUser', JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem('roseStudioToken');
        localStorage.removeItem('roseStudioUser');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('roseStudioToken', data.token);
    localStorage.setItem('roseStudioUser', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    localStorage.setItem('roseStudioToken', data.token);
    localStorage.setItem('roseStudioUser', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('roseStudioToken');
    localStorage.removeItem('roseStudioUser');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
