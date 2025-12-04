import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientForm from '../../components/ui/ClientForm';
import { clientsAPI } from '../../services/api';
import Button from '../../components/common/Button'; 

const EditClient = () => {
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

  const handleSubmit = (data) => {
    clientsAPI.update(id, data).then(() => navigate('/clients'));
  };

  if (loading) return <div>Chargement...</div>;
  if (!client) return <div>Client non trouvé</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Éditer Client</h1>
      <ClientForm initialData={client} onSubmit={handleSubmit} onCancel={() => navigate('/clients')} />
      <Button onClick={() => navigate('/clients')} className="mt-4">Retour</Button>  {/* Ajouté pour utiliser Button */}
    </div>
  );
};

export default EditClient;