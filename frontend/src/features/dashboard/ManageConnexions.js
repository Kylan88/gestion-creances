import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connexionsAPI } from '../../services/api';
import { toast } from 'react-toastify';  
import Button from '../../components/common/Button';

const ManageConnexions = () => {
  const [connexions, setConnexions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search_user: '',
    action: 'tous',
    date_debut: '',
    date_fin: '',
  });

  const fetchConnexions = (page = 1) => {
    const params = { ...filters, page, per_page: 10 };
    connexionsAPI.getAll(params).then((res) => {
      setConnexions(res.data.connexions || []);
      setTotalPages(res.data.total_pages || 1);
      setCurrentPage(page);
    }).catch((err) => {
      console.error('Erreur fetch connexions:', err);
    });
  };

  useEffect(() => {
    fetchConnexions(1);
  }, [filters]);

  const handleFiltersChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handlePageChange = (page) => {
    fetchConnexions(page);
  };

  const actionsOptions = [
    { value: 'tous', label: 'Toutes actions' },
    { value: 'login', label: 'Connexion' },
    { value: 'logout', label: 'Déconnexion' },
  ];

  const handleReset = () => {
    setFilters({ search_user: '', action: 'tous', date_debut: '', date_fin: '' });
    fetchConnexions(1);
    toast.success("Filtres réinitialisés"); 
  };

  return (
    <div className="p-6">
      {/* Bouton Retour */}
      <div className="mb-4 flex items-center">
        <Link to="/dashboard">
          <Button variant="secondary" className="mr-4">← Retour au Dashboard</Button>
        </Link>
        <h1 className="text-2xl font-bold">Gestion des Connexions (Admin)</h1>
      </div>
      
      {/* Filtres */}
      <div className="mb-4 space-y-2 md:space-y-0 md:flex md:space-x-4">
        <input
          placeholder="Rechercher par username"
          value={filters.search_user}
          onChange={(e) => handleFiltersChange('search_user', e.target.value)}
          className="p-2 border rounded w-full md:w-64"
        />
        <select
          value={filters.action}
          onChange={(e) => handleFiltersChange('action', e.target.value)}
          className="p-2 border rounded w-full md:w-48"
        >
          {actionsOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date_debut}
          onChange={(e) => handleFiltersChange('date_debut', e.target.value)}
          className="p-2 border rounded w-full md:w-32"
        />
        <input
          type="date"
          value={filters.date_fin}
          onChange={(e) => handleFiltersChange('date_fin', e.target.value)}
          className="p-2 border rounded w-full md:w-32"
        />
        <Button onClick={() => fetchConnexions(1)}>Filtrer</Button>
        <Button onClick={handleReset} variant="secondary">Réinitialiser</Button>
      </div>

      {/* Tableau */}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Action</th>
            <th className="py-2 px-4 border-b">Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          {connexions.length > 0 ? (
            connexions.map((item) => (
              <tr key={item.id}>
                <td className="py-2 px-4 border-b">
                  {new Date(item.date_action).toLocaleString('fr-FR')}
                </td>
                <td className="py-2 px-4 border-b font-semibold capitalize">
                  {item.action}
                </td>
                <td className="py-2 px-4 border-b">{item.username || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="py-4 px-4 text-center text-gray-500">Aucune connexion trouvée.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="secondary"
          >
            Précédent
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
            return pageNum <= totalPages ? (
              <Button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={pageNum === currentPage}
                variant={pageNum === currentPage ? 'primary' : 'secondary'}
              >
                {pageNum}
              </Button>
            ) : null;
          })}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="secondary"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManageConnexions;