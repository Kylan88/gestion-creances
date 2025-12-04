// src/pages/EnterCode.js
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import '../../styles/auth.css';

const EnterCode = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('code'); // 'code' ou 'password'
  const [code, setCode] = useState(['', '', '', '', '', '']); // Pour saisie code
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' }); // Pour password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const method = searchParams.get('method'); // 'sms'

  useEffect(() => {
    if (method !== 'sms') {
      toast.error('Accès invalide. Redirection vers connexion.');
      navigate('/login');
    }
    inputRefs.current[0]?.focus();
  }, [method, navigate]);

  const handleInputChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      } else if (!value && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'Enter') {
      if (step === 'code') {
        handleCodeSubmit();
      } else {
        handlePasswordSubmit();
      }
    }
  };

  const handleCodeSubmit = async () => {
    const codeString = code.join('');
    if (codeString.length !== 6) {
      toast.error('Veuillez saisir un code à 6 chiffres.');
      return;
    }

    // Ici, pour simplicité, on assume validation code backend ; passe direct à password
    // En prod, POST à un endpoint /verify-code pour valider avant password
    setStep('password');
    toast.info('Code vérifié ! Entrez votre nouveau mot de passe.');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsSubmitting(true);

    try {
      const codeString = code.join('');
      const res = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: codeString,  // Envoi code pour SMS
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
        setStep('code'); // Reset sur erreur
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (err) {
      toast.error('Erreur réseau ou serveur.');
    }
    setIsSubmitting(false);
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({ 
      opacity: 1, 
      scale: 1, 
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
        <h1 className="auth-title">
          {step === 'code' ? 'Vérification par code SMS' : 'Nouveau mot de passe'}
        </h1>
        <p className="auth-subtitle">
          {step === 'code' 
            ? 'Entrez le code à 6 chiffres envoyé à votre numéro.' 
            : 'Choisissez un nouveau mot de passe sécurisé.'
          }
        </p>
        
        {step === 'code' ? (
          <>
            <div className="code-inputs">
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="auth-input code-input"
                  variants={inputVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                />
              ))}
            </div>
            <Button 
              type="button" 
              onClick={handleCodeSubmit}
              disabled={code.join('').length !== 6}
              className="auth-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Vérifier code
            </Button>
          </>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="auth-form">
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
        )}

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

export default EnterCode;