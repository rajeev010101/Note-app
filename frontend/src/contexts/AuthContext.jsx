import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const readToken = () => {
  try { return localStorage.getItem('token'); } catch { return null; }
};

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch { return null; }
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(() => decodeToken(readToken() || ''));

  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeToken(newToken));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: Boolean(token) }}>{children}</AuthContext.Provider>;
}
