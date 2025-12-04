import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { clientsAPI } from '../../services/api';
import Button from '../common/Button';
import { 
  CurrencyDollarIcon, 
  CalendarIcon, 
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, clientId, onSuccess }) => {
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); // NOUVEAU : State pour erreurs inline

  const resetForm = () => {
    setMontant('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      setError('Le montant doit être un nombre positif.');
      toast.error('Montant invalide');
      return;
    }
    if (!date) {
      setError('La date est requise.');
      toast.error('Date invalide');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await clientsAPI.addPayment(clientId, { montant: montantNum, date_paiement: date });
      toast.success('Paiement enregistré avec succès !');
      resetForm();
      onClose();
      if (onSuccess) onSuccess(); // Refresh liste (backend met à jour montant_du)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Erreur lors de l\'enregistrement du paiement.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose} // Close on backdrop click
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-gray-900/100 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full border border-emerald-400/20 shadow-2xl relative" // MOINS TRANSPARENT : bg-gray-800/20 pour voile
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Ajouter un Paiement
            </h2>
            <motion.button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isSubmitting}
            >
              <XMarkIcon className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montant */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-200 mb-1">Montant Payé (FCFA)</label>
              <CurrencyDollarIcon className="absolute left-3 top-10 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                placeholder="Ex. 50000"
                value={montant}
                onChange={(e) => {
                  setMontant(e.target.value);
                  if (error && parseFloat(e.target.value) > 0) setError(''); // Clear error on valid input
                }}
                className={`w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                  error ? 'border-red-500/50 focus:ring-red-500/50' : ''
                }`}
                required
                step="0.01"
                min="0.01"
                disabled={isSubmitting}
              />
              {error && (
                <p className="mt-1 text-sm text-red-300 flex items-center">
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  {error}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-200 mb-1">Date de Paiement</label>
              <CalendarIcon className="absolute left-3 top-10 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (error) setError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                required
                disabled={isSubmitting}
                max={new Date().toISOString().split('T')[0]} // Pas de future date
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600/30">
              <motion.button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-700/50 text-gray-200 hover:bg-gray-600/50 rounded-xl transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Annuler
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmitting || parseFloat(montant) <= 0 || !date}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Confirmer Paiement</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;