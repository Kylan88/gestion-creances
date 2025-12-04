import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log('PrivateRoute: user=', user, 'loading=', loading);  // DEBUG

  if (loading) return <div>Chargement route...</div>;  // Local loading
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;