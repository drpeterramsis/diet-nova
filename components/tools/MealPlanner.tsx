
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar } from '../Visuals';

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

interface MealPlannerProps {
  initialTargetKcal?: number;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ initialTargetKcal }) => {
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
  const [showTargetGm, setShowTargetGm] = useState(false);
  const [showTargetPerc, setShowTargetPerc] = useState(false);

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
    
    // % relative to Target Kcal
    const percTarget = targetKcal > 0 ? {
       cho: (tot.cho * 4 / targetKcal) * 100,
       pro: (tot.pro * 4 / targetKcal) * 100,
       fat: (tot.fat * 9 / targetKcal) * 100,
       kcal: (tot.kcal / targetKcal) * 100
    } : { cho: 0, pro: 0, fat: 0, kcal: 0 };

    // % relative to Calculated Total Kcal
    const percCalc = tot.kcal > 0 ? {
      cho: (tot.cho * 4 / tot.kcal) * 100,
      pro: (tot.pro * 4 / tot.kcal) * 100,
      fat: (tot.fat * 9 / tot.kcal) * 100
    } : { cho: 0, pro: 0, fat: 0 };

    return { remainKcal, percTarget, percCalc };
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
       total: ((manualGm.cho * 4 + manualGm.pro * 4 + manualGm.fat * 9) / targetKcal) * 100
     } : { cho: 0, pro: 0, fat: 0, total: 0 };

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
     let totalUsedServes = 0;
     
     GROUPS.forEach(g => {
       groupUsed[g] = MEALS.reduce((acc, m) => acc + (distribution[g]?.[m] || 0), 0);
       totalUsedServes += groupUsed[g];
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
     
     const pRemainKcal = targetKcal - pTotals.kcal;
     
     // Planner % of Target
     const pPercTarget = targetKcal > 0 ? {
        cho: (pTotals.cho * 4 / targetKcal) * 100,
        pro: (pTotals.pro * 4 / targetKcal) * 100,
        fat: (pTotals.fat * 9 / targetKcal) * 100,
        kcal: (pTotals.kcal / targetKcal) * 100
     } : { cho: 0, pro: 0, fat: 0, kcal: 0 };

     return { groupUsed, remainingServes, pTotals, pRemainKcal, pPercTarget };

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
  };

  // Helper to color numbers
  const colorNum = (val: number, isZeroRed = false) => {
     if (val === 0) return isZeroRed ? 'text-red-500' : 'text-gray-400';
     return 'text-blue-600';
  };

  const T = t.mealPlannerTool;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
         <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => setViewMode('calculator')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition ${viewMode === 'calculator' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}>
               {T.modeCalculator}
             </button>
             <button onClick={() => setViewMode('planner')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition ${viewMode === 'planner' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}>
               {T.modePlanner}
             </button>
             <button onClick={() => setViewMode('both')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition ${viewMode === 'both' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}>
               {T.modeBoth}
             </button>
         </div>
         <button onClick={resetAll} className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition w-full md:w-auto">
            {t.common.reset}
         </button>
      </div>

      <div className={`grid grid-cols-1 ${viewMode === 'both' ? 'xl:grid-cols-2' : ''} gap-8`}>
        
        {/* CALCULATOR SECTION */}
        {(viewMode === 'calculator' || viewMode === 'both') && (
          <div className="space-y-6">
             <div className="card bg-white shadow-lg border-0 ring-1 ring-gray-200">
                <div className="text-center mb-4 border-b pb-4">
                   <h2 className="text-2xl font-bold text-[var(--color-heading)]">{T.modeCalculator}</h2>
                   {targetKcal === 0 && <p className="text-xs bg-yellow-100 text-yellow-800 inline-block px-2 py-1 rounded mt-2">{T.addTotalKcalFirst}</p>}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-bg-soft)] text-[var(--color-heading)] border-b border-green-100">
                        <th className="p-3 text-left">{T.foodGroup}</th>
                        <th className="p-3 w-20 text-center">{T.serves}</th>
                        <th className="p-3 text-center">{T.cho}</th>
                        <th className="p-3 text-center">{T.pro}</th>
                        <th className="p-3 text-center">{T.fat}</th>
                        <th className="p-3 text-center">{T.kcal}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {GROUPS.map(g => (
                         <tr key={g} className="hover:bg-gray-50">
                           <td className="p-2 font-medium">{T.groups[g as keyof typeof T.groups]}</td>
                           <td className="p-2 text-center">
                             <input 
                               type="number" min="0" step="0.5" 
                               value={servings[g]} 
                               onChange={(e) => handleServeChange(g, Number(e.target.value))}
                               className="w-16 p-1 border rounded text-center focus:ring-2 focus:ring-[var(--color-primary)]"
                               dir="ltr"
                             />
                           </td>
                           <td className={`p-2 text-center font-mono ${colorNum(exchangeTotals.groupDetails[g].cho)}`}>{exchangeTotals.groupDetails[g].cho}</td>
                           <td className={`p-2 text-center font-mono ${colorNum(exchangeTotals.groupDetails[g].pro)}`}>{exchangeTotals.groupDetails[g].pro}</td>
                           <td className={`p-2 text-center font-mono ${colorNum(exchangeTotals.groupDetails[g].fat)}`}>{exchangeTotals.groupDetails[g].fat}</td>
                           <td className={`p-2 text-center font-mono font-bold ${colorNum(exchangeTotals.groupDetails[g].kcal)}`}>{exchangeTotals.groupDetails[g].kcal}</td>
                         </tr>
                       ))}
                       
                       {/* Totals Row */}
                       <tr className="bg-yellow-50 font-bold border-t-2 border-yellow-200">
                          <td className="p-3 text-yellow-900">{T.totals}</td>
                          <td className="p-3 text-center">
                             <input 
                               type="number" placeholder="Target" 
                               value={targetKcal || ''} onChange={(e) => setTargetKcal(Number(e.target.value))}
                               className="w-20 p-1 border border-yellow-300 rounded text-center bg-white"
                               dir="ltr"
                             />
                             <div className="text-[10px] text-gray-500 mt-1">Target Kcal</div>
                          </td>
                          <td className="p-3 text-center">{exchangeTotals.totals.cho}</td>
                          <td className="p-3 text-center">{exchangeTotals.totals.pro}</td>
                          <td className="p-3 text-center">{exchangeTotals.totals.fat}</td>
                          <td className="p-3 text-center text-red-700">{exchangeTotals.totals.kcal}</td>
                       </tr>

                       {/* Comparison Rows with Progress Bars */}
                       <tr className="text-xs text-gray-600 bg-gray-50">
                          <td className="p-2" colSpan={6}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                               <ProgressBar 
                                  label="Target Kcal Progress" 
                                  current={exchangeTotals.totals.kcal} 
                                  target={targetKcal} 
                                  unit="kcal"
                                  color="bg-blue-500"
                               />
                               <div className="flex justify-between items-end pb-1">
                                 <span>Remaining:</span>
                                 <span className={`font-bold ${comparisons.remainKcal < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {comparisons.remainKcal} kcal
                                 </span>
                               </div>
                             </div>
                          </td>
                       </tr>
                    </tbody>
                  </table>
                </div>
             </div>
             
             {/* Manual Targets Toggles */}
             <div className="flex gap-2">
                <button onClick={() => setShowTargetGm(!showTargetGm)} className="text-sm text-[var(--color-primary)] underline hover:text-[var(--color-primary-dark)]">
                  {showTargetGm ? 'Hide' : 'Show'} {T.manualTargetGm}
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setShowTargetPerc(!showTargetPerc)} className="text-sm text-[var(--color-primary)] underline hover:text-[var(--color-primary-dark)]">
                  {showTargetPerc ? 'Hide' : 'Show'} {T.manualTargetPerc}
                </button>
             </div>

             {/* Manual Grams Panel */}
             {showTargetGm && (
               <div className="card bg-blue-50 p-4 text-sm animate-fade-in">
                  <h4 className="font-bold mb-3 text-blue-800">{T.manualTargetGm}</h4>
                  <div className="grid grid-cols-5 gap-2 mb-2 font-semibold text-xs text-center text-gray-600">
                     <div className="col-span-2 text-left">Metric</div>
                     <div>CHO (g)</div>
                     <div>PRO (g)</div>
                     <div>FAT (g)</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center mb-3">
                     <div className="col-span-2">
                        <div className="font-bold text-gray-700">Inputs</div>
                        <div className="text-xs text-gray-500">{manualGmCalcs.totalInputKcal} Kcal</div>
                     </div>
                     <input type="number" className="p-1 rounded text-center" value={manualGm.cho || ''} onChange={(e) => setManualGm({...manualGm, cho: Number(e.target.value)})} />
                     <input type="number" className="p-1 rounded text-center" value={manualGm.pro || ''} onChange={(e) => setManualGm({...manualGm, pro: Number(e.target.value)})} />
                     <input type="number" className="p-1 rounded text-center" value={manualGm.fat || ''} onChange={(e) => setManualGm({...manualGm, fat: Number(e.target.value)})} />
                  </div>
                   <div className="grid grid-cols-5 gap-2 items-center text-xs text-gray-600 border-t border-blue-200 pt-2">
                     <div className="col-span-2">{T.targetPerc}</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.targetPercFromGm.cho.toFixed(1)}%</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.targetPercFromGm.pro.toFixed(1)}%</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.targetPercFromGm.fat.toFixed(1)}%</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center text-xs font-bold text-blue-700 border-t border-blue-200 pt-2 mt-1">
                     <div className="col-span-2">{T.remainManual}</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.remain.cho.toFixed(1)}</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.remain.pro.toFixed(1)}</div>
                     <div className="text-center" dir="ltr">{manualGmCalcs.remain.fat.toFixed(1)}</div>
                  </div>
               </div>
             )}

             {/* Manual Percent Panel */}
             {showTargetPerc && (
                <div className="card bg-purple-50 p-4 text-sm animate-fade-in">
                   <h4 className="font-bold mb-3 text-purple-800">{T.manualTargetPerc}</h4>
                   <div className="grid grid-cols-5 gap-2 mb-2 font-semibold text-xs text-center text-gray-600">
                      <div className="col-span-2 text-left">Metric</div>
                      <div>CHO (%)</div>
                      <div>PRO (%)</div>
                      <div>FAT (%)</div>
                   </div>
                   <div className="grid grid-cols-5 gap-2 items-center mb-3">
                      <div className="col-span-2">
                         <div className="font-bold text-gray-700">Inputs</div>
                         <div className="text-xs text-gray-500">Total: {manualPercCalcs.totalPerc}%</div>
                      </div>
                      <input type="number" className="p-1 rounded text-center" value={manualPerc.cho || ''} onChange={(e) => setManualPerc({...manualPerc, cho: Number(e.target.value)})} />
                      <input type="number" className="p-1 rounded text-center" value={manualPerc.pro || ''} onChange={(e) => setManualPerc({...manualPerc, pro: Number(e.target.value)})} />
                      <input type="number" className="p-1 rounded text-center" value={manualPerc.fat || ''} onChange={(e) => setManualPerc({...manualPerc, fat: Number(e.target.value)})} />
                   </div>
                    <div className="grid grid-cols-5 gap-2 items-center text-xs text-gray-600 border-t border-purple-200 pt-2">
                      <div className="col-span-2">{T.targetGm}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.targetGmFromPerc.cho.toFixed(0)}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.targetGmFromPerc.pro.toFixed(0)}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.targetGmFromPerc.fat.toFixed(0)}</div>
                   </div>
                   <div className="grid grid-cols-5 gap-2 items-center text-xs font-bold text-purple-700 border-t border-purple-200 pt-2 mt-1">
                      <div className="col-span-2">{T.remainManual}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.remain.cho.toFixed(0)}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.remain.pro.toFixed(0)}</div>
                      <div className="text-center" dir="ltr">{manualPercCalcs.remain.fat.toFixed(0)}</div>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* PLANNER SECTION */}
        {(viewMode === 'planner' || viewMode === 'both') && (
           <div className="space-y-6">
               <div className="card bg-white shadow-lg border-0 ring-1 ring-gray-200 overflow-hidden">
                   <div className="text-center mb-4 border-b pb-4 pt-4 px-4">
                      <h2 className="text-2xl font-bold text-[var(--color-heading)]">{T.modePlanner}</h2>
                      {/* Visual Planner Progress */}
                      <div className="mt-4 max-w-md mx-auto">
                          <ProgressBar 
                              label="Planner Budget"
                              current={plannerCalculations.pTotals.kcal}
                              target={targetKcal}
                              unit="kcal"
                          />
                          <div className="text-right text-xs mt-1">
                            {plannerCalculations.pRemainKcal.toFixed(0)} kcal remaining
                          </div>
                      </div>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm">
                         <thead>
                            <tr className="bg-blue-50 text-blue-900">
                               <th className="p-2 text-left min-w-[100px] sticky left-0 bg-blue-50 z-10">{T.foodGroup}</th>
                               {MEALS.map(m => (
                                  <th key={m} className="p-2 text-center min-w-[60px]">{T.meals[m as keyof typeof T.meals]}</th>
                               ))}
                               <th className="p-2 text-center min-w-[70px] bg-yellow-50 text-yellow-900 font-bold border-l">{T.meals.remain}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {GROUPS.map(g => (
                                <tr key={g} className="hover:bg-gray-50">
                                   <td className="p-2 font-medium sticky left-0 bg-white z-10 shadow-sm">{T.groups[g as keyof typeof T.groups]}</td>
                                   {MEALS.map(m => (
                                      <td key={m} className="p-1 text-center">
                                         <input 
                                            type="number" min="0" step="0.5"
                                            value={distribution[g][m] || ''}
                                            onChange={(e) => handleDistChange(g, m, Number(e.target.value))}
                                            className={`w-12 p-1 border rounded text-center focus:ring-1 focus:ring-blue-500 ${distribution[g][m] > 0 ? 'bg-blue-50 border-blue-200 font-bold text-blue-700' : ''}`}
                                         />
                                      </td>
                                   ))}
                                   <td className={`p-2 text-center border-l font-bold ${plannerCalculations.remainingServes[g] === 0 ? 'text-green-500' : 'text-red-500 bg-red-50'}`}>
                                      {plannerCalculations.remainingServes[g]}
                                   </td>
                                </tr>
                             ))}
                         </tbody>
                      </table>
                   </div>
               </div>
               
               {/* Planner Summary */}
               <div className="card bg-gray-50 p-4 border border-gray-200">
                  <h4 className="font-bold mb-2 text-gray-700">Planner Totals</h4>
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div className="p-2 bg-white rounded shadow-sm">
                          <div className="text-xs text-gray-500">{T.cho}</div>
                          <div className="font-bold text-blue-600">{plannerCalculations.pTotals.cho}g</div>
                          <div className="text-[10px] text-gray-400" dir="ltr">{plannerCalculations.pPercTarget.cho.toFixed(1)}%</div>
                      </div>
                       <div className="p-2 bg-white rounded shadow-sm">
                          <div className="text-xs text-gray-500">{T.pro}</div>
                          <div className="font-bold text-red-600">{plannerCalculations.pTotals.pro}g</div>
                          <div className="text-[10px] text-gray-400" dir="ltr">{plannerCalculations.pPercTarget.pro.toFixed(1)}%</div>
                      </div>
                       <div className="p-2 bg-white rounded shadow-sm">
                          <div className="text-xs text-gray-500">{T.fat}</div>
                          <div className="font-bold text-yellow-600">{plannerCalculations.pTotals.fat}g</div>
                          <div className="text-[10px] text-gray-400" dir="ltr">{plannerCalculations.pPercTarget.fat.toFixed(1)}%</div>
                      </div>
                       <div className="p-2 bg-white rounded shadow-sm border border-green-200">
                          <div className="text-xs text-gray-500">{T.kcal}</div>
                          <div className="font-bold text-green-700">{plannerCalculations.pTotals.kcal}</div>
                          <div className="text-[10px] text-gray-400" dir="ltr">{plannerCalculations.pPercTarget.kcal.toFixed(1)}%</div>
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
