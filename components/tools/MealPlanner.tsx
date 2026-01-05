
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProgressBar, MacroDonut } from '../Visuals';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SavedMeal, Client, ClientVisit } from '../../types';
import Toast from '../Toast';
import MealCreator, { WeeklyPlan, DEFAULT_WEEKLY_PLAN } from './MealCreator';
import { AdvancedMealCreator } from './AdvancedMealCreator'; 
import { DietType, DietPlanRow } from '../../data/dietTemplates';
import DietGuidelinesView from './DietGuidelinesView';
import FoodComposition from './FoodComposition'; // Import for Modal

/**
 * v2.0.243 Clinical Maintenance Constants
 * Calculation factors for macronutrient and calorie conversion per exchange serve.
 */
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

/**
 * UI Styling Configuration
 */
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
  fatsMufa: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '🥜' },
  fatsSat: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '🥥' },
};

const MEALS = ['snack1', 'breakfast', 'snack2', 'lunch', 'snack3', 'dinner', 'snack4'];
const BASE_GROUPS = Object.keys(GROUP_FACTORS);

/**
 * v2.0.243 Dictionary for Diet-Specific Guidelines
 * Allows the system to dynamically render instructions based on the selected Diet Type.
 */
const DIET_SPECIFIC_GUIDELINES: Record<string, string> = {
  'Balanced': `• Diversity: Include all food groups in the plan.; • Added Sugar: Must be less than 10% of total daily calories.; • Saturated Fat: Must be less than 10% of total daily calories.; • PUFA: Up to 10% of total calories.; • MUFA: Up to 20% of total calories.; • Carbs & Fruit: Do not rely on fruit as your only carb source.; • Carbs & Fruit: Fruit servings should not exceed 15% of the total plan.`,
  'DASH': `• Sodium: Limit to < 2,300 mg/day (ideally 1,500 mg).; • Potassium: Increase intake via fruits and vegetables.; • Low Fat Dairy: Emphasize 2-3 servings of low-fat dairy daily.; • Fiber: Target > 30g per day from whole grains and vegetables.; • Saturated Fat: Must be less than 6% of total calories.`,
  'Low Carb': `• Carb Limit: Keep total carbs within 20-40% of total energy.; • Protein focus: Ensure adequate lean protein at every meal.; • Healthy Fats: Emphasize MUFA and PUFA sources.; • Non-starchy Veg: Minimum 3-5 servings of green leafy vegetables.`,
  'Diabetes': `• Consistency: Distribute carb servings evenly across 5-6 meals.; • GI Focus: Prefer Low Glycemic Index starches (Oats, Whole Wheat).; • Fiber: High fiber intake to stabilize glucose levels.; • Added Sugar: 0% or strictly minimal added sugars.`
};

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

// v2.0.254 - New Meal Plan Summary Table Component
const MealPlanSummaryTable: React.FC<{ distribution: any, visibleGroups: string[], targetKcal: number }> = ({ distribution, visibleGroups, targetKcal }) => {
    // Helper to get friendly name
    // v2.0.258: Updated to show full names for food groups as per user request
    const getFriendlyGroupName = (g: string) => {
        // Basic Groups
        if(g === 'starch') return 'Starch';
        if(g === 'veg') return 'Vegetables';
        if(g === 'fruit') return 'Fruits';
        if(g === 'legumes') return 'Legumes';
        if(g === 'sugar') return 'Sugar';
        
        // Meat Groups
        if(g === 'meatLean') return 'Meat Lean';
        if(g === 'meatMed') return 'Meat Medium';
        if(g === 'meatHigh') return 'Meat High';
        
        // Milk Groups
        if(g === 'milkSkim') return 'Milk Skimmed';
        if(g === 'milkLow') return 'Milk Medium';
        if(g === 'milkWhole') return 'Milk High (Whole)';
        
        // Fat Groups
        if(g === 'fats') return 'Fats (General)';
        if(g === 'fatsSat') return 'Fat SFA';
        if(g === 'fatsMufa') return 'Fat MUFA';
        if(g === 'fatsPufa') return 'Fat PUFA';
        
        return g;
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden h-fit">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                <span>📑</span> Meal Breakdown
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                            <th className="p-2 text-left">Meal</th>
                            <th className="p-2 text-left">Composition</th>
                            <th className="p-2 text-center">Kcal</th>
                            <th className="p-2 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MEALS.map((meal) => {
                            let totalMealKcal = 0;
                            const composition: string[] = [];
                            
                            visibleGroups.forEach(group => {
                                const serves = Number(distribution[group]?.[meal] || 0);
                                if (serves > 0) {
                                    const factor = GROUP_FACTORS[group];
                                    if(factor) totalMealKcal += serves * factor.kcal;
                                    composition.push(`${serves} ${getFriendlyGroupName(group)}`);
                                }
                            });

                            if (totalMealKcal === 0) return null;

                            const percent = targetKcal > 0 ? (totalMealKcal / targetKcal) * 100 : 0;
                            const isHigh = percent > 35; // Highlight main meals

                            return (
                                <tr key={meal} className={isHigh ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                                    <td className="p-2 font-bold text-gray-800 capitalize border-r border-gray-100">
                                        {meal.replace(/(\d)/, ' $1')}
                                    </td>
                                    <td className="p-2 text-gray-600">
                                        {composition.join(', ')}
                                    </td>
                                    <td className="p-2 text-center font-mono font-bold text-blue-600">
                                        {totalMealKcal.toFixed(0)}
                                    </td>
                                    <td className="p-2 text-right font-bold text-gray-500">
                                        {percent.toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Total Row */}
                        <tr className="bg-gray-50 border-t border-gray-200">
                            <td className="p-2 font-black text-gray-800" colSpan={2}>TOTAL PLAN</td>
                            <td className="p-2 text-center font-black text-green-700">
                                {visibleGroups.reduce((acc, g) => {
                                    return acc + MEALS.reduce((mAcc, m) => mAcc + (Number(distribution[g]?.[m] || 0) * (GROUP_FACTORS[g]?.kcal || 0)), 0);
                                }, 0).toFixed(0)}
                            </td>
                            <td className="p-2 text-right font-black text-green-700">
                                100%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};


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
  const [viewMode, setViewMode] = useState<'calculator' | 'planner' | 'both' | 'day-menu' | 'guidelines' | 'advanced-day-menu'>('calculator');
  const [useFatBreakdown, setUseFatBreakdown] = useState(false);
  
  // v2.0.257 - Food Analysis Modal State
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // --- Diet Guidelines Persistent State ---
  const [activeGuidelineId, setActiveGuidelineId] = useState<string>('dash');

  // --- Diet Templates Cloud State ---
  const [dietTemplates, setDietTemplates] = useState<DietType[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [templateStatus, setTemplateStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  // State for Targets - Default to 2000 if not provided
  const [targetKcal, setTargetKcal] = useState<number>(initialTargetKcal || 2000);
  const [manualGm, setManualGm] = useState({ cho: 0, pro: 0, fat: 0 });
  const [manualPerc, setManualPerc] = useState({ cho: 0, pro: 0, fat: 0 });
  const [activeTargetTab, setActiveTargetTab] = useState<'none' | 'gm' | 'perc'>('none');

  // State for Day Menu (Unified State)
  const [dayMenuPlan, setDayMenuPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);

  // --- Template & Advanced Calculator State ---
  const [selectedDietId, setSelectedDietId] = useState<string>('');
  const [selectedDistId, setSelectedDistId] = useState<string>('');
  const [selectedPlanName, setSelectedPlanName] = useState<string>(''); 
  
  const [advCalc, setAdvCalc] = useState({
      kcal: 2000,
      carbPerc: 50,
      weight: 70,
      proteinFactor: 1.2
  });
  const [advResults, setAdvResults] = useState<{choG: number, proG: number, fatG: number, proP: number, fatP: number, sfaG: number, mufaG: number, pufaG: number} | null>(null);

  // --- 1. Fetch Cloud Diet Templates ---
  useEffect(() => {
    const fetchDietTemplates = async () => {
      setIsTemplatesLoading(true);
      setTemplateStatus('idle');
      try {
        const { data, error } = await supabase
          .from('diet_templates')
          .select('*, diet_name, diet_notes') 
          .order('diet_type', { ascending: true })
          .order('kcal', { ascending: true });

        if (error) throw error;

        if (data) {
          // Transform flat SQL rows into DietType hierarchy
          const transformed: Record<string, DietType> = {};
          data.forEach(row => {
            const dietTypeId = row.diet_type.toLowerCase().replace(/\s+/g, '_');
            if (!transformed[dietTypeId]) {
              transformed[dietTypeId] = { id: dietTypeId, name: row.diet_type, distributions: [] };
            }
            
            const distId = `${dietTypeId}_${row.macro_ratios}`.toLowerCase().replace(/\s+/g, '_');
            let dist = transformed[dietTypeId].distributions.find(d => d.id === distId);
            if (!dist) {
              dist = { id: distId, label: row.macro_ratios, rows: [] };
              transformed[dietTypeId].distributions.push(dist);
            }
            
            dist.rows.push({
              kcal: row.kcal,
              dietName: row.diet_name,
              dietNotes: row.diet_notes,
              exchanges: {
                starch: Number(row.starch || 0),
                veg: Number(row.vegetables || 0),
                fruit: Number(row.fruits || 0),
                legumes: Number(row.legumes || 0),
                milkSkim: Number(row.milk_skimmed_low || 0),
                milkLow: Number(row.milk_medium || 0),
                milkWhole: Number(row.milk_high_whole || 0),
                meatLean: Number(row.meat_lean_low || 0),
                meatMed: Number(row.meat_medium || 0),
                meatHigh: Number(row.meat_high || 0),
                fatsSat: Number(row.fat_sat || 0),
                fatsMufa: Number(row.fat_mufa || 0),
                fatsPufa: Number(row.fat_pufa || 0),
                sugar: Number(row.sugar || 0)
              }
            });
          });
          
          const finalArray = Object.values(transformed);
          setDietTemplates(finalArray);
          
          // Set initial selection
          if (finalArray.length > 0) {
            setSelectedDietId(finalArray[0].id);
            if (finalArray[0].distributions.length > 0) {
              setSelectedDistId(finalArray[0].distributions[0].id);
            }
          }
          setTemplateStatus('success');
        }
      } catch (err) {
        console.error("Error fetching diet templates:", err);
        setTemplateStatus('error');
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    fetchDietTemplates();
  }, []);

  // Filter Saved Plans Logic
  const filteredSavedPlans = useMemo(() => {
    if (!loadSearchQuery) return savedPlans;
    const q = loadSearchQuery.toLowerCase();
    return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  // State for Planner Distribution
  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>(
    BASE_GROUPS.reduce((acc, group) => ({
      ...acc,
      [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
    }), {})
  );

  const VISIBLE_GROUPS = useMemo(() => {
      if (useFatBreakdown) return BASE_GROUPS;
      else return BASE_GROUPS.filter(g => !['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g));
  }, [useFatBreakdown]);

  const calculatedFatsSum = useMemo(() => {
      return (Number(servings['fatsPufa']) || 0) + (Number(servings['fatsMufa']) || 0) + (Number(servings['fatsSat']) || 0);
  }, [servings]);

  // Explicitly typing calculation returns
  const calcTotals = useMemo<{ 
    cho: number; pro: number; fat: number; fiber: number; kcal: number; 
    kcalPufa: number; kcalMufa: number; kcalSat: number; 
  }>(() => {
    let total_cho = 0;
    let total_pro = 0;
    let total_fat = 0;
    let total_fiber = 0;
    let total_kcal = 0;
    let total_kcalPufa = 0;
    let total_kcalMufa = 0;
    let total_kcalSat = 0;

    for (const g of BASE_GROUPS) {
      let s = Number(servings[g]) || 0;
      if (useFatBreakdown) {
          if (g === 'fats') s = 0;
      } else {
          if (['fatsPufa', 'fatsMufa', 'fatsSat'].includes(g)) s = 0;
      }

      const factor = GROUP_FACTORS[g];
      if (factor) {
          const sNum: number = Number(s);
          total_cho += (sNum * Number(factor.cho));
          total_pro += (sNum * Number(factor.pro));
          total_fat += (sNum * Number(factor.fat));
          total_fiber += (sNum * Number(factor.fiber));
          total_kcal += (sNum * Number(factor.kcal));
          if (g === 'fatsPufa') total_kcalPufa += (sNum * Number(factor.fat) * 9);
          if (g === 'fatsMufa') total_kcalMufa += (sNum * Number(factor.fat) * 9);
          if (g === 'fatsSat') total_kcalSat += (sNum * Number(factor.fat) * 9);
      }
    }
    return { cho: total_cho, pro: total_pro, fat: total_fat, fiber: total_fiber, kcal: total_kcal, kcalPufa: total_kcalPufa, kcalMufa: total_kcalMufa, kcalSat: total_kcalSat };
  }, [servings, useFatBreakdown]);

  const totalPerc = useMemo(() => {
      const k = Number(calcTotals.kcal) || 1;
      const cNum = Number(calcTotals.cho);
      const pNum = Number(calcTotals.pro);
      const fNum = Number(calcTotals.fat);
      
      return {
          cho: ((cNum * 4) / k * 100).toFixed(1),
          pro: ((pNum * 4) / k * 100).toFixed(1),
          fat: ((fNum * 9) / k * 100).toFixed(1),
      }
  }, [calcTotals]);

  // Dist Totals
  const distTotals = useMemo<{ 
    cho: number; pro: number; fat: number; fiber: number; kcal: number; 
  }>(() => {
      let t_cho = 0;
      let t_pro = 0;
      let t_fat = 0;
      let t_fiber = 0;
      let t_kcal = 0;
      
      for (const g of VISIBLE_GROUPS) {
          const factor = GROUP_FACTORS[g];
          if (factor) {
              const f_cho = Number(factor.cho);
              const f_pro = Number(factor.pro);
              const f_fat = Number(factor.fat);
              const f_fiber = Number(factor.fiber);
              const f_kcal = Number(factor.kcal);

              for (const m of MEALS) {
                  const groupDist = (distribution as Record<string, Record<string, number>>)[g];
                  const sVal = groupDist ? groupDist[m] : 0;
                  let s = Number(sVal || 0);
                  if (useFatBreakdown && g === 'fats') s = 0;
                  const sNum = Number(s);
                  t_cho += (sNum * f_cho);
                  t_pro += (sNum * f_pro);
                  t_fat += (sNum * f_fat);
                  t_fiber += (sNum * f_fiber);
                  t_kcal += (sNum * f_kcal);
              }
          }
      }
      return { cho: t_cho, pro: t_pro, fat: t_fat, fiber: t_fiber, kcal: t_kcal };
  }, [distribution, useFatBreakdown, VISIBLE_GROUPS]);

  // --- Template Handlers ---
  const selectedDiet = dietTemplates.find(d => d.id === selectedDietId);
  const selectedDistribution = selectedDiet?.distributions.find(d => d.id === selectedDistId);

  // Plan Name Options instead of kcal options
  const planNameOptions = useMemo(() => {
      if (!selectedDistribution) return [];
      return [...new Set(selectedDistribution.rows.map(r => r.dietName || `Plan (${r.kcal} kcal)`))].sort();
  }, [selectedDistribution]);

  // Auto-select first plan when distribution changes
  useEffect(() => {
      if (planNameOptions.length > 0 && (!selectedPlanName || !planNameOptions.includes(selectedPlanName))) {
          setSelectedPlanName(planNameOptions[0]);
      }
  }, [planNameOptions]);

  // Derived Kcal for display only
  const derivedKcal = useMemo(() => {
      if (!selectedDistribution || !selectedPlanName) return 0;
      const plan = selectedDistribution.rows.find(r => (r.dietName || `Plan (${r.kcal} kcal)`) === selectedPlanName);
      return plan ? plan.kcal : 0;
  }, [selectedDistribution, selectedPlanName]);

  /**
   * v2.0.243 - Dynamic Guidelines Logic
   * Fetches guidelines based on the Diet Type name (e.g., DASH, Balanced).
   */
  const currentGuidelines = useMemo(() => {
      if (!selectedDiet) return '';
      const name = selectedDiet.name;
      
      // Match diet type to specific guidelines or fallback to Balanced
      for (const key in DIET_SPECIFIC_GUIDELINES) {
          if (name.toLowerCase().includes(key.toLowerCase())) {
              return DIET_SPECIFIC_GUIDELINES[key];
          }
      }
      return DIET_SPECIFIC_GUIDELINES['Balanced'];
  }, [selectedDiet]);

  /**
   * v2.0.243 - Plan Specific Notes
   * Fetches notes specific to the individual plan selected from the database.
   */
  const currentPlanNotes = useMemo(() => {
      if (!selectedDistribution || !selectedPlanName) return '';
      const plan = selectedDistribution.rows.find(r => (r.dietName || `Plan (${r.kcal} kcal)`) === selectedPlanName);
      return plan?.dietNotes || '';
  }, [selectedDistribution, selectedPlanName]);

  const applyTemplate = () => {
      if (!selectedDistribution || !selectedPlanName) return;
      const plan = selectedDistribution.rows.find(r => (r.dietName || `Plan (${r.kcal} kcal)`) === selectedPlanName);
      if (!plan) {
          setStatusMsg(`No template found matching "${selectedPlanName}".`);
          setTimeout(() => setStatusMsg(''), 2000);
          return;
      }

      setTargetKcal(plan.kcal);
      
      const newServings = BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {});
      Object.keys(plan.exchanges).forEach(key => {
          (newServings as any)[key] = (plan.exchanges as any)[key];
      });
      
      if (plan.exchanges.fatsSat || plan.exchanges.fatsMufa || plan.exchanges.fatsPufa) {
          setUseFatBreakdown(true);
          newServings['fats'] = 0; 
      } else {
          setUseFatBreakdown(false);
      }

      setServings(newServings);
      const dietName = selectedDiet?.name || "Template";
      const distName = selectedDistribution.label;
      setStatusMsg(`${dietName} (${distName}) - ${plan.kcal} kcal applied.`);
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const calculateAdvancedMacros = () => {
      const { kcal, carbPerc, weight, proteinFactor } = advCalc;
      const carbG = (kcal * (carbPerc / 100)) / 4;
      const proG = weight * proteinFactor;
      const proKcal = proG * 4;
      const proPerc = (proKcal / kcal) * 100;
      const fatPerc = 100 - carbPerc - proPerc;
      const fatKcal = kcal * (fatPerc / 100);
      const fatG = fatKcal / 9;
      const sfaG = (kcal * 0.10) / 9;
      const remainingFatG = Math.max(0, fatG - sfaG);
      const pufaG = remainingFatG * (1/3);
      const mufaG = remainingFatG * (2/3);
      
      setAdvResults({
          choG: Math.round(carbG), proG: Math.round(proG), fatG: Math.round(fatG),
          proP: parseFloat(proPerc.toFixed(1)), fatP: parseFloat(fatPerc.toFixed(1)),
          sfaG: parseFloat(sfaG.toFixed(1)), mufaG: parseFloat(mufaG.toFixed(1)), pufaG: parseFloat(pufaG.toFixed(1))
      });
  };

  const applyAdvancedTargets = () => {
      if (!advResults) return;
      setManualGm({ cho: advResults.choG, pro: advResults.proG, fat: advResults.fatG });
      setActiveTargetTab('gm');
      setStatusMsg("Macro targets updated from calculator.");
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const updateServing = (group: string, val: number) => {
    setServings(prev => ({ ...prev, [group]: val }));
  };

  const updateDistribution = (group: string, meal: string, val: number) => {
    setDistribution(prev => ({
      ...prev,
      [group]: { ...prev[group], [meal]: val }
    }));
  };

  const handlePrint = () => { window.print(); };

  const fetchPlans = async () => {
      if (!session) return;
      setIsLoadingPlans(true);
      setLoadSearchQuery('');
      try {
          const { data, error } = await supabase
            .from('saved_meals')
            .select('*')
            .eq('tool_type', 'meal-planner')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (data) setSavedPlans(data);
      } catch (err) {
          setStatusMsg("Error loading plans.");
      } finally {
          setIsLoadingPlans(false);
      }
  };

  const savePlan = async () => {
      if (!planName.trim()) { alert("Please enter a name for the meal plan."); return; }
      if (!session) return;
      setStatusMsg("Saving...");
      const planData = { servings, distribution, targetKcal, manualGm, manualPerc, dayMenuPlan };
      const isUpdate = loadedPlanId && (planName === lastSavedName);
      try {
          if (isUpdate) {
             await supabase.from('saved_meals').update({ name: planName, data: planData }).eq('id', loadedPlanId).eq('user_id', session.user.id);
             setStatusMsg("Plan Updated Successfully!");
          } else {
             const { data, error } = await supabase.from('saved_meals').insert({ user_id: session.user.id, name: planName, tool_type: 'meal-planner', data: planData, created_at: new Date().toISOString() }).select().single();
             if (error) throw error;
             if (data) { setLoadedPlanId(data.id); setLastSavedName(data.name); }
             setStatusMsg("Plan Saved as New Entry!");
          }
          fetchPlans();
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) { setStatusMsg("Failed to save: " + err.message); }
  };

  const handleSaveToVisit = async () => {
      if (!activeVisit) return;
      setStatusMsg('Saving to Client Visit...');
      const planData = { servings, distribution, targetKcal, manualGm, manualPerc, dayMenuPlan };
      try {
          const { error } = await supabase.from('client_visits').update({ meal_plan_data: planData }).eq('id', activeVisit.visit.id);
          if (error) throw error;
          setStatusMsg('Saved to Client Visit Record!');
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) { setStatusMsg('Error Saving to Visit: ' + err.message); }
  };

  const loadPlan = (plan: SavedMeal) => {
      if (!plan.data) return;
      setServings({ ...plan.data.servings } || {});
      setDistribution({ ...plan.data.distribution } || {});
      setTargetKcal(plan.data.targetKcal || 0);
      setManualGm(plan.data.manualGm || {cho:0, pro:0, fat:0});
      setManualPerc(plan.data.manualPerc || {cho:0, pro:0, fat:0});
      if (plan.data.dayMenuPlan) setDayMenuPlan(plan.data.dayMenuPlan);
      setPlanName(plan.name);
      setLoadedPlanId(plan.id);
      setLastSavedName(plan.name);
      const hasDetails = (plan.data.servings?.fatsPufa || 0) > 0 || (plan.data.servings?.fatsMufa || 0) > 0 || (plan.data.servings?.fatsSat || 0) > 0;
      if (hasDetails) setUseFatBreakdown(true);
      setShowLoadModal(false);
      setStatusMsg(t.common.loadSuccess);
      setTimeout(() => setStatusMsg(''), 3000);
  };

  const deletePlan = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this plan?")) return;
      try {
          await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session?.user.id);
          setSavedPlans(prev => prev.filter(p => p.id !== id));
      } catch (err) { console.error("Error deleting:", err); }
  };

  const resetAll = () => {
      setServings(BASE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: 0 }), {}));
      setDistribution(BASE_GROUPS.reduce((acc, group) => ({
          ...acc,
          [group]: MEALS.reduce((mAcc, meal) => ({ ...mAcc, [meal]: 0 }), {})
      }), {}));
      setTargetKcal(2000);
      setPlanName('');
      setLoadedPlanId(null);
      setLastSavedName('');
      setUseFatBreakdown(false);
      setDayMenuPlan(DEFAULT_WEEKLY_PLAN);
      setSelectedDietId(dietTemplates.length > 0 ? dietTemplates[0].id : '');
      setSelectedDistId(dietTemplates.length > 0 && dietTemplates[0].distributions.length > 0 ? dietTemplates[0].distributions[0].id : '');
      setSelectedPlanName('');
  };

  const getGroupLabel = (group: string) => {
      if (group === 'fatsPufa') return 'Fat PUFA';
      if (group === 'fatsMufa') return 'Fat MUFA';
      if (group === 'fatsSat') return 'Fat SAT';
      return t.mealPlannerTool.groups[group as keyof typeof t.mealPlannerTool.groups] || group;
  }

  const targetMacros = useMemo(() => {
      if (activeTargetTab === 'gm') return { cho: Number(manualGm.cho), pro: Number(manualGm.pro), fat: Number(manualGm.fat), source: 'Manual Grams' };
      if (activeTargetTab === 'perc') return { cho: (targetKcal * (Number(manualPerc.cho) / 100)) / 4, pro: (targetKcal * (Number(manualPerc.pro) / 100)) / 4, fat: (targetKcal * (Number(manualPerc.fat) / 100)) / 9, source: 'Manual %' };
      return { cho: 0, pro: 0, fat: 0, source: 'None' };
  }, [activeTargetTab, manualGm, manualPerc, targetKcal]);

  const getAchievedPct = (val: number, target: number) => {
      if (!target || target <= 0) return 0;
      return (val / target) * 100;
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in">
      <Toast message={statusMsg} />

      {activeVisit && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm no-print">
              <div>
                  <h3 className="font-bold text-purple-800 text-lg">Client: {activeVisit.client.full_name}</h3>
                  <p className="text-sm text-purple-600 flex flex-wrap gap-3">
                     <span>Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}</span>
                     <span>•</span>
                     <span>Clinic: {activeVisit.client.clinic || 'N/A'}</span>
                  </p>
              </div>
              <div className="flex items-center gap-3">
                  <button onClick={handleSaveToVisit} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2">
                      <span>💾</span> Save to Visit
                  </button>
              </div>
          </div>
      )}

      <div className="relative flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 no-print">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
           {onBack && (
               <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm whitespace-nowrap">
                   <span>←</span> {t.common.backToCalculator}
               </button>
           )}
           <h1 className="text-2xl font-bold text-[var(--color-heading)] hidden xl:block whitespace-nowrap">{t.tools.mealPlanner.title}</h1>
           <div className="relative flex-grow md:flex-grow-0">
                <input type="text" placeholder="Enter Plan Name..." value={planName} onChange={(e) => setPlanName(e.target.value)} className="w-full md:w-64 px-4 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-gray-800 font-medium" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✎</span>
           </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap justify-center">
            <button onClick={() => setViewMode('calculator')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'calculator' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.mealPlannerTool.modeCalculator}</button>
            <button onClick={() => setViewMode('planner')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'planner' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.mealPlannerTool.modePlanner}</button>
            <button onClick={() => setViewMode('day-menu')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'day-menu' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🥗 Day Menu</button>
            <button onClick={() => setViewMode('advanced-day-menu')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'advanced-day-menu' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🔬 Advanced Day</button>
            <button onClick={() => setViewMode('guidelines')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'guidelines' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📚 Diet Guide</button>
        </div>

        <div className="flex gap-2 items-center">
            {session && (
                <><button onClick={() => savePlan()} className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title={t.common.save + " (As Template)"}><span className="text-xl">💾</span></button>
                <button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-500 hover:bg-purple-600 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title={t.common.load + " (Template)"}><span className="text-xl">📂</span></button></>
            )}
             <button onClick={handlePrint} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Print Plan"><span className="text-xl">🖨️</span></button>
            <button onClick={resetAll} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition">{t.common.reset}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {viewMode === 'calculator' && (
            <>
                {/* ... (Existing Calculator Code - No Changes) ... */}
                <div className="lg:col-span-3 space-y-6 no-print">
                    {/* QUICK DIET TEMPLATES (Cloud Exclusive) */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-blue-50 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">Quick Diet Templates</h3>
                            <div className={`text-xl transition-colors duration-500 ${templateStatus === 'success' ? 'text-green-500' : templateStatus === 'error' ? 'text-red-500' : 'text-gray-300 animate-pulse'}`} title={templateStatus === 'success' ? 'Database Connected' : 'Cloud Not Fetched'}>
                                ☁️
                            </div>
                        </div>
                        {isTemplatesLoading ? (
                            <div className="text-center py-6 text-gray-400 text-xs animate-pulse font-bold">📡 Fetching Cloud Templates...</div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                                <label className="text-[11px] text-gray-500 font-bold block mb-1.5 uppercase">Diet Type</label>
                                <select className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedDietId} onChange={(e) => {
                                        setSelectedDietId(e.target.value);
                                        const d = dietTemplates.find(dt => dt.id === e.target.value);
                                        if(d && d.distributions.length > 0) setSelectedDistId(d.distributions[0].id);
                                    }}>
                                    {dietTemplates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] text-gray-500 font-bold block mb-1.5 uppercase">Distribution</label>
                                <select className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedDistId} onChange={(e) => setSelectedDistId(e.target.value)}>
                                    {selectedDiet?.distributions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex-grow">
                                    <label className="text-[11px] text-gray-500 font-bold block mb-1.5 uppercase">Diet Plan Name</label>
                                    <select className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800" value={selectedPlanName} onChange={(e) => setSelectedPlanName(e.target.value)}>
                                        <option value="" disabled>-- Select Plan --</option>
                                        {planNameOptions.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Target Result:</span>
                                    <span className="font-mono font-black text-blue-800">{derivedKcal} kcal</span>
                                </div>
                                <button onClick={applyTemplate} className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm h-[42px] mt-1">Load Template</button>
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden">
                        <div className="p-4 border-b bg-green-50"><h3 className="font-bold text-green-900 flex items-center gap-2 text-sm uppercase"><span>🧮</span> Precision Macro Calc</h3></div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Kcal</label><input type="number" value={advCalc.kcal} onChange={e => setAdvCalc({...advCalc, kcal: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold text-blue-800" /></div>
                                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carb %</label><input type="number" value={advCalc.carbPerc} onChange={e => setAdvCalc({...advCalc, carbPerc: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold text-blue-600" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label><input type="number" value={advCalc.weight} onChange={e => setAdvCalc({...advCalc, weight: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold text-gray-800" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prot Fac (g/kg)</label><input type="number" step="0.1" value={advCalc.proteinFactor} onChange={e => setAdvCalc({...advCalc, proteinFactor: Number(e.target.value)})} className="w-full p-1.5 border rounded text-sm font-bold text-red-600" /></div>
                            </div>
                            <button onClick={calculateAdvancedMacros} className="w-full py-2 bg-gray-800 text-white font-bold rounded text-xs hover:bg-gray-900 transition">Calculate Breakdown</button>
                            {advResults && (
                                <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                        <div className="bg-blue-100 p-1.5 rounded"><div className="font-bold text-blue-800">{advResults.choG}g</div><div className="text-[9px] text-blue-600">C ({advCalc.carbPerc}%)</div></div>
                                        <div className="bg-red-100 p-1.5 rounded"><div className="font-bold text-red-800">{advResults.proG}g</div><div className="text-[9px] text-red-600">P ({advResults.proP}%)</div></div>
                                        <div className="bg-yellow-100 p-1.5 rounded"><div className="font-bold text-yellow-800">{advResults.fatG}g</div><div className="text-[9px] text-yellow-600">F ({advResults.fatP}%)</div></div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Fat Quality (Approx 1:2:1)</p><div className="flex justify-between text-[10px]"><span>SFA (10%): <b className="text-orange-700">{advResults.sfaG}g</b></span><span>MUFA: <b className="text-yellow-700">{advResults.mufaG}g</b></span></div><div className="text-[10px] text-right mt-1"><span>PUFA: <b className="text-yellow-600">{advResults.pufaG}g</b></span></div></div>
                                    <button onClick={applyAdvancedTargets} className="mt-3 w-full py-1.5 bg-green-600 text-white font-bold rounded text-xs hover:bg-green-700 shadow-sm transition">Apply Targets</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6">
                     <div className="card bg-white shadow-lg overflow-hidden border border-gray-200">
                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center"><span className="font-bold text-gray-700">Exchanges Calculator</span><div className="text-xs text-gray-500">Inputs: {Object.values(servings).reduce((a: number, b: number) => a + b, 0)}</div></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-[var(--color-primary)] text-white">
                                    <tr>
                                        <th className="p-3 text-left w-1/3">{t.mealPlannerTool.foodGroup}</th>
                                        <th className="p-3 text-center w-24">{t.mealPlannerTool.serves}</th>
                                        <th className="p-3 text-center">% kcal</th>
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
                                        const target = isAutoFat ? Number(calculatedFatsSum) : (Number(servings[group]) || 0);
                                        const s = target;
                                        const f = GROUP_FACTORS[group];
                                        const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200', icon: '🍽️' };
                                        
                                        const groupKcal = s * Number(f.kcal);
                                        const groupKcalPct = targetKcal > 0 ? (groupKcal / targetKcal) * 100 : 0;

                                        return (
                                            <tr key={group} className={`${style.bg} border-b ${style.border} bg-opacity-30`}>
                                                <td className="p-3 font-medium transition-colors"><div className={`flex items-center gap-2 text-base ${style.text}`}><span className="text-xl">{style.icon}</span> {getGroupLabel(group)}{group === 'fats' && (<button onClick={() => setUseFatBreakdown(!useFatBreakdown)} className={`ml-2 text-[10px] px-2 py-0.5 rounded border transition font-bold ${useFatBreakdown ? 'bg-yellow-200 border-yellow-300 text-yellow-800' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'}`} title="Toggle detailed fat types">{useFatBreakdown ? 'Hide Details' : 'Show Breakdown'}</button>)}{isAutoFat && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded ml-2">Auto-Sum</span>}</div></td>
                                                <td className="p-3 text-center bg-white/50">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <input type="number" min="0" step="0.5" disabled={isAutoFat} className={`w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all ${isAutoFat ? 'bg-gray-100 font-bold text-gray-500 cursor-not-allowed' : s === 0 ? 'text-red-300 bg-white' : 'font-bold text-lg text-gray-800 bg-white shadow-sm'}`} value={s || ''} placeholder="0" onChange={(e) => updateServing(group, parseFloat(e.target.value) || 0)} />
                                                        {s > 0 && s < 1 && (
                                                            <div className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded font-bold animate-pulse whitespace-nowrap" title="Weekly Limit">
                                                                ⚠️ Weekly Limit
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-[10px] font-bold text-gray-500">
                                                    {groupKcalPct > 0 ? `${groupKcalPct.toFixed(1)}%` : '-'}
                                                </td>
                                                <td className="p-3 text-center"><div className={`font-mono text-base ${s*Number(f.cho) === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{(s*Number(f.cho)).toFixed(1)}</div><div className="text-[10px] text-gray-400 font-medium">{f.cho}g</div></td>
                                                <td className="p-3 text-center"><div className={`font-mono text-base ${s*Number(f.pro) === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{(s*Number(f.pro)).toFixed(1)}</div><div className="text-[10px] text-gray-400 font-medium">{f.pro}g</div></td>
                                                <td className="p-3 text-center"><div className={`font-mono text-base ${s*Number(f.fat) === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{(s*Number(f.fat)).toFixed(1)}</div><div className="text-[10px] text-gray-400 font-medium">{f.fat}g</div></td>
                                                <td className="p-3 text-center"><div className={`font-mono text-base ${s*Number(f.fiber) === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{(s*Number(f.fiber)).toFixed(1)}</div><div className="text-[10px] text-gray-400 font-medium">{f.fiber}g</div></td>
                                                <td className="p-3 text-center"><div className={`font-mono text-base ${s*Number(f.kcal) === 0 ? 'text-red-300' : 'text-gray-700 font-bold'}`}>{(s*Number(f.kcal)).toFixed(1)}</div><div className="text-[10px] text-gray-400 font-medium">{f.kcal}kcal</div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>

                <div className="lg:col-span-3 space-y-6 no-print">
                    <div className="card bg-white shadow-xl sticky top-24 border-t-4 border-t-[var(--color-primary)]">
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2"><span className="text-2xl">📊</span> Smart Summary</h3>
                            
                            <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={t.kcal.kcalRequired} />
                            <div className="mb-6"><MacroDonut cho={Number(calcTotals.cho)} pro={Number(calcTotals.pro)} fat={Number(calcTotals.fat)} totalKcal={Number(calcTotals.kcal)} /></div>
                            <div className="space-y-1 mb-6"><ProgressBar current={Number(calcTotals.kcal)} target={targetKcal} label="Calorie Goal" unit="kcal" showPercent={true}/></div>
                            {/* ... Rest of Summary ... */}
                        </div>
                    </div>
                </div>
            </>
        )}

        {viewMode === 'planner' && (
            <div className="lg:col-span-12 flex flex-col lg:flex-row gap-6">
                
                {/* 1. Meal Summary Table (New Col) v2.0.254 */}
                <div className="w-full lg:w-1/4 flex-shrink-0 order-2 lg:order-1 no-print">
                     <MealPlanSummaryTable 
                        distribution={distribution}
                        visibleGroups={VISIBLE_GROUPS}
                        targetKcal={targetKcal}
                     />
                </div>

                {/* 2. Main Planner Table (Center) v2.0.254 (Adapted to 3 col) */}
                <div className="flex-grow card bg-white shadow-lg overflow-hidden order-1 lg:order-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm border-collapse">
                            {/* ... Table Content ... */}
                            <thead className="bg-gray-800 text-white sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 text-left min-w-[140px] bg-gray-900 border-b border-gray-700">Food Group</th>
                                    <th className="p-2 text-center bg-gray-800 border-b border-gray-700 font-bold">% kcal</th>
                                    <th className="p-2 text-center bg-gray-700 min-w-[60px] border-b border-gray-600 font-bold border-r border-gray-600">Remain</th>
                                    {MEALS.map(m => (<th key={m} className="p-2 text-center min-w-[60px] border-b border-gray-700">{t.mealPlannerTool.meals[m as keyof typeof t.mealPlannerTool.meals]}</th>))}
                                </tr>
                                <tr><th colSpan={MEALS.length + 3} className="p-1 bg-blue-100 text-blue-900 text-center text-xs font-bold uppercase tracking-widest border-b border-blue-200">Serves Day Distribution</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {VISIBLE_GROUPS.map(group => {
                                    // ... Row Logic ...
                                    const isAutoFat = useFatBreakdown && group === 'fats';
                                    let displayDistributions: Record<string, number> = (distribution as any)[group] || {};
                                    if (isAutoFat) {
                                        displayDistributions = {};
                                        MEALS.forEach(m => { displayDistributions[m] = (Number(distribution['fatsPufa']?.[m]) || 0) + (Number(distribution['fatsMufa']?.[m]) || 0) + (Number(distribution['fatsSat']?.[m]) || 0); });
                                    }
                                    const targetServes = isAutoFat ? Number(calculatedFatsSum) : (Number(servings[group]) || 0);
                                    const totalDistServes = MEALS.reduce((acc: number, m: string) => acc + (Number(displayDistributions[m]) || 0), 0);
                                    const rem = targetServes - totalDistServes;
                                    const isOver = rem < 0, isComplete = rem === 0 && targetServes > 0;
                                    const style = GROUP_STYLES[group] || { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200', icon: '🍽️' };
                                    
                                    const factor = GROUP_FACTORS[group];
                                    const distKcal = totalDistServes * Number(factor.kcal);
                                    const distPct = targetKcal > 0 ? (distKcal / targetKcal) * 100 : 0;

                                    return (
                                        <tr key={group} className={`${style.bg} bg-opacity-30 border-b border-gray-100`}>
                                            <td className="p-2 font-medium border-r border-gray-200 sticky left-0 z-10 bg-white"><div className={`flex items-center gap-1.5 ${style.text}`}><span className="text-sm">{style.icon}</span> {getGroupLabel(group)}{group === 'fats' && (<button onClick={() => setUseFatBreakdown(!useFatBreakdown)} className={`ml-2 text-[8px] px-1.5 py-0.5 rounded border font-bold ${useFatBreakdown ? 'bg-yellow-200 text-yellow-800 border-yellow-300' : 'bg-gray-100 border-gray-200 text-gray-500 border-gray-200'}`}>{useFatBreakdown ? 'Hide' : 'Show'}</button>)}{isAutoFat && <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded ml-1">Sum</span>}</div><div className="text-[10px] text-gray-500 font-normal no-print mt-1 ml-5 border-t border-black/10 pt-0.5">Target: <span className="font-bold">{targetServes}</span></div></td>
                                            <td className="p-2 text-center text-[10px] font-bold text-gray-400">
                                                {distPct > 0 ? `${distPct.toFixed(1)}%` : '-'}
                                            </td>
                                            <td className={`p-2 text-center font-bold border-r-2 border-gray-300 ${isOver ? 'bg-red-50 text-red-600' : isComplete ? 'bg-gray-50 text-gray-300' : 'bg-white text-gray-600'}`}>{rem === 0 ? '-' : rem.toFixed(1)}</td>
                                            {MEALS.map(meal => (<td key={meal} className="p-1 text-center border-r border-gray-100">{isAutoFat ? (<div className="text-gray-500 font-bold text-xs">{Number(displayDistributions[meal]) > 0 ? displayDistributions[meal] : '-'}</div>) : (<input type="number" className={`w-full h-8 text-center bg-transparent focus:bg-blue-50 outline-none rounded hover:bg-gray-100 transition ${(Number(displayDistributions?.[meal]) || 0) === 0 ? 'text-gray-300' : 'text-black font-bold'}`} placeholder="-" value={displayDistributions?.[meal] || ''} onChange={(e) => updateDistribution(group, meal, parseFloat(e.target.value) || 0)} />)}</td>))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Summary (Right Col) v2.0.254 (Adapted to 3 col) */}
                <div className="w-full lg:w-1/4 flex-shrink-0 space-y-4 no-print order-3">
                     <div className="card bg-white p-4 sticky top-24">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Planner Snapshot</h3>
                        
                        <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label={t.kcal.kcalRequired} />
                        <div className="mb-6"><MacroDonut cho={Number(distTotals.cho)} pro={Number(distTotals.pro)} fat={Number(distTotals.fat)} totalKcal={Number(distTotals.kcal)} /></div>
                        {/* ... Rest of Snapshot ... */}
                     </div>
                </div>
            </div>
        )}

        <div className={`col-span-12 ${viewMode === 'day-menu' ? 'block' : 'hidden'}`}>
            <MealCreator 
                initialLoadId={initialLoadId} 
                autoOpenLoad={autoOpenLoad} 
                autoOpenNew={autoOpenNew} 
                activeVisit={activeVisit} 
                isEmbedded={true} 
                externalTargetKcal={targetKcal} 
                plannedExchanges={servings} 
                externalWeeklyPlan={dayMenuPlan} 
                onWeeklyPlanChange={setDayMenuPlan} 
                externalGuidelines={currentGuidelines}
                externalNotes={currentPlanNotes} 
                dietTitle={selectedDiet?.name || 'Selected Diet'}
                onOpenAnalysis={() => setShowAnalysisModal(true)} // Open local modal
            />
        </div>

        {viewMode === 'advanced-day-menu' && (
            <div className="col-span-12">
                <AdvancedMealCreator />
            </div>
        )}

        {viewMode === 'guidelines' && (
            <div className="col-span-12">
                <DietGuidelinesView 
                    selectedId={activeGuidelineId}
                    onSelect={setActiveGuidelineId}
                />
            </div>
        )}

      </div>

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{t.common.load}</h3><button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
                <div className="mb-4"><input type="text" placeholder={t.common.search} value={loadSearchQuery} onChange={(e) => setLoadSearchQuery(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]" /></div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {isLoadingPlans ? ( <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : filteredSavedPlans.length === 0 ? ( <div className="text-center py-10 text-gray-400">No saved plans found.</div>
                    ) : (
                        filteredSavedPlans.map(plan => (
                            <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group">
                                <div><div className="font-bold text-gray-800">{plan.name}</div><div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString('en-GB')}</div></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Load</button><button onClick={() => deletePlan(plan.id)} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">Del</button></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Analysis Modal for Day Menu */}
      {showAnalysisModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl relative">
                   <div className="absolute top-4 right-4 z-[60]">
                       <button onClick={() => setShowAnalysisModal(false)} className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm font-bold">✕</button>
                   </div>
                   <div className="h-full overflow-y-auto p-2">
                       <FoodComposition onClose={() => setShowAnalysisModal(false)} />
                   </div>
              </div>
          </div>
      )}

    </div>
  );
};