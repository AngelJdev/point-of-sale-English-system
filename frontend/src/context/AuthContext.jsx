import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Revisar si hay un usuario guardado en el sessionStorage al cargar la app
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      setCurrentUser(parsedInfo);
    }
    setLoading(false);
  }, []);

  const login = async (usuario, password) => {
    try {
      const { data } = await axios.post('/users/login', { usuario, password });
      setCurrentUser(data);
      sessionStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
