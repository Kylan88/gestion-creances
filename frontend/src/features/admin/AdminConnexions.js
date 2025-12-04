import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Search, 
  Calendar, 
  Filter,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import Button from '../../components/common/Button';
// Input remplacé par <input> natif pour éviter l'erreur de module

const AdminConnexions = () => {
  const { user } = useAuth();
  const [connexions, setConnexions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUser, setSearchUser] = useState('');
  const [actionFilter, setActionFilter] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const fetchConnexions = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...filters
      });
      const response = await api.get(`/admin/connexions?${params}`);
      setConnexions(response.data.connexions || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error('Erreur lors de la récupération des connexions:', err);
      const errMsg = err.response?.data?.error || 'Erreur lors de la récupération des connexions';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Accès réservé aux administrateurs.');
      setLoading(false);
      return;
    }
    fetchConnexions(currentPage, {
      search_user: searchUser,
      action: actionFilter,
      date_debut: dateDebut,
      date_fin: dateFin
    });
  }, [currentPage, searchUser, actionFilter, dateDebut, dateFin, fetchConnexions, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchConnexions(1, { search_user: searchUser, action: actionFilter, date_debut: dateDebut, date_fin: dateFin });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formattedConnexions = useMemo(() => 
    connexions.map(connexion => ({
      ...connexion,
      formattedDate: new Date(connexion.date_action).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })), [connexions]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center text-gray-100"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Chargement des connexions...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 p-6 font-sans"
    >
      {/* HEADER */}
      <header className="mb-8 text-center relative">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Gestion des Connexions
        </h1>
        <p className="text-gray-400 text-sm">Suivi des sessions utilisateurs en temps réel</p>
      </header>

      {/* FILTRES - Glassmorphism */}
      <section className="mb-6">
        <motion.form
          onSubmit={handleSearch}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/20 shadow-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="bg-white/10 text-gray-100 placeholder-gray-400 border border-gray-600/50 focus:border-emerald-400 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-white/10 text-gray-100 border border-gray-600/50 focus:border-emerald-400 rounded-lg px-3 py-2 w-full"
              >
                <option value="tous">Toutes actions</option>
                <option value="login">Connexions</option>
                <option value="logout">Déconnexions</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="bg-white/10 text-gray-100 border border-gray-600/50 focus:border-emerald-400 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="bg-white/10 text-gray-100 border border-gray-600/50 focus:border-emerald-400 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <Button type="submit" variant="primary" className="md:col-span-1">
              Filtrer
            </Button>
          </div>
        </motion.form>
      </section>

      {/* ERREUR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-500/30 text-red-200 text-center shadow-xl"
          >
            {error}
            <Button onClick={() => fetchConnexions(1, {})} variant="ghost" size="sm" className="mt-2 text-red-200 hover:text-red-100">
              Réessayer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLEAU - Glassmorphism */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/30 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10 border-b border-gray-600/50">
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">User ID</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Action</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Date Action</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600/30">
                <AnimatePresence>
                  {formattedConnexions.map((connexion) => (
                    <motion.tr
                      key={connexion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-gray-100">{connexion.user_id}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          connexion.action === 'login' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {connexion.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{connexion.formattedDate}</td>
                      <td className="px-6 py-4 text-gray-100">{connexion.username || 'N/A'}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {formattedConnexions.length === 0 && !loading && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      Aucune connexion trouvée.
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center space-x-2 mt-6"
        >
          <Button
            variant="ghost"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-gray-300 mx-4">{`${currentPage} / ${totalPages}`}</span>
          <Button
            variant="ghost"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminConnexions;