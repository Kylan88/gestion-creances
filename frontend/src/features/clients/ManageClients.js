import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';  // NOUVEAU : Pour le bouton retour
import { toast } from 'react-toastify';
import { clientsAPI } from '../../services/api';
import ClientTable from '../../components/ui/ClientTable';
import ClientForm from '../../components/ui/ClientForm';
import PaymentModal from '../../components/ui/PaymentModal';
import ImportClients from './ImportClients';
import Button from '../../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  CurrencyDollarIcon, 
  ArrowPathIcon, 
  PlusIcon, 
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', statut: 'tous', montant_min: '', montant_max: '', per_page: 10 }); // NOUVEAU : per_page dans filters pour backend /api/clients
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false); // NOUVEAU : Loading state
  const [error, setError] = useState(null); // NOUVEAU : Error state
  const [pageLoading, setPageLoading] = useState(false); // NOUVEAU : Loading spécifique à la pagination

  const fetchClients = useCallback(async (page = 1, isPageChange = false) => {
    if (isPageChange) setPageLoading(true); // Loading seulement pour pagination
    else setLoading(true);
    setError(null);
    try {
      const res = await clientsAPI.getAll({ ...filters, page, per_page: filters.per_page }); // Utilise per_page du state pour backend
      setClients(res.data.clients || []);
      setTotalPages(res.data.total_pages || 1);
      setCurrentPage(page);
      if (res.data.clients.length === 0) {
        toast.info('Aucun client trouvé avec ces filtres.');
      }
    } catch (err) {
      console.error('Erreur fetch clients:', err);
      setError('Impossible de charger les clients. Réessayez.');
      toast.error('Erreur de chargement des clients.');
    } finally {
      setPageLoading(false);
      if (!isPageChange) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  // NOUVEAU : Debounce pour search (évite trop de fetches)
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchClients(1, false), 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search, fetchClients]); // Debounce sur search seulement

  const handleFiltersChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Fetch immédiat pour non-search (statut, montants, per_page)
    if (key !== 'search') {
      fetchClients(1, false);
    }
  }, [fetchClients]);

  // NOUVEAU : Changement per_page (optimise pour backend, moins de pages)
  const handlePerPageChange = useCallback((perPage) => {
    setFilters(prev => ({ ...prev, per_page: perPage }));
    fetchClients(1, false);
  }, [fetchClients]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchClients(page, true); // Loading page-specific
    }
  }, [currentPage, totalPages, fetchClients]);

  // NOUVEAU : Pagination optimisée : Boutons intelligents (1er/prev/next/dernier + ellipsis)
  const renderPagination = useMemo(() => {
    const delta = 2; // Nombre de pages visibles de chaque côté
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

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

  const handleEdit = useCallback((id) => {
    const client = clients.find(c => c.id === id);
    setEditingClient(client || null);
    setShowForm(true);
  }, [clients]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await clientsAPI.delete(id);
        toast.success('Client supprimé !');
        fetchClients(currentPage, false);
      } catch (err) {
        toast.error('Erreur suppression : ' + (err.response?.data?.error || 'Essaie encore.'));
      }
    }
  }, [currentPage, fetchClients]);

  const handleRelance = useCallback(async (id) => {
    if (window.confirm('Envoyer relance par email ?')) {
      try {
        await clientsAPI.relance(id);
        toast.success('Relance envoyée !');
        fetchClients(currentPage, false);
      } catch (err) {
        toast.error('Erreur relance : ' + (err.response?.data?.error || 'Vérifie l\'email.'));
      }
    }
  }, [currentPage, fetchClients]);

  const handlePaymentOpen = useCallback((id) => {
    setSelectedClientId(id);
    setShowPaymentModal(true);
  }, []);

  const handleSubmitForm = useCallback(async (data) => {
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, data);
        toast.success('Client mis à jour !');
      } else {
        await clientsAPI.create(data);
        toast.success('Client ajouté !');
      }
      setShowForm(false);
      setEditingClient(null);
      fetchClients(currentPage, false);
    } catch (err) {
      toast.error('Erreur : ' + (err.response?.data?.error || 'Vérifie les champs.'));
    }
  }, [editingClient, currentPage, fetchClients]);

  const handleExport = useCallback(async () => {
    try {
      const res = await clientsAPI.exportCSV(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export CSV téléchargé !');
    } catch (err) {
      toast.error('Erreur export : ' + (err.response?.data?.error || 'Réseau ?'));
    }
  }, [filters]);

  const handleRefresh = useCallback(() => {
    fetchClients(currentPage, false);
    toast.info('Liste rafraîchie !');
  }, [currentPage, fetchClients]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 flex items-center justify-center p-6"
      >
        <div className="text-center bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <p className="text-red-200 mb-4">{error}</p>
          <Button onClick={() => { setError(null); fetchClients(1, false); }} className="bg-red-600 hover:bg-red-700">
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 p-4 sm:p-6 font-sans" // Padding réduit sur mobile pour plus d'espace
    >
      {/* HEADER - Amélioré avec bouton retour et titre gradient, centré sur mobile */}
      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-4 w-full sm:w-auto justify-start sm:justify-start">
          <Link to="/dashboard">
            <Button variant="ghost" className="p-2 text-emerald-400 hover:text-emerald-300">
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Gérer les Clients
          </h1>
        </motion.div>
        <Button onClick={handleRefresh} variant="ghost" className="text-gray-400 hover:text-emerald-400 self-start sm:self-auto">
          <ArrowPathIcon className="w-5 h-5" />
        </Button>
      </header>

      {/* FILTRES - Layout "Cartes Groupées" pour un aspect modulaire et ordonné, avec fix overflow */}
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-400/20 shadow-xl overflow-hidden" // : overflow-hidden sur la section
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"> {/* : sm:2 puis lg:3 pour éviter overflow sur petits écrans intermédiaires */}
            {/* Carte 1 : Recherche & Statut */}
            <div className="bg-white/5 rounded-xl p-3 border border-gray-600/30 flex flex-col space-y-2"> {/* AJOUTÉ : flex-col pour stack contrôlé */}
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300">Recherche</h3>
              <div className="space-y-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  <input 
                    placeholder="Rechercher par nom..." 
                    value={filters.search} 
                    onChange={(e) => handleFiltersChange('search', e.target.value)} 
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/10 border border-gray-600/50 rounded-lg text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <FunnelIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  <select 
                    value={filters.statut} 
                    onChange={(e) => handleFiltersChange('statut', e.target.value)} 
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/10 border border-gray-600/50 rounded-lg text-xs sm:text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="tous">Tous statuts</option>
                    <option value="retard">En retard</option>
                    <option value="avenir">À venir</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Carte 2 : Montants & Per Page - Fix overflow avec stack forcé sur sm- */}
            <div className="bg-white/5 rounded-xl p-3 border border-gray-600/30 flex flex-col space-y-2 sm:col-span-2 lg:col-span-1"> {/* AJOUTÉ : sm:col-span-2 pour plus d'espace sur intermédiaire, flex-col */}
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300">Filtres Montants</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"> {/* AJOUTÉ : stack sur <sm, row sur sm+ */}
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={filters.montant_min} 
                      onChange={(e) => handleFiltersChange('montant_min', e.target.value)} 
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/10 border border-gray-600/50 rounded-lg text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={filters.montant_max} 
                      onChange={(e) => handleFiltersChange('montant_max', e.target.value)} 
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white/10 border border-gray-600/50 rounded-lg text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="relative">
                  <select 
                    value={filters.per_page} 
                    onChange={(e) => handlePerPageChange(parseInt(e.target.value))} 
                    className="w-full pl-3 pr-3 py-1.5 sm:py-2 bg-white/10 border border-gray-600/50 rounded-lg text-xs sm:text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                  >
                    <option value={5}>5 par page</option>
                    <option value={10}>10 par page</option>
                    <option value={20}>20 par page</option>
                    <option value={50}>50 par page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Carte 3 : Actions - Full width sur mobile, ajusté */}
            <div className="bg-white/5 rounded-xl p-3 border border-gray-600/30 flex flex-col space-y-2 sm:col-span-2 lg:col-span-1"> {/* AJOUTÉ : sm:col-span-2 pour équilibre, flex-col */}
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300">Actions</h3>
              <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.05 }} className="w-full">
                  <Button onClick={handleExport} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 w-full text-xs sm:text-sm py-1.5 sm:py-2">
                    <DocumentArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Exporter CSV</span> {/* AJOUTÉ : truncate pour éviter overflow text */}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="w-full">
                  <Button onClick={() => setShowForm(true)} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25 w-full text-xs sm:text-sm py-1.5 sm:py-2">
                    <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Nouveau</span>
                  </Button>
                </motion.div>
                <div className="w-full">
                  <ImportClients onImportSuccess={fetchClients} className="w-full" /> {/* AJOUTÉ : w-full pour forcer fit */}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* TABLEAU - Avec loading spinner et couleur améliorée pour visibilité, padding adaptatif */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12 sm:py-16" // AJOUTÉ : Py réduit sur mobile
          >
            <div className="text-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-400 mx-auto mb-4" /> {/* AJOUTÉ : Taille adaptative */}
              <p className="text-gray-300 text-sm sm:text-base">Chargement des clients...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-700/30 overflow-hidden shadow-2xl p-0" // AJOUTÉ : Rounded adaptatif
          >
            <ClientTable
              data={clients}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange} // NOUVEAU : Callback optimisé
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRelance={handleRelance}
              onPayment={handlePaymentOpen}
              className="text-gray-100" 
            />
            {/* PAGINATION OPTIMISÉE - NOUVEAU : Boutons intelligents avec ellipsis et navigation rapide, space-x réduit sur mobile */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-1 sm:space-x-2 p-3 sm:p-4 bg-gray-800/50 border-t border-gray-700/30" // AJOUTÉ : Space et padding adaptatifs
              >
                <motion.button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" /> {/* AJOUTÉ : Icon plus petit sur mobile */}
                </motion.button>
                <motion.button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeftIcon className="w-4 h-5 sm:w-5" />
                </motion.button>
                <div className="flex space-x-0.5 sm:space-x-1"> {/* AJOUTÉ : Space réduit */}
                  {renderPagination}
                </div>
                <motion.button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronDoubleRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                {pageLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-emerald-400 ml-1 sm:ml-2" />} {/* AJOUTÉ : Taille et ml adaptatifs */}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL FORM - Animé, max-w plus petit sur mobile */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" // AJOUTÉ : Padding modal adaptatif
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full border border-emerald-400/20 shadow-2xl" // AJOUTÉ : Max-w et padding adaptatifs
            >
              <ClientForm 
                initialData={editingClient || {}} 
                onSubmit={handleSubmitForm} 
                onCancel={() => { 
                  setShowForm(false); 
                  setEditingClient(null); 
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PAIEMENT - Animé, même adaptations */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full border border-emerald-400/20 shadow-2xl"
            >
              <PaymentModal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)} 
                clientId={selectedClientId} 
                onSuccess={fetchClients} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageClients;