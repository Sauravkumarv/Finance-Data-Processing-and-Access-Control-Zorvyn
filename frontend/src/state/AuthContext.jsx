import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProfileFromToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const user = useMemo(() => getProfileFromToken(token), [token]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const logout = () => setToken('');

  return (
    <AuthContext.Provider value={{ token, setToken, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
