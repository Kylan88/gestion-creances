import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  CreditCardIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ClientTable = ({ 
  data, 
  onEdit, 
  onDelete, 
  onRelance, 
  onPayment, 
  totalPages, 
  currentPage, 
  onPageChange, 
  className = 'text-gray-100' // Prop pour thème sombre
}) => {
  const [actionStates, setActionStates] = useState({}); // State central pour dropdowns par ID
  const dropdownRefs = useRef({}); // NOUVEAU : Refs pour chaque dropdown (un par client)
  const today = new Date().toISOString().split('T')[0];

  // NOUVEAU : useEffect pour close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(actionStates).forEach(clientId => {
        if (actionStates[clientId] && dropdownRefs.current[clientId] && !dropdownRefs.current[clientId].contains(event.target)) {
          setActionStates(prev => ({ ...prev, [clientId]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionStates]);

  const toggleActions = (clientId) => {
    setActionStates(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-gray-400"
      >
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun client trouvé. Ajoutez-en un nouveau !</p>
      </motion.div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Table Wrapper - Glassmorphism pour thème sombre */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/30">
            <thead className="bg-gray-800/50 hidden sm:table-header-group">
              <tr>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">ID</th>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Nom</th>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Téléphone</th>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Email</th>
                <th className="py-3 px-2 sm:px-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Montant Dû (FCFA)</th>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Échéance</th>
                <th className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Statut</th>
                <th className="py-3 px-2 sm:px-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {data.map((client, index) => {
                const statut = client.date_echeance < today ? 'Retard' : 'Avenir';
                const isRetard = statut === 'Retard';
                const localId = (currentPage - 1) * 10 + index + 1; // NOUVEAU : ID global paginé (ex. : page 2 = 11-20)
                const showActions = actionStates[client.id] || false; // Utilise state central
                return (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }} // Stagger pour fluidité
                    className="hover:bg-gray-700/50 transition-colors duration-200 even:bg-gray-800/20"
                  >
                    {/* Mobile Card Layout - Amélioré avec truncate et overflow-hidden */}
                    <td className="block py-3 px-4 sm:hidden border-b border-gray-700/30 overflow-hidden">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">ID:</span>
                          <span className="text-sm font-mono text-gray-300 ml-2 min-w-0 flex-1 truncate">{localId}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">Nom:</span>
                          <span className="text-sm font-medium text-gray-100 ml-2 min-w-0 flex-1 truncate">{client.nom}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">Téléphone:</span>
                          <span className="text-sm text-gray-300 ml-2 min-w-0 flex-1 truncate">{client.telephone}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">Email:</span>
                          <span className="text-sm text-gray-300 ml-2 min-w-0 flex-1 truncate" title={client.email}>{client.email}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">Montant:</span>
                          <span className="text-sm font-semibold text-gray-100 ml-2 min-w-0 flex-1 text-right">{client.montant_du.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-gray-400 truncate">Échéance:</span>
                          <span className="text-sm text-gray-300 ml-2 min-w-0 flex-1 truncate">{new Date(client.date_echeance).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-400 truncate">Statut:</span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                            isRetard 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {statut}
                          </span>
                        </div>
                        <div className="flex justify-end mt-2 pt-2 border-t border-gray-700/30">
                          {/* Mobile Actions - Compact */}
                          <div className="relative inline-block" ref={el => dropdownRefs.current[client.id] = el}>
                            <motion.button
                              onClick={() => toggleActions(client.id)}
                              className="p-2 text-gray-400 hover:text-emerald-300 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Actions"
                            >
                              <EllipsisVerticalIcon className="w-5 h-5" />
                            </motion.button>
                            <AnimatePresence>
                              {showActions && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-600/50 shadow-2xl z-10 py-2 max-w-[calc(100vw-2rem)]" // Limite largeur pour mobile
                                  style={{ minWidth: '200px' }}
                                >
                                  {/* Mobile-optimized actions */}
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(client.id);
                                      toggleActions(client.id);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-emerald-300 transition-all duration-150"
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <PencilIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                                    Éditer
                                  </motion.button>
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPayment(client.id);
                                      toggleActions(client.id);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-green-300 transition-all duration-150"
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <CreditCardIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                                    Paiement
                                  </motion.button>
                                  {isRetard && (
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRelance(client.id);
                                        toggleActions(client.id);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-yellow-300 transition-all duration-150"
                                      whileHover={{ x: 4 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <ExclamationTriangleIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                                      Relancer
                                    </motion.button>
                                  )}
                                  <div className="my-1 border-t border-gray-600/30 mx-4"></div>
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Supprimer ${client.nom} ? Cette action est irréversible.`)) {
                                        onDelete(client.id);
                                        toggleActions(client.id);
                                      }
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-red-300 transition-all duration-150"
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <TrashIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                                    Supprimer
                                  </motion.button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Desktop Table Layout */}
                    <td className="hidden sm:table-cell py-3 px-4 text-sm font-mono text-gray-300 border-b border-gray-700/30">{localId}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm font-medium text-gray-100 border-b border-gray-700/30">{client.nom}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30">{client.telephone}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30 max-w-xs truncate" title={client.email}>
                      {client.email}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-right font-semibold text-gray-100 border-b border-gray-700/30">
                      {client.montant_du.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-gray-300 border-b border-gray-700/30">
                      {new Date(client.date_echeance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm border-b border-gray-700/30">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        isRetard 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {statut}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 border-b border-gray-700/30 relative">
                      <div className="relative inline-block" ref={el => dropdownRefs.current[client.id] = el}>
                        <motion.button
                          onClick={() => toggleActions(client.id)}
                          className="p-2 text-gray-400 hover:text-emerald-300 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Actions"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </motion.button>
                        <AnimatePresence>
                          {showActions && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-600/50 shadow-2xl z-10 py-2"
                              style={{ minWidth: '200px' }}
                            >
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(client.id);
                                  toggleActions(client.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-emerald-300 transition-all duration-150"
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <PencilIcon className="w-4 h-4 mr-3" />
                                Éditer
                              </motion.button>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPayment(client.id);
                                  toggleActions(client.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-green-300 transition-all duration-150"
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <CreditCardIcon className="w-4 h-4 mr-3" />
                                Ajouter Paiement
                              </motion.button>
                              {isRetard && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRelance(client.id);
                                    toggleActions(client.id);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-yellow-300 transition-all duration-150"
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <ExclamationTriangleIcon className="w-4 h-4 mr-3" />
                                  Relancer
                                </motion.button>
                              )}
                              <div className="my-1 border-t border-gray-600/30 mx-4"></div>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Supprimer ${client.nom} ? Cette action est irréversible.`)) {
                                    onDelete(client.id);
                                    toggleActions(client.id);
                                  }
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-red-300 transition-all duration-150"
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <TrashIcon className="w-4 h-4 mr-3" />
                                Supprimer
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION - Responsive avec plus de breakpoints, overflow-x-auto sur conteneur pages */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 p-2 sm:p-4 mt-4 bg-gray-800/50 rounded-xl border border-gray-700/30 overflow-hidden"
        >
          {/* Boutons Nav Rapide - Stack on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <motion.button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="p-1 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Première page"
            >
              «
            </motion.button>
            <motion.button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Page précédente"
            >
              ‹
            </motion.button>
          </div>

          {/* Pages avec Ellipsis - overflow-x-auto pour scroll horizontal sur mobile si besoin */}
          <div className="flex space-x-0.5 sm:space-x-1 overflow-x-auto pb-1 sm:pb-0 flex-1 min-w-0">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, index) => {
              const delta = window.innerWidth < 640 ? 1 : 2; // Delta réduit sur mobile
              const isVisible = page <= delta + 1 || page >= totalPages - delta || (page >= currentPage - delta && page <= currentPage + delta);
              if (!isVisible && index !== 0 && index !== totalPages - 1) {
                if (index === delta + 1) return <span key="left-dots" className="px-2 py-2 text-gray-500 whitespace-nowrap flex-shrink-0">...</span>;
                if (index === totalPages - delta - 1) return <span key="right-dots" className="px-2 py-2 text-gray-500 whitespace-nowrap flex-shrink-0">...</span>;
                return null;
              }
              return (
                <motion.button
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={page === currentPage}
                  className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg mx-0.5 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                    page === currentPage
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-semibold'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-emerald-300 border border-gray-600/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ scale: page === currentPage ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`Page ${page}`}
                >
                  {page}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <motion.button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Page suivante"
            >
              ›
            </motion.button>
            <motion.button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 sm:p-2 text-gray-400 hover:text-emerald-400 disabled:opacity-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Dernière page"
            >
              »
            </motion.button>
          </div>

          {/* Info Page - Centré sur mobile, flex-shrink-0 */}
          <span className="text-xs text-gray-400 mt-2 sm:mt-0 sm:ml-4 block sm:inline flex-shrink-0">
            Page {currentPage} sur {totalPages} ({data.length} clients)
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default ClientTable;