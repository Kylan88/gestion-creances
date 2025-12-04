import React, { useState } from 'react';
import api from '../../services/api';

const AddClient = () => {
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    montant_du: '',
    date_echeance: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/clients/add', formData, {
        withCredentials: true,
      });

      console.log('Client ajouté :', response.data);
      alert('Client ajouté avec succès !');

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        telephone: '',
        email: '',
        montant_du: '',
        date_echeance: '',
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout du client :", err);
      const msg = err.response?.data?.error || err.message || "Erreur inconnue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '560px',
        margin: '2rem auto',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>
        Ajouter un nouveau client
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            border: '1px solid #fcc',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nom */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label
            htmlFor="nom"
            style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}
          >
            Nom complet
          </label>
          <input
            id="nom"
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #007bff')}
            onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
          />
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label
            htmlFor="telephone"
            style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}
          >
            Téléphone (ex: +2250123456789 ou 0123456789)
          </label>
          <input
            id="telephone"
            type="text"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
            placeholder="+225 01 23 45 67 89"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #007bff')}
            onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #007bff')}
            onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
          />
        </div>

        {/* Montant dû */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label
            htmlFor="montant_du"
            style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}
          >
            Montant dû (FCFA)
          </label>
          <input
            id="montant_du"
            type="number"
            name="montant_du"
            min="1"
            step="100"
            value={formData.montant_du}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #007bff')}
            onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
          />
        </div>

        {/* Date d'échéance */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="date_echeance"
            style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#444' }}
          >
            Date d'échéance
          </label>
          <input
            id="date_echeance"
            type="date"
            name="date_echeance"
            value={formData.date_echeance}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '2px solid #007bff')}
            onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
          />
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.9rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: loading ? '#555' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le client'}
        </button>
      </form>
    </div>
  );
};

export default AddClient;