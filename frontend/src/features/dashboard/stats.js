import React, { useEffect, useState } from "react";
import { getStats } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext"; 

export default function Stats(){
  const { user } = useAuth(); // Optionnel : pour admin
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(e => console.error(e));
  }, []);

  if(!stats) return <div>Chargement des statistiques...</div>;

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
      <div style={{padding:12, border:"1px solid #ddd", borderRadius:8}}>
        <h4>Montants</h4>
        <div>En retard: {stats.montants_par_statut.retard} FCFA</div>
        <div>A venir: {stats.montants_par_statut.avenir} FCFA</div>
      </div>
      <div style={{padding:12, border:"1px solid #ddd", borderRadius:8}}>
        <h4>Répartition</h4>
        <div>Payés: {stats.repartition_clients.payes}</div>
        <div>En retard: {stats.repartition_clients.en_retard}</div>
        <div>Total: {stats.repartition_clients.total}</div>
      </div>
      <div style={{padding:12, border:"1px solid #ddd", borderRadius:8}}>
        <h4>Total dû</h4>
        <div>{stats.total_du} FCFA</div>
      </div>
    </div>
  );
}