import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './features/auth/PrivateRoute';
import AuthForm from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import ManageClients from './features/clients/ManageClients';
import ImportClients from './features/clients/ImportClients';
import Historique from './features/dashboard/Historique';
import Profil from './features/auth/Profil';
import AdminUsers from './features/admin/AdminUsers';
import AdminConnexions from './features/admin/AdminConnexions';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeftIcon, UserIcon } from 'lucide-react';
import Button from './components/common/Button';
import ResetPassword from './features/auth/ResetPassword';
import EnterCode from './features/auth/EnterCode';
import ThemeToggle from './components/ui/ThemeToggle';        // ← AJOUTÉ
import { ThemeProvider } from './contexts/ThemeContext';      // ← AJOUTÉ

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 pt-20">
              <Dashboard />
            </div>
          </PrivateRoute>
        } />
        <Route path="/clients" element={<PrivateRoute><ManageClients /></PrivateRoute>} />
        <Route path="/import-clients" element={<PrivateRoute><ImportClients /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
        <Route path="/historique" element={<PrivateRoute><Historique /></PrivateRoute>} />
        <Route path="/connexions" element={<PrivateRoute><AdminConnexions /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/enter-code" element={<EnterCode />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

function NavBar() {
  const { user, logout } = useAuth(); 
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  // FIX avatar URL
  const getBackendUrl = (endpoint) => {
    if (process.env.NODE_ENV === 'development') {
      return `http://localhost:5000${endpoint}`;
    }
    return endpoint;
  };
  const resolveAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:')) return avatarUrl;
    return getBackendUrl(avatarUrl);
  };

  useEffect(() => {
    let timeout;
    const showNav = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };
    const handleMouseMove = () => showNav();
    document.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  if (!user) return null;

  const showBackButton = ['/clients', '/historique', '/profil', '/users', '/connexions'].includes(location.pathname);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-emerald-400/20 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link to="/profil" className="block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {resolveAvatarUrl(user.avatar_url) ? (
                <img
                  src={resolveAvatarUrl(user.avatar_url)}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </motion.div>
          </Link>
          <motion.span 
            className="text-lg font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            Bonjour, {user.username || 'User'}
          </motion.span>
        </div>

        {/* BOUTONS DE DROITE */}
        <div className="flex items-center space-x-4">
          {/* Bouton retour */}
          {showBackButton && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link to="/dashboard">
                <Button variant="ghost" className="p-2 text-emerald-400 hover:text-emerald-300">
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* TOGGLE DARK/LIGHT */}
          <ThemeToggle />

          {/* Déconnexion */}
          <motion.button 
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl transition-all duration-300 font-medium"
          >
            Déconnexion
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

function LoadingSpinner() {
  const { loading } = useAuth();
  if (!loading) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 pointer-events-none"
    >
      <div className="text-center pointer-events-auto">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
        <p className="text-gray-300 font-medium">Chargement...</p>
      </div>
    </motion.div>
  );
}

function App() {
  return (
    <ThemeProvider>          {/* ← ENVELOPPE TOUT */}
      <AuthProvider>
        <Router>
          <LoadingSpinner />
          <NavBar />
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;