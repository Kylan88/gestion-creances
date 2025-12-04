import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI } from '../../services/api';
import Button from '../../components/common/Button';

const RelanceClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsAPI.getById(id).then((res) => {
      setClient(res.data.client);
      setLoading(false);
    }).catch(() => navigate('/clients'));
  }, [id, navigate]);

  const handleRelance = () => {
    clientsAPI.relance(id).then(() => {
      alert('Relance envoyée !');
      navigate('/clients');
    });
  };

  if (loading) return <div>Chargement...</div>;
  if (!client) return <div>Client non trouvé</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Relancer {client.nom}</h1>
      <p>Montant dû : {client.montant_du} FCFA</p>
      <p>Échéance : {client.date_echeance}</p>
      <Button onClick={handleRelance} className="mt-4 bg-yellow-500">Envoyer Relance</Button>
      <Button onClick={() => navigate('/clients')} className="ml-2">Annuler</Button>
    </div>
  );
};

export default RelanceClient;