import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarEditor from 'react-avatar-editor';
import { 
  ChevronLeftIcon,
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  ArrowPathIcon,
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

const Profil = () => {
  const { user, updateUser, refetchUser } = useAuth(); // Utilise refetchUser et updateUser du context
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newUsername: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState({
    updateInfo: false,
    changeUsername: false,
    changePassword: false,
    uploadAvatar: false,
  });
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [croppedImage, setCroppedImage] = useState(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  // Memoize getBackendUrl pour stabilité (dépend de process.env constant)
  const getBackendUrl = useCallback((endpoint) => {
    if (process.env.NODE_ENV === 'development') {
      return `http://localhost:5000${endpoint}`;
    }
    return endpoint;
  }, []);

  // Helper pour résoudre l'URL avatar (relative → full en dev)
  const resolveAvatarUrl = useCallback((avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:')) return avatarUrl;
    return getBackendUrl(avatarUrl);
  }, [getBackendUrl]);

  // Cleanup URL.createObjectURL pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      if (croppedImage) {
        URL.revokeObjectURL(croppedImage);
      }
    };
  }, [imageSrc, croppedImage]);

  // Fonction pour redimensionner l'image éditée (max 512x512, maintient l'aspect ratio)
  const resizeImage = useCallback((file, maxSize = 512) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        let { width: origWidth, height: origHeight } = img;

        const scaleFactor = Math.min(maxSize / origWidth, maxSize / origHeight);
        const width = Math.round(origWidth * scaleFactor);
        const height = Math.round(origHeight * scaleFactor);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: file.type });
            resolve(resizedFile);
          } else {
            reject(new Error('Erreur lors de la création du blob'));
          }
        }, file.type, 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Fonction pour sauvegarder l'image éditée en blob
  const handleSave = useCallback(async (editor) => {
    if (!editor) return null;
    const canvas = editor.getImageScaledToCanvas();
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const editedFile = new File([blob], 'edited-avatar.png', { type: 'image/png' });
          try {
            const resizedFile = await resizeImage(editedFile);
            const croppedUrl = URL.createObjectURL(resizedFile);
            setCroppedImage(croppedUrl);
            setAvatarFile(resizedFile);
            resolve(croppedUrl); // Retourne l'URL valide pour setAvatarPreview
          } catch (err) {
            console.error('Erreur resize:', err);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }, 'image/png', 0.9);
    });
  }, [resizeImage]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newUsername: '',
      });
      // FIX : Résoudre l'URL pour preview (relative → full en dev)
      setAvatarPreview(resolveAvatarUrl(user.avatar_url));
      setError(null);
    }
  }, [user, resolveAvatarUrl]);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return toast.error('Fichier doit être une image');
      }
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('Image trop grande (max 5MB)');
      }
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        setImageSrc(objectUrl);
        setShowCropper(true);
        setCroppedImage(null);
        setAvatarFile(null);
        setScale(1);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error('Erreur chargement image');
      };
      img.src = objectUrl;
    }
  }, []);

  // Confirmer l'édition et fermer l'éditeur
  const handleConfirmEdit = useCallback(async () => {
    if (editorRef.current) {
      const croppedUrl = await handleSave(editorRef.current);
      if (croppedUrl) {
        setAvatarPreview(croppedUrl);
        // Revoke explicite si besoin (mais cleanup useEffect gère déjà)
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        if (croppedImage) URL.revokeObjectURL(croppedImage);
        setImageSrc(null);
        setCroppedImage(null);
        setShowCropper(false);
      } else {
        toast.error('Veuillez ajuster l\'image');
      }
    } else {
      toast.error('Éditeur non prêt, réessayez');
    }
  }, [handleSave, imageSrc, croppedImage]);

  const handleCancelEdit = useCallback(() => {
    setShowCropper(false);
    setImageLoaded(false);
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    if (croppedImage) {
      URL.revokeObjectURL(croppedImage);
    }
    setCroppedImage(null);
    setAvatarFile(null);
    setScale(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageSrc, croppedImage]);

  // Slider pour zoom
  const handleScaleChange = useCallback((e) => {
    setScale(parseFloat(e.target.value));
  }, []);

  const handleUploadAvatar = useCallback(async () => {
    if (!avatarFile) {
      return toast.error('Aucune image sélectionnée');
    }
    setLoading(prev => ({ ...prev, uploadAvatar: true }));
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', avatarFile);
      const res = await fetch(getBackendUrl('/profil'), {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });
      if (!res.ok) {
        const errText = await res.text();
        let errData = {};
        try {
          errData = JSON.parse(errText);
        } catch {
          errData = { error: errText.substring(0, 200) + '...' };
        }
        throw new Error(errData.error || `Erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log('Réponse backend avatar:', data); // Log pour debug
      toast.success('Avatar mis à jour');
      setAvatarFile(null);
      // FIX : Résoudre l'URL pour preview (relative → full en dev)
      const fullAvatarUrl = resolveAvatarUrl(data.avatar_url);
      setAvatarPreview(fullAvatarUrl);
      setCroppedImage(null);
      if (updateUser) {
        updateUser({ ...user, avatar_url: data.avatar_url }); // Update immédiat
      }
      // FIX : Refetch pour sync complet (DB → context, persiste après reload)
      await refetchUser(); // Utilise du context (fetch /api/user et setUser)
    } catch (err) {
      console.error('Erreur upload avatar détaillée:', err);
      toast.error(err.message || 'Erreur upload avatar');
    } finally {
      setLoading(prev => ({ ...prev, uploadAvatar: false }));
    }
  }, [avatarFile, user, updateUser, getBackendUrl, resolveAvatarUrl, refetchUser]);

  const handleRemoveAvatar = useCallback(async () => {
    setLoading(prev => ({ ...prev, uploadAvatar: true }));
    try {
      const res = await fetch(getBackendUrl('/profil'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'remove_avatar' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la suppression');
      }
      toast.success('Avatar supprimé');
      setAvatarPreview(null);
      if (updateUser) {
        updateUser({ ...user, avatar_url: null });
      }
      // FIX : Refetch pour sync
      await refetchUser();
    } catch (err) {
      console.error('Erreur remove avatar:', err);
      toast.error(err.message || 'Erreur suppression avatar');
    } finally {
      setLoading(prev => ({ ...prev, uploadAvatar: false }));
    }
  }, [user, updateUser, getBackendUrl, refetchUser]);

  const handleUpdateInfo = useCallback(async () => {
    if (!formData.fullname.trim() || !formData.email.trim()) {
      return toast.error('Nom et email requis');
    }
    setLoading(prev => ({ ...prev, updateInfo: true }));
    try {
      await authAPI.updateProfil({ 
        action: 'update_info', 
        fullname: formData.fullname.trim(), 
        email: formData.email.trim() 
      });
      toast.success('Infos mises à jour');
      if (updateUser) {
        updateUser({ ...user, fullname: formData.fullname.trim(), email: formData.email.trim() });
      }
      // FIX : Refetch pour sync complet (ex. si backend modifie autre chose)
      await refetchUser();
    } catch (err) {
      console.error('Erreur update info:', err);
      toast.error(err.response?.data?.error || 'Erreur mise à jour');
    } finally {
      setLoading(prev => ({ ...prev, updateInfo: false }));
    }
  }, [formData.fullname, formData.email, user, updateUser, refetchUser]);

  const handleChangeUsername = useCallback(async () => {
    const trimmedUsername = formData.newUsername.trim();
    if (!trimmedUsername) {
      return toast.error('Nouveau username requis');
    }
    if (trimmedUsername.length < 3) {
      return toast.error('Username doit faire au moins 3 caractères');
    }
    if (trimmedUsername === user.username) {
      return toast.info('Username identique, aucune modification');
    }
    setLoading(prev => ({ ...prev, changeUsername: true }));
    try {
      await authAPI.updateProfil({ 
        action: 'change_username', 
        new_username: trimmedUsername 
      });
      toast.success('Username mis à jour');
      setFormData(prev => ({ ...prev, newUsername: '' }));
      if (updateUser) {
        updateUser({ ...user, username: trimmedUsername });
      }
      // FIX : Refetch pour sync
      await refetchUser();
    } catch (err) {
      console.error('Erreur change username:', err);
      toast.error(err.response?.data?.error || 'Erreur changement username');
    } finally {
      setLoading(prev => ({ ...prev, changeUsername: false }));
    }
  }, [formData.newUsername, user.username, user, updateUser, refetchUser]);

  const handleChangePassword = useCallback(async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Mots de passe non identiques');
    }
    if (!formData.currentPassword || !formData.newPassword) {
      return toast.error('Champs requis');
    }
    if (formData.newPassword.length < 8) {
      return toast.error('Nouveau mot de passe trop court (min 8 caractères)');
    }
    setLoading(prev => ({ ...prev, changePassword: true }));
    try {
      await authAPI.updateProfil({
        action: 'change_password',
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      toast.success('Mot de passe mis à jour');
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));
      // FIX : Refetch pour sync (ex. si backend invalide session ou autre)
      await refetchUser();
    } catch (err) {
      console.error('Erreur change password:', err);
      toast.error(err.response?.data?.error || 'Erreur changement mot de passe');
    } finally {
      setLoading(prev => ({ ...prev, changePassword: false }));
    }
  }, [formData.currentPassword, formData.newPassword, formData.confirmPassword, refetchUser]);

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 flex items-center justify-center p-6"
      >
        <div className="text-center bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <p className="text-red-200 mb-4">Utilisateur non trouvé</p>
          <Link to="/login">
            <Button className="bg-red-600 hover:bg-red-700">Se connecter</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 flex items-center justify-center p-6"
      >
        <div className="text-center bg-red-900/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <p className="text-red-200 mb-4">{error}</p>
          <Button onClick={() => setError(null)} className="bg-red-600 hover:bg-red-700">
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-gray-100 p-4 font-sans"
    >
      {/* HEADER - Centré */}
      <header className="mb-6 flex flex-col items-center space-y-2 sm:flex-row sm:items-center sm:justify-center sm:space-y-0 sm:space-x-4">
        <Link to="/dashboard">
          <Button variant="ghost" className="p-2 text-emerald-400 hover:text-emerald-300">
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400"
              onError={() => setAvatarPreview(null)} // Fallback si src invalide
            />
          ) : (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Mon Profil
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto space-y-6">

        {/* Avatar Upload */}
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-100">
              <CameraIcon className="w-4 h-4" />
              <span>Avatar</span>
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
                      onError={() => setAvatarPreview(null)} // Fallback si src invalide
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {avatarPreview && (
                    <motion.button
                      onClick={handleRemoveAvatar}
                      disabled={loading.uploadAvatar}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 text-white shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>
                {!showCropper ? (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg cursor-pointer flex-1 py-2 rounded-lg transition-colors duration-200"
                    >
                      <CameraIcon className="w-3 h-3" />
                      <span>Choisir une photo</span>
                    </label>
                    <input
                      id="avatar-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    {avatarFile && (
                      <motion.div whileHover={{ scale: 1.05 }} className="flex-1">
                        <Button
                          onClick={handleUploadAvatar}
                          disabled={loading.uploadAvatar}
                          className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 shadow-lg disabled:opacity-50 py-2"
                        >
                          {loading.uploadAvatar ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Upload</span>
                            </>
                          ) : (
                            <>
                              <ArrowPathIcon className="w-3 h-3" />
                              <span>OK</span>
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Mode Éditeur Avatar
                  <div className="w-full space-y-3">
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                      {imageLoaded ? (
                        <div className="relative">
                          <AvatarEditor
                            key={imageSrc}
                            ref={editorRef}
                            image={imageSrc}
                            width={200}
                            height={200}
                            border={20}
                            borderRadius={100}
                            color={[255, 255, 255, 1]}
                            scale={scale}
                            rotate={0}
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-gray-700 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        </div>
                      )}
                      <div className="w-full mt-3">
                        <label className="text-sm text-gray-300 block mb-1">Zoom:</label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={scale}
                          onChange={handleScaleChange}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          disabled={!imageLoaded}
                        />
                      </div>
                    </div>
                    {croppedImage && (
                      <div className="flex items-center justify-center">
                        <img
                          src={croppedImage}
                          alt="Preview Éditée"
                          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400"
                        />
                      </div>
                    )}
                    <div className="flex space-x-2 justify-center">
                      <Button
                        onClick={handleConfirmEdit}
                        disabled={!imageLoaded}
                        className="bg-emerald-500 hover:bg-emerald-600 flex-1"
                      >
                        Confirmer
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="bg-gray-600 hover:bg-gray-500 flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center">JPG, PNG (max 5MB, édité & redimensionné à 512px max)</p>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Infos Personnelles */}
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20 shadow-xl mb-6"
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-100">
              <UserIcon className="w-4 h-4" />
              <span>Informations</span>
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  value={user.username || 'N/A'} 
                  readOnly 
                  className="w-full pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-100 cursor-not-allowed focus:outline-none"
                  placeholder="Username actuel"
                />
              </div>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="fullname" 
                  placeholder="Nom complet" 
                  value={formData.fullname} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleUpdateInfo} 
                  disabled={loading.updateInfo}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg py-2"
                >
                  {loading.updateInfo ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Maj...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>Mettre à jour</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Username */}
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20 shadow-xl mb-6"
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-100">
              <UserIcon className="w-4 h-4" />
              <span>Changer Nom d'Utilisateur</span>
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="newUsername" 
                  placeholder="Nouveau (min 3 car.)" 
                  value={formData.newUsername} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleChangeUsername} 
                  disabled={loading.changeUsername || !formData.newUsername.trim()}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg disabled:opacity-50 py-2"
                >
                  {loading.changeUsername ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Maj...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>Changer</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Password */}
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-gray-100">
              <KeyIcon className="w-4 h-4" />
              <span>Changer Mot De Passe</span> 
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="currentPassword" 
                  type="password" 
                  placeholder="Actuel" 
                  value={formData.currentPassword} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="newPassword" 
                  type="password" 
                  placeholder="Nouveau (min 8)" 
                  value={formData.newPassword} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  name="confirmPassword" 
                  type="password" 
                  placeholder="Confirmer" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleChangePassword} 
                  disabled={loading.changePassword || formData.newPassword !== formData.confirmPassword || !formData.newPassword}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg disabled:opacity-50 py-2"
                >
                  {loading.changePassword ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Maj...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>Changer</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Profil;