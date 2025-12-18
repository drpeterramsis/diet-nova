
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar, MacroDonut } from '../Visuals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SavedMeal, Client, ClientVisit } from '../../types';
import Toast from '../Toast';
import MealCreator, { WeeklyPlan, DEFAULT_WEEKLY_PLAN } from './MealCreator';
import { fallbackTemplates, DietType, mapDBRowToTemplate } from '../../data/dietTemplates';

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

  // --- NEW: Diet Templates State (Cloud) ---
  const [cloudTemplates, setCloudTemplates] = useState<DietType[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [selectedDietId, setSelectedDietId] = useState<string>('');
  const [selectedDistId, setSelectedDistId] = useState<string>('');
  const [templateKcal, setTemplateKcal] = useState<number>(1200);

  // Fetch Templates from Supabase (v2.0.230: Improved Error Reporting)
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    setTemplateError(null);
    try {
        const { data, error } = await supabase
            .from('diet_templates')
            .select('*')
            .order('diet_type', { ascending: true })
            .order('macro_ratios', { ascending: true })
            .order('kcal', { ascending: true });

        if (error) {
            if (error.code === '42P01') throw new Error("Table 'diet_templates' not found in database.");
            throw error;
        }

        if (data && data.length > 0) {
            const typesMap: Record<string, DietType> = {};
            data.forEach(row => {
                const typeId = row.diet_type.toLowerCase().replace(/\s+/g, '_');
                if (!typesMap[typeId]) {
                    typesMap[typeId] = { id: typeId, name: row.diet_type, distributions: [] };
                }
                const distId = `${typeId}_${row.macro_ratios.toLowerCase().replace(/\s+/g, '_')}`;
                let dist = typesMap[typeId].distributions.find(d => d.id === distId);
                if (!dist) {
                    dist = { id: distId, label: row.macro_ratios, rows: [] };
                    typesMap[typeId].distributions.push(dist);
                }
                dist.rows.push(mapDBRowToTemplate(row));
            });
            const sortedTypes = Object.values(typesMap);
            setCloudTemplates(sortedTypes);
            if (sortedTypes.length > 0) {
                setSelectedDietId(sortedTypes[0].id);
                if (sortedTypes[0].distributions.length > 0) {
                    setSelectedDistId(sortedTypes[0].distributions[0].id);
                }
            }
        } else {
            setCloudTemplates([]);
            setTemplateError("Cloud database is connected, but the 'diet_templates' table is empty.");
        }
    } catch (err: any) {
        console.error("Supabase Templates Sync Failed:", err);
        setCloudTemplates([]);
        setTemplateError(err.message || "Failed to connect to cloud templates.");
    } finally {
        setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const [servings, setServings] = useState<Record<string, number>>(
    BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {})
  );

  const [targetKcal, setTargetKcal] = useState<number>(initialTargetKcal || 2000);
  const [manualGm, setManualGm] = useState({ cho: 0, pro: 0, fat: 0 });
  const [manualPerc, setManualPerc] = useState({ cho: 0, pro: 0, fat: 0 });
  const [activeTargetTab, setActiveTargetTab] = useState<'none' | 'gm' | 'perc'>('none');
  const [dayMenuPlan, setDayMenuPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);
  
  const [advCalc, setAdvCalc] = useState({ kcal: 2000, carbPerc: 50, weight: 70, proteinFactor: 1.2 });
  const [advResults, setAdvResults] = useState<{choG: number, proG: number, fatG: number, proP: number, fatP: number, sfaG: number, mufaG: number, pufaG: number} | null>(null);

  useEffect(() => {
    if (initialTargetKcal && initialTargetKcal > 0) {
      setTargetKcal(initialTargetKcal);
      setTemplateKcal(initialTargetKcal); 
      setAdvCalc(prev => ({ ...prev, kcal: initialTargetKcal })); 
    }
  }, [initialTargetKcal]);

  const filteredSavedPlans = useMemo(() => {
    if (!loadSearchQuery) return savedPlans;
    const q = loadSearchQuery.toLowerCase();
    return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

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
                  if (data && !error) loadPlan(data);
              } catch (err) { console.error("Auto-load failed", err); }
          }
      };
      autoLoad();
  }, [initialLoadId, session]);

  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>(
    BASE_GROUPS.reduce((acc, group) => ({
      ...acc,
      [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
    }), {})
  );

  const VISIBLE_GROUPS = useMemo(() => {
      return useFatBreakdown ? BASE_GROUPS : BASE_GROUPS.filter(g => !['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g));
  }, [useFatBreakdown]);

  const calculatedFatsSum = useMemo(() => {
      return (servings['fatsPufa'] || 0) + (servings['fatsMufa'] || 0) + (servings['fatsSat'] || 0);
  }, [servings]);

  const calcTotals = useMemo(() => {
    let cho = 0, pro = 0, fat = 0, fiber = 0, kcal = 0;
    let kcalPufa = 0, kcalMufa = 0, kcalSat = 0;
    BASE_GROUPS.forEach(g => {
      let s = servings[g] || 0;
      if (useFatBreakdown) { if (g === 'fats') s = 0; }
      else { if (['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g)) s = 0; }
      const factor = GROUP_FACTORS[g];
      if (factor) {
          cho += s * factor.cho; pro += s * factor.pro; fat += s * factor.fat; fiber += s * factor.fiber;
          const groupKcal = s * factor.kcal; kcal += groupKcal;
          if (g === 'fatsPufa') kcalPufa += s * factor.fat * 9;
          if (g === 'fatsMufa') kcalMufa += s * factor.fat * 9;
          if (g === 'fatsSat') kcalSat += s * factor.fat * 9;
      }
    });
    return { cho, pro, fat, fiber, kcal, kcalPufa, kcalMufa, kcalSat };
  }, [servings, useFatBreakdown]);

  const totalPerc = useMemo(() => {
      const k = calcTotals.kcal || 1;
      return {
          cho: ((calcTotals.cho * 4) / k * 100).toFixed(1),
          pro: ((calcTotals.pro * 4) / k * 100).toFixed(1),
          fat: ((calcTotals.fat * 9) / k * 100).toFixed(1),
      }
  }, [calcTotals]);

  const distTotals = useMemo(() => {
      let cho = 0, pro = 0, fat = 0, fiber = 0, kcal = 0;
      VISIBLE_GROUPS.forEach(g => {
          MEALS.forEach(m => {
              let s = distribution[g]?.[m] || 0;
              if (useFatBreakdown && g === 'fats') s = 0; 
              if (GROUP_FACTORS[g]) {
                  cho += s * GROUP_FACTORS[g].cho; pro += s * GROUP_FACTORS[g].pro;
                  fat += s * GROUP_FACTORS[g].fat; fiber += s * GROUP_FACTORS[g].fiber;
                  kcal += s * GROUP_FACTORS[g].kcal;
              }
          });
      });
      return { cho, pro, fat, fiber, kcal };
  }, [distribution, useFatBreakdown, VISIBLE_GROUPS]);

  const selectedDiet = cloudTemplates.find(d => d.id === selectedDietId);
  const selectedDistribution = selectedDiet?.distributions.find(d => d.id === selectedDistId);

  const applyTemplate = () => {
      if (!selectedDistribution) return;
      const plan = selectedDistribution.rows.find(r => r.kcal === templateKcal);
      if (!plan) {
          setStatusMsg(`No template found for ${templateKcal} kcal.`);
          setTimeout(() => setStatusMsg(''), 2000);
          return;
      }
      setTargetKcal(templateKcal);
      setUseFatBreakdown(true);
      const newServings = { ...servings };
      Object.keys(plan.exchanges).forEach(key => { newServings[key] = (plan.exchanges as any)[key]; });
      if (plan.exchanges.fatsSat || plan.exchanges.fatsMufa || plan.exchanges.fatsPufa) { newServings['fats'] = 0; }
      setServings(newServings);
      setStatusMsg(`${selectedDiet?.name} (${selectedDistribution.label}) - ${templateKcal} kcal`);
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const calculateAdvancedMacros = () => {
      const { kcal, carbPerc, weight, proteinFactor } = advCalc;
      const carbG = (kcal * (carbPerc / 100)) / 4;
      const proG = weight * proteinFactor;
      const fatG = (kcal - (carbG * 4 + proG * 4)) / 9;
      setAdvResults({
          choG: Math.round(carbG), proG: Math.round(proG), fatG: Math.round(fatG),
          proP: parseFloat(((proG * 4 / kcal) * 100).toFixed(1)),
          fatP: parseFloat(((fatG * 9 / kcal) * 100).toFixed(1)),
          sfaG: parseFloat(((kcal * 0.1) / 9).toFixed(1)),
          mufaG: parseFloat(((fatG - (kcal * 0.1 / 9)) * 0.66).toFixed(1)),
          pufaG: parseFloat(((fatG - (kcal * 0.1 / 9)) * 0.33).toFixed(1))
      });
  };

  const applyAdvancedTargets = () => {
      if (!advResults) return;
      setManualGm({ cho: advResults.choG, pro: advResults.proG, fat: advResults.fatG });
      setActiveTargetTab('gm');
      setStatusMsg("Macro targets updated.");
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const updateServing = (group: string, val: number) => { setServings(prev => ({ ...prev, [group]: val })); };
  const updateDistribution = (group: string, meal: string, val: number) => {
    setDistribution(prev => ({ ...prev, [group]: { ...prev[group], [meal]: val } }));
  };

  const savePlan = async () => {
      if (!planName.trim()) { alert("Please enter a name for the meal plan."); return; }
      if (!session) return;
      setStatusMsg("Saving...");
      const planData = { servings, distribution, targetKcal, manualGm, manualPerc, dayMenuPlan };
      try {
          const { data, error } = await supabase.from('saved_meals').insert({
              user_id: session.user.id, name: planName, tool_type: 'meal-planner', data: planData, created_at: new Date().toISOString()
          }).select().single();
          if (error) throw error;
          if (data) { setLoadedPlanId(data.id); setLastSavedName(data.name); setStatusMsg("Plan Saved!"); }
          fetchPlans();
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) { setStatusMsg("Failed to save: " + err.message); }
  };

  const handleSaveToVisit = async () => {
      if (!activeVisit) return;
      setStatusMsg('Saving to Visit...');
      const planData = { servings, distribution, targetKcal, manualGm, manualPerc, dayMenuPlan };
      try {
          const { error } = await supabase.from('client_visits').update({ meal_plan_data: planData }).eq('id', activeVisit.visit.id);
          if (error) throw error;
          setStatusMsg('Saved to Client Visit!');
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) { setStatusMsg('Error: ' + err.message); }
  };

  const loadPlan = (plan: SavedMeal) => {
      if (!plan.data) return;
      setServings(plan.data.servings || {});
      setDistribution(plan.data.distribution || {});
      setTargetKcal(plan.data.targetKcal || 2000);
      setManualGm(plan.data.manualGm || {cho:0, pro:0, fat:0});
      setManualPerc(plan.data.manualPerc || {cho:0, pro:0, fat:0});
      if (plan.data.dayMenuPlan) setDayMenuPlan(plan.data.dayMenuPlan); 
      setPlanName(plan.name); setLoadedPlanId(plan.id); setLastSavedName(plan.name);
      if (plan.data.servings?.fatsPufa > 0) setUseFatBreakdown(true);
      setShowLoadModal(false); setStatusMsg("Loaded!");
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const resetAll = () => {
      setServings(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}));
      setDistribution(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {}) }), {}));
      setTargetKcal(2000); setPlanName(''); setLoadedPlanId(null); setUseFatBreakdown(false); setDayMenuPlan(DEFAULT_WEEKLY_PLAN);
  };

  const fetchPlans = async () => {
      if (!session) return;
      setIsLoadingPlans(true);
      try {
          const { data } = await supabase.from('saved_meals').select('*').eq('tool_type', 'meal-planner').eq('user_id', session.user.id).order('created_at', { ascending: false });
          if (data) setSavedPlans(data);
      } catch (err) { console.error(err); } finally { setIsLoadingPlans(false); }
  };

  const targetMacros = useMemo(() => {
      if (activeTargetTab === 'gm') return { cho: manualGm.cho, pro: manualGm.pro, fat: manualGm.fat };
      if (activeTargetTab === 'perc') return { cho: (targetKcal * (manualPerc.cho / 100)) / 4, pro: (targetKcal * (manualPerc.pro / 100)) / 4, fat: (targetKcal * (manualPerc.fat / 100)) / 9 };
      return { cho: 0, pro: 0, fat: 0 };
  }, [activeTargetTab, manualGm, manualPerc, targetKcal]);

  const RenderCell = ({ val, factor, label }: { val: number, factor: number, label: string }) => (
      <td className="p-3 text-center">
          <div className={`font-mono text-base ${val === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{val.toFixed(1)}</div>
          <div className="text-[10px] text-gray-400 font-medium">{factor}{label === 'Kcal' ? 'kcal' : 'g'}</div>
      </td>
  );

  const getGroupLabel = (group: string) => {
      if (group === 'fatsPufa') return 'Fat PUFA';
      if (group === 'fatsMufa') return 'Fat MUFA';
      if (group === 'fatsSat') return 'Fat SAT';
      return t.mealPlannerTool.groups[group as keyof typeof t.mealPlannerTool.groups] || group;
  }

  // --- RENDER METHOD (Corrected v2.0.230 - Resolved Duplication) ---
  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in">
      <Toast message={statusMsg} />
      
      {activeVisit && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm no-print">
              <div>
                  <h3 className="font-bold text-purple-800 text-lg">Client: {activeVisit.client.full_name}</h3>
                  <p className="text-sm text-purple-600">Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}</p>
              </div>
              <button onClick={handleSaveToVisit} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2">
                  <span>💾</span> Save to Visit
              </button>
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
           <input type="text" placeholder="Plan Name" value={planName} onChange={(e) => setPlanName(e.target.value)} className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm" />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('calculator')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'calculator' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.mealPlannerTool.modeCalculator}</button>
            <button onClick={() => setViewMode('planner')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'planner' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.mealPlannerTool.modePlanner}</button>
            <button onClick={() => setViewMode('day-menu')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'day-menu' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🥗 Day Menu</button>
        </div>

        <div className="flex gap-2 items-center">
            {session && (
                <>
                <button onClick={() => savePlan()} className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Save Template"><span className="text-xl">💾</span></button>
                <button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-500 hover:bg-purple-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Load Template"><span className="text-xl">📂</span></button>
                </>
            )}
            <button onClick={() => window.print()} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Print"><span className="text-xl">🖨️</span></button>
            <button onClick={resetAll} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition">{t.common.reset}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {viewMode === 'calculator' && (
            <>
                <div className="lg:col-span-3 space-y-6 no-print">
                    {/* Templates Sidebar */}
                    <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3 text-sm uppercase">Cloud Diet Templates</h3>
                        {isLoadingTemplates ? (
                            <div className="text-center py-4 text-xs text-gray-400 animate-pulse">Syncing...</div>
                        ) : templateError ? (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                                <p className="text-[10px] text-red-700 mb-3">{templateError}</p>
                                <button onClick={fetchTemplates} className="text-[10px] font-bold text-blue-600 hover:underline">Retry</button>
                            </div>
                        ) : cloudTemplates.length > 0 ? (
                            <div className="space-y-3">
                                <div><label className="text-[10px] text-gray-500 font-bold block mb-1">Diet Type</label>
                                <select className="w-full p-2 border rounded text-xs" value={selectedDietId} onChange={(e) => setSelectedDietId(e.target.value)}>{cloudTemplates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                <div><label className="text-[10px] text-gray-500 font-bold block mb-1">Distribution</label>
                                <select className="w-full p-2 border rounded text-xs" value={selectedDistId} onChange={(e) => setSelectedDistId(e.target.value)}>{selectedDiet?.distributions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
                                <div className="flex gap-2 items-end"><div className="flex-grow"><label className="text-[10px] text-gray-500 font-bold block mb-1">Kcal</label><select className="w-full p-2 border rounded text-xs" value={templateKcal} onChange={(e) => setTemplateKcal(Number(e.target.value))}>{selectedDistribution?.rows.map(r => <option key={r.kcal} value={r.kcal}>{r.kcal}</option>)}</select></div><button onClick={applyTemplate} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700">Load</button></div>
                            </div>
                        ) : <div className="text-xs text-center text-gray-400 py-4">No Templates</div>}
                    </div>

                    {/* Advanced Calculator Sidebar */}
                    <div className="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden">
                        <div className="p-3 border-b bg-green-50"><h3 className="font-bold text-green-900 text-xs uppercase">Precision Macro Calc</h3></div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-[10px] font-bold text-gray-500">Kcal</label><input type="number" value={advCalc.kcal} onChange={e => setAdvCalc({...advCalc, kcal: Number(e.target.value)})} className="w-full p-1.5 border rounded text-xs" /></div>
                                <div><label className="block text-[10px] font-bold text-gray-500">Carb%</label><input type="number" value={advCalc.carbPerc} onChange={e => setAdvCalc({...advCalc, carbPerc: Number(e.target.value)})} className="w-full p-1.5 border rounded text-xs" /></div>
                            </div>
                            <button onClick={calculateAdvancedMacros} className="w-full py-2 bg-gray-800 text-white font-bold rounded text-[10px] hover:bg-gray-900">CALCULATE</button>
                            {advResults && (
                                <div className="bg-gray-50 p-2 rounded border text-[10px] space-y-2">
                                    <div className="flex justify-between"><span>CHO: <b>{advResults.choG}g</b></span><span>PRO: <b>{advResults.proG}g</b></span><span>FAT: <b>{advResults.fatG}g</b></span></div>
                                    <button onClick={applyAdvancedTargets} className="w-full py-1 bg-green-600 text-white font-bold rounded">APPLY TARGETS</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Calculator Table */}
                <div className="lg:col-span-6">
                     <div className="card bg-white shadow-lg overflow-hidden border border-gray-200">
                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center"><span className="font-bold text-gray-700">Exchanges Calculator</span></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-[var(--color-primary)] text-white">
                                    <tr><th className="p-3 text-left w-1/3">{t.mealPlannerTool.foodGroup}</th><th className="p-3 text-center w-24">{t.mealPlannerTool.serves}</th><th className="p-3 text-center">CHO</th><th className="p-3 text-center">PRO</th><th className="p-3 text-center">FAT</th><th className="p-3 text-center bg-[var(--color-primary-dark)]">Kcal</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {VISIBLE_GROUPS.map(group => {
                                        const isAutoFat = useFatBreakdown && group === 'fats';
                                        const s = isAutoFat ? calculatedFatsSum : (servings[group] || 0);
                                        const f = GROUP_FACTORS[group];
                                        const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200', icon: '🍽️' };
                                        return (
                                            <tr key={group} className={`${style.bg} bg-opacity-30 border-b ${style.border}`}>
                                                <td className="p-3 font-medium transition-colors"><div className={`flex items-center gap-2 text-base ${style.text}`}><span className="text-xl">{style.icon}</span> {getGroupLabel(group)}{group === 'fats' && (<button onClick={() => setUseFatBreakdown(!useFatBreakdown)} className="ml-2 text-[8px] px-1 border rounded">{useFatBreakdown ? 'Hide' : 'Show'}</button>)}</div></td>
                                                <td className="p-3 text-center"><input type="number" min="0" step="0.5" disabled={isAutoFat} className={`w-20 p-2 border rounded text-center font-bold ${isAutoFat ? 'bg-gray-100' : 'bg-white'}`} value={s || ''} onChange={(e) => updateServing(group, parseFloat(e.target.value) || 0)} /></td>
                                                <RenderCell val={s * f.cho} factor={f.cho} label="CHO" /><RenderCell val={s * f.pro} factor={f.pro} label="PRO" /><RenderCell val={s * f.fat} factor={f.fat} label="FAT" /><RenderCell val={s * f.kcal} factor={f.kcal} label="Kcal" />
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-3 space-y-6 no-print">
                    <div className="card bg-white shadow-xl sticky top-24 border-t-4 border-t-[var(--color-primary)] p-4">
                        <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs">Summary</h3>
                        <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label="Goal (Kcal)" />
                        <div className="mb-6"><MacroDonut cho={calcTotals.cho} pro={calcTotals.pro} fat={calcTotals.fat} totalKcal={calcTotals.kcal} /></div>
                        <div className="space-y-4">
                            <ProgressBar current={calcTotals.kcal} target={targetKcal} label="Calorie Goal" unit="kcal" showPercent={true}/>
                            {activeTargetTab !== 'none' && (
                                <div className="space-y-2 pt-2 border-t">
                                    <ProgressBar current={calcTotals.cho} target={targetMacros.cho} label="CHO" unit="g" color="bg-blue-500" showPercent={true} />
                                    <ProgressBar current={calcTotals.pro} target={targetMacros.pro} label="PRO" unit="g" color="bg-red-500" showPercent={true} />
                                    <ProgressBar current={calcTotals.fat} target={targetMacros.fat} label="FAT" unit="g" color="bg-yellow-500" showPercent={true} />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex gap-1 justify-center">
                            <button onClick={() => setActiveTargetTab(activeTargetTab === 'gm' ? 'none' : 'gm')} className={`px-2 py-1 rounded text-[10px] font-bold border transition ${activeTargetTab === 'gm' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Grams</button>
                            <button onClick={() => setActiveTargetTab(activeTargetTab === 'perc' ? 'none' : 'perc')} className={`px-2 py-1 rounded text-[10px] font-bold border transition ${activeTargetTab === 'perc' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Percent</button>
                        </div>
                        {activeTargetTab === 'gm' && (
                             <div className="mt-3 space-y-2 p-2 bg-gray-50 rounded text-[10px]">
                                 <div className="flex justify-between"><span>CHO (g)</span> <input type="number" className="w-12 border rounded text-center" value={manualGm.cho} onChange={e => setManualGm({...manualGm, cho: parseFloat(e.target.value)})} /></div>
                                 <div className="flex justify-between"><span>PRO (g)</span> <input type="number" className="w-12 border rounded text-center" value={manualGm.pro} onChange={e => setManualGm({...manualGm, pro: parseFloat(e.target.value)})} /></div>
                                 <div className="flex justify-between"><span>FAT (g)</span> <input type="number" className="w-12 border rounded text-center" value={manualGm.fat} onChange={e => setManualGm({...manualGm, fat: parseFloat(e.target.value)})} /></div>
                             </div>
                        )}
                         {activeTargetTab === 'perc' && (
                             <div className="mt-3 space-y-2 p-2 bg-gray-50 rounded text-[10px]">
                                 <div className="flex justify-between"><span>CHO (%)</span> <input type="number" className="w-12 border rounded text-center" value={manualPerc.cho} onChange={e => setManualPerc({...manualPerc, cho: parseFloat(e.target.value)})} /></div>
                                 <div className="flex justify-between"><span>PRO (%)</span> <input type="number" className="w-12 border rounded text-center" value={manualPerc.pro} onChange={e => setManualPerc({...manualPerc, pro: parseFloat(e.target.value)})} /></div>
                                 <div className="flex justify-between"><span>FAT (%)</span> <input type="number" className="w-12 border rounded text-center" value={manualPerc.fat} onChange={e => setManualPerc({...manualPerc, fat: parseFloat(e.target.value)})} /></div>
                             </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {viewMode === 'planner' && (
            <div className="lg:col-span-12 flex flex-col lg:flex-row gap-6">
                <div className="flex-grow card bg-white shadow-lg overflow-hidden">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                        <thead className="bg-gray-800 text-white">
                            <tr><th className="p-2 text-left">Food Group</th><th className="p-2 text-center">Remain</th>{MEALS.map(m => (<th key={m} className="p-2 text-center">{t.mealPlannerTool.meals[m as keyof typeof t.mealPlannerTool.meals]}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {VISIBLE_GROUPS.map(group => {
                                const isAutoFat = useFatBreakdown && group === 'fats';
                                let dispDists: Record<string, number> = distribution[group] || {};
                                if (isAutoFat) {
                                    dispDists = {};
                                    MEALS.forEach(m => { dispDists[m] = (distribution['fatsPufa']?.[m] || 0) + (distribution['fatsMufa']?.[m] || 0) + (distribution['fatsSat']?.[m] || 0); });
                                }
                                const target = isAutoFat ? calculatedFatsSum : (servings[group] || 0);
                                const totalDist = MEALS.reduce((acc: number, m: string) => acc + (Number(dispDists[m]) || 0), 0);
                                const rem = target - totalDist;
                                return (
                                    <tr key={group} className="border-b">
                                        <td className="p-2 font-bold bg-gray-50">{getGroupLabel(group)} <span className="text-[10px] text-gray-400">(T:{target})</span></td>
                                        <td className={`p-2 text-center font-bold ${rem < 0 ? 'text-red-600' : 'text-gray-600'}`}>{rem === 0 ? '-' : rem.toFixed(1)}</td>
                                        {MEALS.map(m => (
                                            <td key={m} className="p-1 text-center">
                                                {isAutoFat ? <span className="text-gray-400">{dispDists[m] || '-'}</span> :
                                                <input type="number" className="w-full text-center outline-none bg-transparent" placeholder="-" value={distribution[group]?.[m] || ''} onChange={(e) => updateDistribution(group, m, parseFloat(e.target.value) || 0)} />}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="w-full lg:w-80 bg-white p-4 border rounded-xl h-fit">
                    <h3 className="font-bold text-gray-700 text-xs uppercase mb-4">Planner Snapshot</h3>
                    <div className="mb-4"><MacroDonut cho={distTotals.cho} pro={distTotals.pro} fat={distTotals.fat} totalKcal={distTotals.kcal} /></div>
                    <ProgressBar current={distTotals.kcal} target={targetKcal} label="Total Planner Kcal" unit="kcal" showPercent={true} />
                </div>
            </div>
        )}

        <div className={`col-span-12 ${viewMode === 'day-menu' ? 'block' : 'hidden'}`}>
            <MealCreator activeVisit={activeVisit} isEmbedded={true} externalTargetKcal={targetKcal} plannedExchanges={servings} externalWeeklyPlan={dayMenuPlan} onWeeklyPlanChange={setDayMenuPlan} />
        </div>
      </div>

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Load Plan</h3><button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
                <div className="mb-4"><input type="text" placeholder="Search..." value={loadSearchQuery} onChange={(e) => setLoadSearchQuery(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none" /></div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {isLoadingPlans ? <div className="text-center py-10 text-gray-400">Loading...</div> : filteredSavedPlans.length === 0 ? <div className="text-center py-10 text-gray-400">No saved plans found.</div> : (filteredSavedPlans.map(plan => (
                        <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group">
                            <div><div className="font-bold text-gray-800">{plan.name}</div><div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div></div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Load</button></div>
                        </div>
                    )))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
