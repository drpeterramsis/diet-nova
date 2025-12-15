
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar, MacroDonut } from '../Visuals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SavedMeal, Client, ClientVisit } from '../../types';
import Toast from '../Toast';
import MealCreator, { WeeklyPlan, DEFAULT_WEEKLY_PLAN } from './MealCreator';

const GROUP_FACTORS: Record<string, { cho: number; pro: number; fat: number; fiber: number; kcal: number }> = {
  starch: { cho: 15, pro: 3, fat: 1, fiber: 1.75, kcal: 80 },
  veg: { cho: 5, pro: 2, fat: 0, fiber: 1.5, kcal: 25 },
  fruit: { cho: 15, pro: 0, fat: 0, fiber: 1.5, kcal: 60 },
  meatLean: { cho: 0, pro: 7, fat: 3, fiber: 0, kcal: 45 },
  meatMed: { cho: 0, pro: 7, fat: 5, fiber: 0, kcal: 75 },
  meatHigh: { cho: 0, pro: 7, fat: 8, fiber: 0, kcal: 100 },
  milkSkim: { cho: 12, pro: 8, fat: 3, fiber: 0, kcal: 100 }, 
  milkLow: { cho: 12, pro: 8, fat: 5, fiber: 0, kcal: 120 }, 
  milkWhole: { cho: 12, pro: 8, fat: 8, fiber: 0, kcal: 150 }, 
  legumes: { cho: 15, pro: 7, fat: 1, fiber: 3, kcal: 110 },
  sugar: { cho: 5, pro: 0, fat: 0, fiber: 0, kcal: 20 },
  fats: { cho: 0, pro: 0, fat: 5, fiber: 0, kcal: 45 },
  fatsPufa: { cho: 0, pro: 0, fat: 5, fiber: 0, kcal: 45 },
  fatsMufa: { cho: 0, pro: 0, fat: 5, fiber: 0, kcal: 45 },
  fatsSat: { cho: 0, pro: 0, fat: 5, fiber: 0, kcal: 45 },
};

const GROUP_STYLES: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  starch: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', icon: '🍞' },
  veg: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', icon: '🥦' },
  fruit: { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200', icon: '🍓' },
  meatLean: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', icon: '🍖' },
  meatMed: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', icon: '🍖' },
  meatHigh: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-400', icon: '🍖' },
  milkSkim: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: '🥛' },
  milkLow: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', icon: '🥛' },
  milkWhole: { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400', icon: '🥛' },
  legumes: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', icon: '🥣' },
  sugar: { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-300', icon: '🍬' },
  fats: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200', icon: '🥑' },
  fatsPufa: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '🌻' },
  fatsMufa: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '🫒' },
  fatsSat: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '🥥' },
};

const MEALS = ['snack1', 'breakfast', 'snack2', 'lunch', 'snack3', 'dinner', 'snack4'];
const BASE_GROUPS = Object.keys(GROUP_FACTORS);

// --- Extracted Component to prevent re-renders/focus loss ---
interface TargetKcalInputProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
}

const TargetKcalInput: React.FC<TargetKcalInputProps> = ({ value, onChange, label }) => (
    <div className="mb-6">
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label}</label>
        <div className="relative">
            <input 
                type="number" 
                className="w-full p-2 border-2 border-[var(--color-primary)] rounded-lg text-center font-bold text-xl text-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] bg-white"
                placeholder="0"
                value={value || ''} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                dir="ltr"
            />
            <span className="absolute right-3 top-3 text-gray-400 text-xs font-medium">Kcal</span>
        </div>
    </div>
);

interface MealPlannerProps {
  initialTargetKcal?: number;
  onBack?: () => void;
  initialLoadId?: string | null;
  autoOpenLoad?: boolean;
  autoOpenNew?: boolean;
  activeVisit?: { client: Client, visit: ClientVisit } | null;
  onNavigate?: (toolId: string, loadId?: string, action?: 'load' | 'new', preserveContext?: boolean) => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ initialTargetKcal, onBack, initialLoadId, autoOpenLoad, autoOpenNew, activeVisit, onNavigate }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  const [viewMode, setViewMode] = useState<'calculator' | 'planner' | 'both' | 'day-menu'>('calculator');
  const [useFatBreakdown, setUseFatBreakdown] = useState(false);
  
  // --- Saving/Loading UI State ---
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useState<string>('');
  const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadSearchQuery, setLoadSearchQuery] = useState('');

  // State for Calculator Input (Servings)
  const [servings, setServings] = useState<Record<string, number>>(
    BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {})
  );

  // State for Targets
  const [targetKcal, setTargetKcal] = useState<number>(0);
  const [manualGm, setManualGm] = useState({ cho: 0, pro: 0, fat: 0 });
  const [manualPerc, setManualPerc] = useState({ cho: 0, pro: 0, fat: 0 });
  const [activeTargetTab, setActiveTargetTab] = useState<'none' | 'gm' | 'perc'>('none');

  // State for Day Menu (Unified State)
  const [dayMenuPlan, setDayMenuPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);

  // Initialize target if provided prop
  useEffect(() => {
    if (initialTargetKcal && initialTargetKcal > 0) {
      setTargetKcal(initialTargetKcal);
    }
  }, [initialTargetKcal]);

  // Filter Saved Plans Logic
  const filteredSavedPlans = useMemo(() => {
    if (!loadSearchQuery) return savedPlans;
    const q = loadSearchQuery.toLowerCase();
    return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  // Auto-load effect
  useEffect(() => {
      const autoLoad = async () => {
          if (initialLoadId && session) {
              try {
                  const { data, error } = await supabase
                    .from('saved_meals')
                    .select('*')
                    .eq('id', initialLoadId)
                    .eq('user_id', session.user.id)
                    .single();
                  
                  if (data && !error) {
                      loadPlan(data);
                  }
              } catch (err) {
                  console.error("Auto-load failed", err);
              }
          }
      };
      autoLoad();
  }, [initialLoadId, session]);

  // --- Hydrate from Visit Data (if activeVisit exists) ---
  useEffect(() => {
      if (activeVisit?.visit.meal_plan_data) {
          const data = activeVisit.visit.meal_plan_data;
          if (data.servings) setServings(data.servings);
          if (data.distribution) setDistribution(data.distribution);
          if (data.targetKcal) setTargetKcal(data.targetKcal);
          if (data.manualGm) setManualGm(data.manualGm);
          if (data.manualPerc) setManualPerc(data.manualPerc);
          if (data.dayMenuPlan) setDayMenuPlan(data.dayMenuPlan); // Hydrate Day Menu
          
          // Check if detailed fats are used
          const hasDetails = (data.servings?.fatsPufa || 0) > 0 || (data.servings?.fatsMufa || 0) > 0 || (data.servings?.fatsSat || 0) > 0;
          if (hasDetails) setUseFatBreakdown(true);
      }
  }, [activeVisit]);

  // Handle Auto Open
  useEffect(() => {
      if (autoOpenLoad && session) {
          fetchPlans();
          setShowLoadModal(true);
      }
      if (autoOpenNew) {
          resetAll();
      }
  }, [autoOpenLoad, autoOpenNew, session]);

  // State for Planner Distribution
  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>(
    BASE_GROUPS.reduce((acc, group) => ({
      ...acc,
      [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
    }), {})
  );

  // --- Memos & Derived State ---
  
  // Determine visible groups based on mode
  const VISIBLE_GROUPS = useMemo(() => {
      if (useFatBreakdown) {
          // Include sub-fats, include 'fats' but it will be handled specially
          return BASE_GROUPS;
      } else {
          // Exclude sub-fats
          return BASE_GROUPS.filter(g => !['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g));
      }
  }, [useFatBreakdown]);

  // Auto-Sum Fats Logic
  // When in breakdown mode, 'fats' serves should be sum of sub-categories for DISPLAY.
  const calculatedFatsSum = useMemo(() => {
      return (servings['fatsPufa'] || 0) + (servings['fatsMufa'] || 0) + (servings['fatsSat'] || 0);
  }, [servings]);

  // --- Calculations ---
  const calcTotals = useMemo(() => {
    let cho = 0, pro = 0, fat = 0, fiber = 0, kcal = 0;
    
    // Sub-fats specific tracking for display
    let kcalPufa = 0;
    let kcalMufa = 0;
    let kcalSat = 0;

    BASE_GROUPS.forEach(g => {
      let s = servings[g] || 0;
      
      if (useFatBreakdown) {
          if (g === 'fats') s = 0; // Don't count generic 'fats' in totals if breakdown is on
      } else {
          if (['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g)) s = 0; // Don't count hidden sub-fats
      }

      const factor = GROUP_FACTORS[g];
      if (factor) {
          cho += s * factor.cho;
          pro += s * factor.pro;
          fat += s * factor.fat;
          fiber += s * factor.fiber;
          const groupKcal = s * factor.kcal;
          kcal += groupKcal;

          // Track calories from specific fat sources
          if (g === 'fatsPufa') kcalPufa += s * factor.fat * 9;
          if (g === 'fatsMufa') kcalMufa += s * factor.fat * 9;
          if (g === 'fatsSat') kcalSat += s * factor.fat * 9;
      }
    });
    return { cho, pro, fat, fiber, kcal, kcalPufa, kcalMufa, kcalSat };
  }, [servings, useFatBreakdown]);

  const distTotals = useMemo(() => {
      let cho = 0, pro = 0, fat = 0, fiber = 0, kcal = 0;
      VISIBLE_GROUPS.forEach(g => {
          MEALS.forEach(m => {
              let s = distribution[g]?.[m] || 0;
              
              if (useFatBreakdown) {
                  if (g === 'fats') s = 0; 
              } 
              
              if (GROUP_FACTORS[g]) {
                  cho += s * GROUP_FACTORS[g].cho;
                  pro += s * GROUP_FACTORS[g].pro;
                  fat += s * GROUP_FACTORS[g].fat;
                  fiber += s * GROUP_FACTORS[g].fiber;
                  kcal += s * GROUP_FACTORS[g].kcal;
              }
          });
      });
      return { cho, pro, fat, fiber, kcal };
  }, [distribution, useFatBreakdown, VISIBLE_GROUPS]);

  const rowRemains = useMemo(() => {
    const remains: Record<string, number> = {};
    VISIBLE_GROUPS.forEach(g => {
        const totalDist = MEALS.reduce((acc, m) => acc + (distribution[g]?.[m] || 0), 0);
        let target = servings[g] || 0;
        
        // Special case for 'fats' in breakdown mode
        if (useFatBreakdown && g === 'fats') {
            target = calculatedFatsSum; // The target is the sum of inputs
            const distPufa = MEALS.reduce((acc, m) => acc + (distribution['fatsPufa']?.[m] || 0), 0);
            const distMufa = MEALS.reduce((acc, m) => acc + (distribution['fatsMufa']?.[m] || 0), 0);
            const distSat = MEALS.reduce((acc, m) => acc + (distribution['fatsSat']?.[m] || 0), 0);
            const totalDistSpecific = distPufa + distMufa + distSat;
            
            remains[g] = target - totalDistSpecific; 
        } else {
            remains[g] = target - totalDist;
        }
    });
    return remains;
  }, [servings, distribution, useFatBreakdown, calculatedFatsSum, VISIBLE_GROUPS]);

  // --- Handlers ---
  const updateServing = (group: string, val: number) => {
    setServings(prev => ({ ...prev, [group]: val }));
  };

  const updateDistribution = (group: string, meal: string, val: number) => {
    setDistribution(prev => ({
      ...prev,
      [group]: { ...prev[group], [meal]: val }
    }));
  };

  const handlePrint = () => {
      window.print();
  };

  // --- Database Operations ---
  const fetchPlans = async () => {
      if (!session) return;
      setIsLoadingPlans(true);
      setLoadSearchQuery(''); // Reset search on open
      try {
          const { data, error } = await supabase
            .from('saved_meals')
            .select('*')
            .eq('tool_type', 'meal-planner')
            .eq('user_id', session.user.id) // Explicit user filtering
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data) setSavedPlans(data);
      } catch (err) {
          console.error('Error fetching plans:', err);
          setStatusMsg("Error loading plans.");
      } finally {
          setIsLoadingPlans(false);
      }
  };

  const savePlan = async () => {
      if (!planName.trim()) {
          alert("Please enter a name for the meal plan.");
          return;
      }
      if (!session) return;
      
      setStatusMsg("Saving...");
      // UNIFIED SAVING: Includes Servings, Distribution, AND Day Menu Plan
      const planData = {
          servings,
          distribution,
          targetKcal,
          manualGm,
          manualPerc,
          dayMenuPlan // Included
      };
      const timestamp = new Date().toISOString();

      const isUpdate = loadedPlanId && (planName === lastSavedName);
      
      try {
          let data;
          if (isUpdate) {
             const updatePayload = {
                name: planName,
                data: planData,
             };

             const response = await supabase
                .from('saved_meals')
                .update(updatePayload)
                .eq('id', loadedPlanId)
                .eq('user_id', session.user.id)
                .select();

             if (response.error) throw response.error;
             if (!response.data || response.data.length === 0) {
                throw new Error("Update failed.");
             }
             data = response.data[0];
          } else {
             const insertPayload = {
                user_id: session.user.id,
                name: planName,
                tool_type: 'meal-planner',
                data: planData,
                created_at: timestamp
             };

             const response = await supabase
                .from('saved_meals')
                .insert(insertPayload)
                .select()
                .single();
             
             if (response.error) throw response.error;
             data = response.data;
          }
              
          if (data) {
              setLoadedPlanId(data.id);
              setLastSavedName(data.name);
              setStatusMsg(isUpdate ? "Plan Updated Successfully!" : "Plan Saved as New Entry!");
          }

          fetchPlans();
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) {
          console.error('Error saving plan:', err);
          setStatusMsg("Failed to save: " + err.message);
      }
  };

  const handleSaveToVisit = async () => {
      if (!activeVisit) return;
      setStatusMsg('Saving to Client Visit...');

      const planData = {
          servings,
          distribution,
          targetKcal,
          manualGm,
          manualPerc,
          dayMenuPlan // Include Day Menu
      };

      try {
          const { error } = await supabase
            .from('client_visits')
            .update({ meal_plan_data: planData })
            .eq('id', activeVisit.visit.id);

          if (error) throw error;
          setStatusMsg('Saved to Client Visit Record!');
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) {
          console.error(err);
          setStatusMsg('Error Saving to Visit: ' + err.message);
      }
  };

  const loadPlan = (plan: SavedMeal) => {
      if (!plan.data) return;
      setServings({ ...plan.data.servings } || {});
      setDistribution({ ...plan.data.distribution } || {});
      setTargetKcal(plan.data.targetKcal || 0);
      setManualGm(plan.data.manualGm || {cho:0, pro:0, fat:0});
      setManualPerc(plan.data.manualPerc || {cho:0, pro:0, fat:0});
      if (plan.data.dayMenuPlan) setDayMenuPlan(plan.data.dayMenuPlan); // Load Day Menu
      
      setPlanName(plan.name);
      setLoadedPlanId(plan.id);
      setLastSavedName(plan.name);
      
      // Check fat mode
      const hasDetails = (plan.data.servings?.fatsPufa || 0) > 0 || (plan.data.servings?.fatsMufa || 0) > 0 || (plan.data.servings?.fatsSat || 0) > 0;
      if (hasDetails) setUseFatBreakdown(true);

      setShowLoadModal(false);
      setStatusMsg(t.common.loadSuccess);
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const deletePlan = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this plan?")) return;
      try {
          const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session?.user.id);
          if (error) throw error;
          setSavedPlans(prev => prev.filter(p => p.id !== id));
          if (loadedPlanId === id) {
              setLoadedPlanId(null);
              setPlanName('');
              setLastSavedName('');
          }
      } catch (err) {
          console.error("Error deleting:", err);
      }
  };

  const resetAll = () => {
      setServings(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}));
      setDistribution(BASE_GROUPS.reduce((acc, group) => ({
          ...acc,
          [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
      }), {}));
      setTargetKcal(0);
      setPlanName('');
      setLoadedPlanId(null);
      setLastSavedName('');
      setUseFatBreakdown(false);
      setDayMenuPlan(DEFAULT_WEEKLY_PLAN);
  };

  const RenderCell = ({ val, factor, label }: { val: number, factor: number, label: string }) => {
      const isZero = val === 0;
      const unit = label === 'Kcal' ? 'kcal' : 'g';
      return (
          <td className="p-3 text-center">
              <div className={`font-mono text-base ${isZero ? 'text-red-300' : 'text-gray-700 font-bold'}`}>
                  {val.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-400 font-medium">
                  {factor}{unit}
              </div>
          </td>
      );
  };

  const getGroupLabel = (group: string) => {
      if (group === 'fatsPufa') return 'Fat PUFA';
      if (group === 'fatsMufa') return 'Fat MUFA';
      if (group === 'fatsSat') return 'Fat SAT';
      return t.mealPlannerTool.groups[group as keyof typeof t.mealPlannerTool.groups] || group;
  }

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in">
      <Toast message={statusMsg} />
      
      {/* Active Visit Toolbar */}
      {activeVisit && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm no-print">
              <div>
                  <h3 className="font-bold text-purple-800 text-lg">
                     Client: {activeVisit.client.full_name}
                  </h3>
                  <p className="text-sm text-purple-600 flex flex-wrap gap-3">
                     <span>Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}</span>
                     <span>•</span>
                     <span>Clinic: {activeVisit.client.clinic || 'N/A'}</span>
                  </p>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSaveToVisit}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2"
                  >
                      <span>💾</span> Save to Visit
                  </button>
              </div>
          </div>
      )}

      {/* Top Control Bar */}
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 no-print">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
           {onBack && (
               <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm whitespace-nowrap">
                   <span>←</span> {t.common.backToCalculator}
               </button>
           )}
           <h1 className="text-2xl font-bold text-[var(--color-heading)] hidden xl:block whitespace-nowrap">{t.tools.mealPlanner.title}</h1>
           
           <div className="relative flex-grow md:flex-grow-0">
                <input 
                    type="text"
                    placeholder="Enter Plan Name..."
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-gray-800 font-medium"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✎</span>
           </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setViewMode('calculator')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'calculator' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t.mealPlannerTool.modeCalculator}
            </button>
            <button 
                onClick={() => setViewMode('planner')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'planner' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t.mealPlannerTool.modePlanner}
            </button>
            <button 
                onClick={() => setViewMode('day-menu')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'day-menu' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                🥗 Day Menu
            </button>
        </div>

        <div className="flex gap-2 items-center">
            {session && (
                <>
                <button 
                    onClick={() => savePlan()}
                    className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm"
                    title={t.common.save + " (As Template)"}
                >
                    <span className="text-xl">💾</span>
                </button>
                <button 
                    onClick={() => {
                        fetchPlans();
                        setShowLoadModal(true);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm"
                    title={t.common.load + " (Template)"}
                >
                    <span className="text-xl">📂</span>
                </button>
                </>
            )}
             <button 
                onClick={handlePrint}
                className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm"
                title="Print Plan"
            >
                <span className="text-xl">🖨️</span>
            </button>
            <button 
                onClick={resetAll}
                className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
                {t.common.reset}
            </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Content (Calculator & Planner Modes) */}
        <div className={`transition-all duration-300 ${viewMode === 'calculator' ? 'lg:col-span-8 xl:col-span-9' : viewMode === 'planner' ? 'lg:col-span-12' : 'hidden'}`}>
            
            {/* CALCULATOR TABLE */}
            {viewMode === 'calculator' && (
                 <div className="card bg-white shadow-lg overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <span className="font-bold text-gray-700">Exchanges</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-[var(--color-primary)] text-white">
                                <tr>
                                    <th className="p-3 text-left w-1/3">{t.mealPlannerTool.foodGroup}</th>
                                    <th className="p-3 text-center w-24">{t.mealPlannerTool.serves}</th>
                                    <th className="p-3 text-center">{t.mealPlannerTool.cho}</th>
                                    <th className="p-3 text-center">{t.mealPlannerTool.pro}</th>
                                    <th className="p-3 text-center">{t.mealPlannerTool.fat}</th>
                                    <th className="p-3 text-center bg-green-700">Fiber</th>
                                    <th className="p-3 text-center bg-[var(--color-primary-dark)]">{t.mealPlannerTool.kcal}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {VISIBLE_GROUPS.map(group => {
                                    const isAutoFat = useFatBreakdown && group === 'fats';
                                    const s = isAutoFat ? calculatedFatsSum : (servings[group] || 0);
                                    
                                    const f = GROUP_FACTORS[group];
                                    const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200', icon: '🍽️' };
                                    
                                    return (
                                        <tr key={group} className={`${style.bg} border-b ${style.border} bg-opacity-30`}>
                                            <td className={`p-3 font-medium transition-colors`}>
                                                <div className={`flex items-center gap-2 text-base ${style.text}`}>
                                                    <span className="text-xl">{style.icon}</span> {getGroupLabel(group)}
                                                    {group === 'fats' && (
                                                        <button 
                                                            onClick={() => setUseFatBreakdown(!useFatBreakdown)}
                                                            className={`ml-2 text-[10px] px-2 py-0.5 rounded border transition font-bold ${useFatBreakdown ? 'bg-yellow-200 border-yellow-300 text-yellow-800' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'}`}
                                                            title="Toggle detailed fat types (SFA, MUFA, PUFA)"
                                                        >
                                                            {useFatBreakdown ? 'Hide Details' : 'Show Breakdown'}
                                                        </button>
                                                    )}
                                                    {isAutoFat && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded ml-2">Auto-Sum</span>}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center bg-white/50">
                                                <input 
                                                    type="number"
                                                    min="0" step="0.5"
                                                    disabled={isAutoFat}
                                                    className={`w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all ${
                                                        isAutoFat ? 'bg-gray-100 font-bold text-gray-500 cursor-not-allowed' :
                                                        s === 0 ? 'text-red-300 bg-white' : 'font-bold text-lg text-gray-800 bg-white shadow-sm'
                                                    }`}
                                                    value={s || ''}
                                                    placeholder="0"
                                                    onChange={(e) => updateServing(group, parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <RenderCell val={s * f.cho} factor={f.cho} label="CHO" />
                                            <RenderCell val={s * f.pro} factor={f.pro} label="PRO" />
                                            <RenderCell val={s * f.fat} factor={f.fat} label="FAT" />
                                            <RenderCell val={s * f.fiber} factor={f.fiber} label="g" />
                                            <RenderCell val={s * f.kcal} factor={f.kcal} label="Kcal" />
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}

            {/* PLANNER TABLE */}
            {viewMode === 'planner' && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Planner Main Table */}
                    <div className="flex-grow card bg-white shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm border-collapse">
                                <thead className="bg-gray-800 text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 text-left min-w-[140px]">{t.mealPlannerTool.foodGroup}</th>
                                        {MEALS.map(m => (
                                            <th key={m} className="p-2 text-center min-w-[60px]">
                                                {t.mealPlannerTool.meals[m as keyof typeof t.mealPlannerTool.meals]}
                                            </th>
                                        ))}
                                        <th className="p-2 text-center bg-gray-700 min-w-[60px]">{t.mealPlannerTool.meals.remain}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {VISIBLE_GROUPS.map(group => {
                                        const isAutoFat = useFatBreakdown && group === 'fats';
                                        
                                        let displayDistributions: Record<string, number> = distribution[group];
                                        if (isAutoFat) {
                                            displayDistributions = {};
                                            MEALS.forEach(m => {
                                                displayDistributions[m] = (distribution['fatsPufa']?.[m] || 0) + 
                                                                          (distribution['fatsMufa']?.[m] || 0) + 
                                                                          (distribution['fatsSat']?.[m] || 0);
                                            });
                                        }

                                        const target = isAutoFat ? calculatedFatsSum : (servings[group] || 0);
                                        const totalDist = MEALS.reduce((acc, m) => acc + (displayDistributions[m] || 0), 0);
                                        const rem = target - totalDist;
                                        
                                        const isOver = rem < 0;
                                        const isComplete = rem === 0 && target > 0;
                                        const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200', icon: '🍽️' };

                                        return (
                                            <tr key={group} className={`${style.bg} bg-opacity-30 border-b border-gray-100`}>
                                                <td className={`p-2 font-medium border-r border-gray-200 sticky left-0 z-10 bg-white`}>
                                                    <div className={`flex items-center gap-1.5 ${style.text}`}>
                                                        <span className="text-sm">{style.icon}</span> {getGroupLabel(group)}
                                                        {group === 'fats' && (
                                                            <button 
                                                                onClick={() => setUseFatBreakdown(!useFatBreakdown)}
                                                                className={`ml-2 text-[8px] px-1.5 py-0.5 rounded border font-bold ${useFatBreakdown ? 'bg-yellow-200 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                                            >
                                                                {useFatBreakdown ? 'Hide' : 'Show'}
                                                            </button>
                                                        )}
                                                        {isAutoFat && <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded ml-1">Sum</span>}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-normal no-print mt-1 ml-5 border-t border-black/10 pt-0.5">
                                                        Total: <span className="font-bold">{target}</span>
                                                    </div>
                                                </td>
                                                {MEALS.map(meal => (
                                                    <td key={meal} className="p-1 text-center border-r border-gray-100">
                                                        {isAutoFat ? (
                                                            <div className="text-gray-500 font-bold text-xs">{displayDistributions[meal] > 0 ? displayDistributions[meal] : '-'}</div>
                                                        ) : (
                                                            <input 
                                                                type="number"
                                                                className={`w-full h-8 text-center bg-transparent focus:bg-blue-50 outline-none rounded hover:bg-gray-100 transition ${
                                                                    (displayDistributions?.[meal] || 0) === 0 ? 'text-red-300' : 'text-black font-bold'
                                                                }`}
                                                                placeholder="-"
                                                                value={displayDistributions?.[meal] || ''}
                                                                onChange={(e) => updateDistribution(group, meal, parseFloat(e.target.value) || 0)}
                                                            />
                                                        )}
                                                    </td>
                                                ))}
                                                <td className={`p-2 text-center font-bold border-l-2 ${isOver ? 'bg-red-50 text-red-600 border-red-200' : isComplete ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {rem.toFixed(1)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Planner Sidebar */}
                    <div className="w-full lg:w-80 flex-shrink-0 space-y-4 no-print">
                         <div className="card bg-white p-4 sticky top-24">
                            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Planner Snapshot</h3>
                            <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={t.kcal.kcalRequired} />
                            
                            <div className="mb-6">
                                <MacroDonut 
                                    cho={distTotals.cho} 
                                    pro={distTotals.pro} 
                                    fat={distTotals.fat} 
                                    totalKcal={distTotals.kcal} 
                                />
                            </div>

                            <div className="space-y-3">
                                <ProgressBar current={distTotals.kcal} target={targetKcal} label="Calories" unit="kcal" />
                                <div className="grid grid-cols-3 gap-2 text-xs text-center mt-4">
                                    <div className="p-2 bg-blue-50 rounded">
                                        <div className="font-bold text-blue-700">{distTotals.cho.toFixed(0)}g</div>
                                        <div className="text-blue-400">CHO</div>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded">
                                        <div className="font-bold text-red-700">{distTotals.pro.toFixed(0)}g</div>
                                        <div className="text-red-400">PRO</div>
                                    </div>
                                    <div className="p-2 bg-yellow-50 rounded">
                                        <div className="font-bold text-yellow-700">{distTotals.fat.toFixed(0)}g</div>
                                        <div className="text-yellow-400">FAT</div>
                                    </div>
                                </div>
                                <div className="p-2 bg-green-50 rounded text-center text-xs">
                                    <div className="font-bold text-green-700">{distTotals.fiber.toFixed(1)}g</div>
                                    <div className="text-green-500">Fiber</div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right Column: Sidebar (Calculator Mode Only) */}
        {viewMode === 'calculator' && (
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 no-print">
                <div className="card bg-white shadow-xl sticky top-24 border-t-4 border-t-[var(--color-primary)]">
                    <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Smart Summary
                        </h3>

                        <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={t.kcal.kcalRequired} />

                        <div className="mb-6">
                             <MacroDonut 
                                cho={calcTotals.cho} 
                                pro={calcTotals.pro} 
                                fat={calcTotals.fat} 
                                totalKcal={calcTotals.kcal} 
                             />
                        </div>

                        <div className="space-y-4 mb-6">
                            <ProgressBar 
                                current={calcTotals.kcal} 
                                target={targetKcal} 
                                label={t.mealPlannerTool.targetKcal} 
                                unit="kcal" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="text-gray-500">Total CHO</div>
                            <div className="text-right font-bold text-blue-600">{calcTotals.cho.toFixed(1)}g</div>
                            <div className="text-gray-500">Total PRO</div>
                            <div className="text-right font-bold text-red-600">{calcTotals.pro.toFixed(1)}g</div>
                            <div className="text-gray-500">Total FAT</div>
                            <div className="text-right font-bold text-yellow-600">{calcTotals.fat.toFixed(1)}g</div>
                            <div className="text-gray-500">Total Fiber</div>
                            <div className="text-right font-bold text-green-600">{calcTotals.fiber.toFixed(1)}g</div>
                        </div>

                        {/* Fat Breakdown Section */}
                        {calcTotals.kcal > 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h4 className="font-bold text-xs text-yellow-800 uppercase mb-2 border-b border-yellow-200 pb-1">Fat Quality Breakdown</h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-orange-700">SFA (Sat)</span>
                                        <div>
                                            <span className="font-bold text-orange-900">{((calcTotals.kcalSat / calcTotals.kcal) * 100).toFixed(1)}%</span>
                                            <span className="text-orange-600 ml-1">(&lt;10%)</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-700">PUFA</span>
                                        <div>
                                            <span className="font-bold text-yellow-900">{((calcTotals.kcalPufa / calcTotals.kcal) * 100).toFixed(1)}%</span>
                                            <span className="text-yellow-600 ml-1">(Up to 10%)</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-700">MUFA</span>
                                        <div>
                                            <span className="font-bold text-yellow-900">{((calcTotals.kcalMufa / calcTotals.kcal) * 100).toFixed(1)}%</span>
                                            <span className="text-yellow-600 ml-1">(Up to 20%)</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-yellow-200 mt-1 pt-1 flex justify-between font-bold">
                                        <span>Total Fat</span>
                                        <span>{((calcTotals.fat * 9 / calcTotals.kcal) * 100).toFixed(1)}% <span className="text-[10px] font-normal text-gray-500">(20-25%)</span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100">
                             <div className="flex justify-center gap-2 mb-4">
                                 <button 
                                    onClick={() => setActiveTargetTab(activeTargetTab === 'gm' ? 'none' : 'gm')}
                                    className={`px-3 py-1 rounded text-xs font-bold ${activeTargetTab === 'gm' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                                 >
                                     Target (g)
                                 </button>
                                 <button 
                                    onClick={() => setActiveTargetTab(activeTargetTab === 'perc' ? 'none' : 'perc')}
                                    className={`px-3 py-1 rounded text-xs font-bold ${activeTargetTab === 'perc' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                                 >
                                     Target (%)
                                 </button>
                             </div>

                             {activeTargetTab === 'gm' && (
                                 <div className="space-y-2 animate-fade-in">
                                     <div className="flex justify-between items-center"><span className="text-xs">CHO (g)</span> <input type="number" className="w-16 p-1 border rounded text-center text-sm" value={manualGm.cho} onChange={e => setManualGm({...manualGm, cho: parseFloat(e.target.value)})} /></div>
                                     <div className="flex justify-between items-center"><span className="text-xs">PRO (g)</span> <input type="number" className="w-16 p-1 border rounded text-center text-sm" value={manualGm.pro} onChange={e => setManualGm({...manualGm, pro: parseFloat(e.target.value)})} /></div>
                                     <div className="flex justify-between items-center"><span className="text-xs">FAT (g)</span> <input type="number" className="w-16 p-1 border rounded text-center text-sm" value={manualGm.fat} onChange={e => setManualGm({...manualGm, fat: parseFloat(e.target.value)})} /></div>
                                     <div className="text-xs text-center text-gray-400 mt-1">Remain: {(manualGm.cho*4 + manualGm.pro*4 + manualGm.fat*9 - calcTotals.kcal).toFixed(0)} kcal</div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Day Menu Integrated View */}
        <div className={`col-span-12 ${viewMode === 'day-menu' ? 'block' : 'hidden'}`}>
            <MealCreator 
                initialLoadId={initialLoadId}
                autoOpenLoad={autoOpenLoad}
                autoOpenNew={autoOpenNew}
                activeVisit={activeVisit}
                // Integrated Props
                isEmbedded={true}
                // Using strictly calculated total per user request (instead of fallback to target)
                externalTargetKcal={calcTotals.kcal}
                plannedExchanges={servings}
                externalWeeklyPlan={dayMenuPlan}
                onWeeklyPlanChange={setDayMenuPlan}
            />
        </div>

      </div>

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t.common.load}</h3>
                    <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder={t.common.search}
                        value={loadSearchQuery}
                        onChange={(e) => setLoadSearchQuery(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>

                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {isLoadingPlans ? (
                        <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : filteredSavedPlans.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No saved plans found.</div>
                    ) : (
                        filteredSavedPlans.map(plan => (
                            <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group">
                                <div>
                                    <div className="font-bold text-gray-800">{plan.name}</div>
                                    <div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString('en-GB')}</div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Load</button>
                                    <button onClick={() => deletePlan(plan.id)} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">Del</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
