
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { MacroDonut, ProgressBar } from "../Visuals";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SavedMeal, Client, ClientVisit } from "../../types";
import Toast from "../Toast";
import { FoodExchangeRow } from "../../data/exchangeData";

interface MealCreatorProps {
    initialLoadId?: string | null;
    autoOpenLoad?: boolean;
    autoOpenNew?: boolean;
    activeVisit?: { client: Client, visit: ClientVisit } | null;
    onNavigate?: (toolId: string, loadId?: string, action?: 'load' | 'new', preserveContext?: boolean) => void;
}

type MealTime = 'Pre-Breakfast' | 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner' | 'Late Snack';
const MEAL_TIMES: MealTime[] = ['Pre-Breakfast', 'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Late Snack'];

// Generate Alt Options (Main + 10 Alts)
const ALT_OPTIONS = ['main', ...Array.from({length: 10}, (_, i) => `Alt ${i+1}`)];

// Extended Planner Item
interface PlannerItem extends FoodItem {
    selected: boolean;
    optionGroup: string; 
}

// Metadata for each meal (Time, Notes)
interface MealMeta {
    timeStart: string;
    timeEnd: string;
    notes: string;
}

// Day Data Structure
interface DayPlan {
    items: Record<string, PlannerItem[]>; // Keyed by MealTime
    meta: Record<string, MealMeta>;       // Keyed by MealTime
}

interface WeeklyPlan {
    [day: number]: DayPlan;
}

// Regex to detect text like "(150 gm)" or "(1)"
const REGEX_PARENS = /(\(\d+.*?\))/g;

const renderHighlightedText = (text: string) => {
    const parts = text.split(REGEX_PARENS);
    return (
        <span>
            {parts.map((part, i) => 
                REGEX_PARENS.test(part) 
                ? <span key={i} className="text-red-500 font-bold">{part}</span> 
                : part
            )}
        </span>
    );
};

// Mapping for Exchange Comparison
const GROUP_MAPPING: Record<string, string> = {
    "Starch": "starch",
    "Fruits": "fruit",
    "Vegetables": "veg",
    "Lean Meat": "meatLean",
    "Medium Meat": "meatMed",
    "High Meat": "meatHigh",
    "Skimmed Milk": "milkSkim",
    "Low Milk": "milkLow",
    "Whole Milk": "milkWhole",
    "Legumes": "legumes",
    "Sugar": "sugar",
    // Fats aggregator handled separately
};

const MealCreator: React.FC<MealCreatorProps> = ({ initialLoadId, autoOpenLoad, autoOpenNew, activeVisit, onNavigate }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // Data Source State
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Weekly Planner State (Default 7 Days)
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({
      1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {} }
  });
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [targetKcal, setTargetKcal] = useState<number>(2000);
  
  // New UI Logic
  const [activeMealTime, setActiveMealTime] = useState<MealTime>('Lunch'); // Default active meal for adding items
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({}); // Collapse state for alternative groups

  // Save/Load State
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useState<string>('');
  const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadSearchQuery, setLoadSearchQuery] = useState('');

  // --- 1. Database Integration ---
  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food,
      group: row.food_group,
      serves: Number(row.serve),
      cho: Number(row.cho),
      protein: Number(row.protein),
      fat: Number(row.fat),
      fiber: Number(row.fiber),
      kcal: Number(row.kcal)
  });

  const mapItemToDB = (item: FoodItem): FoodExchangeRow => ({
      food: item.name,
      food_group: item.group,
      serve: item.serves,
      cho: item.cho,
      protein: item.protein,
      fat: item.fat,
      fiber: item.fiber,
      kcal: item.kcal
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoadingData(true);
          try {
              const { data, error } = await supabase
                  .from('food_exchange')
                  .select('*')
                  .order('food', { ascending: true })
                  .limit(2000);

              if (error) throw error;

              if (data && data.length > 0) {
                  const mapped = data.map(mapDBToItem);
                  setActiveData(mapped);
                  setDataSource('cloud');
              } else {
                  console.log("No cloud data found, using local.");
                  setDataSource('local');
              }
          } catch (err) {
              console.warn("Using local exchange data. DB Error:", err);
              setDataSource('local');
          } finally {
              setIsLoadingData(false);
          }
      };
      fetchDB();
  }, []);

  const handleSyncToCloud = async () => {
      if (!session) return;
      if (!window.confirm("This will upload local exchange items to the Supabase database. Continue?")) return;
      setSyncMsg('Syncing...');
      try {
          const payload = mealCreatorDatabase.map(mapItemToDB);
          const { error } = await supabase.from('food_exchange').insert(payload);
          
          if (error) throw error;
          setSyncMsg('Success! Data uploaded.');
          window.location.reload(); 
      } catch (err: any) {
          console.error(err);
          setSyncMsg('Error: ' + err.message);
      }
  };

  // --- 2. Search Logic ---
  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return activeData.filter(
      (food) => food.name.toLowerCase().includes(q) || food.group.toLowerCase().includes(q)
    );
  }, [searchQuery, activeData]);

  // --- 3. Planner Logic ---
  
  // Helper to ensure current day structure exists
  const ensureDayExists = (day: number) => {
      setWeeklyPlan(prev => {
          if (prev[day]) return prev;
          return {
              ...prev,
              [day]: { 
                  items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}),
                  meta: {}
              }
          };
      });
  };

  useEffect(() => {
      ensureDayExists(currentDay);
  }, [currentDay]);

  // Hydrate from Active Visit
  const fetchTargetKcal = () => {
      if (!activeVisit) return;
      let target = 0;
      if (activeVisit.visit.meal_plan_data?.targetKcal) {
          target = Number(activeVisit.visit.meal_plan_data.targetKcal);
      } else if (activeVisit.visit.kcal_data?.inputs?.reqKcal) {
          target = Number(activeVisit.visit.kcal_data.inputs.reqKcal);
      }
      if (target > 0) {
          setTargetKcal(target);
          setStatusMsg(`Target updated to ${target} kcal`);
          setTimeout(() => setStatusMsg(''), 2000);
      } else {
          alert("No calculated target found in Meal Planner or Kcal Calculator.");
      }
  };

  useEffect(() => {
      if (activeVisit) {
          // 1. Set Target Kcal (Prioritize Plan Data if exists, otherwise Kcal Calc)
          let target = 2000;
          
          if (activeVisit.visit.day_plan_data?.targetKcal) {
              target = Number(activeVisit.visit.day_plan_data.targetKcal);
          } else if (activeVisit.visit.meal_plan_data?.targetKcal) {
              target = Number(activeVisit.visit.meal_plan_data.targetKcal);
          } else if (activeVisit.visit.kcal_data?.inputs?.reqKcal) {
              target = Number(activeVisit.visit.kcal_data.inputs.reqKcal);
          }
          
          if (target > 0) setTargetKcal(target);
          
          // 2. Load Day Plan if exists
          if (activeVisit.visit.day_plan_data) {
              const data = activeVisit.visit.day_plan_data;
              if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
              setStatusMsg("Loaded Client Plan");
          }
      }
  }, [activeVisit]);

  const addToPlan = (food: FoodItem) => {
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay] || { items: {}, meta: {} };
          const currentList = dayData.items[activeMealTime] || [];
          
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  items: {
                      ...dayData.items,
                      [activeMealTime]: [...currentList, { ...food, serves: 1, selected: true, optionGroup: 'main' }]
                  }
              }
          };
      });
      setSearchQuery("");
  };

  const removeFromPlan = (mealTime: string, index: number) => {
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = [...dayData.items[mealTime]];
          newList.splice(index, 1);
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  items: {
                      ...dayData.items,
                      [mealTime]: newList
                  }
              }
          };
      });
  };

  const updateItem = (mealTime: string, index: number, field: keyof PlannerItem, value: any) => {
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = [...dayData.items[mealTime]];
          newList[index] = { ...newList[index], [field]: value };
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  items: {
                      ...dayData.items,
                      [mealTime]: newList
                  }
              }
          };
      });
  };

  const updateMeta = (mealTime: string, field: keyof MealMeta, value: string) => {
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const currentMeta = dayData.meta[mealTime] || { timeStart: '', timeEnd: '', notes: '' };
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  meta: {
                      ...dayData.meta,
                      [mealTime]: { ...currentMeta, [field]: value }
                  }
              }
          };
      });
  };

  const toggleGroupSelection = (mealTime: string, group: string, status: boolean) => {
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = dayData.items[mealTime].map(item => 
              item.optionGroup === group ? { ...item, selected: status } : item
          );
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  items: {
                      ...dayData.items,
                      [mealTime]: newList
                  }
              }
          };
      });
  };

  const resetPlanner = () => {
      if(!confirm("Clear all days?")) return;
      setWeeklyPlan({ 1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {} } });
      setCurrentDay(1);
      setPlanName("");
      setLoadedPlanId(null);
      setLastSavedName("");
  };

  const clearDay = () => {
      if(!confirm("Clear current day only?")) return;
      setWeeklyPlan(prev => ({
          ...prev,
          [currentDay]: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {} }
      }));
  };

  // --- 4. Calculations (Current Day Only) ---
  const summary = useMemo(() => {
    let totalServes = 0, totalCHO = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalKcal = 0;
    
    // Track used serves per mapped group
    const usedExchanges: Record<string, number> = {};

    const dayData = weeklyPlan[currentDay];
    if (!dayData) return { totalServes: 0, totalCHO: 0, totalProtein: 0, totalFat: 0, totalFiber: 0, totalKcal: 0, usedExchanges };

    Object.values(dayData.items).forEach((mealList: any) => {
        if (Array.isArray(mealList)) {
            mealList.forEach((item: PlannerItem) => {
                if (item.selected) { // Only count if checkbox is active
                    const s = item.serves;
                    totalServes += s;
                    totalCHO += item.cho * s;
                    totalProtein += item.protein * s;
                    totalFat += item.fat * s;
                    totalFiber += item.fiber * s;
                    totalKcal += item.kcal * s;

                    // Map to Exchange Key
                    let key = GROUP_MAPPING[item.group] || item.group;
                    // Handle fats aggregation
                    if (item.group.includes("Fat")) key = 'fats';
                    
                    usedExchanges[key] = (usedExchanges[key] || 0) + s;
                }
            });
        }
    });

    return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, usedExchanges };
  }, [weeklyPlan, currentDay]);

  const percentages = useMemo(() => {
     const k = summary.totalKcal || 1;
     return {
         cho: ((summary.totalCHO * 4) / k * 100).toFixed(1),
         pro: ((summary.totalProtein * 4) / k * 100).toFixed(1),
         fat: ((summary.totalFat * 9) / k * 100).toFixed(1),
     }
  }, [summary]);

  const exchangeComparison = useMemo(() => {
      if (!activeVisit?.visit.meal_plan_data?.servings) return [];
      const planned = activeVisit.visit.meal_plan_data.servings;
      const used = summary.usedExchanges;
      
      // Define list of groups to compare
      const groups = [
          { key: 'starch', label: 'Starch' },
          { key: 'fruit', label: 'Fruits' },
          { key: 'veg', label: 'Vegetables' },
          { key: 'meatLean', label: 'Lean Meat' },
          { key: 'meatMed', label: 'Med Meat' },
          { key: 'meatHigh', label: 'High Meat' },
          { key: 'milkSkim', label: 'Skim Milk' },
          { key: 'milkLow', label: 'Low Milk' },
          { key: 'milkWhole', label: 'Full Milk' },
          { key: 'legumes', label: 'Legumes' },
          { key: 'sugar', label: 'Sugar' },
          { key: 'fats', label: 'Fats' },
      ];

      return groups.map(g => {
          let planVal = planned[g.key] || 0;
          
          // Special handling for aggregated Fats if planned separates them
          if (g.key === 'fats' && planVal === 0) {
              planVal = (planned['fatsPufa'] || 0) + (planned['fatsMufa'] || 0) + (planned['fatsSat'] || 0);
          }

          const useVal = used[g.key] || 0;
          return { ...g, plan: planVal, used: useVal };
      }).filter(g => g.plan > 0 || g.used > 0);

  }, [activeVisit, summary.usedExchanges]);

  // --- 5. Save/Load --- 
  const fetchPlans = async () => {
    if (!session) return;
    setIsLoadingPlans(true);
    setLoadSearchQuery('');
    try {
        const { data, error } = await supabase
          .from('saved_meals')
          .select('*')
          .eq('tool_type', 'day-planner')
          .eq('user_id', session.user.id)
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
    // Mode 1: Save to Visit
    if (activeVisit) {
        setStatusMsg("Saving to Client Visit...");
        try {
            const planData = { weeklyPlan, targetKcal };
            const { error } = await supabase
                .from('client_visits')
                .update({ day_plan_data: planData })
                .eq('id', activeVisit.visit.id);
            
            if (error) throw error;
            setStatusMsg("Saved to Visit Successfully!");
            setTimeout(() => setStatusMsg(''), 3000);
        } catch (err: any) {
            console.error(err);
            setStatusMsg("Error saving to visit: " + err.message);
        }
        return;
    }

    // Mode 2: Save as Template
    if (!planName.trim()) {
        alert("Please enter a plan name.");
        return;
    }
    if (!session) return;
    
    setStatusMsg("Saving Template...");
    const planData = { weeklyPlan, targetKcal };
    const isUpdate = loadedPlanId && (planName === lastSavedName);

    try {
        let data;
        if (isUpdate) {
            const { data: updated, error } = await supabase
                .from('saved_meals')
                .update({ name: planName, data: planData })
                .eq('id', loadedPlanId)
                .eq('user_id', session.user.id)
                .select()
                .single();
            if (error) throw error;
            data = updated;
        } else {
            const { data: inserted, error } = await supabase
                .from('saved_meals')
                .insert({
                    user_id: session.user.id,
                    name: planName,
                    tool_type: 'day-planner',
                    data: planData,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            if (error) throw error;
            data = inserted;
        }
        
        if (data) {
            setLoadedPlanId(data.id);
            setLastSavedName(data.name);
            setStatusMsg(isUpdate ? "Plan Updated!" : "Plan Saved!");
        }
        
        fetchPlans(); 
        setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
        console.error('Error saving:', err);
        setStatusMsg("Failed to save: " + err.message);
    }
  };

  const loadPlan = (plan: SavedMeal) => {
    if (!plan.data) return;
    
    if (plan.data.weeklyPlan) {
        setWeeklyPlan(plan.data.weeklyPlan);
    } else if (plan.data.dayPlan) {
        // Legacy convert
        setWeeklyPlan({ 1: { items: { ...plan.data.dayPlan }, meta: {} } });
    }

    if (plan.data.targetKcal) setTargetKcal(plan.data.targetKcal);
    setPlanName(plan.name);
    setLoadedPlanId(plan.id); 
    setLastSavedName(plan.name); 
    setShowLoadModal(false);
    setStatusMsg(t.common.loadSuccess);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deletePlan = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this plan?")) return;
      if (!session) return;
      
      try {
          const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session.user.id);
          if (error) throw error;
          setSavedPlans(prev => prev.filter(p => p.id !== id));
          if (loadedPlanId === id) {
              setLoadedPlanId(null);
              setPlanName('');
              setLastSavedName('');
          }
      } catch (err: any) {
          console.error("Error deleting:", err);
          setStatusMsg("Error deleting plan: " + err.message);
      }
  };

  // Filter Saved Plans Logic
  const filteredSavedPlans = useMemo(() => {
      if (!loadSearchQuery) return savedPlans;
      const q = loadSearchQuery.toLowerCase();
      return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  // Handle Initial Load
  useEffect(() => {
      if (initialLoadId && session && !activeVisit) {
          const autoLoad = async () => {
              const { data } = await supabase.from('saved_meals').select('*').eq('id', initialLoadId).single();
              if (data) loadPlan(data);
          };
          autoLoad();
      }
  }, [initialLoadId, activeVisit]);

  // --- Print Logic ---
  const handlePrint = (mode: 'day' | 'week') => {
      const printArea = document.getElementById('print-area');
      if (printArea) {
          if (mode === 'day') {
              document.body.classList.add('print-day-only');
              document.body.classList.remove('print-week');
          } else {
              document.body.classList.add('print-week');
              document.body.classList.remove('print-day-only');
          }
          window.print();
          // Reset
          document.body.classList.remove('print-day-only');
          document.body.classList.remove('print-week');
      }
  };

  // --- Render Helpers ---
  const getUniqueGroups = (items: PlannerItem[]) => {
      const groups = new Set<string>();
      items.forEach(i => groups.add(i.optionGroup));
      // Ensure 'main' is first
      const arr = Array.from(groups);
      if (arr.includes('main')) {
          return ['main', ...arr.filter(g => g !== 'main').sort()];
      }
      return arr.sort();
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in space-y-6 pb-12">
      <Toast message={statusMsg || syncMsg} />

      {/* Active Visit Toolbar */}
      {activeVisit && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-2 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm no-print">
              <div>
                  <h3 className="font-bold text-blue-800 text-lg">
                     Day Planner: {activeVisit.client.full_name}
                  </h3>
                  <p className="text-sm text-blue-600">
                     Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}
                  </p>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={savePlan}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2"
                  >
                      <span>💾</span> Save to Visit
                  </button>
              </div>
          </div>
      )}

      {/* Sticky Header Wrapper to fix overlap issues */}
      <div className="sticky top-12 z-40 bg-[var(--color-bg)] pt-2 pb-4 -mx-4 px-4 no-print shadow-sm border-b border-gray-100/50">
          {/* Header & Search */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6">
              <div className="text-center xl:text-left">
                  <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">
                      Day Food Planner
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 justify-center xl:justify-start">
                      Select a meal time (click header) then search to add foods.
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border cursor-help ${dataSource === 'cloud' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`} title={dataSource === 'cloud' ? 'Cloud Database' : 'Local Database'}>
                          {dataSource === 'cloud' ? '☁️' : '💾'}
                      </span>
                  </p>
              </div>

              {/* Search Bar - Adds to ACTIVE MEAL TIME */}
              <div className="relative w-full max-w-xl">
                  <input
                    type="text"
                    className={`w-full px-6 py-3 rounded-full border-2 focus:outline-none shadow-sm text-lg transition-colors bg-white ${
                        activeMealTime ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]' : 'border-gray-300'
                    }`}
                    placeholder={`Search to add to: ${activeMealTime}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-primary)] bg-white px-2">
                      Adding to: {activeMealTime}
                  </span>
                  
                  {/* Search Results Dropdown */}
                  {searchQuery && filteredFoods.length > 0 && (
                    <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 border border-gray-100 text-right">
                      {filteredFoods.map((food, idx) => (
                        <li 
                          key={idx} 
                          className="px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center cursor-pointer group"
                          onClick={() => addToPlan(food)}
                        >
                          <div className="flex-grow text-left">
                              <div className="font-medium text-[var(--color-text)]">
                                  {renderHighlightedText(food.name)}
                              </div>
                              <div className="text-xs text-[var(--color-text-light)] flex gap-2">
                                 <span>{food.group}</span>
                                 <span className="font-bold text-blue-600">{food.kcal.toFixed(0)} kcal</span>
                              </div>
                          </div>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200">
                              + Add
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button 
                        onClick={() => onNavigate && onNavigate('meal-planner', undefined, undefined, true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition shadow-sm text-sm font-bold flex items-center gap-2"
                        title="Back to Meal Planner"
                    >
                        <span>📅</span> Meal Planner
                    </button>
                    {!activeVisit && session && (
                        <>
                        <input 
                            type="text" placeholder="Plan Name" value={planName} onChange={e => setPlanName(e.target.value)}
                            className="w-32 p-2 border rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                        <button onClick={savePlan} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition" title="Save Template">💾</button>
                        <button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded transition" title="Load Template">📂</button>
                        </>
                    )}
                    {session && dataSource === 'local' && (
                        <button onClick={handleSyncToCloud} className="bg-orange-100 text-orange-700 px-3 py-2 rounded text-xs font-bold hover:bg-orange-200">
                            ☁️ Sync
                        </button>
                    )}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => handlePrint('day')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded shadow-sm">Print Day</button>
                        <button onClick={() => handlePrint('week')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded shadow-sm">Print Week</button>
                    </div>
                    <button onClick={resetPlanner} className="text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-2 rounded hover:bg-red-50">
                        Clear All
                    </button>
              </div>
          </div>
      </div>

      {/* Day Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-print">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 ${
                    currentDay === day 
                    ? 'bg-white text-blue-600 border-blue-600 shadow-sm' 
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                }`}
              >
                  Day {day}
              </button>
          ))}
          <button onClick={clearDay} className="ml-auto text-xs text-red-400 hover:text-red-600 px-3">Clear Day {currentDay}</button>
      </div>

      <div id="print-area" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Column: Exchange Control (New Feature) */}
          <div className="xl:col-span-3 space-y-6 order-2 xl:order-1">
              <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 sticky top-40">
                  <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b border-purple-100 pb-2">
                      <span>📋</span> Exchange Control
                  </h3>
                  
                  {exchangeComparison.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs italic">
                          No planned exchanges found in Meal Planner.
                          {activeVisit ? " Set targets in Meal Planner first." : ""}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                              <span>Group</span>
                              <span>Used / Plan</span>
                          </div>
                          {exchangeComparison.map(ex => {
                              const pct = Math.min((ex.used / (ex.plan || 1)) * 100, 100);
                              const isOver = ex.used > ex.plan;
                              const isComplete = ex.used === ex.plan;
                              const barColor = isOver ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-purple-500';
                              
                              return (
                                  <div key={ex.key} className="space-y-1">
                                      <div className="flex justify-between text-xs font-medium text-gray-700">
                                          <span>{ex.label}</span>
                                          <span className={`${isOver ? 'text-red-600 font-bold' : isComplete ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                                              {ex.used.toFixed(1)} / {ex.plan.toFixed(1)}
                                          </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  )}
                  
                  {/* Legend */}
                  <div className="mt-4 pt-3 border-t border-purple-50 text-[10px] text-gray-400 flex justify-between">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Match</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Over</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Under</span>
                  </div>
              </div>
          </div>

          {/* Middle Column: Meal Sections (Main Planner) */}
          <div className="xl:col-span-6 space-y-6 order-1 xl:order-2">
              
              {/* PRINT WEEK VIEW */}
              <div className="hidden print-week-only">
                  <h2 className="text-2xl font-bold mb-4 text-center">Weekly Meal Plan</h2>
                  {Object.keys(weeklyPlan).map(dayStr => {
                      const d = Number(dayStr);
                      const dayData = weeklyPlan[d];
                      return (
                          <div key={d} className="mb-6 break-inside-avoid border p-2">
                              <h3 className="font-bold text-lg border-b bg-gray-100 p-1">Day {d}</h3>
                              <div className="text-xs grid grid-cols-1 gap-2 mt-2">
                                  {MEAL_TIMES.map(time => {
                                      const items = dayData?.items[time]?.filter(i => i.selected) || [];
                                      const meta = dayData?.meta[time];
                                      if(items.length === 0 && !meta?.notes) return null;
                                      return (
                                          <div key={time}>
                                              <strong className="text-gray-700">{time} {meta?.timeStart ? `(${meta.timeStart}-${meta.timeEnd})` : ''}:</strong> 
                                              <span className="ml-1">{items.map(i => i.name).join(', ')}</span>
                                              {meta?.notes && <div className="italic text-gray-500 ml-4">Note: {meta.notes}</div>}
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      )
                  })}
              </div>

              {/* CURRENT DAY VIEW */}
              <div className="print-day-content">
                  <div className="mb-4 print:block hidden text-center">
                      <h2 className="text-2xl font-bold">Daily Meal Plan - Day {currentDay}</h2>
                      {activeVisit && <p>Client: {activeVisit.client.full_name}</p>}
                  </div>

                  {MEAL_TIMES.map((time) => {
                      const dayData = weeklyPlan[currentDay] || { items: {}, meta: {} };
                      const items = dayData.items[time] || [];
                      const meta = dayData.meta[time] || { timeStart: '', timeEnd: '', notes: '' };
                      
                      const isActive = activeMealTime === time;
                      const uniqueGroups = getUniqueGroups(items);
                      
                      // Calculate active nutrients for header (selected items only)
                      const sectionStats = items.filter(i => i.selected).reduce((acc, i) => ({
                          kcal: acc.kcal + (i.kcal * i.serves),
                          cho: acc.cho + (i.cho * i.serves),
                          protein: acc.protein + (i.protein * i.serves),
                          fat: acc.fat + (i.fat * i.serves)
                      }), { kcal: 0, cho: 0, protein: 0, fat: 0 });

                      return (
                        <div key={time} className={`rounded-xl shadow-sm border overflow-hidden mb-6 break-inside-avoid transition-all ${isActive ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                            {/* Header (Click to Activate) */}
                            <div 
                                className={`px-4 py-3 flex flex-col md:flex-row justify-between items-center cursor-pointer transition-colors ${isActive ? 'bg-yellow-50 border-b border-yellow-200' : 'bg-gray-50 border-b border-gray-200 hover:bg-gray-100'}`}
                                onClick={() => setActiveMealTime(time)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isActive ? 'text-yellow-900' : 'text-gray-700'}`}>
                                        {time === 'Breakfast' ? '🍳' : time === 'Lunch' ? '🥗' : time === 'Dinner' ? '🍲' : '🍎'} 
                                        {time}
                                    </h3>
                                    {isActive && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-bold no-print">ACTIVE</span>}
                                </div>
                                
                                <div className="flex items-center gap-3 mt-2 md:mt-0" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 text-xs">
                                        <input 
                                            type="time" 
                                            value={meta.timeStart}
                                            onChange={e => updateMeta(time, 'timeStart', e.target.value)}
                                            className="p-1 border rounded bg-white w-20"
                                        />
                                        <span>-</span>
                                        <input 
                                            type="time" 
                                            value={meta.timeEnd}
                                            onChange={e => updateMeta(time, 'timeEnd', e.target.value)}
                                            className="p-1 border rounded bg-white w-20"
                                        />
                                    </div>
                                    <div className="flex flex-col items-end text-xs min-w-[80px]">
                                        <div className="font-bold text-gray-800">{sectionStats.kcal.toFixed(0)} kcal</div>
                                        <div className="text-[9px] text-gray-500 font-mono flex gap-1">
                                            <span className="text-red-500">P:{sectionStats.protein.toFixed(0)}</span>
                                            <span className="text-blue-500">C:{sectionStats.cho.toFixed(0)}</span>
                                            <span className="text-yellow-500">F:{sectionStats.fat.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4">
                                {items.length === 0 ? (
                                    <div className="text-center text-sm text-gray-400 italic py-4 border-2 border-dashed border-gray-100 rounded-lg">
                                        {isActive ? "Search above to add items here..." : "Click header to activate, then add items."}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {uniqueGroups.map(group => {
                                            const groupItems = items.filter(i => i.optionGroup === group);
                                            // Main group always visible, others collapsible
                                            const isMain = group === 'main';
                                            const groupKey = `${time}-${group}`;
                                            const isExpanded = isMain || expandedGroups[groupKey];

                                            return (
                                                <div key={group} className={`rounded-lg border ${isMain ? 'border-blue-100 bg-blue-50/20' : 'border-orange-100 bg-orange-50/20'}`}>
                                                    {/* Group Header */}
                                                    <div className={`px-3 py-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider ${isMain ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800 cursor-pointer'}`}
                                                         onClick={() => !isMain && setExpandedGroups(prev => ({...prev, [groupKey]: !prev[groupKey]}))}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {!isMain && <span>{isExpanded ? '▼' : '►'}</span>}
                                                            <span>{group === 'main' ? 'Main Meal' : group}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 no-print">
                                                            <label className="flex items-center gap-1 cursor-pointer">
                                                                <input type="checkbox" onChange={(e) => toggleGroupSelection(time, group, e.target.checked)} checked={groupItems.every(i => i.selected)} />
                                                                All
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Group Items */}
                                                    {isExpanded && (
                                                        <div className="divide-y divide-gray-100">
                                                            {groupItems.map((item) => {
                                                                const realIdx = items.indexOf(item);
                                                                return (
                                                                    <div key={realIdx} className={`p-2 pl-4 flex flex-col sm:flex-row items-center gap-3 transition ${!item.selected ? 'opacity-50 grayscale' : ''}`}>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={item.selected} 
                                                                            onChange={(e) => updateItem(time, realIdx, 'selected', e.target.checked)}
                                                                            className="w-4 h-4 cursor-pointer no-print"
                                                                        />
                                                                        
                                                                        <div className="flex-grow text-left w-full sm:w-auto">
                                                                            <div className="font-bold text-gray-800 text-sm">
                                                                                {renderHighlightedText(item.name)}
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-500 flex gap-2">
                                                                                <span>{item.group}</span>
                                                                                {/* Move Item Controls */}
                                                                                <select 
                                                                                    value={item.optionGroup}
                                                                                    onChange={(e) => updateItem(time, realIdx, 'optionGroup', e.target.value)}
                                                                                    className="bg-transparent border-b border-gray-300 text-[9px] outline-none hover:border-blue-400 no-print"
                                                                                >
                                                                                    {ALT_OPTIONS.map(opt => (
                                                                                        <option key={opt} value={opt}>{opt === 'main' ? 'Main' : opt}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            <input 
                                                                                type="number" step="0.25" min="0" 
                                                                                value={item.serves}
                                                                                onChange={(e) => updateItem(time, realIdx, 'serves', Number(e.target.value))}
                                                                                className="w-12 p-1 border rounded text-center text-sm font-bold focus:ring-1 focus:ring-blue-400"
                                                                            />
                                                                            <span className="text-[10px] text-gray-500">sv</span>
                                                                        </div>

                                                                        <div className="text-right w-16 hidden sm:block">
                                                                            <div className="font-mono font-bold text-gray-700 text-xs">{(item.kcal * item.serves).toFixed(0)}</div>
                                                                        </div>

                                                                        <button onClick={() => removeFromPlan(time, realIdx)} className="text-red-400 hover:text-red-600 px-2 text-lg no-print">×</button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Footer Controls for Meal */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col md:flex-row gap-3">
                                    <textarea 
                                        placeholder="Notes for this meal..." 
                                        value={meta.notes}
                                        onChange={e => updateMeta(time, 'notes', e.target.value)}
                                        className="w-full p-2 text-xs border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-yellow-400 resize-none h-16"
                                    />
                                    {items.length > 0 && (
                                        <button 
                                            onClick={() => {
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                setActiveMealTime(time);
                                            }}
                                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 whitespace-nowrap h-fit self-start no-print"
                                        >
                                            + Add Item / Alt
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>

          {/* Right Column: Totals & Targets */}
          <div className="xl:col-span-3 space-y-6 order-3 xl:order-3">
              <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-blue-600 p-6 sticky top-40">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📊</span> Daily Summary
                  </h3>

                  <div className="mb-6">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Calories</label>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-grow">
                            <input 
                                type="number" 
                                className="w-full p-2 border-2 border-blue-200 rounded-lg text-center font-bold text-xl text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                placeholder="0"
                                value={targetKcal} 
                                onChange={(e) => setTargetKcal(parseFloat(e.target.value))}
                                dir="ltr"
                            />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs font-medium">Kcal</span>
                        </div>
                        {activeVisit && (
                            <button 
                                onClick={fetchTargetKcal}
                                className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200"
                                title="Fetch calculated target from Kcal Calculator"
                            >
                                🔄
                            </button>
                        )}
                      </div>
                  </div>

                  <div className="mb-6">
                      <MacroDonut 
                        cho={summary.totalCHO} 
                        pro={summary.totalProtein} 
                        fat={summary.totalFat} 
                        totalKcal={summary.totalKcal} 
                      />
                  </div>

                  <div className="space-y-4">
                      <ProgressBar 
                        current={summary.totalKcal} 
                        target={targetKcal} 
                        label="Calories" 
                        unit="kcal" 
                        color="bg-blue-500"
                      />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mt-6">
                     <div className="p-2 bg-blue-50 rounded border border-blue-100">
                        <div className="text-xs text-gray-500">CHO</div>
                        <div className="font-bold text-blue-700">{summary.totalCHO.toFixed(0)}g</div>
                        <div className="text-[10px] text-blue-400">{percentages.cho}%</div>
                     </div>
                     <div className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="text-xs text-gray-500">PRO</div>
                        <div className="font-bold text-red-700">{summary.totalProtein.toFixed(0)}g</div>
                        <div className="text-[10px] text-red-400">{percentages.pro}%</div>
                     </div>
                     <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-xs text-gray-500">FAT</div>
                        <div className="font-bold text-yellow-700">{summary.totalFat.toFixed(0)}g</div>
                        <div className="text-[10px] text-yellow-400">{percentages.fat}%</div>
                     </div>
                  </div>
              </div>
          </div>

      </div>

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t.common.load}</h3>
                    <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="mb-4">
                    <input 
                        type="text" placeholder={t.common.search} value={loadSearchQuery} onChange={(e) => setLoadSearchQuery(e.target.value)}
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
                                    <div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div>
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
      
      {/* CSS for Print Hiding */}
      <style>{`
        @media print {
            .print-week-only { display: none; }
            body.print-week .print-week-only { display: block; }
            body.print-week .print-day-content { display: none; }
            
            body.print-day-only .print-week-only { display: none; }
            body.print-day-only .print-day-content { display: block; }
        }
      `}</style>
    </div>
  );
};

export default MealCreator;
