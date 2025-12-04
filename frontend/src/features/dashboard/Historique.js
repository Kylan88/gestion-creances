import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { historiqueAPI } from '../../services/api';
import Button from '../../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search_client: '',
    action: 'tous',
    date_debut: '',
    date_fin: '',
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const actionsOptions = useMemo(() => [
    { value: 'tous', label: 'Toutes actions' },
    { value: 'ajout', label: 'Ajout' },
    { value: 'modification', label: 'Modification' },
    { value: 'paiement', label: 'Paiement' },
    { value: 'relance', label: 'Relance' },
    { value: 'suppression', label: 'Suppression' },
    { value: 'import', label: 'Import' },
  ], []);
  const fetchHistorique = useCallback(async (page = 1, isPageChange = false) => {
    if (isPageChange) setPageLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page, per_page: filters.per_page };
      const res = await historiqueAPI.getAll(params);
      setHistorique(res.data.actions || []);
      setTotalPages(res.data.total_pages || 1);
      setCurrentPage(page);
      if (res.data.actions.length === 0) {
        toast.info('Aucun historique trouvé avec ces filtres.');
      }
    } catch (err) {
      console.error('Erreur fetch historique:', err);
      setError('Impossible de charger l\'historique. Réessayez.');
      toast.error('Erreur de chargement de l\'historique.');
    } finally {
      setPageLoading(false);
      if (!isPageChange) setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    fetchHistorique(1, false);
  }, [fetchHistorique]);
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchHistorique(1, false), 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search_client, fetchHistorique]);
  const handleFiltersChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search_client') {
      fetchHistorique(1, false);
    }
  }, [fetchHistorique]);
  const handlePerPageChange = useCallback((perPage) => {
    setFilters(prev => ({ ...prev, per_page: perPage }));
    fetchHistorique(1, false);
  }, [fetchHistorique]);
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchHistorique(page, true);
    }
  }, [currentPage, totalPages, fetchHistorique]);
  const renderPagination = useMemo(() => {
    const delta = 2;
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      rangeWithDots.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.unshift(1, '...');
    } else {
      rangeWithDots.unshift(1);
    }
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }
    return rangeWithDots.map((page, index) => (
      <motion.button
        key={index}
        onClick={() => typeof page === 'number' && handlePageChange(page)}
        disabled={page === '...' || page === currentPage}
        className={`px-3 py-2 rounded-lg mx-1 transition-all duration-200 ${
          page === currentPage
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-emerald-300 border border-gray-600/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: page === '...' ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {page}
      </motion.button>
    ));
  }, [currentPage, totalPages, handlePageChange]);
  const handleReset = useCallback(() => {
    setFilters({ search_client: '', action: 'tous', date_debut: '', date_fin: '', per_page: 10 });
    fetchHistorique(1, false);
    toast.success("Filtres réinitialisés");
  }, [fetchHistorique]);
  const handleExport = useCallback(async () => {
    try {
      const csv = historique.map(h => [
        new Date(h.date_modification).toLocaleString('fr-FR'),
        h.action,
        h.client_nom || 'N/A',
        h.details || '-',
        h.modifie_par || 'Système'
      ]).map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historique_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Historique exporté !');
    } catch (err) {
      toast.error('Erreur export');
    }
  }, [historique]);
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 flex items-center justify-center p-6"
      >
        <div className="text-center bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <p className="text-red-200 mb-4">{error}</p>
          <Button onClick={() => { setError(null); fetchHistorique(1, false); }} className="bg-red-600 hover:bg-red-700">
            Réessayer
          </Button>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 p-6 font-sans"
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-4 order-2 sm:order-1">
          <Link to="/dashboard">
            <Button variant="ghost" className="p-2 text-emerald-400 hover:text-emerald-300">
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Historique des Actions
          </h1>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} className="order-1 sm:order-2">
          <Button onClick={handleExport} className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg">
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>Exporter CSV</span>
          </Button>
        </motion.div>
      </header>
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20 shadow-xl"
        >
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Rechercher par nom du client..."
                value={filters.search_client}
                onChange={(e) => handleFiltersChange('search_client', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="relative min-w-[120px] sm:min-w-[150px]">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filters.action}
                onChange={(e) => handleFiltersChange('action', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
              >
                {actionsOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:min-w-[280px]">
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_debut}
                  onChange={(e) => handleFiltersChange('date_debut', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_fin}
                  onChange={(e) => handleFiltersChange('date_fin', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <div className="relative min-w-[80px] sm:min-w-[100px]">
              <select
                value={filters.per_page}
                onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
              >
                <option value={5}>5 par page</option>
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
              </select>
            </div>
            <div className="flex space-x-2 min-w-fit">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button onClick={() => fetchHistorique(1, false)} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Filtrer</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button onClick={handleReset} variant="ghost" className="flex items-center space-x-2 text-gray-300 hover:text-gray-200">
                  Réinitialiser
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-16"
          >
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
              <p className="text-gray-300">Chargement de l'historique...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Action</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Client</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Détails</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Modifié par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {historique.length > 0 ? (
                    historique.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-700/50 transition-colors duration-200 even:bg-gray-800/20"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30">
                          {new Date(item.date_modification).toLocaleString('fr-FR', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-100 border-b border-gray-700/30 capitalize">
                          {item.action.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30">
                          {item.client_nom || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30 max-w-xs sm:max-w-md truncate" title={item.details}>
                          {item.details || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-200 border-b border-gray-700/30">
                          {item.modifie_par || 'Système'}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr key="empty">
                      <td colSpan="5" className="py-12 text-center text-gray-400">
                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun historique trouvé.</p>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 p-4 mt-4 bg-gray-800/50 rounded-xl border border-gray-700/30"
              >
                <motion.button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Première page"
                >
                  «
                </motion.button>
                <motion.button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Page précédente"
                >
                 
                </motion.button>
                <div className="flex space-x-1">
                  {renderPagination}
                </div>
                <motion.button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Page suivante"
                >
                 
                </motion.button>
                <motion.button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Dernière page"
                >
                  »
                </motion.button>
                {pageLoading && <Loader2 className="w-5 h-5 animate-spin text-emerald-400 ml-2" />}
                <span className="text-xs text-gray-400 ml-4">
                  Page {currentPage} sur {totalPages} ({historique.length} actions)
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default Historique;
