import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { statsAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, UsersIcon, ClockIcon, CalendarIcon, UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Aujourd\'hui');
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (period = 'Aujourd\'hui') => {
    setLoading(true);
    setError(null);
    try {
      const response = await statsAPI(); // Pas de token : sessions via cookies (cohérent avec app.py)
      console.log('Raw Stats Response:', response); // Debug : Vois la structure exacte
      setStats(response); // FIX : Match le premier code (setStats(response) au lieu de response.data)
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques. Réessayez.');
      toast.error(err.response?.data?.error || err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(filter);
  }, [fetchStats, filter]);

  const handleRefresh = () => { // FIX : handleRefresh au lieu de handleRéception (typo)
    fetchStats(filter);
    toast.info('Stats rafraîchies !');
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Calcul dynamique du dégradé principal basé sur le % de retard (de stats.montants_par_statut)
  const dynamicBgGradient = useMemo(() => {
    const totalMontant = (stats?.montants_par_statut?.avenir || 0) + (stats?.montants_par_statut?.retard || 0) || 1;
    const retardPercent = ((stats?.montants_par_statut?.retard || 0) / totalMontant) * 100;
    if (retardPercent > 30) {
      return 'bg-gradient-to-br from-slate-900 via-red-950 to-slate-900';
    } else if (retardPercent > 10) {
      return 'bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900';
    } else {
      return 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900';
    }
  }, [stats]);

  // Palette étendue avec couleurs dynamiques pour cartes
  const colors = useMemo(() => ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'], []);
  const dynamicCardColors = useMemo(() => {
    const totalMontant = (stats?.montants_par_statut?.avenir || 0) + (stats?.montants_par_statut?.retard || 0) || 1;
    const retardPercent = ((stats?.montants_par_statut?.retard || 0) / totalMontant) * 100;
    if (retardPercent > 30) return 'red';
    return 'emerald';
  }, [stats]);

  const repartitionData = useMemo(() => (
    stats ? Object.entries(stats.repartition_clients || {}).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    })) : []
  ), [stats, colors]);

  const montantsData = useMemo(() => (
    stats ? Object.entries(stats.montants_par_statut || {}).map(([name, montant]) => ({
      name: name === 'avenir' ? 'à venir' : name === 'retard' ? 'en retard' : name,
      montant,
    })) : []
  ), [stats]);

  const evolutionData = useMemo(() => [
    { date: 'Lun', montant: 400 },
    { date: 'Mar', montant: 300 },
    { date: 'Mer', montant: 500 },
    { date: 'Jeu', montant: 450 },
    { date: 'Ven', montant: 600 },
  ], []);

  const totalClients = stats?.repartition_clients?.total || 0;
  const montantAVenir = stats?.montants_par_statut?.avenir || 0;
  const montantRetard = stats?.montants_par_statut?.retard || 0;

  // Animation compteur pour stats
  const AnimatedCounter = ({ value, color = 'emerald' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = value || 0;
      if (start === end) return;
      const increment = end / 60;
      const timer = setInterval(() => {
        start += increment;
        setCount(Math.floor(start));
        if (start >= end) clearInterval(timer);
      }, 16);
      return () => clearInterval(timer);
    }, [value]);
    const gradientClass = color === 'red' 
      ? 'bg-gradient-to-r from-red-400 to-red-500' 
      : 'bg-gradient-to-r from-emerald-400 to-teal-500';
    return (
      <motion.span 
        initial={0} 
        animate={{ opacity: 1 }} 
        className={`text-3xl font-bold ${gradientClass} bg-clip-text text-transparent`}
      >
        {count.toLocaleString()}
      </motion.span>
    );
  };

  // Actions rapides étendues (conditionnel pour admin)
  const actionsData = useMemo(() => [
    {
      icon: UsersIcon,
      label: 'Clients',
      to: '/clients',
      bg: 'from-emerald-500 to-green-600'
    },
    {
      icon: CalendarIcon,
      label: 'Historique',
      to: '/historique',
      bg: 'from-lime-500 to-emerald-600'
    },
    {
      icon: ClockIcon,
      label: 'Profil',
      to: '/profil',
      bg: 'from-teal-500 to-cyan-600'
    },
    ...(user?.role === 'admin' ? [
      {
        icon: UserGroupIcon,
        label: 'Utilisateurs',
        to: '/users',
        bg: 'from-purple-500 to-pink-600'
      },
      {
        icon: ArrowPathIcon,
        label: 'Connexions',
        to: '/connexions',
        bg: 'from-blue-500 to-indigo-600'
      }
    ] : [])
  ], [user?.role]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen ${dynamicBgGradient} text-gray-100 flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Chargement des stats en live...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`pt-20 min-h-screen ${dynamicBgGradient} text-gray-100 p-6 font-sans`}
    >
      {/* HEADER - Amélioré avec badge live */}
      <header className="mb-8 text-center relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block bg-emerald-500/20 rounded-full px-3 py-1 text-sm font-semibold text-emerald-300 border border-emerald-400/30 absolute -top-2 -right-0"
        >
          Live
        </motion.div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-400 text-sm">Suivi en temps réel des performances et des clients</p>
      </header>

      {/* FILTRE PÉRIODE - Glassmorphism */}
      <section className="mb-6 flex justify-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 flex space-x-2 border border-emerald-400/20 shadow-xl">
          {['Aujourd\'hui', 'Semaine', 'Mois'].map((period) => (
            <motion.div
              key={period}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={filter === period ? 'primary' : 'secondary'}
                onClick={() => handleFilterChange(period)}
                className={`px-6 py-2 text-sm rounded-xl transition-all duration-300 ${
                  filter === period
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                size="sm"
              >
                {period}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CARTES STATS - Glassmorphism + Anim compteur dynamique */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Clients', value: totalClients, icon: UsersIcon, color: dynamicCardColors },
          { label: 'Montant à venir', value: montantAVenir, icon: ChartBarIcon, color: 'emerald' },
          { label: 'Montant en retard', value: montantRetard, icon: ClockIcon, color: 'red' }
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, rotateX: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-${color}-400/20 hover:border-${color}-400/40`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400 font-medium">{label}</span>
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                <Icon className={`w-7 h-7 text-${color}-400`} />
              </motion.div>
            </div>
            <div className="flex items-baseline justify-between">
              <AnimatedCounter value={value} color={color} />
              <span className={`text-sm text-${color}-300`}>F</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* GRAPHIQUES - Améliorés avec patterns et hovers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Bar chart */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/30"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
              Montants par Statut
            </h2>
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={montantsData}>
              <defs>
                <pattern id="barPattern" height="6" width="6" patternUnits="userSpaceOnUse">
                  <path d="M 0 0 L 6 6 M 6 0 L 0 6" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.95)", color: "#fff", border: "1px solid #10B981" }} />
              <Legend />
              <Bar 
                dataKey="montant" 
                fill="url(#barPattern)" 
                background={{ fill: '#374151' }}
                radius={[8, 8, 0, 0]} 
                className="hover:fill-[#10B981] transition-colors duration-200"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl" />
          <h2 className="text-xl font-bold mb-4 text-gray-200 relative z-10">Répartition des Clients</h2>
          <AnimatePresence mode="wait">
            {repartitionData.length ? (
              <ResponsiveContainer width="100%" height={300} key="pie">
                <PieChart>
                  <Pie
                    data={repartitionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={40}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {repartitionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity duration-200" 
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.95)", color: "#fff", border: "1px solid #10B981" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <motion.p
                key="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 py-16 relative z-10"
              >
                Aucune donnée disponible
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-sm text-gray-400 mt-4 relative z-10">Total: {totalClients} clients</p>
        </motion.div>
      </section>

      {/* Graphique linéaire - Amélioré */}
      <section className="mb-10">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/30"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-200">Évolution des Montants (Semaine)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.95)", color: "#fff", border: "1px solid #10B981" }} />
              <ReferenceLine y={0} stroke="#374151" />
              <Line 
                type="monotone" 
                dataKey="montant" 
                stroke="url(#lineGradient)" 
                strokeWidth={4} 
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </section>

      {/* ACTIONS RAPIDES - Liens du footer intégrés comme boutons (horizontal pour tous les écrans) */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-200">Actions rapides</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3">
          {actionsData.map(({ icon: Icon, label, to, bg }, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to={to}>
                <Button
                  className={`w-full flex flex-col items-center justify-center p-3 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${bg} text-xs`}
                >
                  <Icon className="w-5 h-5 mb-1 drop-shadow-lg" />
                  {label}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gestion d'erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-500/30 text-red-200 text-center shadow-xl"
          >
            {error}
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="mt-2 text-red-200 hover:text-red-100">
              Réessayer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Dashboard;