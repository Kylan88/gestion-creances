import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import '../../styles/auth.css';  

const AuthForm = () => {
  const [mode, setMode] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotData, setForgotData] = useState({ identifier: '' }); // email or phone
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const { login, setUser } = useAuth(); // AJOUTÉ : setUser pour updater le profil après login (incl. avatar_url)
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    email: '',
    telephone: '', // NOUVEAU : Pour register
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let success;
      if (mode === 'register') {
        const registerData = {
          username: formData.username,
          fullname: formData.fullname,
          email: formData.email,
          telephone: formData.telephone, // NOUVEAU : Envoi téléphone
          password: formData.password,
          confirm_password: formData.confirmPassword,
        };
        const res = await fetch('http://localhost:5000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          success = await login({ username: formData.username, password: formData.password });
        } else {
          toast.error(data.error);
          return;
        }
      } else {
        success = await login({ username: formData.username, password: formData.password });
      }

      if (success) {
        // NOUVEAU : Après login réussi, fetch /profil pour charger avatar_url et autres infos persistantes
        // Cela assure que l'avatar mis à jour reste visible après reconnexion (stocké en DB via app.py)
        try {
          const profileRes = await fetch('http://localhost:5000/profil', {
            method: 'GET',
            credentials: 'include', // Pour session
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            // Met à jour le contexte avec profileData (incl. avatar_url de app.py)
            setUser(profileData); // Assume setUser met à jour le state user avec avatar_url, etc.
          } else {
            console.warn('Échec fetch /profil après login, mais navigation continue');
          }
        } catch (profileErr) {
          console.error('Erreur fetch /profil:', profileErr);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('Erreur réseau ou serveur');
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (isForgotSubmitting) return;
    setIsForgotSubmitting(true);

    try {
      console.log('Forgot: Appel fetch à /forgot-password avec identifier:', forgotData.identifier);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);  // FIX : 30s pour SMTP lent

      const res = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotData.identifier }),
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Forgot: Réponse status:', res.status);

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Lien/code envoyé !');
        if (data.method === 'SMS') {
          navigate('/enter-code?method=sms');
        } else if (data.token) {
          navigate(`/reset-password?token=${data.token}`);
        } else {
          setShowForgotPassword(false);
        }
        setForgotData({ identifier: '' });
      } else {
        toast.error(data.error || 'Erreur backend (500 ? Vérifiez logs SMTP).');
      }
    } catch (err) {
      console.error('Forgot: Erreur fetch:', err);
      // FIX : Ignore AbortError silencieusement (warning React inoffensif)
      if (err.name === 'AbortError') {
        toast.warning('Timeout (30s) : Backend lent (SMTP ?). Réessayez.');
      } else {
        toast.error('Erreur réseau : ' + err.message);
      }
    }
    setIsForgotSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    // Intégration Google OAuth. Utiliser @react-oauth/google pour un flux complet.
    // Ici, on assume que le backend a une route /auth/google qui gère le callback OAuth.
    // Étapes backend (à ajouter dans app.py) :
    // 1. Installer flask-oauthlib ou google-auth.
    // 2. Route GET /auth/google pour redirect vers Google.
    // 3. Route /auth/google/callback pour échanger code pour token, créer/lier user, set session.
    // Frontend : Utiliser window.location pour redirect, ou une lib comme react-oauth/google (dépréciée, préférer @react-oauth/google).
    // Pour simplicité, on simule un redirect vers le backend OAuth endpoint.
    window.location.href = 'http://localhost:5000/auth/google';
  };

  const isRegisterMode = mode === 'register';

  // Variants pour animations
  const formVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { delay: i * 0.1 } 
    }),
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <motion.div 
      className="auth-container"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <motion.div 
        className="auth-card"
        variants={formVariants}
      >
        <motion.div className="auth-header" variants={inputVariants}>
          <motion.h1 className="auth-title" custom={0}>Bienvenue</motion.h1>
          <motion.p className="auth-subtitle" custom={1}>Veuillez entrer vos informations de connexion</motion.p>
        </motion.div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegisterMode && (
            <>
              <motion.input 
                name="fullname" 
                placeholder="Nom complet" 
                value={formData.fullname} 
                onChange={handleChange} 
                className="auth-input"
                required 
                variants={inputVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              />
              <motion.input 
                name="email" 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={handleChange} 
                className="auth-input"
                required 
                variants={inputVariants}
                custom={3}
                initial="hidden"
                animate="visible"
              />
              {/* NOUVEAU : Champ téléphone pour register */}
              <motion.input 
                name="telephone" 
                type="tel" 
                placeholder="Téléphone (e.g., 0123456789 pour +225)" 
                value={formData.telephone} 
                onChange={handleChange} 
                className="auth-input"
                required 
                variants={inputVariants}
                custom={4}
                initial="hidden"
                animate="visible"
              />
            </>
          )}
          <motion.input 
            name="username" 
            placeholder="Nom d'utilisateur" 
            value={formData.username} 
            onChange={handleChange} 
            className="auth-input"
            required 
            variants={inputVariants}
            custom={isRegisterMode ? 5 : 0}
            initial="hidden"
            animate="visible"
          />
          <motion.input 
            name="password" 
            type="password" 
            placeholder="Mot de passe" 
            value={formData.password} 
            onChange={handleChange} 
            className="auth-input"
            required 
            variants={inputVariants}
            custom={isRegisterMode ? 6 : 1}
            initial="hidden"
            animate="visible"
          />
          {isRegisterMode && (
            <motion.input 
              name="confirmPassword" 
              type="password" 
              placeholder="Confirmez le mot de passe" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              className="auth-input"
              required 
              variants={inputVariants}
              custom={7}
              initial="hidden"
              animate="visible"
            />
          )}
          {!isRegisterMode && (
            <motion.button 
              type="button"
              onClick={() => setShowForgotPassword(true)} 
              className="forgot-password-link" 
              custom={2} 
              initial="hidden" 
              animate="visible"
              whileHover={{ color: '#4285f4' }}
            >
              mot de passe oublié ?
            </motion.button>
          )}
          <motion.button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
            variants={inputVariants}
            custom={isRegisterMode ? 8 : 3}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? 'Loading...' : (isRegisterMode ? "M'enregister" : 'Connexion')}
          </motion.button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>
        <motion.button 
          className="google-button" 
          onClick={handleGoogleLogin}
          variants={inputVariants}
          custom={4}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="google-icon" />
          Connectez vous avec Google
        </motion.button>

        <motion.div 
          className="auth-footer"
          variants={inputVariants}
          custom={5}
          initial="hidden"
          animate="visible"
        >
          <p>
            {isRegisterMode ? 'Deja un compte ?' : "pas encore de compte chez nous ?"}
            <button type="button" onClick={() => setMode(isRegisterMode ? 'login' : 'register')} className="auth-link">
              {isRegisterMode ? 'Connexion' : 'crée votre compte gratuitement ici'}
            </button>
          </p>
        </motion.div>
      </motion.div>

      {/* Modal pour mot de passe oublié */}
      {showForgotPassword && (
        <motion.div 
          className="forgot-modal-overlay"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          onClick={() => setShowForgotPassword(false)}
        >
          <motion.div 
            className="forgot-modal"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Reset Password</h2>
            <p>Enter your email or phone number to receive a reset link or code.</p>
            <form onSubmit={handleForgotPassword}>
              <input 
                name="identifier" 
                type="text" 
                placeholder="Email or Phone Number" 
                value={forgotData.identifier} 
                onChange={handleForgotChange} 
                className="auth-input"
                required 
              />
              <div className="modal-buttons">
                <Button 
                  type="submit" 
                  disabled={isForgotSubmitting}
                  className="auth-button"
                >
                  {isForgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowForgotPassword(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AuthForm;