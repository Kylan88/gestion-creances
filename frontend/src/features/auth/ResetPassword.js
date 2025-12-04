// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import '../../styles/auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({ 
    new_password: '', 
    confirm_password: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token manquant. Redirection vers la connexion.');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,  // Envoi token pour email
          ...formData 
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        navigate('/login');
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Erreur réseau ou serveur.');
    }
    setIsSubmitting(false);
  };

  if (!token) return null; // Redirigé par useEffect

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { delay: i * 0.1 } 
    }),
  };

  return (
    <motion.div 
      className="auth-container"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <motion.div className="auth-card" variants={formVariants}>
        <h1 className="auth-title">Réinitialiser le mot de passe</h1>
        <p className="auth-subtitle">Entrez votre nouveau mot de passe.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <motion.input 
            type="password" 
            name="new_password" 
            placeholder="Nouveau mot de passe" 
            value={formData.new_password} 
            onChange={handleChange} 
            className="auth-input"
            required 
            variants={inputVariants}
            custom={0}
            initial="hidden"
            animate="visible"
          />
          <motion.input 
            type="password" 
            name="confirm_password" 
            placeholder="Confirmer le nouveau mot de passe" 
            value={formData.confirm_password} 
            onChange={handleChange} 
            className="auth-input"
            required 
            variants={inputVariants}
            custom={1}
            initial="hidden"
            animate="visible"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="auth-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
          </Button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="auth-link"
            style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline' }}
          >
            Retour à la connexion
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResetPassword;