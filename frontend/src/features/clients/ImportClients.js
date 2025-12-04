import React, { useState } from 'react';
import Button from '../../components/common/Button';
import { clientsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ImportClients = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Sélectionne un fichier CSV');
      return;
    }
    setIsImporting(true);
    try {
      const res = await clientsAPI.importCSV(file);
      toast.success(res.data.message);
      setFile(null);
      if (onImportSuccess) onImportSuccess();  // Refresh liste
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur import');
    }
    setIsImporting(false);
  };

  // Génère et télécharge CSV exemple
  const handleDownloadExample = () => {
    const csvContent = `nom,telephone,email,montant_du,date_echeance
Exemple Client 1,+225070000000,client1@example.com,50000.00,2025-10-01
Exemple Client 2,+225070000001,client2@example.com,25000.50,2025-09-15
Exemple Client 3,+225070000002,client3@example.com,75000.00,2025-11-30

# Notes : 
# - Téléphone : Format international (+225 pour Côte d'Ivoire) ou local (10 chiffres).
# - Montant_du : En FCFA, positif (ex. 50000.00).
# - Date_echeance : Format YYYY-MM-DD.
# - Email : Valide et unique.
# - Importe seulement les lignes valides ; les erreurs sont ignorées.
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'exemple_clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.info('Exemple CSV téléchargé ! Adapte-le à tes données.');
  };

  const fileName = file ? file.name : 'Aucun fichier';

  return (
    <div className="w-full space-y-1 overflow-hidden">  {/* Ultra-compact : space-y-1, overflow-hidden */}
      <div className="flex items-center space-x-1"> {/* Row ultra-serrée */}
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          className="flex-1 p-0.5 border border-gray-600/50 rounded text-xs bg-white/10 text-gray-100 file:mr-0.5 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-300 min-w-0 truncate"  
          disabled={isImporting}
          title={fileName} 
          placeholder="Choisir CSV"  
        />
        <Button 
          onClick={handleImport} 
          disabled={!file || isImporting} 
          className="flex-none bg-purple-500 hover:bg-purple-600 text-white px-1 py-0.5 text-xs whitespace-nowrap" 
          size="sm"
        >
          {isImporting ? '...' : 'Importer.'}  {/* Abréviation pour compacité */}
        </Button>
      </div>
      <Button 
        onClick={handleDownloadExample} 
        className="w-full bg-gray-500 hover:bg-gray-600 text-white px-1 py-0.5 text-xs" 
        size="sm"
      >
        📥Telecharger un Exemple ici.
      </Button>
      <p className="text-xs text-gray-400 hidden sm:block truncate">Colonnes : nom, tel, email, montant, date</p> {/* Abrégé et masqué mobile */}
    </div>
  );
};

export default ImportClients;