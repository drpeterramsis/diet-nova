

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { SavedMeal, Client } from '../types';
import Loading from './Loading';
import ToolsGrid from './ToolsGrid';

interface UserDashboardProps {
  onNavigateTool: (toolId: string, loadId?: string) => void;
  setBmiOpen: (v: boolean) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigateTool, setBmiOpen }) => {
  const { session, profile } = useAuth();
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [plans, setPlans] = useState<SavedMeal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsError, setClientsError] = useState(false);

  const isDoctor = profile?.role === 'doctor';

  useEffect(() => {
    fetchData();
  }, [session, isDoctor]);

  const fetchData = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    
    // 1. Fetch Meals and Plans (Common for all users)
    try {
      const { data: mealsData } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tool_type', 'meal-creator')
        .order('created_at', { ascending: false });

      const { data: plansData } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tool_type', 'meal-planner')
        .order('created_at', { ascending: false });

      if (mealsData) setMeals(mealsData);
      if (plansData) setPlans(plansData);
    } catch (error) {
      console.error('Error loading meals/plans:', error);
    }

    // 2. Fetch Clients (Doctor Only)
    if (isDoctor) {
        try {
            const { data: clientsData, error } = await supabase
            .from('clients')
            .select('*')
            .eq('doctor_id', session.user.id)
            .order('visit_date', { ascending: false });
            
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.warn("Clients table missing in DB");
                    setClientsError(true);
                } else {
                    console.error("Error loading clients:", error);
                }
            } else if (clientsData) {
                setClients(clientsData);
                setClientsError(false);
            }
        } catch (err) {
            console.warn("Exception loading clients (likely table missing):", err);
            setClientsError(true);
        }
    }

    setLoading(false);
  };

  const deleteItem = async (id: string, type: 'meal' | 'plan') => {
    if (!window.confirm(t.common.delete + "?")) return;
    try {
      const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session?.user.id);
      if (error) throw error;
      
      if (type === 'meal') {
        setMeals(prev => prev.filter(m => m.id !== id));
      } else {
        setPlans(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading />;

  const roleLabel = profile?.role === 'doctor' ? t.auth.doctor : t.auth.patient;
  const welcomeMsg = lang === 'en' ? `Welcome back, ${profile?.full_name}` : `مرحباً بعودتك، ${profile?.full_name}`;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in pb-24">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)] rounded-2xl p-8 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-2">
                    {roleLabel}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{welcomeMsg}</h1>
                <p className="text-white/80">{session?.user.email}</p>
            </div>
            <button 
                onClick={() => document.getElementById('dashboard-tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-[var(--color-primary-dark)] px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1"
            >
                {t.common.explore}
            </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isDoctor ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
        
        {/* Saved Meals Section */}
        <div className="card bg-white shadow-lg flex flex-col h-full border-t-4 border-blue-500">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🥗</span> {t.tools.mealCreator.title}
                    </h2>
                    <span className="text-3xl font-bold text-blue-600 mt-2 block">{meals.length}</span>
                    <p className="text-xs text-gray-500">Saved Meals</p>
                </div>
                <div className="flex flex-col gap-2">
                     <button 
                        onClick={() => onNavigateTool('meal-creator')}
                        className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium"
                    >
                        Open Tool ↗
                    </button>
                </div>
            </div>
            
            <div className="space-y-3 flex-grow">
                {meals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No saved meals yet.
                    </div>
                ) : (
                    <>
                        {meals.slice(0, 5).map(meal => (
                            <div key={meal.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition group bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{meal.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <span>🕒</span> {formatDate(meal.created_at)}
                                            <span className="mx-1">•</span>
                                            <span>{meal.data?.addedFoods?.length || 0} items</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onNavigateTool('meal-creator', meal.id)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 transition"
                                        >
                                            {t.common.open}
                                        </button>
                                        <button 
                                            onClick={() => deleteItem(meal.id, 'meal')}
                                            className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-medium rounded hover:bg-red-100 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {meals.length > 5 && (
                             <button 
                                onClick={() => onNavigateTool('meal-creator')}
                                className="w-full py-2 text-center text-sm text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg transition"
                             >
                                 See {meals.length - 5} more...
                             </button>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* Saved Plans Section */}
        <div className="card bg-white shadow-lg flex flex-col h-full border-t-4 border-purple-500">
             <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📅</span> {t.tools.mealPlanner.title}
                    </h2>
                    <span className="text-3xl font-bold text-purple-600 mt-2 block">{plans.length}</span>
                    <p className="text-xs text-gray-500">Saved Plans</p>
                </div>
                <div className="flex flex-col gap-2">
                     <button 
                        onClick={() => onNavigateTool('meal-planner')}
                        className="text-sm bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition font-medium"
                    >
                        Open Tool ↗
                    </button>
                </div>
            </div>

            <div className="space-y-3 flex-grow">
                {plans.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No saved plans yet.
                    </div>
                ) : (
                    <>
                        {plans.slice(0, 5).map(plan => (
                            <div key={plan.id} className="p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-sm transition group bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition">{plan.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <span>🕒</span> {formatDate(plan.created_at)}
                                            {plan.data?.targetKcal > 0 && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <span className="text-green-600 font-medium">{plan.data.targetKcal} kcal</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onNavigateTool('meal-planner', plan.id)}
                                            className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-medium rounded hover:bg-purple-100 transition"
                                        >
                                            {t.common.open}
                                        </button>
                                        <button 
                                            onClick={() => deleteItem(plan.id, 'plan')}
                                            className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-medium rounded hover:bg-red-100 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {plans.length > 5 && (
                             <button 
                                onClick={() => onNavigateTool('meal-planner')}
                                className="w-full py-2 text-center text-sm text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg transition"
                             >
                                 See {plans.length - 5} more...
                             </button>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* Assigned Clients Section (Doctor Only) */}
        {isDoctor && (
             <div className="card bg-white shadow-lg flex flex-col h-full border-t-4 border-green-500">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span>👥</span> {t.clients.title}
                        </h2>
                        <span className="text-3xl font-bold text-green-600 mt-2 block">{clientsError ? '-' : clients.length}</span>
                        <p className="text-xs text-gray-500">Total Clients</p>
                    </div>
                     <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => onNavigateTool('client-manager')}
                            className="text-sm bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition font-medium"
                        >
                             Open Tool ↗
                        </button>
                     </div>
                </div>

                <div className="space-y-3 flex-grow">
                    {clientsError ? (
                        <div className="text-center py-8 text-red-400 bg-red-50 rounded-lg border border-dashed border-red-200 text-sm p-4">
                             <p className="font-bold">Table 'clients' not found.</p>
                             <p className="text-xs mt-1">Please check database configuration.</p>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            {t.clients.noClients}
                        </div>
                    ) : (
                        <>
                            {clients.slice(0, 5).map(client => (
                                <div key={client.id} className="p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-sm transition group bg-white">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition">{client.full_name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <span>📍</span> {client.clinic}
                                                <span className="mx-1">•</span>
                                                <span>{new Date(client.visit_date).toLocaleDateString()}</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => onNavigateTool('client-manager', client.id)}
                                            className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded hover:bg-green-100 transition"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {clients.length > 5 && (
                                 <button 
                                    onClick={() => onNavigateTool('client-manager')}
                                    className="w-full py-2 text-center text-sm text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg transition"
                                 >
                                     See {clients.length - 5} more...
                                 </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        )}

      </div>
      
      {/* Tools Section */}
      <div id="dashboard-tools" className="mt-12 border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
           <span>🛠️</span> {t.header.tools}
        </h2>
        <ToolsGrid 
            onToolClick={onNavigateTool} 
            setBmiOpen={setBmiOpen} 
            isAuthenticated={true} 
        />
      </div>
    </div>
  );
};

export default UserDashboard;