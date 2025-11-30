import { createContext, useState } from 'react';
import { login } from '../services/login';

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');

    return Boolean(token);
  });

  const singout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  const singin = async (username, password) => {
    const { data, error } = await login(username, password);

    if (error) {
      return { error };
    }

//guardar customerId si existe
    if (data.customerId) {
      localStorage.setItem('customerId', data.customerId); 
  }
    let token = null;
    if (typeof data === 'string') token = data;
    else token = data?.token ?? data?.accessToken ?? null;

    if (token) localStorage.setItem('token', token);
    setIsAuthenticated(true);

    return { data, error: null };
  };

  return (
    <AuthContext.Provider
      value={ {
        isAuthenticated,
        singin,
        singout,
      } }
    >
      {children}
    </AuthContext.Provider>
  );
};

export {
  AuthProvider,
  AuthContext,
};
