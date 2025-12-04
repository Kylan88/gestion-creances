import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  UserIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import PhoneInputField from './PhoneInputField';

// Schéma Zod = validation ultime
const clientSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
  telephone: z.string().regex(/^\+225\d{8,10}$/, 'Numéro invalide (ex: +225 01 23 45 67 89)'),
  email: z.string().email('Email invalide'),
  montant_du: z.coerce.number().positive('Montant doit être positif'),
  date_echeance: z.string().min(1, 'Date requise'),
});

const ClientForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: initialData.nom || '',
      telephone: initialData.telephone || '',
      email: initialData.email || '',
      montant_du: initialData.montant_du || '',
      date_echeance: initialData.date_echeance || '',
    },
  });

  // Reset auto quand on change de client (édition)
  React.useEffect(() => {
    reset({
      nom: initialData.nom || '',
      telephone: initialData.telephone || '',
      email: initialData.email || '',
      montant_du: initialData.montant_du || '',
      date_echeance: initialData.date_echeance || '',
    });
  }, [initialData, reset]);

  const onSubmitForm = async (data) => {
    try {
      await onSubmit(data);
      toast.success(initialData.id ? 'Client mis à jour !' : 'Client ajouté !');
      if (!initialData.id) reset(); // reset seulement si ajout
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur serveur');
    }
  };

  // Pour le téléphone (champ custom)
  const phoneValue = watch('telephone');

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmitForm)}
      className="space-y-6 max-w-md mx-auto p-4 sm:p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Nom */}
      <InputField
        label="Nom du Client"
        icon={UserIcon}
        type="text"
        placeholder="Koffi Jean"
        error={errors.nom?.message}
        {...register('nom')}
      />

      {/* Téléphone PRO */}
      <PhoneInputField
        value={phoneValue}
        onChange={(value) => setValue('telephone', value || '', { shouldValidate: true })}
        label="Téléphone"
        error={errors.telephone?.message}
        disabled={isSubmitting}
        defaultCountry="CI"
      />

      {/* Email */}
      <InputField
        label="Email"
        icon={EnvelopeIcon}
        type="email"
        placeholder="jean@gmail.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Montant */}
      <InputField
        label="Montant dû (FCFA)"
        icon={CurrencyDollarIcon}
        type="number"
        placeholder="50000"
        error={errors.montant_du?.message}
        {...register('montant_du')}
      />

      {/* Date */}
      <InputField
        label="Date d'échéance"
        icon={CalendarIcon}
        type="date"
        error={errors.date_echeance?.message}
        min={new Date().toISOString().split('T')[0]}
        {...register('date_echeance')}
      />

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-600/30">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 bg-gray-800/80 text-gray-200 rounded-xl hover:bg-gray-700 transition"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sauvegarde...</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Sauvegarder</span>
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

// InputField simplifié (plus besoin de name, onChange, etc.)
const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1">
    <label className="block text-sm text-gray-300">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
      <input
        {...props}
        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-500/50 focus:ring-red-500/50'
            : 'border-gray-600/50 focus:ring-emerald-500/50'
        }`}
      />
    </div>
    {error && (
      <p className="text-xs text-red-300 flex items-center gap-1 mt-1">
        {error}
      </p>
    )}
  </div>
);

export default ClientForm;