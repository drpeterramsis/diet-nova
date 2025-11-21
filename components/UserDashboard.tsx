import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { SavedMeal } from '../types';
import Loading from './Loading';
import ToolsGrid from './ToolsGrid';

interface UserDashboardProps {
  onNavigateTool: (toolId: string, loadId?: string) => void;
  setBmiOpen: (v: boolean) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigateTool, setBmiOpen }) => {
  const { session, profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [plans, setPlans] = useState<SavedMeal[]>([]);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      // Fetch Meal Creator Data
      const { data: mealsData } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tool_type', 'meal-creator')
        .order('created_at', { ascending: false });

      // Fetch Meal Planner Data
      const { data: plansData } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tool_type', 'meal-planner')
        .order('created_at', { ascending: false });

      if (mealsData) setMeals(mealsData);
      if (plansData) setPlans(plansData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card bg-white border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition p-6 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t.tools.mealCreator.title}</p>
                <h3 className="text-3xl font-bold text-gray-800">{meals.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl">
                🥗
            </div>
        </div>
        <div className="card bg-white border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition p-6 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t.tools.mealPlanner.title}</p>
                <h3 className="text-3xl font-bold text-gray-800">{plans.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl">
                📅
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Meals Section */}
        <div className="card bg-white shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>🥗</span> {t.tools.mealCreator.title}
                </h2>
                <button 
                    onClick={() => onNavigateTool('meal-creator')}
                    className="text-sm bg-[var(--color-bg-soft)] text-[var(--color-primary)] px-3 py-1 rounded-lg hover:bg-green-100 transition"
                >
                    + New
                </button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {meals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No saved meals yet.
                    </div>
                ) : (
                    meals.map(meal => (
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
                            {/* Mini Preview */}
                            <div className="mt-3 flex flex-wrap gap-1">
                                {meal.data?.addedFoods?.slice(0, 3).map((f: any, idx: number) => (
                                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                        {f.name.split(' ')[0]}
                                    </span>
                                ))}
                                {(meal.data?.addedFoods?.length || 0) > 3 && (
                                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">...</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Recent Plans Section */}
        <div className="card bg-white shadow-lg">
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>📅</span> {t.tools.mealPlanner.title}
                </h2>
                <button 
                    onClick={() => onNavigateTool('meal-planner')}
                    className="text-sm bg-[var(--color-bg-soft)] text-[var(--color-primary)] px-3 py-1 rounded-lg hover:bg-green-100 transition"
                >
                    + New
                </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {plans.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No saved plans yet.
                    </div>
                ) : (
                    plans.map(plan => (
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
                    ))
                )}
            </div>
        </div>
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