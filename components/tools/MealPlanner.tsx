
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar, MacroDonut } from '../Visuals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SavedMeal, Client, ClientVisit } from '../../types';
import Toast from '../Toast';
import MealCreator, { WeeklyPlan, DEFAULT_WEEKLY_PLAN } from './MealCreator';
import { dietTemplates, DietType, DietDistribution } from '../../data/dietTemplates';

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

// --- Target Input Component ---
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
                className="w-full p-2 border-2 border-[var(--color-primary)] rounded-lg text-center font-bold text-xl text-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] bg-white shadow-inner"
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
  
  // --- States ---
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useState<string>('');
  const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadSearchQuery, setLoadSearchQuery] = useState('');

  const [servings, setServings] = useState<Record<string, number>>(
    BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {})
  );

  const [targetKcal, setTargetKcal] = useState<number>(initialTargetKcal || 2000);
  const [manualGm, setManualGm] = useState({ cho: 0, pro: 0, fat: 0 });
  const [manualPerc, setManualPerc] = useState({ cho: 0, pro: 0, fat: 0 });
  const [activeTargetTab, setActiveTargetTab] = useState<'none' | 'gm' | 'perc'>('none');
  const [dayMenuPlan, setDayMenuPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);

  // Template & Adv State
  const [selectedDietId, setSelectedDietId] = useState<string>(dietTemplates[0].id);
  const [selectedDistId, setSelectedDistId] = useState<string>(dietTemplates[0].distributions[0].id);
  const [templateKcal, setTemplateKcal] = useState<number>(1200);
  
  const [advCalc, setAdvCalc] = useState({
      kcal: 2000,
      carbPerc: 50,
      weight: 70,
      proteinFactor: 1.2
  });
  const [advResults, setAdvResults] = useState<{choG: number, proG: number, fatG: number, proP: number, fatP: number, sfaG: number, mufaG: number, pufaG: number} | null>(null);

  // Sync Initial Target
  useEffect(() => {
    if (initialTargetKcal && initialTargetKcal > 0) {
      setTargetKcal(initialTargetKcal);
      setTemplateKcal(initialTargetKcal);
      setAdvCalc(prev => ({ ...prev, kcal: initialTargetKcal }));
    }
  }, [initialTargetKcal]);

  // Handle Hydration
  useEffect(() => {
      if (activeVisit?.visit.meal_plan_data) {
          const data = activeVisit.visit.meal_plan_data;
          if (data.servings) setServings(data.servings);
          if (data.distribution) setDistribution(data.distribution);
          if (data.targetKcal) {
              setTargetKcal(data.targetKcal);
              setTemplateKcal(data.targetKcal);
          }
          if (data.manualGm) setManualGm(data.manualGm);
          if (data.manualPerc) setManualPerc(data.manualPerc);
          if (data.dayMenuPlan) setDayMenuPlan(data.dayMenuPlan);
          const hasDetails = (data.servings?.fatsPufa || 0) > 0 || (data.servings?.fatsMufa || 0) > 0 || (data.servings?.fatsSat || 0) > 0;
          if (hasDetails) setUseFatBreakdown(true);
      }
      if (activeVisit?.visit.weight) {
          setAdvCalc(prev => ({ ...prev, weight: activeVisit.visit.weight || 70 }));
      }
  }, [activeVisit]);

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
    let cho = 0, pro = 0, fat = 0, fiber = 0, kcal = 0, kcalPufa = 0, kcalMufa = 0, kcalSat = 0;
    BASE_GROUPS.forEach(g => {
      let s = servings[g] || 0;
      if (useFatBreakdown) { if (g === 'fats') s = 0; }
      else { if (['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g)) s = 0; }
      const factor = GROUP_FACTORS[g];
      if (factor) {
          cho += s * factor.cho; pro += s * factor.pro; fat += s * factor.fat; fiber += s * factor.fiber; kcal += s * factor.kcal;
          if (g === 'fatsPufa') kcalPufa += s * factor.fat * 9;
          if (g === 'fatsMufa') kcalMufa += s * factor.fat * 9;
          if (g === 'fatsSat') kcalSat += s * factor.fat * 9;
      }
    });
    return { cho, pro, fat, fiber, kcal, kcalPufa, kcalMufa, kcalSat };
  }, [servings, useFatBreakdown]);

  const totalPerc = useMemo(() => {
      const k = calcTotals.kcal || 1;
      return { cho: ((calcTotals.cho * 4) / k * 100).toFixed(1), pro: ((calcTotals.pro * 4) / k * 100).toFixed(1), fat: ((calcTotals.fat * 9) / k * 100).toFixed(1) }
  }, [calcTotals]);

  const applyTemplate = () => {
      const selectedDiet = dietTemplates.find(d => d.id === selectedDietId);
      const selectedDistribution = selectedDiet?.distributions.find(d => d.id === selectedDistId);
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
      const proPerc = (proG * 4 / kcal) * 100;
      const fatPerc = 100 - carbPerc - proPerc;
      const fatG = (kcal * (fatPerc / 100)) / 9;
      const sfaG = (kcal * 0.10) / 9;
      const remFatG = Math.max(0, fatG - sfaG);
      setAdvResults({ choG: Math.round(carbG), proG: Math.round(proG), fatG: Math.round(fatG), proP: parseFloat(proPerc.toFixed(1)), fatP: parseFloat(fatPerc.toFixed(1)), sfaG: parseFloat(sfaG.toFixed(1)), mufaG: parseFloat((remFatG * 2/3).toFixed(1)), pufaG: parseFloat((remFatG * 1/3).toFixed(1)) });
  };

  const applyAdvancedTargets = () => {
      if (!advResults) return;
      setManualGm({ cho: advResults.choG, pro: advResults.proG, fat: advResults.fatG });
      setActiveTargetTab('gm');
      setStatusMsg("Macro targets updated from calculator.");
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const targetMacros = useMemo(() => {
      if (activeTargetTab === 'gm') return { cho: manualGm.cho, pro: manualGm.pro, fat: manualGm.fat };
      if (activeTargetTab === 'perc') return { cho: (targetKcal * manualPerc.cho / 100) / 4, pro: (targetKcal * manualPerc.pro / 100) / 4, fat: (targetKcal * manualPerc.fat / 100) / 9 };
      return { cho: 0, pro: 0, fat: 0 };
  }, [activeTargetTab, manualGm, manualPerc, targetKcal]);

  const updateServing = (group: string, val: number) => setServings(prev => ({ ...prev, [group]: val }));
  const updateDistribution = (group: string, meal: string, val: number) => setDistribution(prev => ({ ...prev, [group]: { ...prev[group], [meal]: val } }));
  const resetAll = () => { setServings(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {})); setDistribution(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: MEALS.reduce((mAcc, m) => ({ ...mAcc, [m]: 0 }), {}) }), {})); setTargetKcal(2000); setPlanName(''); setLoadedPlanId(null); setUseFatBreakdown(false); setDayMenuPlan(DEFAULT_WEEKLY_PLAN); };

  // Fix: Defined getGroupLabel to handle translation of group keys to display names
  const getGroupLabel = (group: string) => {
    return t.mealPlannerTool.groups[group as keyof typeof t.mealPlannerTool.groups] || group;
  };

  const RenderCell = ({ val, factor, label }: { val: number, factor: number, label: string }) => {
      const isZero = val === 0;
      return (
          <td className="p-3 text-center">
              <div className={`font-mono text-base ${isZero ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{val.toFixed(1)}</div>
              <div className="text-[10px] text-gray-400 font-medium">{factor}{label === 'Kcal' ? 'kcal' : 'g'}</div>
          </td>
      );
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in">
      <Toast message={statusMsg} />
      
      {/* Top Control Bar */}
      <div className="relative flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 no-print">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
           {onBack && <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"><span>←</span> {t.common.backToCalculator}</button>}
           <h1 className="text-2xl font-bold text-[var(--color-heading)] hidden xl:block">Meal Planner</h1>
           <div className="relative flex-grow md:flex-grow-0">
                <input type="text" placeholder="Plan Label..." value={planName} onChange={(e) => setPlanName(e.target.value)} className="w-full md:w-64 px-4 py-2 pl-9 border border-gray-300 rounded-lg outline-none font-medium" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✎</span>
           </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('calculator')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'calculator' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}>{t.mealPlannerTool.modeCalculator}</button>
            <button onClick={() => setViewMode('planner')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'planner' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}>{t.mealPlannerTool.modePlanner}</button>
            <button onClick={() => setViewMode('day-menu')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'day-menu' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>🥗 Day Menu</button>
        </div>

        <div className="flex gap-2">
             <button onClick={() => window.print()} className="bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm">🖨️</button>
             <button onClick={resetAll} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium">Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {viewMode === 'calculator' && (
            <>
                <div className="lg:col-span-3 space-y-6 no-print">
                    {/* Template Loader */}
                    <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3 text-xs uppercase tracking-wider">Quick Templates</h3>
                        <div className="space-y-3">
                            <select className="w-full p-2 border rounded text-xs bg-gray-50 font-bold" value={selectedDietId} onChange={(e) => { setSelectedDietId(e.target.value); const d = dietTemplates.find(dt => dt.id === e.target.value); if(d) setSelectedDistId(d.distributions[0].id); }}>
                                {dietTemplates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select className="w-full p-2 border rounded text-xs bg-gray-50" value={selectedDistId} onChange={(e) => setSelectedDistId(e.target.value)}>
                                {dietTemplates.find(d => d.id === selectedDietId)?.distributions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                            </select>
                            <div className="flex gap-2 items-end">
                                <div className="flex-grow">
                                    <select className="w-full p-2 border rounded text-xs bg-white font-bold" value={templateKcal} onChange={(e) => setTemplateKcal(Number(e.target.value))}>
                                        {[1200, 1400, 1600, 1800, 2000, 2200, 2400].map(k => <option key={k} value={k}>{k} kcal</option>)}
                                    </select>
                                </div>
                                <button onClick={applyTemplate} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 shadow-md">Apply</button>
                            </div>
                        </div>
                    </div>

                    {/* Precision Macro Calc */}
                    <div className="bg-white rounded-xl shadow-md border border-green-100 p-4">
                        <h3 className="font-bold text-green-900 flex items-center gap-2 text-xs uppercase tracking-wider mb-4">Precision Macro Calc</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div><label className="block text-[10px] font-bold text-gray-400 mb-1">Target Kcal</label><input type="number" value={advCalc.kcal} onChange={e => setAdvCalc({...advCalc, kcal: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold" /></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 mb-1">Carb %</label><input type="number" value={advCalc.carbPerc} onChange={e => setAdvCalc({...advCalc, carbPerc: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold" /></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 mb-1">Weight (kg)</label><input type="number" value={advCalc.weight} onChange={e => setAdvCalc({...advCalc, weight: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold" /></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 mb-1">Prot g/kg</label><input type="number" step="0.1" value={advCalc.proteinFactor} onChange={e => setAdvCalc({...advCalc, proteinFactor: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold" /></div>
                        </div>
                        <button onClick={calculateAdvancedMacros} className="w-full py-2 bg-gray-800 text-white font-bold rounded text-xs mb-3">Calculate</button>
                        {advResults && (
                            <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                                <div className="grid grid-cols-3 gap-1 text-center mb-2 font-bold">
                                    <div className="text-blue-700">{advResults.choG}g C</div>
                                    <div className="text-red-700">{advResults.proG}g P</div>
                                    <div className="text-yellow-700">{advResults.fatG}g F</div>
                                </div>
                                <button onClick={applyAdvancedTargets} className="w-full py-1.5 bg-green-600 text-white font-bold rounded-lg text-[10px]">Apply Target Macros</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-6">
                     <div className="card bg-white shadow-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-primary)] text-white">
                                <tr><th className="p-3 text-left">Group</th><th className="p-3 text-center">Serves</th><th className="p-3 text-center">CHO</th><th className="p-3 text-center">PRO</th><th className="p-3 text-center">FAT</th><th className="p-3 text-center bg-[var(--color-primary-dark)]">Kcal</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {VISIBLE_GROUPS.map(group => {
                                    const isAutoFat = useFatBreakdown && group === 'fats';
                                    const target = isAutoFat ? calculatedFatsSum : (servings[group] || 0);
                                    const f = GROUP_FACTORS[group];
                                    const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', icon: '🍽️' };
                                    return (
                                        <tr key={group} className={`${style.bg} bg-opacity-20`}>
                                            <td className={`p-3 font-medium ${style.text}`}><span className="mr-2">{style.icon}</span> {getGroupLabel(group)}
                                                {group === 'fats' && <button onClick={() => setUseFatBreakdown(!useFatBreakdown)} className="ml-2 text-[8px] bg-white border px-1 rounded">{useFatBreakdown ? 'Hide' : 'Expand'}</button>}
                                            </td>
                                            <td className="p-2 text-center bg-white/40"><input type="number" step="0.5" disabled={isAutoFat} className="w-16 p-2 border rounded text-center font-bold" value={target || ''} onChange={(e) => updateServing(group, parseFloat(e.target.value) || 0)} /></td>
                                            <RenderCell val={target * f.cho} factor={f.cho} label="g" />
                                            <RenderCell val={target * f.pro} factor={f.pro} label="g" />
                                            <RenderCell val={target * f.fat} factor={f.fat} label="g" />
                                            <RenderCell val={target * f.kcal} factor={f.kcal} label="Kcal" />
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                     </div>
                </div>

                <div className="lg:col-span-3 space-y-6 no-print">
                    <div className="card bg-white shadow-xl border-t-4 border-t-[var(--color-primary)] p-4 sticky top-24 z-30">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">📊 Smart Summary</h3>
                        <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label="Energy Target" />
                        <div className="mb-4"><MacroDonut cho={calcTotals.cho} pro={calcTotals.pro} fat={calcTotals.fat} totalKcal={calcTotals.kcal} /></div>
                        <ProgressBar current={calcTotals.kcal} target={targetKcal} label="Calorie Progress" unit="kcal" showPercent={true} />
                        
                        <div className="mt-6 space-y-2">
                             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Nutrient</span><span>Total (g)</span><span>Rem</span></div>
                             <div className="bg-blue-50 p-2 rounded flex justify-between items-center text-xs"><span className="text-blue-700 font-bold">Carbs</span><span className="font-mono">{calcTotals.cho.toFixed(1)}g</span><span className="text-[10px] text-blue-400">{(activeTargetTab !== 'none' ? targetMacros.cho - calcTotals.cho : 0).toFixed(0)}</span></div>
                             <div className="bg-red-50 p-2 rounded flex justify-between items-center text-xs"><span className="text-red-700 font-bold">Protein</span><span className="font-mono">{calcTotals.pro.toFixed(1)}g</span><span className="text-[10px] text-red-400">{(activeTargetTab !== 'none' ? targetMacros.pro - calcTotals.pro : 0).toFixed(0)}</span></div>
                             <div className="bg-yellow-50 p-2 rounded flex justify-between items-center text-xs"><span className="text-yellow-700 font-bold">Fat</span><span className="font-mono">{calcTotals.fat.toFixed(1)}g</span><span className="text-[10px] text-yellow-400">{(activeTargetTab !== 'none' ? targetMacros.fat - calcTotals.fat : 0).toFixed(0)}</span></div>
                        </div>

                        <div className="mt-4 flex gap-1 justify-center"><button onClick={() => setActiveTargetTab('gm')} className={`flex-1 text-[9px] py-1 rounded border font-bold ${activeTargetTab === 'gm' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>Set (g)</button><button onClick={() => setActiveTargetTab('perc')} className={`flex-1 text-[9px] py-1 rounded border font-bold ${activeTargetTab === 'perc' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>Set (%)</button></div>
                    </div>
                </div>
            </>
        )}
        
        {viewMode === 'planner' && (
            <div className="lg:col-span-12 flex flex-col lg:flex-row gap-6">
                <div className="flex-grow card bg-white shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-gray-800 text-white">
                                <tr><th className="p-2 text-left bg-gray-900 border-b border-gray-700">Group</th><th className="p-2 text-center bg-gray-700 border-r border-gray-600">Rem</th>{MEALS.map(m => <th key={m} className="p-2 text-center border-b border-gray-700">{t.mealPlannerTool.meals[m as keyof typeof t.mealPlannerTool.meals]}</th>)}</tr>
                            </thead>
                            <tbody>
                                {VISIBLE_GROUPS.map(group => {
                                    const isAutoFat = useFatBreakdown && group === 'fats';
                                    let dists = distribution[group] || {};
                                    if (isAutoFat) { dists = {}; MEALS.forEach(m => { dists[m] = (distribution['fatsPufa']?.[m] || 0) + (distribution['fatsMufa']?.[m] || 0) + (distribution['fatsSat']?.[m] || 0); }); }
                                    const total = MEALS.reduce((acc, m) => acc + (Number(dists[m]) || 0), 0);
                                    const rem = (isAutoFat ? calculatedFatsSum : (servings[group] || 0)) - total;
                                    const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', icon: '🍽️' };
                                    return (
                                        <tr key={group} className={`${style.bg} bg-opacity-20 border-b border-gray-100 hover:bg-opacity-40 transition`}>
                                            <td className="p-2 font-bold sticky left-0 bg-white border-r z-10">{style.icon} {getGroupLabel(group)}</td>
                                            <td className={`p-2 text-center font-bold border-r ${rem < 0 ? 'bg-red-50 text-red-600' : 'text-gray-400'}`}>{rem === 0 ? '-' : rem.toFixed(1)}</td>
                                            {MEALS.map(m => <td key={m} className="p-1 border-r border-gray-100">{isAutoFat ? <div className="text-center font-bold text-gray-500">{dists[m] || '-'}</div> : <input type="number" className="w-full h-8 text-center bg-transparent outline-none rounded font-bold" placeholder="-" value={dists[m] || ''} onChange={(e) => updateDistribution(group, m, parseFloat(e.target.value) || 0)} />}</td>)}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        <div className={`col-span-12 ${viewMode === 'day-menu' ? 'block' : 'hidden'}`}>
            <MealCreator isEmbedded={true} externalTargetKcal={targetKcal} plannedExchanges={servings} externalWeeklyPlan={dayMenuPlan} onWeeklyPlanChange={setDayMenuPlan} />
        </div>
      </div>
    </div>
  );
};
