import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket, onNotification } from '../services/socket';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Charger les données utilisateur depuis le localStorage si elles existent
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log('Auth init: starting (check disabled for debug)');  // DEBUG
    
    // Simuler un petit délai avant de charger le profil
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (socket) {
      onNotification((data) => {
        toast.info(data.message);
      });
    }
    return () => disconnectSocket();
  }, [socket]);

  // Sauvegarder l'utilisateur dans le localStorage chaque fois qu'il est mis à jour
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // NOUVEAU : Fonction pour refetch user depuis /api/user (sync après modifications)
  const refetchUser = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUser(); // Appel à /api/user (déjà implémenté dans authAPI)
      setUser(response.data.user);
      toast.success('Profil rafraîchi');
    } catch (err) {
      console.error('Erreur refetch user:', err);
      toast.error(err.response?.data?.error || 'Erreur rafraîchissement profil');
      if (err.response?.status === 401) {
        // Auto-logout si session invalide
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Login attempt...');
      const res = await authAPI.login(credentials);
      console.log('Login success:', res.data);
      setUser(res.data.user);
      setSocket(initSocket());
      toast.success(res.data.message);
      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data?.error || err.message);
      toast.error(err.response?.data?.error || 'Erreur de connexion');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error (ignore):', err);
    }
    setUser(null);
    disconnectSocket();
    setSocket(null);
    localStorage.removeItem('user'); // Supprimer l'utilisateur du localStorage lors de la déconnexion
    toast.info('Déconnexion');
  };

  // NOUVEAU : Fonction pour update partiel user (ex. après modification locale)
  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const value = { user, login, logout, loading, refetchUser, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };