import { createContext, useContext, useState } from 'react';
import { login as loginApi, logout as logoutApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem('vandigo_access_token')
  );

  const login = async (phone, password) => {
    const { data } = await loginApi(phone, password);
    localStorage.setItem('vandigo_access_token', data.access_token);
    localStorage.setItem('vandigo_refresh_token', data.refresh_token);
    setToken(data.access_token);
    return data;
  };

  const logout = () => {
    logoutApi();
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
