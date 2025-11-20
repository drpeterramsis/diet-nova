
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar, MacroDonut } from '../Visuals';

const GROUP_FACTORS: Record<string, { cho: number; pro: number; fat: number; kcal: number }> = {
  starch: { cho: 15, pro: 3, fat: 0, kcal: 80 },
  veg: { cho: 5, pro: 2, fat: 0, kcal: 25 },
  fruit: { cho: 15, pro: 0, fat: 0, kcal: 60 },
  meatLean: { cho: 0, pro: 7, fat: 3, kcal: 45 },
  meatMed: { cho: 0, pro: 7, fat: 5, kcal: 75 },
  meatHigh: { cho: 0, pro: 7, fat: 8, kcal: 100 },
  milkSkim: { cho: 15, pro: 8, fat: 3, kcal: 100 },
  milkLow: { cho: 15, pro: 8, fat: 5, kcal: 120 },
  milkWhole: { cho: 15, pro: 8, fat: 8, kcal: 160 },
  legumes: { cho: 15, pro: 7, fat: 0, kcal: 110 },
  fats: { cho: 0, pro: 0, fat: 5, kcal: 45 },
  sugar: { cho: 5, pro: 0, fat: 0, kcal: 20 },
};

const GROUPS = Object.keys(GROUP_FACTORS);
const MEALS = ['snack1', 'breakfast', 'snack2', 'lunch', 'snack3', 'dinner', 'snack4'];

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
}

const MealPlanner: React.FC<MealPlannerProps> = ({ initialTargetKcal, onBack }) => {
  const { t, isRTL } = useLanguage();
  const [viewMode, setViewMode] = useState<'calculator' | 'planner' | 'both'>('calculator');
  
  // State for Calculator Input (Servings)
  const [servings, setServings] = useState<Record<string, number>>(
    GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {})
  );

  // State for Targets
  const [targetKcal, setTargetKcal] = useState<number>(0);
  const [manualGm, setManualGm] = useState({ cho: 0, pro: 0, fat: 0 });
  const [manualPerc, setManualPerc] = useState({ cho: 0, pro: 0, fat: 0 });
  const [activeTargetTab, setActiveTargetTab] = useState<'none' | 'gm' | 'perc'>('none');

  // Initialize target if provided prop
  useEffect(() => {
    if (initialTargetKcal && initialTargetKcal > 0) {
      setTargetKcal(initialTargetKcal);
    }
  }, [initialTargetKcal]);

  // State for Planner Distribution
  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>(
    GROUPS.reduce((acc, group) => ({
      ...acc,
      [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
    }), {})
  );

  // --- Calculations ---

  // 1. Exchange List Totals
  const exchangeTotals = useMemo(() => {
    let totals = { cho: 0, pro: 0, fat: 0, kcal: 0 };
    const groupDetails: Record<string, any> = {};

    GROUPS.forEach(group => {
      const s = servings[group];
      const f = GROUP_FACTORS[group];
      const res = {
        cho: s * f.cho,
        pro: s * f.pro,
        fat: s * f.fat,
        kcal: s * f.kcal
      };
      groupDetails[group] = res;
      totals.cho += res.cho;
      totals.pro += res.pro;
      totals.fat += res.fat;
      totals.kcal += res.kcal;
    });
    return { totals, groupDetails };
  }, [servings]);

  // 2. Comparisons
  const comparisons = useMemo(() => {
    const tot = exchangeTotals.totals;
    const remainKcal = targetKcal - tot.kcal;
    
    // % relative to Calculated Total Kcal
    const percCalc = tot.kcal > 0 ? {
      cho: (tot.cho * 4 / tot.kcal) * 100,
      pro: (tot.pro * 4 / tot.kcal) * 100,
      fat: (tot.fat * 9 / tot.kcal) * 100
    } : { cho: 0, pro: 0, fat: 0 };

    return { remainKcal, percCalc };
  }, [exchangeTotals, targetKcal]);

  // 3. Manual Target Calcs
  const manualGmCalcs = useMemo(() => {
     const totalInputKcal = (manualGm.cho * 4) + (manualGm.pro * 4) + (manualGm.fat * 9);
     const remain = {
       kcal: totalInputKcal - exchangeTotals.totals.kcal,
       cho: manualGm.cho - exchangeTotals.totals.cho,
       pro: manualGm.pro - exchangeTotals.totals.pro,
       fat: manualGm.fat - exchangeTotals.totals.fat,
     };
     
     const targetPercFromGm = targetKcal > 0 ? {
       cho: (manualGm.cho * 4 / targetKcal) * 100,
       pro: (manualGm.pro * 4 / targetKcal) * 100,
       fat: (manualGm.fat * 9 / targetKcal) * 100,
     } : { cho: 0, pro: 0, fat: 0 };

     return { totalInputKcal, remain, targetPercFromGm };
  }, [manualGm, exchangeTotals, targetKcal]);

  const manualPercCalcs = useMemo(() => {
    const totalPerc = manualPerc.cho + manualPerc.pro + manualPerc.fat;
    
    const targetGmFromPerc = {
      cho: (targetKcal * manualPerc.cho / 100) / 4,
      pro: (targetKcal * manualPerc.pro / 100) / 4,
      fat: (targetKcal * manualPerc.fat / 100) / 9,
    };
    const targetKcalFromPerc = (targetGmFromPerc.cho * 4) + (targetGmFromPerc.pro * 4) + (targetGmFromPerc.fat * 9);

    const remain = {
      kcal: targetKcalFromPerc - exchangeTotals.totals.kcal,
      cho: targetGmFromPerc.cho - exchangeTotals.totals.cho,
      pro: targetGmFromPerc.pro - exchangeTotals.totals.pro,
      fat: targetGmFromPerc.fat - exchangeTotals.totals.fat,
    };

    return { totalPerc, targetGmFromPerc, targetKcalFromPerc, remain };
  }, [manualPerc, exchangeTotals, targetKcal]);


  // 4. Meal Planner Calculations
  const plannerCalculations = useMemo(() => {
     const groupUsed: Record<string, number> = {};
     
     GROUPS.forEach(g => {
       groupUsed[g] = MEALS.reduce((acc, m) => acc + (distribution[g]?.[m] || 0), 0);
     });
     
     const remainingServes: Record<string, number> = {};
     GROUPS.forEach(g => {
       remainingServes[g] = servings[g] - groupUsed[g];
     });

     // Planner Nutritional Totals (based on used serves in planner)
     let pTotals = { cho: 0, pro: 0, fat: 0, kcal: 0 };
     GROUPS.forEach(g => {
       const s = groupUsed[g];
       const f = GROUP_FACTORS[g];
       pTotals.cho += s * f.cho;
       pTotals.pro += s * f.pro;
       pTotals.fat += s * f.fat;
       pTotals.kcal += s * f.kcal;
     });
     
     const pPercTarget = targetKcal > 0 ? {
        cho: (pTotals.cho * 4 / targetKcal) * 100,
        pro: (pTotals.pro * 4 / targetKcal) * 100,
        fat: (pTotals.fat * 9 / targetKcal) * 100,
        kcal: (pTotals.kcal / targetKcal) * 100
     } : { cho: 0, pro: 0, fat: 0, kcal: 0 };

     return { groupUsed, remainingServes, pTotals, pPercTarget };

  }, [distribution, servings, targetKcal]);


  // --- Handlers ---
  const handleServeChange = (group: string, val: number) => {
    setServings(prev => ({ ...prev, [group]: val }));
  };
  
  const handleDistChange = (group: string, meal: string, val: number) => {
    setDistribution(prev => ({
      ...prev,
      [group]: { ...prev[group], [meal]: val }
    }));
  };

  const resetAll = () => {
    setServings(GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}));
    setDistribution(GROUPS.reduce((acc, group) => ({
      ...acc,
      [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
    }), {}));
    setManualGm({ cho: 0, pro: 0, fat: 0 });
    setManualPerc({ cho: 0, pro: 0, fat: 0 });
    setTargetKcal(0);
    setActiveTargetTab('none');
  };

  const colorNum = (val: number, isZeroRed = false) => {
     if (val === 0) return isZeroRed ? 'text-red-400' : 'text-gray-300';
     return 'text-blue-600';
  };

  const T = t.mealPlannerTool;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)] sticky top-0 z-20">
         <div className="flex items-center gap-3">
             {onBack && (
                 <button 
                   onClick={onBack}
                   className="px-4 py-2 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 font-medium flex items-center gap-2 transition"
                 >
                   <span className="transform rotate-180 text-xl">➥</span> 
                   <span className="hidden sm:inline">{t.common.backToCalculator}</span>
                 </button>
             )}
             <h1 className="text-xl font-bold text-[var(--color-heading)] hidden md:block">
                {viewMode === 'calculator' ? T.modeCalculator : viewMode === 'planner' ? T.modePlanner : T.modeBoth}
             </h1>
         </div>

         <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setViewMode('calculator')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'calculator' ? 'bg-white text-[var(--color-primary)] shadow' : 'text-gray-500'}`}>
               {T.modeCalculator}
             </button>
             <button onClick={() => setViewMode('planner')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'planner' ? 'bg-white text-[var(--color-primary)] shadow' : 'text-gray-500'}`}>
               {T.modePlanner}
             </button>
             <button onClick={() => setViewMode('both')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'both' ? 'bg-white text-[var(--color-primary)] shadow' : 'text-gray-500'}`}>
               {T.modeBoth}
             </button>
         </div>
         
         <button onClick={resetAll} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium">
            {t.common.reset}
         </button>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* --- MODE: CALCULATOR --- */}
        {(viewMode === 'calculator' || viewMode === 'both') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Left Column: Input Table */}
             <div className="lg:col-span-2">
                <div className="card bg-white shadow-md border-0 ring-1 ring-gray-200 h-full">
                    <div className="p-4 border-b border-gray-100 bg-[var(--color-bg-soft)] rounded-t-xl">
                       <h2 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2">
                          📊 {T.modeCalculator}
                          <span className="text-xs font-normal bg-white px-2 py-1 rounded border text-gray-500">Enter servings below</span>
                       </h2>
                    </div>
                    <div className="overflow-x-auto p-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-100">
                            <th className="p-3 text-left">{T.foodGroup}</th>
                            <th className="p-3 w-24 text-center bg-blue-50/50 rounded-t-lg">{T.serves}</th>
                            <th className="p-3 text-center hidden sm:table-cell">{T.cho}</th>
                            <th className="p-3 text-center hidden sm:table-cell">{T.pro}</th>
                            <th className="p-3 text-center hidden sm:table-cell">{T.fat}</th>
                            <th className="p-3 text-center font-bold">{T.kcal}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {GROUPS.map(g => (
                             <tr key={g} className="hover:bg-gray-50 transition-colors group">
                               <td className="p-3 font-medium text-gray-700">{T.groups[g as keyof typeof T.groups]}</td>
                               <td className="p-2 text-center bg-blue-50/30 group-hover:bg-blue-50 transition-colors">
                                 <input 
                                   type="number" min="0" step="0.5" 
                                   value={servings[g]} 
                                   onChange={(e) => handleServeChange(g, Number(e.target.value))}
                                   className={`w-full p-2 border rounded-lg text-center focus:ring-2 focus:ring-[var(--color-primary)] outline-none ${servings[g] > 0 ? 'border-blue-300 bg-white font-bold text-blue-700 shadow-sm' : 'bg-transparent border-gray-200'}`}
                                   dir="ltr"
                                 />
                               </td>
                               <td className={`p-3 text-center hidden sm:table-cell font-mono ${colorNum(exchangeTotals.groupDetails[g].cho)}`}>{exchangeTotals.groupDetails[g].cho}</td>
                               <td className={`p-3 text-center hidden sm:table-cell font-mono ${colorNum(exchangeTotals.groupDetails[g].pro)}`}>{exchangeTotals.groupDetails[g].pro}</td>
                               <td className={`p-3 text-center hidden sm:table-cell font-mono ${colorNum(exchangeTotals.groupDetails[g].fat)}`}>{exchangeTotals.groupDetails[g].fat}</td>
                               <td className={`p-3 text-center font-mono font-bold ${colorNum(exchangeTotals.groupDetails[g].kcal)}`}>{exchangeTotals.groupDetails[g].kcal}</td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                </div>
             </div>

             {/* Right Column: Summary Sidebar (Inlined) */}
             <div className="lg:col-span-1">
                <div className="card bg-white shadow-lg border border-[var(--color-border)] sticky top-24 h-fit">
                    <h3 className="font-bold text-lg text-[var(--color-heading)] mb-4 border-b pb-2">Smart Summary</h3>
                    
                    {/* 1. Target Input */}
                    <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={T.targetKcal} />

                    {/* 2. Visuals */}
                    <div className="mb-6 flex justify-center">
                        {exchangeTotals.totals.kcal > 0 ? (
                            <MacroDonut 
                                cho={exchangeTotals.totals.cho}
                                pro={exchangeTotals.totals.pro}
                                fat={exchangeTotals.totals.fat}
                                totalKcal={exchangeTotals.totals.kcal}
                            />
                        ) : (
                            <div className="h-32 w-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                                Add servings to see chart
                            </div>
                        )}
                    </div>

                    {/* 3. Progress Bars */}
                    <div className="space-y-4 mb-6">
                        <ProgressBar 
                            label="Budget Used"
                            current={exchangeTotals.totals.kcal}
                            target={targetKcal}
                            unit="kcal"
                            color="bg-[var(--color-primary)]"
                        />
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>Calculated: <strong>{exchangeTotals.totals.kcal}</strong></span>
                            <span className={comparisons.remainKcal < 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                {comparisons.remainKcal > 0 ? '+' : ''}{comparisons.remainKcal} Remain
                            </span>
                        </div>
                    </div>

                    {/* 4. Manual Targets Tabs */}
                    <div className="border-t pt-4">
                        <div className="flex mb-2 bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => setActiveTargetTab('gm')} 
                                className={`flex-1 text-xs py-1.5 rounded-md transition ${activeTargetTab === 'gm' ? 'bg-white shadow text-[var(--color-primary)] font-bold' : 'text-gray-500'}`}
                            >
                                Target (g)
                            </button>
                            <button 
                                onClick={() => setActiveTargetTab('perc')} 
                                className={`flex-1 text-xs py-1.5 rounded-md transition ${activeTargetTab === 'perc' ? 'bg-white shadow text-[var(--color-primary)] font-bold' : 'text-gray-500'}`}
                            >
                                Target (%)
                            </button>
                            <button 
                                onClick={() => setActiveTargetTab('none')} 
                                className={`px-3 text-xs py-1.5 rounded-md transition ${activeTargetTab === 'none' ? 'bg-white shadow text-red-500' : 'text-gray-400'}`}
                            >
                                ×
                            </button>
                        </div>

                        {activeTargetTab === 'gm' && (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <span>CHO (g)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualGm.cho || ''} onChange={(e) => setManualGm({...manualGm, cho: Number(e.target.value)})} />
                                    <span className={`text-xs w-12 text-right ${manualGmCalcs.remain.cho < 0 ? 'text-red-500' : 'text-blue-600'}`}>{manualGmCalcs.remain.cho.toFixed(0)} diff</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>PRO (g)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualGm.pro || ''} onChange={(e) => setManualGm({...manualGm, pro: Number(e.target.value)})} />
                                    <span className={`text-xs w-12 text-right ${manualGmCalcs.remain.pro < 0 ? 'text-red-500' : 'text-blue-600'}`}>{manualGmCalcs.remain.pro.toFixed(0)} diff</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>FAT (g)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualGm.fat || ''} onChange={(e) => setManualGm({...manualGm, fat: Number(e.target.value)})} />
                                    <span className={`text-xs w-12 text-right ${manualGmCalcs.remain.fat < 0 ? 'text-red-500' : 'text-blue-600'}`}>{manualGmCalcs.remain.fat.toFixed(0)} diff</span>
                                </div>
                                <div className="text-xs text-center text-blue-800 pt-1 border-t border-blue-200 mt-1">
                                    Manual Total: {manualGmCalcs.totalInputKcal} kcal
                                </div>
                            </div>
                        )}

                        {activeTargetTab === 'perc' && (
                            <div className="bg-purple-50 p-3 rounded-lg text-sm space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <span>CHO (%)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualPerc.cho || ''} onChange={(e) => setManualPerc({...manualPerc, cho: Number(e.target.value)})} />
                                    <span className="text-xs w-12 text-right text-purple-600">{manualPercCalcs.targetGmFromPerc.cho.toFixed(0)}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>PRO (%)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualPerc.pro || ''} onChange={(e) => setManualPerc({...manualPerc, pro: Number(e.target.value)})} />
                                    <span className="text-xs w-12 text-right text-purple-600">{manualPercCalcs.targetGmFromPerc.pro.toFixed(0)}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>FAT (%)</span>
                                    <input type="number" className="w-16 p-1 rounded border text-center" value={manualPerc.fat || ''} onChange={(e) => setManualPerc({...manualPerc, fat: Number(e.target.value)})} />
                                    <span className="text-xs w-12 text-right text-purple-600">{manualPercCalcs.targetGmFromPerc.fat.toFixed(0)}g</span>
                                </div>
                                <div className="text-xs text-center text-purple-800 pt-1 border-t border-purple-200 mt-1">
                                    Target: {manualPercCalcs.targetKcalFromPerc.toFixed(0)} kcal ({manualPercCalcs.totalPerc}%)
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* --- MODE: PLANNER --- */}
        {(viewMode === 'planner' || viewMode === 'both') && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-dashed border-gray-300">
               {/* Left Column: Distribution Table */}
               <div className="lg:col-span-2">
                   <div className="card bg-white shadow-lg border-0 ring-1 ring-gray-200 h-full overflow-hidden">
                       <div className="p-4 border-b border-gray-100 bg-blue-50 rounded-t-xl flex justify-between items-center">
                          <h2 className="text-lg font-bold text-blue-900">📅 {T.modePlanner}</h2>
                          <div className="text-xs text-blue-700">Distribute servings across meals</div>
                       </div>
                       
                       <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                             <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b">
                                   <th className="p-3 text-left min-w-[120px] sticky left-0 bg-gray-50 z-10 border-r">{T.foodGroup}</th>
                                   {MEALS.map(m => (
                                      <th key={m} className="p-2 text-center min-w-[70px]">{T.meals[m as keyof typeof T.meals]}</th>
                                   ))}
                                   <th className="p-2 text-center min-w-[80px] bg-yellow-50 text-yellow-900 font-bold border-l shadow-inner">{T.meals.remain}</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {GROUPS.map(g => (
                                    <tr key={g} className="hover:bg-gray-50 group">
                                       <td className="p-3 font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r shadow-sm">{T.groups[g as keyof typeof T.groups]}</td>
                                       {MEALS.map(m => (
                                          <td key={m} className="p-1 text-center">
                                             <input 
                                                type="number" min="0" step="0.5"
                                                value={distribution[g][m] || ''}
                                                onChange={(e) => handleDistChange(g, m, Number(e.target.value))}
                                                className={`w-full p-1.5 border rounded text-center focus:ring-1 focus:ring-blue-500 outline-none transition-all ${distribution[g][m] > 0 ? 'bg-blue-50 border-blue-300 font-bold text-blue-700' : 'border-gray-100 focus:bg-white'}`}
                                             />
                                          </td>
                                       ))}
                                       <td className={`p-2 text-center border-l font-bold shadow-inner transition-colors ${plannerCalculations.remainingServes[g] === 0 ? 'bg-green-50 text-green-600' : plannerCalculations.remainingServes[g] < 0 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                          {plannerCalculations.remainingServes[g]}
                                       </td>
                                    </tr>
                                 ))}
                             </tbody>
                          </table>
                       </div>
                   </div>
               </div>

               {/* Right Column: Planner Snapshot (Inlined) */}
               <div className="lg:col-span-1">
                  <div className="card bg-white shadow-lg border border-[var(--color-border)] sticky top-24 h-fit">
                        <h3 className="font-bold text-lg text-[var(--color-heading)] mb-4 border-b pb-2">Planner Snapshot</h3>
                        
                        {/* Added Target Input here as well */}
                        <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={T.targetKcal} />

                        <div className="mb-6">
                            <MacroDonut 
                                cho={plannerCalculations.pTotals.cho}
                                pro={plannerCalculations.pTotals.pro}
                                fat={plannerCalculations.pTotals.fat}
                                totalKcal={plannerCalculations.pTotals.kcal}
                            />
                        </div>

                        <div className="space-y-4 mb-4">
                            <ProgressBar 
                                label="Planner Budget Used"
                                current={plannerCalculations.pTotals.kcal}
                                target={targetKcal > 0 ? targetKcal : exchangeTotals.totals.kcal}
                                unit="kcal"
                                color="bg-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded-lg">
                            <div className="p-1">
                                <div className="font-bold text-blue-600">{plannerCalculations.pTotals.cho}g</div>
                                <div className="text-gray-400">CHO</div>
                            </div>
                            <div className="p-1 border-l border-r border-gray-200">
                                <div className="font-bold text-red-600">{plannerCalculations.pTotals.pro}g</div>
                                <div className="text-gray-400">PRO</div>
                            </div>
                            <div className="p-1">
                                <div className="font-bold text-yellow-600">{plannerCalculations.pTotals.fat}g</div>
                                <div className="text-gray-400">FAT</div>
                            </div>
                        </div>
                    </div>
               </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default MealPlanner;
